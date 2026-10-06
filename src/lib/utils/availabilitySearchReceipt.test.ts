import { afterEach, describe, expect, it, vi } from 'vitest';
import { loggedInToken } from '$lib/store';
import { baseURL, ApplicationLetters } from '$lib/helpers';
import { openAvailabilitySearchReceipt, ReceiptError } from './availabilitySearchReceipt';

describe('openAvailabilitySearchReceipt', () => {
	afterEach(() => {
		loggedInToken.set(null);
		vi.restoreAllMocks();
	});

	it('uses the bearer token and keeps the PDF URL alive until delayed cleanup', async () => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi.fn().mockResolvedValue(
			new Response(new Blob(['%PDF-1.4 receipt'], { type: 'application/pdf' }), {
				status: 200,
				headers: { 'Content-Type': 'application/pdf' }
			})
		);
		const createObjectURL = vi.fn().mockReturnValue('blob:receipt');
		const revokeObjectURL = vi.fn();
		let cleanup: (() => void) | undefined;
		const scheduleRevoke = vi.fn((callback: () => void) => {
			cleanup = callback;
			return 1;
		});

		await openAvailabilitySearchReceipt('12345', {
			fetcher,
			openTab: () => tab,
			createObjectURL,
			revokeObjectURL,
			scheduleRevoke
		});

		const [url, options] = fetcher.mock.calls[0];
		expect(url).toBe(
			`${baseURL}/api/letters/generate?letterType=${ApplicationLetters.AvailabilitySearchReceipt}&rrr=12345`
		);
		expect(options.headers).toEqual({
			Authorization: 'Bearer test-token',
			Accept: 'application/pdf'
		});
		expect(tab.location.replace).toHaveBeenCalledWith('blob:receipt');
		expect(createObjectURL).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'application/pdf' })
		);
		expect(scheduleRevoke).toHaveBeenCalledOnce();
		expect(revokeObjectURL).not.toHaveBeenCalled();
		cleanup?.();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:receipt');
	});

	it.each([
		[401, 'unauthorized', 'Session expired, please log in again'],
		[403, 'forbidden', 'You are not allowed to print this receipt'],
		[500, 'generic', 'Could not generate receipt, please try again']
	])('closes the blank tab and reports HTTP %i', async (status, kind, message) => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi
			.fn()
			.mockResolvedValue(new Response('<html>raw server error</html>', { status }));

		const error = await openAvailabilitySearchReceipt('12345', {
			fetcher,
			openTab: () => tab
		}).catch((e) => e);

		expect(error).toBeInstanceOf(ReceiptError);
		expect(error.kind).toBe(kind);
		expect(error.message).toBe(message);
		expect(tab.close).toHaveBeenCalledOnce();
	});

	it('shows the server message for 409 payment-required responses', async () => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const message =
			'Payment has not been completed for this availability search. Complete payment to print your receipt.';
		const fetcher = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message }), {
				status: 409,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		const error = await openAvailabilitySearchReceipt('12345', {
			fetcher,
			openTab: () => tab
		}).catch((e) => e);

		expect(error).toBeInstanceOf(ReceiptError);
		expect(error.kind).toBe('payment');
		expect(error.message).toBe(message);
		expect(tab.close).toHaveBeenCalledOnce();
	});

	it('falls back to the default 409 message when the body is not usable', async () => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 409 }));

		await expect(
			openAvailabilitySearchReceipt('12345', { fetcher, openTab: () => tab })
		).rejects.toThrow('Complete payment to print your receipt.');
	});

	it('rejects a missing token before opening a tab', async () => {
		const openTab = vi.fn();

		await expect(openAvailabilitySearchReceipt('12345', { openTab })).rejects.toMatchObject({
			kind: 'unauthorized'
		});
		expect(openTab).not.toHaveBeenCalled();
	});

	it('closes the blank tab when the successful response is not a PDF', async () => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi.fn().mockResolvedValue(
			new Response(new Blob(['not a PDF'], { type: 'application/json' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		await expect(
			openAvailabilitySearchReceipt('12345', { fetcher, openTab: () => tab })
		).rejects.toThrow('Could not generate receipt, please try again');
		expect(tab.close).toHaveBeenCalledOnce();
	});

	it('rejects a non-PDF body even when the server labels it as a PDF', async () => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi.fn().mockResolvedValue(
			new Response(new Blob(['error page'], { type: 'application/pdf' }), {
				status: 200,
				headers: { 'Content-Type': 'application/pdf' }
			})
		);

		await expect(
			openAvailabilitySearchReceipt('12345', { fetcher, openTab: () => tab })
		).rejects.toThrow('Could not generate receipt, please try again');
		expect(tab.close).toHaveBeenCalledOnce();
	});
});
