<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
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
	let type: string;
	onMount(async () => {
		const file = $page.url.searchParams.get('type') ?? '';
		type = file;
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
				fileType: type
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
	<div
		class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		on:click={handleOutsideClick}
		on:keydown={handleKeydown}
		role="presentation"
	>
		<div
			class="modal-content bg-white rounded-lg shadow-xl w-full max-w-md mx-auto"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Modal Header -->
			<div class="border-b px-6 py-4">
				<h3 id="modal-title" class="text-lg font-bold text-black">File Search</h3>
				<p>For files in Awaiting Search</p>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				{#if error}
					<div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
						{error}
					</div>
				{/if}

				<div class="space-y-4 mx-auto">
					<!-- Search and Class selection layout -->
					<div class="flex flex-col md:flex-row gap-3">
						<!-- Search Input -->
						<div class="w-full md:w-3/3">
							<label for="search-query" class="block text-sm font-medium text-gray-700 mb-1">
								File Number
							</label>
							<input
								id="search-query"
								type="text"
								bind:value={searchQuery}
								placeholder="Enter file number"
								class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<!-- File Type Dropdown
						<div class="w-full md:w-1/3">
							<label for="file-type" class="block text-sm font-medium text-gray-700 mb-1">
								File Type
							</label>
							<input
								id="search-query"
								type="text"
								placeholder={type && type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
								value={type && type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
								disabled
								class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div> -->
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-end space-x-3">
				<!-- <span class="flex items-center text-xs text-gray-600">
					<Icon icon="mdi:information-variant-circle" class="mr-2 text-red-500" style="font-size: 1.3em;" />
					Post Registration is strictly for registered files with active status.
				</span> -->
				<button
					type="button"
					on:click={closeModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={handleSearch}
					disabled={isLoading}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<span class="inline-block mr-2">
							<svg
								class="animate-spin h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
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
