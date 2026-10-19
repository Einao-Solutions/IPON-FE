import { get } from 'svelte/store';
import { loggedInToken, loggedInUser } from '$lib/store';
import { clearAuthCookies } from '$lib/auth-session';

export const SESSION_EXPIRED_MESSAGE = 'Session expired, please log in again';

export interface AuthFetchInit extends RequestInit {
	/**
	 * Handle a 401 locally instead of triggering the shared session-expiry
	 * redirect, for callers that show their own message.
	 */
	skipSessionExpiryRedirect?: boolean;
}

/** Reads the bearer token held for the current session, if any. */
export function getAuthToken(): string | null {
	const token = get(loggedInToken);
	return token && token.trim() ? token : null;
}

// Access tokens last 2 hours while the login cookie lasts 7 days, so a stale
// token returns 401. There is no refresh flow, so the user has to sign in
// again. Remembering which token was rejected collapses a burst of parallel
// 401s into a single redirect, while still letting a later session expire.
let rejectedToken: string | null | undefined;

/**
 * Drops the expired session and sends the user back to the login page. Safe to
 * call repeatedly: only the first call for a given token takes effect.
 */
export function handleSessionExpired(token: string | null = getAuthToken()): void {
	if (typeof window === 'undefined') return;
	if (rejectedToken === token) return;
	rejectedToken = token;

	clearAuthCookies();
	loggedInToken.set(null);
	loggedInUser.set(null);

	// Imported lazily so this module stays usable outside a browser bundle.
	void (async () => {
		try {
			const { toast } = await import('svelte-sonner');
			toast.error(SESSION_EXPIRED_MESSAGE);
			if (window.location?.pathname?.startsWith('/auth')) return;
			const { goto } = await import('$app/navigation');
			await goto('/auth');
		} catch (error) {
			console.error('Failed to redirect after session expiry', error);
		}
	})();
}

function hasAuthorization(keys: string[]): boolean {
	return keys.some((key) => key.toLowerCase() === 'authorization');
}

/**
 * Adds the bearer token while keeping the caller's header representation, so
 * code that reads `init.headers.Authorization` keeps working.
 */
function withAuthorization(headers: HeadersInit | undefined, token: string): HeadersInit {
	if (typeof Headers !== 'undefined' && headers instanceof Headers) {
		const next = new Headers(headers);
		if (!next.has('Authorization')) next.set('Authorization', `Bearer ${token}`);
		return next;
	}

	if (Array.isArray(headers)) {
		return hasAuthorization(headers.map(([key]) => key))
			? headers
			: [...headers, ['Authorization', `Bearer ${token}`]];
	}

	// Plain objects in this codebase sometimes carry undefined values, which the
	// Headers constructor rejects, so they are filtered out here.
	const next: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers ?? {})) {
		if (value === undefined || value === null) continue;
		next[key] = String(value);
	}
	if (!hasAuthorization(Object.keys(next))) next['Authorization'] = `Bearer ${token}`;
	return next;
}

/**
 * Builds headers for an authenticated API call. The Authorization header is
 * omitted when no token is available so that public endpoints keep working.
 */
export function authHeaders(headers?: HeadersInit): HeadersInit {
	const token = getAuthToken();
	if (!token) return headers ?? {};
	return withAuthorization(headers, token);
}

/**
 * `fetch` wrapper that attaches the bearer token to IPON backend calls.
 *
 * Existing headers are preserved and never overwritten, and no Content-Type is
 * added, so `FormData` bodies keep their generated multipart boundary. A 401 on
 * a request that carried a token means the session expired, so the user is
 * signed out and redirected unless `skipSessionExpiryRedirect` is set.
 */
export async function authFetch(input: RequestInfo | URL, init?: AuthFetchInit): Promise<Response> {
	const token = getAuthToken();
	const requestInit = stripAuthFetchOptions(init);

	// Without a token nothing was authenticated, so a 401 just means the caller
	// hit a protected endpoint from a public page; leave that to the caller.
	if (!token) return fetch(input, requestInit);

	const response = await sendWithToken(input, requestInit, token);
	if (response.status === 401 && !init?.skipSessionExpiryRedirect) {
		handleSessionExpired(token);
	}
	return response;
}

function stripAuthFetchOptions(init?: AuthFetchInit): RequestInit | undefined {
	if (!init || !('skipSessionExpiryRedirect' in init)) return init;
	const { skipSessionExpiryRedirect: _omitted, ...rest } = init;
	return rest;
}

function sendWithToken(
	input: RequestInfo | URL,
	init: RequestInit | undefined,
	token: string
): Promise<Response> {
	const isRequest = typeof Request !== 'undefined' && input instanceof Request;
	if (isRequest && !init?.headers) {
		const headers = withAuthorization((input as Request).headers, token);
		return fetch(new Request(input as Request, { headers }), init);
	}

	return fetch(input, { ...init, headers: withAuthorization(init?.headers, token) });
}
