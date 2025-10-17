<script lang="ts">
	import { Label } from '$lib/components/ui/label/index';
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from '$lib/components/ui/button/index';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { Cell } from '$lib/components/ui/calendar';
	import { applicationData, loggedInUser, metaDataInfo } from '$lib/store';
	// import { mapDateToString } from '../home/components/dashboardutils';

	import { parseLoggedInUser } from '../../../dataview/datahelpers';
	import { goto } from '$app/navigation';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import {
		ApplicationStatuses,
		baseURL,
		FileTypes,
		hasValidCorrespondenceDetails,
		UserRoles,
		type CorrespondenceType
	} from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	$: fileData = $applicationData;

	interface SearchResult {
		titleOfTradeMark: string;
		tradeMarkClass: string | null;
		trademarkType: number; // 1 = Foreign, 0 = Local
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
	}

	let results: SearchResult[] = [];
	let isLoading = true;
	let error: string | null = null;
	let searchParams: {
		query: string;
		classId?: number;
		fileType: string;
	} | null = null;
	let fileNumber: string | null = null;
	let title: string;
	let filteredResults: SearchResult[] = [];
	let showCorrespondenceRequest = false;
	let applicantDetails: {
		name: string;
		email: string;
		phone: string;
		fileId: string;
	} | null = null;
	onMount(async () => {
		try {
			// Retrieve search parameters from sessionStorage
			const storedParams = sessionStorage.getItem('searchParams');
			searchParams = storedParams ? JSON.parse(storedParams) : null;
			if (!$loggedInUser) {
				const user = parseLoggedInUser(document.cookie);
				if (!user) {
					console.log('the logged in user');
					await goto('/auth');
				} else {
					loggedInUser.set(user);
				}
			}
			//console.log($loggedInUser.name);
			if (searchParams) {
				// Fetch search results from the backend
				const response = await fetch(
					`${baseURL}/api/files/GetFileByFileNumber?fileNumber=${searchParams.query}`
				);
				if (response.ok) {
					results = await response.json();
					// console.log(results.fileType)
				} else {
					error = 'Failed to fetch search results';
				}

				filteredResults = results.filter(
					(result) => result.fileTypes === 2 && [3].includes(result.fileStatus)
				);
			} else {
				error = 'Search parameters are missing';
			}
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
</script>

<div class="space-y-4 m-4 p-2">
	<div class="flex items-center justify-between">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">Pre Registration Search Results</h1>
		<div></div>
		<!-- Empty div to balance the flexbox -->
	</div>

	{#if searchParams}
		<div class="bg-gray-50 p-4 rounded-md mb-4">
			<h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
			<div class="flex flex-wrap gap-4">
				{#if searchParams.query}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">File Number:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.query}</span
						>
					</div>
				{/if}
				{#if searchParams.classId}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Class:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.classId}</span
						>
					</div>
				{/if}
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
		<div class="bg-yellow-50 p-8 rounded-md text-center">
			<Icon
				icon="lucide:search-x"
				width="2rem"
				height="2rem"
				class="mx-auto mb-2 text-yellow-600"
			/>
			<h3 class="text-lg font-medium text-gray-800 mb-1">No results found</h3>
			<p class="text-gray-600">Please ensure that your file status is 'Awaiting Search'.</p>
		</div>
	{:else}
		<div class="bg-white rounded-md shadow overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">S/N</Table.Head>
						<Table.Head>File Number</Table.Head>
						<Table.Head>File Title</Table.Head>
						<Table.Head class="w-128">File Applicant</Table.Head>
						<Table.Head class="w-24">Class</Table.Head>
						<Table.Head class="w-32">Representation</Table.Head>
						<Table.Head class="w-64">Clerical Update</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<!-- .filter(result => result.fileStatus == 4 || result.fileStatus == 7 || result.fileStatus == 3) -->
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
								<select
									class="border rounded px-2 py-1"
									on:change={(e) => {
										const selectedValue = e.target.value;
										if (selectedValue === 'update-name') {
											goto(
												`/home/update-files/update?fileId=${result.fileId}&fileType=${result.fileTypes}&updateType=ApplicantName`
											);
										} else if (selectedValue === 'update-address') {
											goto(
												`/home/update-files/update?fileId=${result.fileId}&fileType=${result.fileTypes}&updateType=ApplicantAddress`
											);
										} else if (selectedValue === 'update-title') {
											goto(
												`/home/update-files/update?fileId=${result.fileId}&fileType=${result.fileTypes}&updateType=FileTitle`
											);
										} else if (selectedValue === 'update-class') {
											goto(
												`/home/update-files/update?fileId=${result.fileId}&fileType=${result.fileTypes}&updateType=FileClass`
											);
										} else if (selectedValue === 'update-correspondence') {
											goto(
												`/home/update-files/update?fileId=${result.fileId}&fileType=${result.fileTypes}&updateType=Correspondence`
											);
										}
									}}
								>
									<option value="">--Select--</option>
									<option value="update-name">Update Applicant Name</option>
									<option value="update-address">Update Applicant Address</option>
									<option value="update-title">Update Title/Representation</option>
									<option value="update-class">Update Class/Description/Disclaimer</option>
									<option value="update-correspondence">Update Correspondence/Attachments</option>
								</select>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
