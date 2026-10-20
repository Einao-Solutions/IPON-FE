import { get } from 'svelte/store';
import { baseURL } from '$lib/helpers';
import { loggedInToken } from '$lib/store';
import { SESSION_EXPIRED_MESSAGE } from './authFetch';

export type ConfirmOutcome = 'confirmed' | 'pending' | 'unauthorized' | 'forbidden' | 'error';

export interface ConfirmResult {
	outcome: ConfirmOutcome;
	message: string;
}

export const PAYMENT_PENDING_MESSAGE = 'Payment not confirmed yet';
export const PAYMENT_SESSION_MESSAGE = SESSION_EXPIRED_MESSAGE;
export const PAYMENT_FORBIDDEN_MESSAGE = 'You are not allowed to confirm this payment';
export const PAYMENT_GENERIC_MESSAGE = 'Could not confirm your payment, please try again';

const PENDING_STORAGE_KEY = 'pendingAvailabilitySearches';

type PendingMap = Record<string, string | null>;

function readPending(): PendingMap {
	if (typeof localStorage === 'undefined') return {};
	try {
		const parsed = JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) ?? '{}');
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function writePending(pending: PendingMap) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
}

// Remembers the RRR (and application id) generated for an unpaid search so that returning from
// Remita, refreshing the page or reopening the app later can still confirm it.
export function savePendingAvailabilitySearch(rrr: string, appId?: string | null) {
	const pending = readPending();
	delete pending[rrr];
	pending[rrr] = appId ?? null;
	writePending(pending);
}

export function getPendingAvailabilitySearchAppId(rrr: string): string | null {
	return readPending()[rrr] ?? null;
}

// Fallback for when Remita's redirect does not carry the RRR back.
export function getLatestPendingAvailabilitySearchRrr(): string | null {
	const keys = Object.keys(readPending());
	return keys.length ? keys[keys.length - 1] : null;
}

export function clearPendingAvailabilitySearch(rrr: string) {
	const pending = readPending();
	if (rrr in pending) {
		delete pending[rrr];
		writePending(pending);
	}
}

// Remita can append its own query string to the return URL (e.g. "?rrr=123?RRR=123"),
// so keep only the leading identifier characters.
export function parseRrr(value: string | null | undefined): string | null {
	const match = value?.trim().match(/^[A-Za-z0-9-]+/);
	return match ? match[0] : null;
}

export function readRrrFromParams(params: URLSearchParams): string | null {
	for (const [key, value] of params.entries()) {
		if (key.toLowerCase() === 'rrr') {
			const rrr = parseRrr(value);
			if (rrr) return rrr;
		}
	}
	return null;
}

interface ConfirmDependencies {
	fetcher: typeof fetch;
	getToken: () => string | null;
}

const defaultDependencies: ConfirmDependencies = {
	fetcher: (...args) => fetch(...args),
	getToken: () => get(loggedInToken)
};

// Calls made for the same RRR while one is already running share the same request,
// so a double click or the page and the list both confirming never send duplicates.
const inFlight = new Map<string, Promise<ConfirmResult>>();

async function sendConfirmation(
	rrr: string,
	appId: string | null | undefined,
	deps: ConfirmDependencies
): Promise<ConfirmResult> {
	const token = deps.getToken();
	if (!token) {
		return { outcome: 'unauthorized', message: PAYMENT_SESSION_MESSAGE };
	}

	const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
	const init: RequestInit = { method: 'POST', headers };
	if (appId) {
		headers['Content-Type'] = 'application/json';
		init.body = JSON.stringify({ appId });
	}

	try {
		const response = await deps.fetcher(
			`${baseURL}/api/files/UpdateAvailabilitySearchPayment?paymentId=${encodeURIComponent(rrr)}`,
			init
		);

		if (response.ok) {
			clearPendingAvailabilitySearch(rrr);
			return { outcome: 'confirmed', message: 'Payment successful, search approved' };
		}
		if (response.status === 400) {
			return { outcome: 'pending', message: PAYMENT_PENDING_MESSAGE };
		}
		if (response.status === 401) {
			return { outcome: 'unauthorized', message: PAYMENT_SESSION_MESSAGE };
		}
		if (response.status === 403) {
			return { outcome: 'forbidden', message: PAYMENT_FORBIDDEN_MESSAGE };
		}
		return { outcome: 'error', message: PAYMENT_GENERIC_MESSAGE };
	} catch {
		return { outcome: 'error', message: PAYMENT_GENERIC_MESSAGE };
	}
}

// Confirmation is by RRR only; the application id is an optional extra hint for the backend.
export function confirmAvailabilitySearchPayment(
	rrr: string,
	appId?: string | null,
	dependencies: Partial<ConfirmDependencies> = {}
): Promise<ConfirmResult> {
	const existing = inFlight.get(rrr);
	if (existing) return existing;

	const request = sendConfirmation(rrr, appId, { ...defaultDependencies, ...dependencies }).finally(
		() => inFlight.delete(rrr)
	);
	inFlight.set(rrr, request);
	return request;
}
