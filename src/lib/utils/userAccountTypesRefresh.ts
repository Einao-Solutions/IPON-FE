import { writable } from 'svelte/store';

export const userAccountTypesRefresh = writable(0);

export function requestUserAccountTypesRefresh(): void {
	userAccountTypesRefresh.update((version) => version + 1);
}
