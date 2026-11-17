import { writable } from 'svelte/store';

export const userRolesRefresh = writable(0);

export function requestUserRolesRefresh(): void {
	userRolesRefresh.update((version) => version + 1);
}
