import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baseURL } from '$lib/helpers';
import {
	clearPendingAvailabilitySearch,
	confirmAvailabilitySearchPayment,
	getLatestPendingAvailabilitySearchRrr,
	getPendingAvailabilitySearchAppId,
	parseRrr,
	readRrrFromParams,
	savePendingAvailabilitySearch
} from './availabilitySearchPayment';

function createStorage() {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		removeItem: (key: string) => void data.delete(key)
	};
}

const getToken = () => 'test-token';

describe('confirmAvailabilitySearchPayment', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('posts the RRR with the bearer token and the optional appId, and reports success on 200', async () => {
		savePendingAvailabilitySearch('RRR1', 'app-1');
		const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

		const result = await confirmAvailabilitySearchPayment('RRR1', 'app-1', { fetcher, getToken });

		expect(result.outcome).toBe('confirmed');
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe(`${baseURL}/api/files/UpdateAvailabilitySearchPayment?paymentId=RRR1`);
		expect(init.method).toBe('POST');
		expect(init.headers).toEqual({
			Authorization: 'Bearer test-token',
			'Content-Type': 'application/json'
		});
		expect(JSON.parse(init.body)).toEqual({ appId: 'app-1' });
		expect(getPendingAvailabilitySearchAppId('RRR1')).toBeNull();
	});

	it('sends no body when there is no application id', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

		await confirmAvailabilitySearchPayment('RRR2', null, { fetcher, getToken });

		const [, init] = fetcher.mock.calls[0];
		expect(init.body).toBeUndefined();
		expect(init.headers).toEqual({ Authorization: 'Bearer test-token' });
	});

	it('treats 400 as still unpaid and keeps the pending RRR for a later retry', async () => {
		savePendingAvailabilitySearch('RRR3', 'app-3');
		const fetcher = vi.fn().mockResolvedValue(new Response('{"message":"unpaid"}', { status: 400 }));

		const result = await confirmAvailabilitySearchPayment('RRR3', 'app-3', { fetcher, getToken });

		expect(result).toEqual({ outcome: 'pending', message: 'Payment not confirmed yet' });
		expect(getPendingAvailabilitySearchAppId('RRR3')).toBe('app-3');
	});

	it.each([
		[401, 'unauthorized'],
		[403, 'forbidden'],
		[500, 'error']
	])('maps HTTP %i to %s', async (status, outcome) => {
		const fetcher = vi.fn().mockResolvedValue(new Response('', { status }));

		const result = await confirmAvailabilitySearchPayment(`RRR-${status}`, null, {
			fetcher,
			getToken
		});

		expect(result.outcome).toBe(outcome);
	});

	it('reports a network failure as an error', async () => {
		const fetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

		const result = await confirmAvailabilitySearchPayment('RRR4', null, { fetcher, getToken });

		expect(result.outcome).toBe('error');
	});

	it('does not call the API without a token', async () => {
		const fetcher = vi.fn();

		const result = await confirmAvailabilitySearchPayment('RRR5', null, {
			fetcher,
			getToken: () => null
		});

		expect(result.outcome).toBe('unauthorized');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('shares one request between concurrent calls for the same RRR', async () => {
		let release!: (response: Response) => void;
		const fetcher = vi.fn().mockReturnValue(
			new Promise<Response>((resolve) => {
				release = resolve;
			})
		);

		const first = confirmAvailabilitySearchPayment('RRR6', null, { fetcher, getToken });
		const second = confirmAvailabilitySearchPayment('RRR6', null, { fetcher, getToken });
		release(new Response('{}', { status: 200 }));

		expect((await first).outcome).toBe('confirmed');
		expect((await second).outcome).toBe('confirmed');
		expect(fetcher).toHaveBeenCalledTimes(1);

		await confirmAvailabilitySearchPayment('RRR6', null, {
			fetcher: vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
			getToken
		});
	});
});

describe('RRR helpers', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('keeps only the leading identifier when Remita appends its own query string', () => {
		expect(parseRrr('270007654321?RRR=270007654321')).toBe('270007654321');
		expect(parseRrr('  123 ')).toBe('123');
		expect(parseRrr('')).toBeNull();
		expect(parseRrr(null)).toBeNull();
	});

	it('reads the rrr parameter regardless of case', () => {
		expect(readRrrFromParams(new URLSearchParams('rrr=111'))).toBe('111');
		expect(readRrrFromParams(new URLSearchParams('orderID=1&RRR=222'))).toBe('222');
		expect(readRrrFromParams(new URLSearchParams('orderID=1'))).toBeNull();
	});

	it('remembers pending searches and returns the latest one', () => {
		savePendingAvailabilitySearch('A', 'app-a');
		savePendingAvailabilitySearch('B', null);

		expect(getPendingAvailabilitySearchAppId('A')).toBe('app-a');
		expect(getLatestPendingAvailabilitySearchRrr()).toBe('B');

		clearPendingAvailabilitySearch('B');
		expect(getLatestPendingAvailabilitySearchRrr()).toBe('A');
	});
});
