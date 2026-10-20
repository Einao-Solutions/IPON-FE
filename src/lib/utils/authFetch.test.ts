import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let token: string | null = 'test-token';

const { setTokenMock, setUserMock, clearCookiesMock, toastErrorMock, gotoMock } = vi.hoisted(
	() => ({
		setTokenMock: vi.fn(),
		setUserMock: vi.fn(),
		clearCookiesMock: vi.fn(),
		toastErrorMock: vi.fn(),
		gotoMock: vi.fn()
	})
);

vi.mock('$lib/store', () => ({
	loggedInToken: { set: setTokenMock },
	loggedInUser: { set: setUserMock }
}));
vi.mock('$lib/auth-session', () => ({ clearAuthCookies: clearCookiesMock }));
vi.mock('svelte-sonner', () => ({ toast: { error: toastErrorMock } }));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));
vi.mock('svelte/store', () => ({ get: () => token }));

const { authFetch, authHeaders, getAuthToken, handleSessionExpired, SESSION_EXPIRED_MESSAGE } =
	await import('./authFetch');

const fetchMock = vi.fn();

function lastInit(): RequestInit {
	return fetchMock.mock.calls[0][1] as RequestInit;
}

function unauthorized() {
	return new Response('', { status: 401 });
}

/** Simulates a browser so the session-expiry path is reachable under node. */
function stubBrowser(pathname = '/home/dashboard') {
	vi.stubGlobal('window', { location: { pathname } });
}

