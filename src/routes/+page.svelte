<script lang="ts">
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";
  onMount(async () => {
    var loggedInUser = document.cookie
      .split(";")
      .find((x) => x.startsWith(" user=") || x.startsWith("user="));
    if (!loggedInUser) {
      toast.error("Please login", {
        position: "top-right",
      });
      await goto("/auth");
    } else {
      await goto("/home/dashboard");
    }
  });
</script>
