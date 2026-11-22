import { get, writable } from 'svelte/store';
import { goto, preloadCode } from '$app/navigation';
import { clearAuthCookies } from '$lib/auth-session';
import { loggedInToken, loggedInUser } from '$lib/store';

/** True while a sign-out is in flight; the home layout shows its overlay from this. */
export const isLoggingOut = writable(false);

// Long enough for the overlay to finish fading in before the page is swapped.
const OVERLAY_SETTLE_MS = 300;

function clearPersistedSession() {
	clearAuthCookies();
	sessionStorage.clear();
	// Preserve cookie consent choice across logout so the banner doesn't reappear on every login
	const cookieConsent = localStorage.getItem('cookie_consent');
	localStorage.clear();
	if (cookieConsent) localStorage.setItem('cookie_consent', cookieConsent);
	document.cookie.split(';').forEach((c) => {
		const eqPos = c.indexOf('=');
		const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
		document.cookie = `${name}=;path=/;max-age=0`;
	});
}

/**
 * Signs the user out and moves to the login page without the signed-in pages
 * visibly falling apart on the way. Safe to call repeatedly: a second call
 * while one is in flight does nothing.
 */
export async function logout(): Promise<void> {
	if (get(isLoggingOut)) return;
	isLoggingOut.set(true);

	// Persisted credentials go first, so the session ends even if the tab is
	// closed mid-transition and the login page does not bounce back.
	clearPersistedSession();

	await Promise.all([
		preloadCode('/auth').catch(() => {}),
		new Promise((resolve) => setTimeout(resolve, OVERLAY_SETTLE_MS))
	]);

	try {
		await goto('/auth');
	} catch (error) {
		console.error('Failed to navigate after logout', error);
	}

	if (!window.location.pathname.startsWith('/auth')) {
		// The overlay stays up; a full page load still gets the user out.
		window.location.assign('/auth');
		return;
	}

	// The in-memory session is dropped only now that the signed-in pages are
	// gone, so they never re-render half signed out.
	loggedInToken.set(null);
	loggedInUser.set(null);
	isLoggingOut.set(false);
}