describe('authFetch', () => {
	beforeEach(() => {
		token = 'test-token';
		fetchMock.mockReset();
		fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('attaches the bearer token when none was supplied', async () => {
		await authFetch('https://example.test/api/files/summary');
		expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/api/files/summary');
		expect((lastInit().headers as Record<string, string>).Authorization).toBe('Bearer test-token');
	});

	it('keeps caller headers and their plain-object shape', async () => {
		await authFetch('https://example.test/api/users/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}'
		});
		const headers = lastInit().headers as Record<string, string>;
		expect(headers['Content-Type']).toBe('application/json');
		expect(headers.Authorization).toBe('Bearer test-token');
		expect(lastInit().method).toBe('POST');
	});

	it('never overwrites an Authorization header the caller already set', async () => {
		await authFetch('https://example.test/api/admin/stats', {
			headers: { Authorization: 'Bearer caller-token' }
		});
		const headers = lastInit().headers as Record<string, string>;
		expect(headers.Authorization).toBe('Bearer caller-token');
	});

	it('does not add a Content-Type, so FormData keeps its multipart boundary', async () => {
		const body = new FormData();
		body.append('file', 'contents');
		await authFetch('https://example.test/api/files/uploadAttachment', { method: 'POST', body });
		const headers = lastInit().headers as Record<string, string>;
		expect(headers.Authorization).toBe('Bearer test-token');
		expect(hasContentType(headers)).toBe(false);
	});

	it('omits the header entirely when there is no token', async () => {
		token = null;
		await authFetch('https://example.test/api/files/summary', {
			headers: { 'Content-Type': 'application/json' }
		});
		const headers = lastInit().headers as Record<string, string>;
		expect(headers.Authorization).toBeUndefined();
		expect(headers['Content-Type']).toBe('application/json');
	});

	it('leaves a blank token treated as absent', async () => {
		token = '   ';
		await authFetch('https://example.test/api/files/summary');
		expect(getAuthToken()).toBeNull();
		expect(lastInit()).toBeUndefined();
	});

	it('supports Headers instances without losing existing entries', async () => {
		const headers = new Headers({ 'X-Trace': 'abc' });
		await authFetch('https://example.test/api/tickets/GetStats', { headers });
		const sent = lastInit().headers as Headers;
		expect(sent.get('X-Trace')).toBe('abc');
		expect(sent.get('Authorization')).toBe('Bearer test-token');
	});

	it('supports tuple header arrays', async () => {
		await authFetch('https://example.test/api/tickets/GetStats', {
			headers: [['X-Trace', 'abc']]
		});
		const sent = lastInit().headers as string[][];
		expect(sent).toContainEqual(['Authorization', 'Bearer test-token']);
		expect(sent).toContainEqual(['X-Trace', 'abc']);
	});

	it('drops undefined header values rather than throwing', async () => {
		await authFetch('https://example.test/api/files/summary', {
			headers: { 'Content-Type': undefined } as unknown as HeadersInit
		});
		const headers = lastInit().headers as Record<string, string>;
		expect(hasContentType(headers)).toBe(false);
		expect(headers.Authorization).toBe('Bearer test-token');
	});
});

describe('session expiry on 401', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		clearCookiesMock.mockClear();
		setTokenMock.mockClear();
		setUserMock.mockClear();
		toastErrorMock.mockClear();
		gotoMock.mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('clears the session and redirects when a token is rejected', async () => {
		token = 'expired-a';
		stubBrowser();
		fetchMock.mockResolvedValue(unauthorized());

		const res = await authFetch('https://example.test/api/files/summary');

		expect(res.status).toBe(401);
		expect(clearCookiesMock).toHaveBeenCalledOnce();
		expect(setTokenMock).toHaveBeenCalledWith(null);
		expect(setUserMock).toHaveBeenCalledWith(null);
		await vi.waitFor(() => expect(gotoMock).toHaveBeenCalledWith('/auth'));
		expect(toastErrorMock).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
	});

	it('collapses parallel 401s for the same token into one redirect', async () => {
		token = 'expired-b';
		stubBrowser();
		fetchMock.mockResolvedValue(unauthorized());

		await Promise.all([
			authFetch('https://example.test/api/files/summary'),
			authFetch('https://example.test/api/users/list'),
			authFetch('https://example.test/api/tickets/GetStats')
		]);

		await vi.waitFor(() => expect(gotoMock).toHaveBeenCalled());
		expect(clearCookiesMock).toHaveBeenCalledOnce();
		expect(toastErrorMock).toHaveBeenCalledOnce();
		expect(gotoMock).toHaveBeenCalledOnce();
	});

	it('lets a new session expire in its turn after re-login', async () => {
		stubBrowser();
		fetchMock.mockResolvedValue(unauthorized());

		token = 'expired-c';
		await authFetch('https://example.test/api/files/summary');
		token = 'expired-d';
		await authFetch('https://example.test/api/files/summary');

		await vi.waitFor(() => expect(gotoMock).toHaveBeenCalledTimes(2));
		expect(clearCookiesMock).toHaveBeenCalledTimes(2);
	});

	it('ignores a 401 when no token was attached, leaving public pages alone', async () => {
		token = null;
		stubBrowser();
		fetchMock.mockResolvedValue(unauthorized());

		await authFetch('https://example.test/api/files/GetFileByFileNumber?fileNumber=1');

		expect(clearCookiesMock).not.toHaveBeenCalled();
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('honours skipSessionExpiryRedirect and keeps it out of the request init', async () => {
		token = 'expired-e';
		stubBrowser();
		fetchMock.mockResolvedValue(unauthorized());

		await authFetch('https://example.test/api/admin/ApplicationHistory', {
			method: 'POST',
			skipSessionExpiryRedirect: true
		});

		expect(clearCookiesMock).not.toHaveBeenCalled();
		expect(gotoMock).not.toHaveBeenCalled();
		expect(lastInit()).not.toHaveProperty('skipSessionExpiryRedirect');
		expect(lastInit().method).toBe('POST');
	});

	it('clears the session but does not redirect when already on the login page', async () => {
		token = 'expired-f';
		stubBrowser('/auth');
		fetchMock.mockResolvedValue(unauthorized());

		await authFetch('https://example.test/api/files/summary');

		await vi.waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
		expect(clearCookiesMock).toHaveBeenCalledOnce();
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('does nothing outside the browser', () => {
		token = 'expired-g';
		handleSessionExpired('expired-g');
		expect(clearCookiesMock).not.toHaveBeenCalled();
	});

	it('leaves non-401 failures untouched', async () => {
		token = 'live-token';
		stubBrowser();
		fetchMock.mockResolvedValue(new Response('', { status: 403 }));

		await authFetch('https://example.test/api/admin/stats');

		expect(clearCookiesMock).not.toHaveBeenCalled();
		expect(gotoMock).not.toHaveBeenCalled();
	});
});

describe('authHeaders', () => {
	it('adds the bearer token to supplied headers', () => {
		token = 'test-token';
		const headers = authHeaders({ 'Content-Type': 'application/json' }) as Record<string, string>;
		expect(headers.Authorization).toBe('Bearer test-token');
		expect(headers['Content-Type']).toBe('application/json');
	});

	it('returns the headers untouched when no token is available', () => {
		token = null;
		const headers = authHeaders({ 'Content-Type': 'application/json' }) as Record<string, string>;
		expect(headers.Authorization).toBeUndefined();
	});
});

function hasContentType(headers: Record<string, string>): boolean {
	return Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
}
