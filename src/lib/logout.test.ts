import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const { gotoMock, preloadCodeMock, clearCookiesMock } = vi.hoisted(() => ({
	gotoMock: vi.fn(),
	preloadCodeMock: vi.fn(),
	clearCookiesMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({ goto: gotoMock, preloadCode: preloadCodeMock }));
vi.mock('$lib/auth-session', () => ({ clearAuthCookies: clearCookiesMock }));

const { loggedInToken, loggedInUser } = await import('$lib/store');
const { isLoggingOut, logout } = await import('./logout');

const assignMock = vi.fn();
let location: { pathname: string; assign: typeof assignMock };

function memoryStorage(initial: Record<string, string> = {}) {
	const items = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value),
		clear: () => items.clear()
	};
}

describe('logout', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		gotoMock.mockReset();
		preloadCodeMock.mockReset().mockResolvedValue(undefined);
		clearCookiesMock.mockReset();
		assignMock.mockReset();

		location = { pathname: '/home/dashboard', assign: assignMock };
		vi.stubGlobal('window', { location });
		vi.stubGlobal('document', { cookie: '' });
		vi.stubGlobal('sessionStorage', memoryStorage({ User: '{}' }));
		vi.stubGlobal('localStorage', memoryStorage({ cookie_consent: 'kept', draft: 'dropped' }));

		isLoggingOut.set(false);
		loggedInToken.set('test-token');
		loggedInUser.set({ firstName: 'Ada' } as never);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('keeps the in-memory session until the login page has taken over', async () => {
		let finishNavigation = () => {};
		gotoMock.mockReturnValue(new Promise<void>((resolve) => (finishNavigation = resolve)));

		const done = logout();
		await vi.advanceTimersByTimeAsync(300);

		// Navigation is under way: persisted credentials are already gone, but
		// the signed-in pages still on screen keep their user and token.
		expect(gotoMock).toHaveBeenCalledWith('/auth');
		expect(clearCookiesMock).toHaveBeenCalledTimes(1);
		expect(localStorage.getItem('draft')).toBeNull();
		expect(localStorage.getItem('cookie_consent')).toBe('kept');
		expect(get(isLoggingOut)).toBe(true);
		expect(get(loggedInToken)).toBe('test-token');
		expect(get(loggedInUser)).not.toBeNull();

		location.pathname = '/auth/';
		finishNavigation();
		await done;

		expect(get(loggedInToken)).toBeNull();
		expect(get(loggedInUser)).toBeNull();
		expect(get(isLoggingOut)).toBe(false);
		expect(assignMock).not.toHaveBeenCalled();
	});

	it('falls back to a full page load when navigation does not reach the login page', async () => {
		gotoMock.mockRejectedValue(new Error('chunk failed to load'));
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const done = logout();
		await vi.advanceTimersByTimeAsync(300);
		await done;

		expect(assignMock).toHaveBeenCalledWith('/auth');
		// The overlay stays up until the browser replaces the page.
		expect(get(isLoggingOut)).toBe(true);
		errorSpy.mockRestore();
	});

	it('ignores a second call while a sign-out is in flight', async () => {
		gotoMock.mockImplementation(async () => {
			location.pathname = '/auth/';
		});

		const first = logout();
		const second = logout();
		await vi.advanceTimersByTimeAsync(300);
		await Promise.all([first, second]);

		expect(gotoMock).toHaveBeenCalledTimes(1);
		expect(clearCookiesMock).toHaveBeenCalledTimes(1);
	});
});
