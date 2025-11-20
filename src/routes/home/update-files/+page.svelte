<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	export let isOpen = false;

	interface SearchParams {
		query: string;
		fileType: string;
	}

	// Form data
	let searchQuery = '';
	let isLoading = false;
	let error: string | null = null;
	let applicantName: string | null = null;
	let applicantEmail: string | null = null;
	const dispatch = createEventDispatcher();
	
	// Get context from URL parameters (client-side only)
	let ipType = 'patent';
	let fileType = 'Patent';
	
	$: if (browser) {
		ipType = $page.url.searchParams.get('ipType') || 'patent';
		fileType = ipType === 'trademark' ? 'Trademark' : ipType === 'patent' ? 'Patent' : 'Design';
	}
	
	onMount(async () => {
		isOpen = true;
	});
	// Close modal function
	function closeModal(): void {
		dispatch('close');
		goto('/home/dashboard');
		isOpen = false;
	}
	// Handle click outside
	function handleOutsideClick(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (target.classList.contains('modal-overlay')) {
			closeModal();
		}
	}
	// Handle search submission
	async function handleSearch(): Promise<void> {
		if (!searchQuery) {
			error = 'Please enter a search term';
			return;
		}

		try {
			isLoading = true;
			error = null;

			const searchParams: SearchParams = {
				query: searchQuery,
				fileType: fileType
			};
			// console.log('searchParams', searchParams);
			// Store search parameters
			sessionStorage.setItem('searchParams', JSON.stringify(searchParams));

			try {
				applicantName = $loggedInUser.name;
				// console.log('applicantName', applicantName);
				applicantEmail = $loggedInUser.email;
				// console.log('applicantEmail', applicantEmail);

				await goto(`/home/update-files/search/`);
			} catch (err) {
				error = 'Payment failed';
			}
		} catch (err) {
			const catchError = err as Error;
			error = catchError.message || 'An error occurred during search';
		} finally {
			isLoading = false;
		}
	}
	// Handle keyboard events for accessibility
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
					<h3 id="modal-title" class="text-lg font-bold text-black">Update Files</h3>
					<p class="text-sm text-gray-600 mt-1">For files in awaiting search</p>
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
