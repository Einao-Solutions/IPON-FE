<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { baseURL } from '$lib/helpers';
    import { loggedInUser } from '$lib/store';
    import Icon from '@iconify/svelte';

    let isOpen = false;
    let searchQuery = '';
    let selectedFileType: string = 'trademark';
    let isLoading = false;
    let error: string | null = null;
    const dispatch = createEventDispatcher();

    onMount(() => {
        isOpen = true;
    });

    function closeModal() {
        dispatch('close');
        goto('/home/dashboard');
        isOpen = false;
    }

    async function handleSearch() {
        if (!searchQuery) {
            error = 'Please enter a file number';
            return;
        }
        if (!selectedFileType) {
            error = 'Please select a file type';
            return;
        }
        isLoading = true;
        error = null;
        try {
            const response = await fetch(`${baseURL}/api/files/files/${encodeURIComponent(searchQuery.trim())}/type`);
            const result = await response.json();
            if (!response.ok) {
                error = result.message || 'File not found.';
                isLoading = false;
                return;
            }
            if (result.type.toLowerCase() !== selectedFileType.toLowerCase()) {
                error = `File type mismatch. You selected "${selectedFileType}", but file is "${result.type}".`;
                isLoading = false;
                return;
            }
            const searchParams = {
                query: searchQuery,
                fileType: selectedFileType
            };
            sessionStorage.setItem('pubStatusSearchParams', JSON.stringify(searchParams));
            await goto(`/home/publications/publicationstatusupdate/search/`);
        } catch (err) {
            error = 'Error checking file type.';
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeModal();
        if (event.key === 'Enter') handleSearch();
    }
</script>

{#if isOpen}
    <div
        class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        on:keydown={handleKeydown}
        role="presentation"
    >
        <div class="modal-content bg-white rounded-lg shadow-xl w-full max-w-md mx-auto" role="dialog" aria-modal="true">
            <div class="border-b px-6 py-4">
                <h3 class="text-lg font-bold text-black">Publication Status Update</h3>
                <p>Search for the File</p>
            </div>
            <div class="p-6">
                {#if error}
                    <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
                {/if}
                <div class="space-y-4 mx-auto">
                    <div class="flex flex-col md:flex-row gap-3">
                        <div class="w-full md:w-2/3">
                            <label for="search-query" class="block text-sm font-medium text-gray-700 mb-1">
                                File Number or RTM:
                            </label>
                            <input
                                id="search-query"
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Enter file number or RTM number"
                                class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div class="w-full md:w-1/3">
                            <label for="file-type" class="block text-sm font-medium text-gray-700 mb-1">
                                File Type
                            </label>
                            <select
                                id="file-type"
                                class="border rounded w-full p-2"
                                bind:value={selectedFileType}
                            >
                                <!-- <option value="patent">Patent</option> -->
                                <option value="trademark">Trademark</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-end space-x-3">
                <span class="flex items-center text-xs text-gray-600">
                    <Icon icon="mdi:information-variant-circle" class="mr-2 text-blue-500" style="font-size: 1.3em;" />
                    Only files with status of publication can undergo publication status update.
                </span>
                <button
                    type="button"
                    on:click={closeModal}
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    on:click={handleSearch}
                    disabled={isLoading}
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {#if isLoading}
                        <span class="inline-block mr-2">
                            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </span>
                        Searching...
                    {:else}
                        Search
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}