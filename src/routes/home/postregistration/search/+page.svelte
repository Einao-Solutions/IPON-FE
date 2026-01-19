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
		hasValidCorrespondenceDetails,
		UserRoles,
		type CorrespondenceType, type FirstPriority
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
		correspondence: CorrespondenceType | undefined;
		patentType?: string;
    	firstPriorityInfo?: FirstPriority[];

	}

	let results: SearchResult[] = [];
	let isLoading = true;
	let error: string | null = null;
	let searchParams: {
		query: string;
		classId?: number;
		fileType: string;
		serviceType?: string;
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

	let isPatent = false;
    let patentError: string | null = null;
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
					sessionStorage.setItem('searchResults', JSON.stringify(results));
				} else {
					error = 'Failed to fetch search results';
				}
				 // Check if fileType is patent
                isPatent = results.length > 0 && results[0].fileTypes === 0;
				//console.log('isPatent:', isPatent);
                if (isPatent) {
                    // Only allow Active (0) or Inactive (1) status
                    filteredResults = results.filter(
                        (result) => [0, 1,14, 20,23].includes(result.fileStatus) && result.fileTypes === 0 // 1 = patent
                    );
                    if (filteredResults.length === 0) {
                        patentError = 'Patent file must be Active or Inactive. Please input a valid file.';
                    }
                } else {
				 // Trademark logic
                    filteredResults = results.filter(
                        (result) => [0, 1, 14, 20,23].includes(result.fileStatus) && result.fileTypes === 2 // 2 = trademark
                    );
				// filteredResults = results.filter(
				// 	(result) => [0, 1].includes(result.fileStatus) && [2].includes(result.fileTypes)
				// );
				}
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
	function renewApplication(result: SearchResult) {
		//console.log('Clicked renewal for:', result);
		// Check if this is a patent file
        if (isPatent) {
			//console.log('isPatent', isPatent);
            const currentStatus = result?.fileStatus;
            // Only allow Active (0) or Inactive (1) status for patents
            if (currentStatus !== 0 && currentStatus !== 1) {
                toast.error('Patent file must be Active or Inactive.', { position: 'top-right' });
                return;
            }
            // const applicantDetails = {
            //     name: result.fileApplicant || '',
            //     email: result.applicantEmail || '',
            //     phone: result.applicantPhone || '',
            //     fileId: result.fileId
            // };
             // Pass all patent details needed for payment page
			// Clear trademark data

			// Check for PCT or Conventional patent type (case-insensitive)
			const patentTypeStr = (result.patentType || '').toLowerCase();
			if (['pct', 'conventional'].includes(patentTypeStr)) {
				// Check if firstPriorityInfo is a non-empty array
				if (!Array.isArray(result.firstPriorityInfo) || result.firstPriorityInfo.length === 0) {
					priorityModalMessage = 'First Priority Information does not exist for this file. Please use the Update Patent module on the dashboard to update your file before filing for a renewal.';
					showPriorityModal = true;
					priorityModalTimer = setTimeout(() => {
						showPriorityModal = false;
					}, 10000);
					return;
				}
			}

       		sessionStorage.removeItem('applicantDetails');
        	const patentData = {
            fileId: result.fileId,
            type: 0, // patent
            titleOfInvention: result.titleOfInvention,
            fileApplicant: result.fileApplicant,
            applicantEmail: result.applicantEmail,
            applicantPhone: result.applicantPhone,
            patentType: result.patentType,
            patentApplicationType: result.patentApplicationType,
            filingDate: result.filingDate,
            correspondence: result.correspondence
        	};
		//console.log('Patent data for payment:', patentData);
		// Store the patent data in sessionStorage
        sessionStorage.setItem('applicationData', JSON.stringify(patentData));
        goto(`/payment?type=renewal&fileId=${result.fileId}`);
        return;
        }

		const currentStatus = result?.fileStatus;
		if (currentStatus === String(ApplicationStatuses.AwaitingPayment)) {
			toast.info('cannot renew an application currently under review', { position: 'top-right' });
		} else {
			sessionStorage.removeItem('applicationData');
			const applicantDetails = {
				name: result.fileApplicant || '',
				email: result.applicantEmail || '',
				phone: result.applicantPhone || '',
				fileId: result.fileId,
				type: 2 // trademark
			};
			sessionStorage.setItem('applicantDetails', JSON.stringify(applicantDetails));
			goto(`/payment?type=renewal&fileId=${result.fileId}`);
		}
	}

	function goBack() {
		window.history.back();
	}

	let showPriorityModal = false;
	let priorityModalTimer: NodeJS.Timeout | null = null;
	let priorityModalMessage = '';

	function closePriorityModal() {
		showPriorityModal = false;
		if (priorityModalTimer) {
			clearTimeout(priorityModalTimer);
			priorityModalTimer = null;
		}
	}

	// Get service name for display
	function getServiceName(serviceType: string): string {
		const serviceNames = {
			'patent-amendment': 'Patent Amendment',
			'patent-assignment': 'Patent Assignment',
			'patent-ctc': 'Patent CTC (Certificate to Copy)',
			'patent-license': 'Patent License',
			'patent-mortgage': 'Patent Mortgage',
			'patent-merger': 'Patent Merger'
		};
		return serviceNames[serviceType as keyof typeof serviceNames] || serviceType;
	}

	// Handle proceed to specific patent service
	function proceedToPatentService(result: SearchResult) {
		if (!searchParams?.serviceType) return;
		
		const serviceRoutes = {
			'patent-amendment': `/home/postregistration/patentamendment?fileId=${result.fileId}&fileType=0`,
			'patent-assignment': `/home/postregistration/patentassignment?fileId=${result.fileId}&fileType=0`,
			'patent-ctc': `/home/postregistration/patentctc?fileId=${result.fileId}&fileType=0`,
			'patent-license': `/home/postregistration/patentlicense?fileId=${result.fileId}&fileType=0`,
			'patent-mortgage': `/home/postregistration/patentmortgage?fileId=${result.fileId}&fileType=0`,
			'patent-merger': `/home/postregistration/patentmerger?fileId=${result.fileId}&fileType=0`
		};
		
		const route = serviceRoutes[searchParams.serviceType as keyof typeof serviceRoutes];
		if (route) {
			goto(route);
		}
	}
