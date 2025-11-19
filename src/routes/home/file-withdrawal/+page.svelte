<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { baseURL } from '$lib/helpers';
    import { loggedInUser } from '$lib/store';
    import Icon from '@iconify/svelte';
    export let isOpen = false;

    interface SearchParams {
        query: string;
        fileType: string;
    }

    let searchQuery = '';
    let isLoading = false;
    let error: string | null = null;
    let applicantName: string | null = null;
    let applicantEmail: string | null = null;
    const dispatch = createEventDispatcher();
    
    // Get context from URL parameters
    $: ipType = $page.url.searchParams.get('ipType') || 'patent';
    // Debug logging
    $: console.log('File Withdrawal - URL param ipType:', $page.url.searchParams.get('ipType'), 'ipType:', ipType);
    // Context-aware file type - no dropdown needed
    $: fileType = ipType === 'trademark' ? 'Trademark' : ipType === 'patent' ? 'Patent' : 'Design';

    onMount(() => {
        isOpen = true;
    });

    function closeModal(): void {
        dispatch('close');
        goto('/home/dashboard');
        isOpen = false;
    }

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target.classList.contains('modal-overlay')) {
            closeModal();
        }
    }

    async function handleSearch(): Promise<void> {
        if (!searchQuery) {
            error = 'File number is required';
            return;
        }
        if (!fileType) {
            error = 'File type is required';
            return;
        }

        isLoading = true;
        error = null;

        try {
            const res = await fetch(`${baseURL}/api/files/files/${encodeURIComponent(searchQuery)}/type`);
            const data = await res.json();

            if (!res.ok) {
                error = data.message || 'File not found.';
                return;
            }

            const actualType = data.type?.toLowerCase();
            const selectedType = type.toLowerCase();

            if (actualType !== selectedType) {
                error = `File number and file type do not match. File number ${searchQuery} is a ${actualType} file.`;
                return;
            }

            const searchParams: SearchParams = {
                query: searchQuery,
                fileType: fileType
            };

            sessionStorage.setItem('withdrawalSearchParams', JSON.stringify(searchParams));
            applicantName = $loggedInUser?.firstName || null;
            applicantEmail = $loggedInUser?.email || null;
            await goto(`/home/file-withdrawal/search/`);
        } catch (err) {
            const catchError = err as Error;
            error = catchError.message || 'An error occurred during search';
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            closeModal();
        }
        if (event.key === 'Enter') {
            handleSearch();
        }
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
                    <h3 id="modal-title" class="text-lg font-bold text-black">File Withdrawal</h3>
                    <p class="text-sm text-gray-600 mt-1">Enter the File Number you want to withdraw</p>
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
                    <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                {/if}

                <!-- Search Input -->
                <div>
                    <label for="search-query" class="block text-sm font-medium text-gray-700 mb-2">
                        File Number
                    </label>
                    <input
                        id="search-query"
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Enter file number"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        on:keydown={handleKeydown}
                    />
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