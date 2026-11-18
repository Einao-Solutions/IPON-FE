import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { userAccountTypesApi } from './userAccountTypesApi';
import { userAccountTypesRefresh } from './userAccountTypesRefresh';
import { userRolesRefresh } from './userRolesRefresh';
import { RoleApiError } from './userRolesApi';

vi.mock('$lib/helpers', () => ({ baseURL: 'https://example.test' }));
vi.mock('$lib/store', async () => {
	const { writable } = await import('svelte/store');
	return {
		loggedInToken: writable('account-test-token'),
		loggedInUser: writable(null),
	};
});

const fetchMock = vi.fn();
const catalogue = [
	{ id: 0, name: 'Individual' },
	{ id: 8, name: 'API-defined type' },
];
const current = {
	userId: 'recipient',
	accountType: null,
	accountTypeName: null,
};

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
	userAccountTypesRefresh.set(0);
	userRolesRefresh.set(0);
});
afterEach(() => vi.unstubAllGlobals());

describe('account-type requests', () => {
	it('loads API-defined options and preserves a legacy null value with encoded user IDs', async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(catalogue)));
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(current)));
		const signal = new AbortController().signal;
		await expect(userAccountTypesApi.getTypes(signal)).resolves.toEqual(
			catalogue,
		);
		await expect(
			userAccountTypesApi.getCurrent('recipient/&', signal),
		).resolves.toEqual(current);
		expect(fetchMock.mock.calls[0][0]).toBe(
			'https://example.test/api/users/account-types',
		);
		expect(fetchMock.mock.calls[1][0]).toBe(
			'https://example.test/api/users/recipient%2F%26/account-type',
		);
		expect(fetchMock.mock.calls[1][1]).toMatchObject({
			signal,
			headers: { Authorization: 'Bearer account-test-token' },
		});
	});

	it.each([true, false])(
		'sends only numeric type zero and refreshes user lists when changed=%s',
		async (changed) => {
			const result = {
				...current,
				accountType: 0,
				accountTypeName: 'Individual',
				changed,
			};
			fetchMock.mockResolvedValue(new Response(JSON.stringify(result)));
			await expect(
				userAccountTypesApi.update('recipient', 0, catalogue),
			).resolves.toEqual(result);
			expect(fetchMock.mock.calls[0]).toEqual([
				'https://example.test/api/users/recipient/account-type',
				expect.objectContaining({
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer account-test-token',
					},
					body: '{"accountType":0}',
				}),
			]);
			expect(get(userAccountTypesRefresh)).toBe(1);
			expect(get(userRolesRefresh)).toBe(0);
		},
	);

	it.each([-1, 1, 0.5, NaN])(
		'rejects invalid/non-catalogue type %s without sending an update',
		async (value) => {
			await expect(
				userAccountTypesApi.update('recipient', value, catalogue),
			).rejects.toMatchObject({ status: 400 });
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);

	it('surfaces backend validation messages and does not invalidate successful caches', async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					errors: { AccountType: ['This type cannot be selected.'] },
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/problem+json' },
				},
			),
		);
		await expect(
			userAccountTypesApi.update('recipient', 0, catalogue),
		).rejects.toThrow('This type cannot be selected.');
		expect(get(userAccountTypesRefresh)).toBe(0);
	});

	it.each([401, 403, 409, 500])(
		'preserves status %s for editor recovery',
		async (status) => {
			fetchMock.mockResolvedValue(new Response('', { status }));
			await expect(
				userAccountTypesApi.update('recipient', 0, catalogue),
			).rejects.toMatchObject({ status });
			expect(get(userAccountTypesRefresh)).toBe(0);
		},
	);

	it.each(['get', 'put'])(
		'invalidates the directory when the user no longer exists on %s',
		async (method) => {
			fetchMock.mockResolvedValue(new Response('', { status: 404 }));
			const result =
				method === 'get'
					? userAccountTypesApi.getCurrent('recipient')
					: userAccountTypesApi.update('recipient', 0, catalogue);
			await expect(result).rejects.toEqual(
				new RoleApiError('User not found', 404),
			);
			expect(get(userAccountTypesRefresh)).toBe(1);
		},
	);

	it('surfaces ambiguous network failures without publishing success', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
		await expect(
			userAccountTypesApi.update('recipient', 0, catalogue),
		).rejects.toThrow('Failed to fetch');
		expect(get(userAccountTypesRefresh)).toBe(0);
	});

	it.each(['catalogue', 'current', 'update'])(
		'rejects a malformed %s response explicitly',
		async (request) => {
			fetchMock.mockResolvedValue(new Response('{}'));
			const result =
				request === 'catalogue'
					? userAccountTypesApi.getTypes()
					: request === 'current'
						? userAccountTypesApi.getCurrent('recipient')
						: userAccountTypesApi.update('recipient', 0, catalogue);
			await expect(result).rejects.toThrow(/Invalid .*response/);
			expect(get(userAccountTypesRefresh)).toBe(0);
		},
	);
});
