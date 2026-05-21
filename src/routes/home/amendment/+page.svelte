<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
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

	let searchQuery = '';
	let isLoading = false;
	let error: string | null = null;
	const dispatch = createEventDispatcher();

	// Amendment is currently a trademark-only service. We still allow a dropdown
	// in case it is opened without IP context, but default to Trademark.
	let type: string = 'Trademark';
	const fileTypeOptions = ['Trademark'];

	let ipType: string | null = null;
	let isFileTypeAutoSet = false;

	function getFileTypeIcon(fileType: string): string {
		const iconMap: Record<string, string> = {
			Trademark: 'mdi:scale-balance',
			Patent: 'mdi:lightbulb-outline',
			Design: 'mdi:palette-outline'
		};
		return iconMap[fileType] || 'mdi:file';
	}

	$: showFileTypeDropdown = !ipType;

	onMount(() => {
		ipType = $page.url.searchParams.get('ipType');
		if (ipType && !isFileTypeAutoSet) {
			const contextMap: Record<string, string> = {
				trademark: 'Trademark',
				patent: 'Patent',
				design: 'Design'
			};
			if (ipType in contextMap) {
				type = contextMap[ipType];
				isFileTypeAutoSet = true;
			}
		}
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
		if (!type && showFileTypeDropdown) {
			error = 'File type is required';
			return;
		}

		isLoading = true;
		error = null;

		try {
			const res = await fetch(
				`${baseURL}/api/files/files/${encodeURIComponent(searchQuery)}/type`
			);
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

			sessionStorage.setItem('amendmentSearchParams', JSON.stringify(searchParams));
			await goto(`/home/amendment/search/`);
		} catch (err) {
			const catchError = err as Error;
			error = catchError.message || 'An error occurred during search';
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') closeModal();
		if (event.key === 'Enter') handleSearch();
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
			aria-labelledby="amendment-modal-title"
		>
			<div class="border-b px-6 py-4">
				<h3 id="amendment-modal-title" class="text-lg font-bold text-black">Amendment Search</h3>
				<p>Please enter the File Number you want to amend</p>
			</div>

			<div class="p-6">
				{#if error}
					<div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
				{/if}

				<div class="space-y-4 mx-auto">
					<div class="flex flex-col md:flex-row gap-3">
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
									{#each fileTypeOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</div>
						{:else if type}
							<div class="w-full md:w-2/3">
								<label class="block text-sm font-medium text-gray-700 mb-1">File Type</label>
								<div class="flex items-center p-2 border border-gray-300 rounded-md bg-green-50">
									<Icon
										icon={getFileTypeIcon(type)}
										class="text-green-800 mr-2"
										width="18"
										height="18"
									/>
									<span class="text-gray-900 font-medium">{type}</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-end space-x-3">
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
					class="px-4 py-2 text-sm font-medium text-white bg-green-800 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<span class="inline-block mr-2">
							<svg
								class="animate-spin h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
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
