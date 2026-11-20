import { baseURL } from '$lib/helpers';
import { authFetch, SESSION_EXPIRED_MESSAGE } from './authFetch';
import { requestUserRolesRefresh } from './userRolesRefresh';

export interface RoleOption {
	id: number;
	name: string;
}

export interface RoleUser {
	id: string;
	name: string;
	email: string;
	phoneNumber: string | null;
	isVerified: boolean;
	userRoles: number[];
}

export interface RoleAssigner {
	id: string;
	name: string;
	email: string;
	assignmentCount: number;
	lastAssignedAt: string;
}

export interface RoleActivity {
	id: string;
	assignedById: string;
	assignedByName: string;
	assignedByEmail: string;
	assignedToId: string;
	assignedToName: string;
	assignedToEmail: string;
	role: number | string;
	action: 'Added' | 'Removed';
	occurredAt: string;
}

export interface RolePage<T> {
	items: T[];
	totalCount: number;
	skip: number;
	take: number;
}

export interface RolePageFilters {
	search?: string;
	pageIndex: number;
	pageSize: number;
}

export interface RoleHistoryFilters extends RolePageFilters {
	assignedById?: string;
	assignedToId?: string;
	role?: number | string;
	action?: '' | 'Added' | 'Removed';
	from?: string;
	to?: string;
}

export class RoleApiError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = 'RoleApiError';
	}

	get retryable() {
		return this.status >= 500;
	}
}

export function roleErrorMessage(error: unknown): string {
	if (error instanceof TypeError)
		return 'Unable to reach the server. Please retry.';
	return error instanceof Error
		? error.message
		: 'Unable to complete the request. Please retry.';
}

export function isRoleErrorRetryable(error: unknown): boolean {
	return !(error instanceof RoleApiError) || error.retryable;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function checkUserResponse(
	response: Response,
	updating = false,
	validationMessage = 'Please check the supplied filters or roles.',
) {
	if (response.ok) return;
	if (response.status === 401)
		throw new RoleApiError(SESSION_EXPIRED_MESSAGE, 401);
	if (response.status === 403)
		throw new RoleApiError(
			'Access denied. SuperAdmin access is required.',
			403,
		);
	if (updating && response.status === 404) {
		throw new RoleApiError(
			'This recipient no longer exists. Close this panel and refresh the users list.',
			404,
		);
	}
	const text = await response.text();
	let detail = text;
	if (text && response.headers.get('content-type')?.includes('json')) {
		const body: unknown = JSON.parse(text);
		if (isRecord(body)) {
			const errors = isRecord(body.errors)
				? Object.values(body.errors)
						.flat()
						.filter((value): value is string => typeof value === 'string')
						.join(' ')
				: '';
			detail =
				errors ||
				[body.message, body.detail, body.title, body.error].find(
					(value): value is string => typeof value === 'string',
				) ||
				text;
		}
	}
	throw new RoleApiError(
		detail ||
			(response.status === 400
				? validationMessage
				: `Request failed (${response.status}). Please retry.`),
		response.status,
	);
}

function pageParams({ search = '', pageIndex, pageSize }: RolePageFilters) {
	if (search.length > 200)
		throw new RoleApiError('Search must be 200 characters or fewer.', 400);
	if (
		!Number.isInteger(pageIndex) ||
		pageIndex < 0 ||
		!Number.isInteger(pageSize) ||
		pageSize < 1 ||
		pageSize > 100
	) {
		throw new RoleApiError(
			'Please select a valid page and a page size between 1 and 100.',
			400,
		);
	}
	const params = new URLSearchParams({
		skip: String(pageIndex * pageSize),
		take: String(pageSize),
	});
	if (search.trim()) params.set('search', search.trim());
	return params;
}

export function roleHistoryParams(
	filters: RoleHistoryFilters,
): URLSearchParams {
	const params = pageParams(filters);
	for (const key of [
		'assignedById',
		'assignedToId',
		'role',
		'action',
	] as const) {
		const value = filters[key];
		if (value !== undefined && value !== '') params.set(key, String(value));
	}
	if (filters.action && !['Added', 'Removed'].includes(filters.action)) {
		throw new RoleApiError('Action must be Added or Removed.', 400);
	}
	const from = filters.from ? new Date(filters.from) : null;
	const to = filters.to ? new Date(filters.to) : null;
	if (
		(from && Number.isNaN(from.getTime())) ||
		(to && Number.isNaN(to.getTime()))
	) {
		throw new RoleApiError('Please enter valid start and end dates.', 400);
	}
	if (from && to && from > to)
		throw new RoleApiError(
			'Start date must be before or equal to end date.',
			400,
		);
	if (from) params.set('from', from.toISOString());
	if (to) params.set('to', to.toISOString());
	return params;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
	const response = await authFetch(`${baseURL}/api/users/${path}`, { signal });
	await checkUserResponse(response);
	return response.json();
}

export function roleDisplayName(
	role: number | string,
	catalogue: RoleOption[],
) {
	return (
		catalogue.find(
			(option) => String(option.id) === String(role) || option.name === role,
		)?.name ?? `Unknown role (${role})`
	);
}

export function roleChanges(
	original: number[],
	selected: number[],
	catalogue: RoleOption[],
) {
	const before = new Set(original);
	const after = new Set(selected);
	const addRoles = [...after].filter((role) => !before.has(role));
	const removeRoles = [...before].filter((role) => !after.has(role));
	if (
		[...addRoles, ...removeRoles].some(
			(id) => !catalogue.some((role) => role.id === id),
		)
	) {
		throw new RoleApiError(
			'A changed role is not in the role catalogue. Refresh the catalogue and try again.',
			400,
		);
	}
	return { addRoles, removeRoles };
}

export const userRolesApi = {
	getRoles: (signal?: AbortSignal) => get<RoleOption[]>('roles', signal),
	getMembers: async (
		role: number,
		filters: RolePageFilters,
		signal?: AbortSignal,
	) =>
		get<RolePage<RoleUser>>(
			`roles/${encodeURIComponent(role)}/users?${pageParams(filters)}`,
			signal,
		),
	getAssigners: async (filters: RolePageFilters, signal?: AbortSignal) =>
		get<RolePage<RoleAssigner>>(
			`role-assigners?${pageParams(filters)}`,
			signal,
		),
	getHistory: async (filters: RoleHistoryFilters, signal?: AbortSignal) =>
		get<RolePage<RoleActivity>>(
			`role-assignment-history?${roleHistoryParams(filters)}`,
			signal,
		),
	async updateRoles(
		userId: string,
		original: number[],
		selected: number[],
		catalogue: RoleOption[],
	) {
		const changes = roleChanges(original, selected, catalogue);
		if (!changes.addRoles.length && !changes.removeRoles.length) {
			throw new RoleApiError('No role changes to save.', 400);
		}
		const response = await authFetch(`${baseURL}/api/users/UpdateUserRoles`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, ...changes }),
		});
		await checkUserResponse(response, true);
		requestUserRolesRefresh();
	},
};
