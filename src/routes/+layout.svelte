<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import CookieConsent from "$lib/components/CookieConsent.svelte";
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, onNavigate } from '$app/navigation';
	import { loggedInUser } from '$lib/store';
	import { canAccessModulePath, isRestrictedModulePath } from '$lib/utils/moduleAccess';
	import "../app.pcss";

	const defaultPageTitle = 'IPO Nigeria Portal';
	// Reset before the next page renders so its own title can override the fallback.
	onNavigate(({ from, to }) => {
		if (to && from?.route.id !== to.route.id) {
			document.title = defaultPageTitle;
		}
	});

	let mounted = false;
	$: restrictedModule = isRestrictedModulePath($page.url.pathname);
	$: canRenderRoute = !restrictedModule || ($loggedInUser !== null && canAccessModulePath($page.url.pathname, $loggedInUser.userRoles ?? []));
	$: if (mounted && !canRenderRoute) {
		goto($loggedInUser ? '/home/dashboard' : '/auth', { replaceState: true });
	}
	onMount(() => { mounted = true; });
</script>
 
<ModeWatcher defaultMode="light" defaultTheme="dracula"  />
<svelte:head>
	<title>{defaultPageTitle}</title>
</svelte:head>
{#if canRenderRoute}
	<slot />
{:else}
	<div class="p-6" aria-live="polite">Checking access...</div>
{/if}
<CookieConsent />
