<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";

  export let open: boolean = false;
  export let serviceName: string = "";
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <div class="flex flex-col items-center text-center py-4">
      <div
        class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4"
      >
        <Icon
          icon="mdi:wrench-clock"
          width="32"
          height="32"
          class="text-amber-500"
        />
      </div>

      <Dialog.Header class="space-y-2">
        <Dialog.Title class="text-lg font-semibold text-gray-900">
          Under Maintenance
        </Dialog.Title>
        <Dialog.Description class="text-sm text-gray-500">
          {#if serviceName}
            <span class="font-medium text-gray-700">{serviceName}</span> is currently
            under maintenance.
          {:else}
            This service is currently under maintenance.
          {/if}
          We're working to improve your experience. Please check back later.
        </Dialog.Description>
      </Dialog.Header>

      <div class="mt-6 w-full">
        <Button
          class="w-full bg-green-800 hover:bg-green-700"
          on:click={() => (open = false)}
        >
          Got it
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
