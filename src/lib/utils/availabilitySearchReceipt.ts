import { get } from 'svelte/store';
import { baseURL, ApplicationLetters } from '$lib/helpers';
import { loggedInToken } from '$lib/store';

interface ReceiptTab extends Window {
	location: Location;
}

export type ReceiptErrorKind = 'unauthorized' | 'forbidden' | 'payment' | 'generic';

// Messages on this error are always safe to show to the user.
export class ReceiptError extends Error {
	constructor(
		public readonly kind: ReceiptErrorKind,
		message: string
	) {
		super(message);
		this.name = 'ReceiptError';
	}
}

export const SESSION_EXPIRED_MESSAGE = 'Session expired, please log in again';
export const RECEIPT_FORBIDDEN_MESSAGE = 'You are not allowed to print this receipt';
export const RECEIPT_PAYMENT_REQUIRED_MESSAGE =
	'Payment has not been completed for this availability search. Complete payment to print your receipt.';
export const RECEIPT_GENERIC_MESSAGE = 'Could not generate receipt, please try again';

async function readPaymentRequiredMessage(response: Response): Promise<string> {
	try {
		const body = await response.json();
		const message = body?.message;
		if (typeof message === 'string' && message.trim() && message.length <= 300) {
			return message.trim();
		}
	} catch {
		// Non-JSON body: fall back to the default message.
	}
	return RECEIPT_PAYMENT_REQUIRED_MESSAGE;
}

interface ReceiptDependencies {
	fetcher: typeof fetch;
	openTab: () => ReceiptTab | null;
	createObjectURL: (blob: Blob) => string;
	revokeObjectURL: (url: string) => void;
	scheduleRevoke: (callback: () => void) => number;
}

const defaultDependencies: ReceiptDependencies = {
	fetcher: (...args) => fetch(...args),
	openTab: () => window.open('about:blank', '_blank'),
	createObjectURL: (blob) => URL.createObjectURL(blob),
	revokeObjectURL: (url) => URL.revokeObjectURL(url),
	scheduleRevoke: (callback) => window.setTimeout(callback, 5 * 60_000)
};

export async function openAvailabilitySearchReceipt(
	rrr: string | null | undefined,
	dependencies: Partial<ReceiptDependencies> = {}
): Promise<void> {
	if (!rrr) {
		throw new ReceiptError('generic', RECEIPT_GENERIC_MESSAGE);
	}

	const token = get(loggedInToken);
	if (!token) {
		throw new ReceiptError('unauthorized', SESSION_EXPIRED_MESSAGE);
	}

	const deps = { ...defaultDependencies, ...dependencies };
	const receiptTab = deps.openTab();
	if (!receiptTab) {
		throw new ReceiptError('generic', 'The receipt tab was blocked. Allow pop-ups and try again.');
	}

	let objectUrl: string | null = null;
	try {
		const params = new URLSearchParams({
			letterType: ApplicationLetters.AvailabilitySearchReceipt.toString(),
			rrr
		});
		const response = await deps.fetcher(`${baseURL}/api/letters/generate?${params}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/pdf'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				throw new ReceiptError('unauthorized', SESSION_EXPIRED_MESSAGE);
			}
			if (response.status === 403) {
				throw new ReceiptError('forbidden', RECEIPT_FORBIDDEN_MESSAGE);
			}
			if (response.status === 409) {
				throw new ReceiptError('payment', await readPaymentRequiredMessage(response));
			}
			throw new ReceiptError('generic', RECEIPT_GENERIC_MESSAGE);
		}

		const blob = await response.blob();
		const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
		const isPdfSignature =
			signature.length === 5 &&
			signature[0] === 0x25 &&
			signature[1] === 0x50 &&
			signature[2] === 0x44 &&
			signature[3] === 0x46 &&
			signature[4] === 0x2d;
		if (!isPdfSignature) {
			throw new ReceiptError('generic', RECEIPT_GENERIC_MESSAGE);
		}

		const pdfBlob = new Blob([blob], { type: 'application/pdf' });
		objectUrl = deps.createObjectURL(pdfBlob);
		let revoked = false;
		const revoke = () => {
			if (revoked || !objectUrl) return;
			revoked = true;
			deps.revokeObjectURL(objectUrl);
		};
		deps.scheduleRevoke(revoke);
		receiptTab.location.replace(objectUrl);
	} catch (error) {
		if (objectUrl) deps.revokeObjectURL(objectUrl);
		receiptTab.close();
		throw error;
	}
}
