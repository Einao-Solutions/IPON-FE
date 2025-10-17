<script lang="ts">
	import { onMount } from 'svelte';
	import { baseURL } from '$lib/helpers';
	import { toast } from 'svelte-french-toast';
	import Icon from '@iconify/svelte';
 	import { Button } from '$lib/components/ui/button/index';
	import { goto } from '$app/navigation';

	let histories: any[] = [];
	let isLoading = false;
	let viewMode = 'card'; // or 'list'

	const itemsPerPage = 6;
	let currentPage = 1;
	let totalPages = 1;

	// Computed sliced items for current page
	$: paginatedHistories = histories.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Fetch all history on mount
	onMount(async () => {
		isLoading = true;
		try {
			const res = await fetch(`${baseURL}/api/files/file-update-history`);
			if (!res.ok) throw new Error('Failed to fetch update history');
			histories = await res.json();
			totalPages = Math.ceil(histories.length / itemsPerPage);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error(message);
		} finally {
			isLoading = false;
		}
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<svelte:head>
	<title>File Update History</title>
</svelte:head>

<div class="p-6">

	<div class="flex items-center justify-between mb-4">
		<h1 class="text-2xl font-bold mb-4">File Update History</h1>

		<div class="flex gap-2">
			<!-- 🔁 Toggle View Button -->
			<button
				on:click={() => viewMode = viewMode === 'card' ? 'list' : 'card'}
				class="border rounded px-4 py-1 text-sm bg-black text-white hover:bg-gray-700 transition-colors"
			>
				{viewMode === 'card' ? 'List View' : 'Card View'}
			</button>

			<!-- 🔙 Back Button -->
			<button
				on:click={() => goto('/home/admin')}
				class="border rounded p-2 text-white bg-black hover:bg-gray-600 transition-colors"
			>
				Back
			</button>
		</div>
	</div>
	

	{#if isLoading}
		<p class="text-gray-500">Loading...</p>
	{:else if histories.length === 0}
		<p class="text-gray-600">No update history found.</p>
	{:else}
		<!-- View: Card -->
		{#if viewMode === 'card'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
				{#each paginatedHistories as h}
					<div class="bg-white rounded-xl shadow-sm border p-4 space-y-2 hover:shadow-md transition-shadow duration-200">
						<p class="text-sm text-gray-700 flex items-center gap-2">
							<Icon icon="mdi:file-document-outline" class="text-green-700" />
							<span class="font-semibold">File Number:</span> {h.fileNumber}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Title:</span> {h.title}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Type:</span> {h.fileType}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Update Type:</span> {h.updateType}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Updated By:</span> {h.adminName}
						</p>
						<p class="text-sm text-gray-500">
							<span class="font-semibold">Date:</span> {new Date(h.dateUpdated).toLocaleString()}
						</p>
					</div>
				{/each}
			</div>
		{:else}
			<!-- View: List -->
			<div class="mb-6 space-y-3">
				{#each paginatedHistories as h}
					<div class="border rounded p-3 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
						<p class="text-sm text-gray-700 flex items-center gap-2">
							<Icon icon="mdi:file-document-outline" class="text-green-700" />
							<span class="font-semibold">File Number:</span> {h.fileNumber}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Title:</span> {h.title}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Type:</span> {h.fileType}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Update Type:</span> {h.updateType}
						</p>
						<p class="text-sm text-gray-700">
							<span class="font-semibold">Updated By:</span> {h.adminName}
						</p>
						<p class="text-sm text-gray-500">
							<span class="font-semibold">Date:</span> {new Date(h.dateUpdated).toLocaleString()}
						</p>
					</div>
				{/each}
			</div>
		{/if}
		
		<!-- Pagination Controls -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			<!-- Previous Button -->
			<button
				class="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-100"
				on:click={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
			>
				Previous
			</button>

			{#if totalPages <= 7}
				<!-- Show all pages if not too many -->
				{#each Array(totalPages).fill(0).map((_, i) => i + 1) as page}
					<button
						class={`px-3 py-1 text-sm rounded border ${
							page === currentPage ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
						}`}
						on:click={() => goToPage(page)}
					>
						{page}
					</button>
				{/each}
			{:else}
				<!-- Smart pagination with ellipsis -->
				{#if currentPage > 2}
					<button
						class={`px-3 py-1 text-sm rounded border ${
							currentPage === 1 ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
						}`}
						on:click={() => goToPage(1)}
					>1</button>
					{#if currentPage > 3}
						<span class="px-2">...</span>
					{/if}
				{/if}

				<!-- Middle pages -->
				{#each [currentPage - 1, currentPage, currentPage + 1] as page (page)}
					{#if page > 1 && page < totalPages}
						<button
							class={`px-3 py-1 text-sm rounded border ${
								page === currentPage ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
							}`}
							on:click={() => goToPage(page)}
						>
							{page}
						</button>
					{/if}
				{/each}

				{#if currentPage < totalPages - 2}
					{#if currentPage < totalPages - 3}
						<span class="px-2">...</span>
					{/if}
					<button
						class={`px-3 py-1 text-sm rounded border ${
							currentPage === totalPages ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
						}`}
						on:click={() => goToPage(totalPages)}
					>
						{totalPages}
					</button>
				{/if}
			{/if}

			<!-- Next Button -->
			<button
				class="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-100"
				on:click={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				Next
			</button>
		</div>

		<!-- Page indicator -->
		<p class="text-center mt-4 text-sm text-gray-600">
			Page {currentPage} of {totalPages}
		</p>
	{/if}
</div>
