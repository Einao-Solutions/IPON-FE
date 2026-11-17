import { writable } from 'svelte/store';
import { isRoleErrorRetryable, roleErrorMessage } from './userRolesApi';

interface QueryState<T> {
	data: T | null;
	loading: boolean;
	error: string;
	retryable: boolean;
}

export function createRoleQuery<T>() {
	const state = writable<QueryState<T>>({
		data: null,
		loading: false,
		error: '',
		retryable: false,
	});
	let version = 0;
	let controller: AbortController | undefined;

	function cancel() {
		version++;
		controller?.abort();
		state.set({ data: null, loading: true, error: '', retryable: false });
	}

	return {
		subscribe: state.subscribe,
		cancel,
		async load(request: (signal: AbortSignal) => Promise<T>) {
			cancel();
			const current = version;
			controller = new AbortController();
			try {
				const data = await request(controller.signal);
				if (current === version)
					state.set({ data, loading: false, error: '', retryable: false });
			} catch (error) {
				if (current !== version) return;
				state.set({
					data: null,
					loading: false,
					error: roleErrorMessage(error),
					retryable: isRoleErrorRetryable(error),
				});
			}
		},
	};
}
