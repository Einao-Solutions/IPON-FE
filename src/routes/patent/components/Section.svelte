<script lang="ts">
  export let title: string;
  export let step: number;
  import { goToStep } from '$lib/utils/patent';
</script>

<div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3 mb-8">
  <div class="flex justify-between items-center border-b pb-2">
    <h2 class="text-lg font-semibold text-gray-800">{title}</h2>
    <button
      on:click={() => goToStep(step)}
      class="rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-4 py-1 text-sm font-medium transition shadow-sm border border-blue-200"
    >
      Edit
    </button>
  </div>
  <div class="text-gray-700 text-sm space-y-2">
    <slot />
  </div>
</div>