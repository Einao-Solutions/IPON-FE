import { baseURL } from '$lib/helpers';
import { authFetch } from './authFetch';
import { checkUserResponse, RoleApiError } from './userRolesApi';
import { requestUserAccountTypesRefresh } from './userAccountTypesRefresh';

export interface AccountTypeOption {
	id: number;
	name: string;
}

export interface UserAccountType {
	userId: string;
	accountType: number | null;
	accountTypeName: string | null;
}

export interface AccountTypeUpdate extends UserAccountType {
	changed: boolean;
}

async function checkAccountTypeResponse(response: Response) {
	if (response.status === 404) {
		requestUserAccountTypesRefresh();
		throw new RoleApiError('User not found', 404);
	}
	await checkUserResponse(
		response,
		false,
		'Please select a valid account type.',
	);
}

function userPath(userId: string) {
	return `${baseURL}/api/users/${encodeURIComponent(userId)}/account-type`;
}

function isOption(value: unknown): value is AccountTypeOption {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		typeof value.id === 'number' &&
		Number.isInteger(value.id) &&
		'name' in value &&
		typeof value.name === 'string'
	);
}

function isCurrent(value: unknown): value is UserAccountType {
	return (
		typeof value === 'object' &&
		value !== null &&
		'userId' in value &&
		typeof value.userId === 'string' &&
		'accountType' in value &&
		(value.accountType === null ||
			(typeof value.accountType === 'number' &&
				Number.isInteger(value.accountType))) &&
		'accountTypeName' in value &&
		(value.accountTypeName === null ||
			typeof value.accountTypeName === 'string')
	);
}

export const userAccountTypesApi = {
	async getTypes(signal?: AbortSignal): Promise<AccountTypeOption[]> {
		const response = await authFetch(`${baseURL}/api/users/account-types`, {
			signal,
		});
		await checkUserResponse(response);
		const result: unknown = await response.json();
		if (!Array.isArray(result) || !result.every(isOption)) {
			throw new Error('Invalid account-type catalogue response. Please retry.');
		}
		return result;
	},
	async getCurrent(
		userId: string,
		signal?: AbortSignal,
	): Promise<UserAccountType> {
		const response = await authFetch(userPath(userId), { signal });
		await checkAccountTypeResponse(response);
		const result: unknown = await response.json();
		if (!isCurrent(result))
			throw new Error('Invalid current account-type response. Please retry.');
		return result;
	},
	async update(
		userId: string,
		accountType: number,
		options: AccountTypeOption[],
	): Promise<AccountTypeUpdate> {
		if (
			!Number.isInteger(accountType) ||
			!options.some((option) => option.id === accountType)
		) {
			throw new RoleApiError('Please select a valid account type.', 400);
		}
		const response = await authFetch(userPath(userId), {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accountType }),
		});
		await checkAccountTypeResponse(response);
		const result: unknown = await response.json();
		if (
			!isCurrent(result) ||
			result.accountType === null ||
			!('changed' in result) ||
			typeof result.changed !== 'boolean'
		) {
			throw new Error(
				'Invalid account-type update response. Reload the current type before retrying.',
			);
		}
		requestUserAccountTypesRefresh();
		return { ...result, changed: result.changed };
	},
};
