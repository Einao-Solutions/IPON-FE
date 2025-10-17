<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { ApplicationLetters } from '$lib/helpers';
	import { getLetterName } from '../../../dataview/datahelpers';
  export let showDialog: boolean;
  export let getDocFileNumber: string;
  export let getDocPaymentId: string;
  export let getDocLoading: boolean;
  export let getDocError: string | null;
  export let getDocResult: any;
  export let documents: any[];
  export let appId: string;

  export let generateLetter: (fileId: string, letterType: ApplicationLetters, applicationId: string) => void;
  export let onClose: () => void;
  export let getDocuments: () => void;
</script>

<Dialog.Root bind:open={showDialog}>
  <Dialog.Content class="max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title class="text-xl font-semibold">Get Documents</Dialog.Title>
      <Dialog.Description class="text-gray-600">
        Enter File Number and Payment ID to retrieve documents.
      </Dialog.Description>
    </Dialog.Header>

    <div class="mt-6 space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">File Number</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter File Number"
          bind:value={getDocFileNumber}
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Payment ID</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter Payment ID"
          bind:value={getDocPaymentId}
          on:keydown={(e) => {
            if (e.key === 'Enter') getDocuments();
          }}
        />
      </div>
    </div>

    {#if getDocError}
      <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-700 text-sm">{getDocError}</p>
      </div>
    {/if}

    {#if documents.length > 0}
      <div class="mt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Documents:</h3>

        <div class="space-y-2 max-h-[20vh] overflow-y-auto pr-1">
          {#each documents as doc, index}
            <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <Icon icon="lucide:file-text" class="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {getLetterName(doc)}
                  </p>
                </div>
              </div>
              <div class="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  on:click={() => generateLetter(getDocFileNumber, doc, appId)}
                  class="text-xs"
                >
                  <Icon icon="lucide:eye" class="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <Dialog.Footer class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
      <Button
        variant="outline"
        on:click={onClose}
        class="px-4 py-2"
      >
        Close
      </Button>
      <Button
        on:click={getDocuments}
        disabled={getDocLoading || !getDocFileNumber || !getDocPaymentId}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
      >
        {#if getDocLoading}
          <Icon icon="eos-icons:loading" class="w-4 h-4 mr-2" />
          Loading...
        {:else}
          <Icon icon="lucide:search" class="w-4 h-4 mr-2" />
          Get Documents
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
