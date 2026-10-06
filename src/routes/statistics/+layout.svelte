<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";

  let mounted = false;
  $: isAuthorized = mounted && Array.isArray($loggedInUser?.userRoles) && $loggedInUser.userRoles.includes(UserRoles.SuperAdmin);
  $: if (mounted && !isAuthorized) {
    goto($loggedInUser ? "/home/dashboard" : "/auth");
  }

  onMount(() => { mounted = true; });
</script>

{#if isAuthorized}
  <slot />
{:else}
  <div class="p-6" aria-live="polite">Checking access...</div>
{/if}