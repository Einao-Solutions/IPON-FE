<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import Icon from '@iconify/svelte';

	let isOpen = false;
	let searchQuery = '';
	let selectedFileType = 'Trademark';
	let isLoading = false;
	let error: string | null = null;
	const dispatch = createEventDispatcher();

	const fileTypeOptions = [
		{ value: 'Trademark', icon: 'mdi:scale-balance' },
		{ value: 'Patent', icon: 'mdi:lightbulb-outline' },
		{ value: 'Design', icon: 'mdi:palette-outline' }
	];

	$: selectedIcon = fileTypeOptions.find((o) => o.value === selectedFileType)?.icon ?? 'mdi:file';

	onMount(() => {
		const ipType = new URLSearchParams(window.location.search).get('ipType');
		if (ipType) {
			const map: Record<string, string> = {
				trademark: 'Trademark',
				patent: 'Patent',
				design: 'Design'
			};
			if (map[ipType]) selectedFileType = map[ipType];
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
		if (target.classList.contains('modal-overlay')) closeModal();
	}

	async function handleSearch(): Promise<void> {
		if (!searchQuery.trim()) {
			error = 'Please enter a file number';
			return;
		}
		isLoading = true;
		error = null;
		try {
			const res = await fetch(
				`${baseURL}/api/files/files/${encodeURIComponent(searchQuery.trim())}/type`
			);
			const data = await res.json();
			if (!res.ok) {
				error = data.message || 'File not found.';
				return;
			}
			if (data.type?.toLowerCase() !== selectedFileType.toLowerCase()) {
				error = `File type mismatch. You selected "${selectedFileType}" but file is "${data.type}".`;
				return;
			}
			sessionStorage.setItem(
				'offlineRenewalSearchParams',
				JSON.stringify({ query: searchQuery.trim(), fileType: selectedFileType })
			);
			await goto('/home/offline-renewal/search');
		} catch (err) {
			error = 'Error checking file. Please try again.';
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
					<h3 class="text-lg font-bold text-black">Renewal History Update</h3>
					<p class="text-sm text-gray-600 mt-1">Search for the file to submit an offline renewal</p>
				</div>
				<button type="button" class="text-gray-400 hover:text-gray-600" on:click={closeModal}>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				{#if error}
					<div class="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
				{/if}

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

				<div>
					<span class="block text-sm font-medium text-gray-700 mb-2">File Type</span>
					<div class="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
						<Icon icon={selectedIcon} class="text-green-800 w-5 h-5" />
						<span class="text-sm font-medium text-gray-700">{selectedFileType}</span>
					</div>
				</div>

				<div class="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
					<Icon icon="mdi:information-variant-circle" class="text-blue-600 w-5 h-5 mt-0.5 shrink-0" />
					<span class="text-xs text-blue-800">
						Only <strong>Active</strong> or <strong>Inactive</strong> files are eligible to submit an offline renewal.
					</span>
				</div>

				<div class="flex gap-2 pt-2">
					<button
						type="button"
						class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
						on:click={closeModal}
					>
						Cancel
					</button>
					<button
						type="button"
						class="flex-1 bg-green-800 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
						disabled={isLoading}
						on:click={handleSearch}
					>
						{#if isLoading}
							<svg class="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
