<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  
  export let selectedPeriod: string = "Monthly";
  export let onPeriodChange: (period: string) => void;
  
  const periods = ["Monthly", "Quarterly", "Yearly"];
</script>

<div class="flex items-center gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-200">
  <div class="flex items-center gap-2">
    <Icon icon="mdi:calendar" class="h-5 w-5 text-gray-600" />
    <span class="text-sm font-medium text-gray-700">Time Period:</span>
  </div>
  <div class="flex gap-2">
    {#each periods as period}
      <Button
        variant={selectedPeriod === period ? "default" : "outline"}
        size="sm"
        on:click={() => onPeriodChange(period)}
        class={selectedPeriod === period ? "bg-green-600 hover:bg-green-600" : ""}
      >
        {period}
      </Button>
    {/each}
  </div>
</div>
