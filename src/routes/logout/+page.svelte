<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loggedInUser } from '$lib/store';
	import {getAuth} from "firebase/auth"

	onMount(async () => {
		if ($loggedInUser != null) {
			document.cookie = 'user=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
			const auth=getAuth()
			await auth.signOut()
			window.location.reload();
		} else {
			await goto('/auth');
		}
	});
</script>
