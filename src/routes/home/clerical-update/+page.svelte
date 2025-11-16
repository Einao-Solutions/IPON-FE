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
	let type: string = '';
	let fileTypeOptions = ['Patent', 'Trademark'];
	
	// NEW: Context-aware functionality
	let ipType: string | null = null;
	let isFileTypeAutoSet = false;
	
	// Helper function to get file type icon
	function getFileTypeIcon(fileType: string): string {
		const iconMap: Record<string, string> = {
			'Trademark': 'mdi:scale-balance',
			'Patent': 'mdi:lightbulb-outline', 
			'Design': 'mdi:palette-outline'
		};
		return iconMap[fileType] || 'mdi:file';
	}
	
	// Determine if file type dropdown should be shown
	$: showFileTypeDropdown = !ipType;

	onMount(async () => {
		// Get IP context from URL parameters
		ipType = $page.url.searchParams.get('ipType');
		
		// Auto-set file type based on context
		if (ipType && !isFileTypeAutoSet) {
			const contextMap: Record<string, string> = {
				'trademark': 'Trademark',
				'patent': 'Patent', 
				'design': 'Design'
			};
			if (ipType in contextMap) {
				type = contextMap[ipType];
				isFileTypeAutoSet = true;
			}
		}
		
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

		if (!searchQuery && !type) {
			error = showFileTypeDropdown ? 'Please enter a file number and select a file type' : 'Please enter a file number';
			return;
		}
		if (!searchQuery) {
			error = 'File number is required';
			return;
		}
		if (!type && showFileTypeDropdown) {
			error = 'File type is required';
			return;
		}
		// if (!searchQuery) {
		// 	error = 'Please enter a file number and select a file type';
		// 	return;
		// }

		isLoading = true;
		error = null;

		try {
			// Check file type from backend
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
				fileType: type
			};

			sessionStorage.setItem('searchParams', JSON.stringify(searchParams));
			applicantName = $loggedInUser.name;		
			applicantEmail = $loggedInUser.email;
			await goto(`/home/clerical-update/search/`);
		}	
		catch (err) {
				//error = 'Payment failed';
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
				<h3 id="modal-title" class="text-lg font-bold text-black">Clerical Update Search</h3>
				<p>Please enter the File Number you want to search</p>
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
								class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						 <!-- File Type Display -->
						{#if showFileTypeDropdown}
							<div class="w-full md:w-2/3">
								<label for="file-type" class="block text-sm font-medium text-gray-700 mb-1">
									File Type
								</label>
								<select
									id="file-type"
									bind:value={type}
									class="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
								>
									<option value="" disabled selected>Select file type</option>
									{#each fileTypeOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</div>
						{:else if type}
							<!-- Context-aware file type display -->
							<div class="w-full md:w-2/3">
								<label class="block text-sm font-medium text-gray-700 mb-1">File Type</label>
								<div class="flex items-center p-2 border border-gray-300 rounded-md bg-green-50">
									<Icon icon={getFileTypeIcon(type)} class="text-green-600 mr-2" width="18" height="18" />
									<span class="text-gray-900 font-medium">{type}</span>
									<!-- <span class="ml-auto text-sm text-green-600">(Auto-detected)</span> -->
								</div>
							</div>
						{/if}
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
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={handleSearch}
					disabled={isLoading}
					class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
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
