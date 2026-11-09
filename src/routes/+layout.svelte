<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import CookieConsent from "$lib/components/CookieConsent.svelte";
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { loggedInUser } from '$lib/store';
	import { canAccessModulePath, isRestrictedModulePath } from '$lib/utils/moduleAccess';
	import "../app.pcss";

	let mounted = false;
	$: restrictedModule = isRestrictedModulePath($page.url.pathname);
	$: canRenderRoute = !restrictedModule || ($loggedInUser !== null && canAccessModulePath($page.url.pathname, $loggedInUser.userRoles ?? []));
	$: if (mounted && !canRenderRoute) {
		goto($loggedInUser ? '/home/dashboard' : '/auth', { replaceState: true });
	}
	onMount(() => { mounted = true; });
</script>
 
<ModeWatcher defaultMode="light" defaultTheme="dracula"  />
{#if canRenderRoute}
	<slot />
{:else}
	<div class="p-6" aria-live="polite">Checking access...</div>
{/if}
<CookieConsent />
