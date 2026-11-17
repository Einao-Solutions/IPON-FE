import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { createRoleQuery } from './roleQuery';
import { RoleApiError } from './userRolesApi';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('role query concurrency', () => {
	it('aborts superseded requests and ignores responses even if abort was ignored', async () => {
		const query = createRoleQuery<string>();
		const old = deferred<string>();
		let oldSignal: AbortSignal | undefined;
		const first = query.load((signal) => {
			oldSignal = signal;
			return old.promise;
		});
		await query.load(async () => 'new results');
		expect(oldSignal?.aborted).toBe(true);
		old.resolve('stale results');
		await first;
		expect(get(query)).toMatchObject({
			data: 'new results',
			loading: false,
			error: '',
		});
	});

	it('invalidates in-flight results immediately while waiting for a debounce', async () => {
		const query = createRoleQuery<string>();
		const old = deferred<string>();
		const first = query.load(() => old.promise);
		query.cancel();
		old.reject(new Error('stale failure'));
		await first;
		expect(get(query)).toMatchObject({ data: null, error: '', loading: true });
		await query.load(async () => 'current results');
		expect(get(query).data).toBe('current results');
	});

	it('clears stale data on failures and supports retrying a network error', async () => {
		const query = createRoleQuery<string>();
		await query.load(async () => 'previous results');
		await query.load(async () => {
			throw new TypeError('Failed to fetch');
		});
		expect(get(query)).toMatchObject({
			data: null,
			loading: false,
			retryable: true,
			error: expect.stringContaining('Please retry'),
		});
		await query.load(async () => 'retried results');
		expect(get(query)).toMatchObject({
			data: 'retried results',
			error: '',
			loading: false,
		});
	});

	it('shows access denied without offering a network retry', async () => {
		const query = createRoleQuery<string>();
		await query.load(async () => {
			throw new RoleApiError('Access denied.', 403);
		});
		expect(get(query)).toMatchObject({
			data: null,
			error: 'Access denied.',
			retryable: false,
			loading: false,
		});
	});
});
