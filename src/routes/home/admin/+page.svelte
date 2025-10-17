<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import * as Card from '$lib/components/ui/card';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FileNumberSearch from './components/FileNumberSearch.svelte';
	import ApplicationSearchResults from './components/ApplicationSearchResults.svelte';
	import { baseURL } from '$lib/helpers';

	let showSearchDialog = false;
	let showResultsDialog = false;
	let searchLoading = false;
	let applications = [];
	let currentFileNumber = '';

	async function searchApplicationsByFileNumber(fileNumber: string) {
		try {
			const response = await fetch(
				`${baseURL}/api/files/GetApplicationsByFile?fileId=${fileNumber}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch applications');
			}

			const data = await response.json();
			sessionStorage.setItem('fileNumber', fileNumber);
			sessionStorage.setItem('fileTitle', data.fileTitle);
			return data.applications || [];
		} catch (error) {
			console.error('Error searching applications:', error);
			// Mock data for demonstration
			return [
				{
					id: 'APP-001',
					applicantName: 'John Doe',
					type: 'Business License',
					status: 'pending',
					dateSubmitted: '2024-01-15',
					paymentId: 'PAY-12345'
				},
				{
					id: 'APP-002',
					applicantName: 'Jane Smith',
					type: 'Building Permit',
					status: 'approved',
					dateSubmitted: '2024-01-10',
					paymentId: null
				}
			];
		}
	}

	function handleOpenSearch() {
		showSearchDialog = true;
	}

	async function handleSearch(event) {
		const { fileNumber } = event.detail;
		currentFileNumber = fileNumber;
		searchLoading = true;

		try {
			applications = await searchApplicationsByFileNumber(fileNumber);
			showSearchDialog = false;
			showResultsDialog = true;
		} catch (error) {
			console.error('Search failed:', error);
			// Handle error - maybe show a toast notification
		} finally {
			searchLoading = false;
		}
	}

	function handleCloseSearch() {
		showSearchDialog = false;
	}

	function handleCloseResults() {
		showResultsDialog = false;
		applications = [];
		currentFileNumber = '';
	}

	function handleSelectApplication(event) {
		const { application } = event.detail;
		console.log('Selected application:', application);
		// Handle application selection - maybe navigate to edit page
		// goto(`/home/admin/app-payments/edit/${application.id}`);
	}
</script>

<svelte:head>
	<title>Update Payment ID - Admin</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">

		<div>
			<h1 class="text-2xl font-bold text-gray-900">Super Admin</h1>
		</div>

		<button
			on:click={() => goto('/home/dashboard')}
			class="border rounded p-2  text-white bg-black hover:bg-gray-600 transition-colors"
			>
				Back
		</button>
	</div>

	<div
		class="border rounded-md justify-between p-3 grid xl:grid-cols-5 lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-3"
	>
		<button
			on:click={() => goto('/home/admin/updatefileinfo')}
			class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
		>
			<Icon icon="mdi:file" width="2em" height="2em" class="text-green-800" />
			<div class="space-y-1">
					<Card.Title class="text-sm font-semibold">UPDATE FILE INFO</Card.Title>
					<Card.Description class="text-xs">Update File Information</Card.Description>
				</div>
		</button>
		<button
			on:click={handleOpenSearch}
			class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
		>
			<Icon icon="mdi:file-edit-outline" width="2rem" height="2rem" class="text-green-800" />
			<div class="space-y-1">
					<Card.Title class="text-sm font-semibold">UPDATE PAYMENT ID</Card.Title>
					<Card.Description class="text-xs">Update Payment ID for application</Card.Description>
				</div>
		</button>
		<button
			on:click={() =>goto('/home/admin/fileupdatehistory')}
			class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
		>
			<Icon icon="mdi:history" width="2rem" height="2rem" class="text-green-800" />
			<div class="space-y-1">
				<Card.Title class="text-sm font-semibold">VIEW FILE HISTORY</Card.Title>
				<Card.Description class="text-xs">View all file update logs</Card.Description>
			</div>
		</button>

	</div>
</div>

<!-- Search Dialog -->
<FileNumberSearch
	bind:open={showSearchDialog}
	bind:loading={searchLoading}
	on:search={handleSearch}
	on:close={handleCloseSearch}
/>

<!-- Results Dialog -->
<ApplicationSearchResults
	bind:open={showResultsDialog}
	bind:applications
	bind:fileNumber={currentFileNumber}
	on:select={handleSelectApplication}
	on:close={handleCloseResults}
/>
