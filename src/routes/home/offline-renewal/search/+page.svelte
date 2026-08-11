<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { baseURL, ApplicationStatuses } from '$lib/helpers';
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from '$lib/components/ui/button/index';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';

	let isLoading = true;
	let error: string | null = null;
	let searchParams: { query: string; fileType: string } | null = null;
	let results: any[] = [];

	onMount(async () => {
		try {
			const stored = sessionStorage.getItem('offlineRenewalSearchParams');
			searchParams = stored ? JSON.parse(stored) : null;
			if (!searchParams) { error = 'Search parameters are missing'; return; }
			const res = await fetch(`${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(searchParams.query)}`);
			if (!res.ok) { error = 'Failed to fetch file details'; return; }
			const data = await res.json();
			if (!data || data.length === 0) { error = 'No file found for the provided number'; return; }
			if (data[0].fileStatus !== ApplicationStatuses.Active && data[0].fileStatus !== ApplicationStatuses.Inactive) {
				error = 'This file is not eligible. Only Active or Inactive files can submit an offline renewal.';
				return;
			}
			results = data;
		} catch (err) {
			error = 'An error occurred while fetching file details';
		} finally {
			isLoading = false;
		}
	});

	function goBack(): void { goto('/home/offline-renewal'); }
	function getTitle(r: any): string {
		return r.titleOfTradeMark || r.titleOfInvention || r.titleOfDesign || '-';
	}
</script>

<div class="space-y-4 m-4 p-2">
	<div class="flex items-center justify-between">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">Renewal History Update — Search Result</h1>
		<div></div>
	</div>

	{#if searchParams}
		<div class="bg-gray-50 p-4 rounded-md mb-4">
			<h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
			<div class="flex flex-wrap gap-4">
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium">File Number:</span>
					<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{searchParams.query}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium">File Type:</span>
					<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{searchParams.fileType}</span>
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center p-12">
			<div class="flex flex-col items-center gap-2">
				<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
				<span class="text-sm text-gray-500">Loading results...</span>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-md text-center"><p>{error}</p></div>
	{:else if results.length === 0}
		<div class="bg-yellow-50 p-8 rounded-md text-center">
			<Icon icon="lucide:search-x" width="2rem" height="2rem" class="mx-auto mb-2 text-yellow-600" />
			<h3 class="text-lg font-medium text-gray-800 mb-1">No eligible file found</h3>
			<p class="text-gray-600 text-sm">Only <strong>Active</strong> or <strong>Inactive</strong> files can submit an offline renewal.</p>
		</div>
	{:else}
		<div class="bg-white rounded-md shadow overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">S/N</Table.Head>
						<Table.Head>File Number</Table.Head>
						<Table.Head>Title</Table.Head>
						<Table.Head>Applicant</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="w-40"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each results as result, index}
						<Table.Row>
							<Table.Cell class="font-medium">{index + 1}</Table.Cell>
							<Table.Cell>{result.fileId}</Table.Cell>
							<Table.Cell>{getTitle(result)}</Table.Cell>
							<Table.Cell>{result.fileApplicant ?? '-'}</Table.Cell>
							<Table.Cell><AppStatusTag value={result.fileStatus} /></Table.Cell>
							<Table.Cell>
								<Button
									class="bg-green-800 hover:bg-green-700 text-white"
									on:click={() => goto(`/home/offline-renewal/submit?fileId=${encodeURIComponent(result.fileId)}&fileType=${result.fileTypes}`)}
								>
									Proceed
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
