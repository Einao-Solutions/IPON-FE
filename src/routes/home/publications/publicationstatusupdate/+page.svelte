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

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target.classList.contains('modal-overlay')) {
            closeModal();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeModal();
        if (event.key === 'Enter') handleSearch();
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
        on:click={handleOutsideClick}
        on:keydown={handleKeydown}
    >
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4" on:click|stopPropagation>
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-lg font-bold text-black">Publication Status Update</h3>
                    <p class="text-sm text-gray-600 mt-1">Search for the File</p>
                </div>
                <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600"
                    on:click={closeModal}
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="space-y-4">
                {#if error}
                    <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
                {/if}

                <!-- File Number Input -->
                <div>
                    <label for="search-query" class="block text-sm font-medium text-gray-700 mb-2">
                        File Number or RTM
                    </label>
                    <input
                        id="search-query"
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Enter file number or RTM number"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        on:keydown={handleKeydown}
                    />
                </div>

                <!-- File Type Display - Static, no dropdown -->
                <div class="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <Icon icon="mdi:scale-balance" class="text-green-600 w-5 h-5" />
                    <span class="text-sm font-medium text-gray-700">
                        File Type: Trademark
                    </span>
                </div>

                <!-- Information Notice -->
                <div class="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
                    <Icon icon="mdi:information-variant-circle" class="text-blue-600 w-5 h-5 mt-0.5" />
                    <span class="text-xs text-blue-800">
                        Only files with status of publication can undergo publication status update.
                    </span>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-2 pt-4">
                    <button
                        type="button"
                        class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                        on:click={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                        on:click={handleSearch}
                    >
                        {#if isLoading}
                            <svg class="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching...
                        {:else}
                            Search
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}