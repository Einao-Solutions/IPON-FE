import { afterEach, describe, expect, it, vi } from 'vitest';
import { loggedInToken } from '$lib/store';
import { baseURL, ApplicationLetters } from '$lib/helpers';
import { openAvailabilitySearchReceipt } from './availabilitySearchReceipt';

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
		[401, 'Your session is missing or expired. Please sign in again.'],
		[403, 'You are not authorized to print this receipt.']
	])('closes the blank tab and reports HTTP %i', async (status, message) => {
		loggedInToken.set('test-token');
		const tab = {
			location: { href: '', replace: vi.fn() },
			close: vi.fn()
		} as unknown as Window;
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status }));

		await expect(
			openAvailabilitySearchReceipt('12345', { fetcher, openTab: () => tab })
		).rejects.toThrow(message);
		expect(tab.close).toHaveBeenCalledOnce();
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
		).rejects.toThrow('The server did not return a PDF receipt.');
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
		).rejects.toThrow('The server did not return a PDF receipt.');
		expect(tab.close).toHaveBeenCalledOnce();
	});
});