</script>

<div class="space-y-4 m-4 p-2">
	<div class="flex items-center justify-between">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">
			{#if isPatent && searchParams?.serviceType}
				{getServiceName(searchParams.serviceType)} - File Details
			{:else}
				Post Registration Search Results
			{/if}
		</h1>
		<div></div>
		<!-- Empty div to balance the flexbox -->
	</div>

	{#if showPriorityModal}
		<div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
				<Icon icon="lucide:alert-triangle" width="2rem" height="2rem" class="mx-auto text-yellow-500 mb-2" />
				<h2 class="text-lg font-semibold mb-2">Missing First Priority Info</h2>
				<p class="mb-4">{priorityModalMessage}</p>
				<Button class="outline bg-red-500 text-white" on:click={closePriorityModal}>Cancel</Button>
			</div>
		</div>
	{/if}

	{#if searchParams}
		<div class="bg-gray-50 p-4 rounded-md mb-4">
			<h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
			<div class="flex flex-wrap gap-4">
				{#if searchParams.query}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Search:</span>
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
			<p class="text-gray-600">Please ensure that your file status is 'Active' to be able to do a post-registration.</p>
		</div>
	{:else}
		<div class="bg-white rounded-md shadow overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">S/N</Table.Head>
						<Table.Head>File Number</Table.Head>
						{#if isPatent}
							<Table.Head>Title of Invention</Table.Head>
							<Table.Head>File Origin</Table.Head>
							<Table.Head>Patent Type</Table.Head>
							<Table.Head>File Applicant</Table.Head>
						{:else}
							<Table.Head>File Title</Table.Head>
							<Table.Head>File Applicant</Table.Head>
							<Table.Head>Class</Table.Head>
							<Table.Head>Representation</Table.Head>
							
						{/if}
						<Table.Head class="w-64">
							{#if isPatent && searchParams?.serviceType}
								{getServiceName(searchParams.serviceType)}
							{:else}
								Recordal
							{/if}
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredResults as result, index}
						<Table.Row>
							<Table.Cell class="font-medium">{index + 1}</Table.Cell>
							<Table.Cell>{result.fileId}</Table.Cell>
							 {#if isPatent}
								<Table.Cell>{result.titleOfInvention}</Table.Cell>
								<Table.Cell>{result.fileOrigin}</Table.Cell>
								<Table.Cell>{result.patentType}</Table.Cell>
								<Table.Cell>{result.fileApplicant}</Table.Cell>
							{:else}
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
								
							{/if}
							<Table.Cell>
								{#if isPatent}
									{#if searchParams?.serviceType}
										<Button on:click={() => proceedToPatentService(result)}>Proceed</Button>
									{:else}
										<Button on:click={() => renewApplication(result)}>Renewal</Button>
									{/if}
								{:else}
								<select
									class="border rounded px-2 py-1"
									on:change={(e) => {
										const selectedValue = e.target.value;
										if (selectedValue === 'merger') {
											goto(`/home/postregistration/merger?fileId=${result.fileId}&fileType=2`);
										} else if (selectedValue === 'registered-users') {
											goto(
												`/home/postregistration/registeredusers?fileId=${result.fileId}&fileType=2`
											);
										} else if (selectedValue === 'assignment') {
											goto(`/home/postregistration/assignment?fileId=${result.fileId}&fileType=2`);
										} else if (selectedValue === 'name-change' && ![20, 21].includes(result.fileStatus)) {
											goto(
												`/home/postregistration/changedata?fileId=${result.fileId}&fileType=2&changeType=Name`
											);
										} else if (selectedValue === 'renewal' && ![20, 21].includes(result.fileStatus)) {
											renewApplication(result);
										} else if (selectedValue === 'address-change' && ![20, 21].includes(result.fileStatus)) {
											goto(
												`/home/postregistration/changedata?fileId=${result.fileId}&fileType=2&changeType=Address`
											);
										}
									}}
								>
									<option value="">Select Recordal</option>
									<option value="merger">Merger</option>
									<option value="registered-users">Registered Users</option>
									<option value="assignment">Assignment</option>
									{#if ![14, 20, 23].includes(result.fileStatus)}
										<option value="name-change">Change of Applicant Name</option>
										<option value="address-change">Change of Applicant Address</option>
										<option value="renewal">Renewal</option>
									{/if}
								</select>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>


