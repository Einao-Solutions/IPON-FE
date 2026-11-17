import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	userRolesApi,
	roleChanges,
	roleDisplayName,
	roleHistoryParams,
	RoleApiError,
} from './userRolesApi';
import { get } from 'svelte/store';
import { userRolesRefresh } from './userRolesRefresh';

vi.mock('$lib/helpers', () => ({ baseURL: 'https://example.test' }));
vi.mock('$lib/store', async () => {
	const { writable } = await import('svelte/store');
	return {
		loggedInToken: writable('role-test-token'),
		loggedInUser: writable(null),
	};
});

const fetchMock = vi.fn();
const catalogue = [
	{ id: 0, name: 'User' },
	{ id: 71, name: 'Reviewer' },
	{ id: 21, name: 'SuperAdmin' },
];
const page = { items: [], totalCount: 43, skip: 20, take: 20 };

beforeEach(() => {
	userRolesRefresh.set(0);
	fetchMock.mockReset();
	fetchMock.mockResolvedValue(
		new Response(JSON.stringify(page), { status: 200 }),
	);
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('role management requests', () => {
	it('uses the configured catalogue endpoint and existing bearer authentication', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify(catalogue)));
		await expect(userRolesApi.getRoles()).resolves.toEqual(catalogue);
		expect(fetchMock.mock.calls[0][0]).toBe(
			'https://example.test/api/users/roles',
		);
		expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
			'Bearer role-test-token',
		);
	});

	it('requests server-side role search with zero-based skip and encoded parameters', async () => {
		await expect(
			userRolesApi.getMembers(71, {
				search: 'Mary & Jo',
				pageIndex: 1,
				pageSize: 20,
			}),
		).resolves.toEqual(page);
		const url = new URL(fetchMock.mock.calls[0][0]);
		expect(url.pathname).toBe('/api/users/roles/71/users');
		expect(Object.fromEntries(url.searchParams)).toEqual({
			search: 'Mary & Jo',
			skip: '20',
			take: '20',
		});
	});

	it('loads only actual assigners from the assigners endpoint, preserving its counts', async () => {
		const result = { ...page, items: [{ id: 'actor', assignmentCount: 15 }] };
		fetchMock.mockResolvedValue(new Response(JSON.stringify(result)));
		await expect(
			userRolesApi.getAssigners({
				search: 'admin',
				pageIndex: 2,
				pageSize: 10,
			}),
		).resolves.toEqual(result);
		const url = new URL(fetchMock.mock.calls[0][0]);
		expect(url.pathname).toBe('/api/users/role-assigners');
		expect(url.searchParams.get('skip')).toBe('20');
		expect(url.searchParams.get('search')).toBe('admin');
	});

	it('keeps actor, recipient, role zero, action and date filters when paging history', async () => {
		await userRolesApi.getHistory({
			pageIndex: 3,
			pageSize: 10,
			assignedById: 'actor/&',
			assignedToId: 'recipient',
			role: 0,
			action: 'Removed',
			search: 'mary@example.test',
			from: '2026-03-01T10:00:00+02:00',
			to: '2026-03-01T12:00:00+02:00',
		});
		const url = new URL(fetchMock.mock.calls[0][0]);
		expect(url.pathname).toBe('/api/users/role-assignment-history');
		expect(Object.fromEntries(url.searchParams)).toEqual({
			skip: '30',
			take: '10',
			assignedById: 'actor/&',
			assignedToId: 'recipient',
			role: '0',
			action: 'Removed',
			search: 'mary@example.test',
			from: '2026-03-01T08:00:00.000Z',
			to: '2026-03-01T10:00:00.000Z',
		});
	});

	it('does not send an actor filter for all activity', async () => {
		await userRolesApi.getHistory({ pageIndex: 0, pageSize: 20 });
		expect(
			new URL(fetchMock.mock.calls[0][0]).searchParams.has('assignedById'),
		).toBe(false);
	});

	it.each([
		{ search: 'x'.repeat(201), pageIndex: 0, pageSize: 20 },
		{ pageIndex: -1, pageSize: 20 },
		{ pageIndex: 1.5, pageSize: 20 },
		{ pageIndex: 0, pageSize: 101 },
		{ pageIndex: 0, pageSize: 0 },
	])(
		'rejects invalid search and page filters before fetching: %j',
		async (filters) => {
			await expect(userRolesApi.getAssigners(filters)).rejects.toBeInstanceOf(
				RoleApiError,
			);
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);

	it('validates inclusive date bounds', () => {
		expect(() =>
			roleHistoryParams({ pageIndex: 0, pageSize: 20, from: 'bad-date' }),
		).toThrow('valid start and end dates');
		expect(() =>
			roleHistoryParams({
				pageIndex: 0,
				pageSize: 20,
				from: '2026-04-02',
				to: '2026-04-01',
			}),
		).toThrow('before or equal');
		expect(
			roleHistoryParams({
				pageIndex: 0,
				pageSize: 20,
				from: '2026-04-01T00:00:00Z',
				to: '2026-04-01T00:00:00Z',
			}).get('to'),
		).toBe('2026-04-01T00:00:00.000Z');
	});
});

