<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import * as Table from '$lib/components/ui/table/index';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loggedInUser } from '$lib/store';
	import { parseLoggedInUser } from '../../../dataview/datahelpers';
	import {
		ApplicationStatuses,
		baseURL,
		FileTypes,
		type CorrespondenceType
	} from '$lib/helpers';

	interface SearchResult {
		titleOfTradeMark: string;
		tradeMarkClass: string | null;
		trademarkType: number;
		fileApplicant: string | null;
		filingDate: string;
		tradeMarkLogo: string | null;
		fileId: string | null;
		fileStatus: ApplicationStatuses | null;
		applicantEmail: string | null;
		applicantPhone: string | null;
		fileTypes: FileTypes;
		correspondence: CorrespondenceType | undefined;
		disclaimer: string | null;
		titleOfInvention: string;
		fileOrigin: string | null;
		titleOfDesign: string | null;
	}

	// Statuses considered "in opposition" — primarily Opposition (15).
	// Related opposition-flow statuses are included as a safety net so files
	// already moved one step further in the opposition process remain amendable.
	const OPPOSITION_STATUSES: number[] = [
		ApplicationStatuses.Opposition,
		ApplicationStatuses.NewOpposition,
		// ApplicationStatuses.AwaitingCounter,
		// ApplicationStatuses.AwaitingResponse,
		// ApplicationStatuses.AwaitingOppositionStaff,
		// ApplicationStatuses.AwaitingResolution,
		// ApplicationStatuses.StatutoryDeclaration
	];

	let results: SearchResult[] = [];
	let filteredResults: SearchResult[] = [];
	let isLoading = true;
	let error: string | null = null;
	let searchParams: { query: string; fileType: string } | null = null;

	onMount(async () => {
		try {
			const storedParams = sessionStorage.getItem('amendmentSearchParams');
			searchParams = storedParams ? JSON.parse(storedParams) : null;

			if (!$loggedInUser) {
				const user = parseLoggedInUser(document.cookie);
				if (!user) {
					await goto('/auth');
					return;
				}
				loggedInUser.set(user);
			}

			if (!searchParams) {
				error = 'Search parameters are missing';
				return;
			}

			const response = await fetch(
				`${baseURL}/api/files/GetFileByFileNumber?fileNumber=${searchParams.query}`
			);
			if (!response.ok) {
				error = 'Failed to fetch search results';
				return;
			}
			results = await response.json();

			filteredResults = results.filter(
				(r) =>
					r.fileTypes === FileTypes.Trademark &&
					r.fileStatus !== null &&
					OPPOSITION_STATUSES.includes(r.fileStatus)
			);
		} catch (err) {
			console.error('Error fetching search results:', err);
			error = 'An error occurred while fetching search results';
		} finally {
			isLoading = false;
		}
	});

	function goBack() {
		window.history.back();
	}

	function startAmendment(result: SearchResult) {
		goto(
			`/home/amendment/update?fileId=${encodeURIComponent(result.fileId ?? '')}&fileType=${result.fileTypes}`
		);
	}
</script>

<div class="space-y-4 m-4 p-2">
	<div class="flex items-center justify-between">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">Amendment Search Results</h1>
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
		<div class="bg-red-50 text-red-600 p-4 rounded-md text-center">
			<p>{error}</p>
		</div>
	{:else if filteredResults.length === 0}
		<div class="flex flex-col items-center justify-center py-16 px-6">
			<div class="bg-amber-50 border border-amber-200 rounded-full p-4 mb-5">
				<Icon icon="lucide:search-x" width="2.5rem" height="2.5rem" class="text-amber-500" />
			</div>
			<h3 class="text-xl font-semibold text-gray-900 mb-2">No eligible files found</h3>
			<p class="text-sm text-gray-500 max-w-md mb-4 text-center">
				Only trademark files currently in <strong>Opposition</strong> can be amended through this
				module.
			</p>
		</div>
	{:else}
		<div class="bg-white rounded-md shadow overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">S/N</Table.Head>
						<Table.Head>File Number</Table.Head>
						<Table.Head>Title of Trademark</Table.Head>
						<Table.Head class="w-32">File Applicant</Table.Head>
						<Table.Head class="w-24">Class</Table.Head>
						<Table.Head class="w-32">Representation</Table.Head>
						<Table.Head class="w-40">Action</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredResults as result, index}
						<Table.Row>
							<Table.Cell class="font-medium">{index + 1}</Table.Cell>
							<Table.Cell>{result.fileId}</Table.Cell>
							<Table.Cell>{result.titleOfTradeMark}</Table.Cell>
							<Table.Cell>{result.fileApplicant}</Table.Cell>
							<Table.Cell>{result.tradeMarkClass}</Table.Cell>
							<Table.Cell>
								{#if Number(result.tradeMarkLogo) === 0}
									Device
								{:else if Number(result.tradeMarkLogo) === 1}
									Wordmark
								{:else if Number(result.tradeMarkLogo) === 2}
									Word and Device
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Button
									size="sm"
									class="bg-green-800 hover:bg-green-700 text-white"
									on:click={() => startAmendment(result)}
								>
									<Icon icon="mdi:file-edit-outline" width="1rem" height="1rem" class="mr-1" />
									Amend
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
