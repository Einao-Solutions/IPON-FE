import { get } from 'svelte/store';
import { baseURL, ApplicationLetters } from '$lib/helpers';
import { loggedInToken } from '$lib/store';

interface ReceiptTab extends Window {
	location: Location;
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
		throw new Error('No payment reference is available for this receipt.');
	}

	const token = get(loggedInToken);
	if (!token) {
		throw new Error('Your session is missing or expired. Please sign in again.');
	}

	const deps = { ...defaultDependencies, ...dependencies };
	const receiptTab = deps.openTab();
	if (!receiptTab) {
		throw new Error('The receipt tab was blocked. Allow pop-ups and try again.');
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
			if (response.status === 401 || response.status === 403) {
				throw new Error(
					response.status === 401
						? 'Your session is missing or expired. Please sign in again.'
						: 'You are not authorized to print this receipt.'
				);
			}
			throw new Error(`Receipt request failed (${response.status}). Please try again.`);
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
			throw new Error('The server did not return a PDF receipt.');
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