describe('role updates', () => {
	it('calculates deduplicated disjoint changes using catalogue IDs', async () => {
		expect(roleChanges([0, 0, 21], [21, 71, 71], catalogue)).toEqual({
			addRoles: [71],
			removeRoles: [0],
		});
		fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
		await userRolesApi.updateRoles('recipient', [0, 21], [21, 71], catalogue);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://example.test/api/users/UpdateUserRoles');
		expect(init.method).toBe('PUT');
		expect(init.headers['Content-Type']).toBe('application/json');
		expect(JSON.parse(init.body)).toEqual({
			userId: 'recipient',
			addRoles: [71],
			removeRoles: [0],
		});
		expect(get(userRolesRefresh)).toBe(1);
	});

	it('sends arrays, including an empty array, and never an actor ID', async () => {
		await userRolesApi.updateRoles('recipient', [0], [0, 71], catalogue);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			userId: 'recipient',
			addRoles: [71],
			removeRoles: [],
		});
	});

	it('does not submit unchanged or unknown changed roles', async () => {
		await expect(
			userRolesApi.updateRoles('recipient', [0, 21], [21, 0], catalogue),
		).rejects.toThrow('No role changes');
		await expect(
			userRolesApi.updateRoles('recipient', [0], [0, 99], catalogue),
		).rejects.toThrow('not in the role catalogue');
		expect(fetchMock).not.toHaveBeenCalled();
		expect(get(userRolesRefresh)).toBe(0);
	});

	it('preserves unknown existing roles rather than silently removing them', () => {
		expect(roleChanges([0, 99], [0, 99, 71], catalogue)).toEqual({
			addRoles: [71],
			removeRoles: [],
		});
		expect(roleDisplayName(71, catalogue)).toBe('Reviewer');
		expect(roleDisplayName(99, catalogue)).toBe('Unknown role (99)');
	});

	it.each([
		[
			400,
			{ errors: { addRoles: ['Invalid role selection.'] } },
			'Invalid role selection.',
			false,
		],
		[401, {}, 'Session expired', false],
		[403, {}, 'Access denied', false],
		[404, {}, 'recipient no longer exists', false],
		[
			503,
			{ message: 'Audit service unavailable.' },
			'Audit service unavailable.',
			true,
		],
	] as const)(
		'surfaces update errors for HTTP %i',
		async (status, body, message, retryable) => {
			fetchMock.mockResolvedValue(
				new Response(JSON.stringify(body), {
					status,
					headers: { 'Content-Type': 'application/problem+json' },
				}),
			);
			const failure = await userRolesApi
				.updateRoles('recipient', [0], [0, 71], catalogue)
				.catch((error: unknown) => error);
			expect(failure).toBeInstanceOf(RoleApiError);
			expect(failure).toMatchObject({
				message: expect.stringContaining(message),
				status,
				retryable,
			});
			expect(get(userRolesRefresh)).toBe(0);
		},
	);
});
