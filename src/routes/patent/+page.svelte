<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import { currentStep, steps, patentForm, countries } from '$lib/utils/patent';

  import PatentInformation from './components/PatentInformation.svelte';
  import Applicants from './components/Applicants.svelte';
  import Inventors from './components/Inventors.svelte';
  import FirstPriority from './components/FirstPriority.svelte';
  import PriorityInfo from './components/PriorityInfo.svelte';
  import Correspondence from './components/Correspondence.svelte';
  import Attachments from './components/Attachments.svelte';
  import Summary from './components/Summary.svelte';
  import { onMount } from 'svelte';

  let stepIndex: number;
  let stepList: string[];

  $: stepIndex = $currentStep;
  $: stepList = $steps;

  const allComponents = {
    'Patent Information': PatentInformation,
    'Applicants Information': Applicants,
    'Inventors Information': Inventors,
    'First Priority Information': FirstPriority,
    'Additional Priority Information': PriorityInfo,
    'Correspondence Information': Correspondence,
    'Attachments': Attachments,
    'Review and Submit': Summary
  };

  onMount(() => {
  // Run the async fetch logic separately
  (async () => {
    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
      const data = await res.json();
      countries.set(data?.data ?? data); // set in global store
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  })();

  // Back button / previous page logic
  const onPopState = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/"; // fallback if no history
    }
  };

  window.addEventListener("popstate", onPopState);

  // Return cleanup function directly
  return () => {
    window.removeEventListener("popstate", onPopState);
  };
});
</script>

<div class="flex h-screen">
  <!-- Sidebar (fixed width) -->
  <div class="w-80 fixed top-0 left-0 h-screen z-10 bg-white border-r">
    <Sidebar />
  </div>

  <!-- Main Content (scrollable area with left margin to offset fixed sidebar) -->
  <main class="ml-80 flex-1 h-screen overflow-y-auto px-8 py-10 bg-gray-50">
    <div class="max-w-5xl mx-auto">
      {#if stepList[stepIndex]}
        <svelte:component this={allComponents[stepList[stepIndex]]} />
      {:else}
        <p class="text-gray-500">Invalid step.</p>
      {/if}
    </div>
  </main>
</div>
