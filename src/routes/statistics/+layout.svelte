<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";

  let isAuthorized = false;

  onMount(() => {
    const user = $loggedInUser;

    if (!user) {
      goto("/auth");
      return;
    }

    if (!user.userRoles?.includes(UserRoles.SuperAdmin)) {
      goto("/home/dashboard");
      return;
    }

    isAuthorized = true;
  });
</script>

{#if isAuthorized}
  <slot />
{:else}
  <div class="p-6" aria-live="polite">Checking access...</div>
{/if}