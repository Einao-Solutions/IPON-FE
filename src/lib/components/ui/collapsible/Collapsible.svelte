<script lang="ts">
  import { slide } from "svelte/transition";
  
  let open = false;
</script>

<div class="collapsible-root">
  <slot {open} toggle={() => (open = !open)} />
</div>
