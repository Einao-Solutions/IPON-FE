<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import CookieConsent from "$lib/components/CookieConsent.svelte";
	import "../app.pcss";

</script>
 
<ModeWatcher defaultMode="light" defaultTheme="dracula"  />
<slot />
<CookieConsent />
