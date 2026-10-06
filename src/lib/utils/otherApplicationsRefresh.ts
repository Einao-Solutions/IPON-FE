import { writable } from 'svelte/store';

// Bumped whenever the Other Applications list may have changed server-side
// (payment confirmed, completion notification received) so an open page refetches it.
export const otherApplicationsRefresh = writable(0);

export function requestOtherApplicationsRefresh(): void {
	otherApplicationsRefresh.update((n) => n + 1);
}
