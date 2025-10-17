<script lang="ts">
  import { currentStep, steps } from '$lib/utils/patent';
  import { goto } from '$app/navigation';
  import Icon  from '@iconify/svelte';

  let showCancelConfirm = false;

  function goToStep(index: number) {
    currentStep.set(index);
  }

  const stepIcons: Record<string, string> = {
    'Patent Information': 'heroicons:information-circle',
    'Inventors Information': 'heroicons:user',
    'Applicants Information': 'heroicons:user-group',
    'Additional Priority Information': 'heroicons:document-text',
    'First Priority Information': 'heroicons:clipboard-document',
    'Correspondence Information': 'heroicons:envelope',
    'Attachments': 'heroicons:paper-clip',
    'Review And Submit': 'heroicons:check-badge'
  };

   function goToDashboard() {
        goto('/home/dashboard');
    }

</script>

<aside class="w-80 min-h-screen bg-white border-r border-gray-200 px-6 py-8 flex flex-col justify-between shadow-sm">
  <div>
    <h1 class="text-2xl font-medium text-black mb-10 mt-2">
      Patent Application Menu
    </h1>

    <ul class="space-y-3">
      {#if Array.isArray($steps)}
        {#each $steps as step, index}
          <li>
            <button
              class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition mb-5
                    {index === $currentStep
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}"
              on:click={() => goToStep(index)}
            >
              <Icon icon={stepIcons[step] ?? 'heroicons:question-mark-circle'} class="w-5 h-5 mr-2 flex-shrink-0" color={index === $currentStep ? 'white' : '#6b7280'} />
              {step}
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>

  <div class="pt-8">
    <button
      class="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition"
      on:click={() => showCancelConfirm = true}
    >
      Cancel Application
    </button>
  </div>
</aside>

<!-- Confirmation Modal -->
{#if showCancelConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
      <h2 class="text-lg font-bold mb-4">Exit Patent Application?</h2>
      <p class="text-black font-medium mb-6">
        Are you sure you want to exit the application? Unsaved changes may be lost.
      </p>
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 rounded-md border border-gray-300 text-white bg-green-500 hover:bg-green-600"
          on:click={() => (showCancelConfirm = false)}
        >
          Stay
        </button>
        <button
          class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          on:click={goToDashboard}
        >
          Exit
        </button>
      </div>
    </div>
  </div>
{/if}