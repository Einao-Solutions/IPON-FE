<script lang="ts">
	import { beforeUpdate, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { applicationData, assignmentData, loggedInUser } from '$lib/store';
	import { ApplicationStatuses, baseURL, type PatentData } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	let cost: string;
	let type: string | null = null;
	let title: string | null = null;
	let isLoading: boolean = false;
	let appData: PatentData | null = null;
	let fileNumber: string | null = null;
	let fileApplicant: string | null = null;
	let applicantEmail: string | null = null;
	let paymentId: string;
	let hash: string | null = null;
	let fileId: string | null = null;
	let applicationId: string | null = null;
	let fileType: string | null = null;
	let responseurl: string | null = null;
	let fileTitle: string | null = null;
	let totalRenewalDue: number | null = 0;
	let currentRenewalIndex = 0;
			
	let missedYearsCount: number = 0;
	let lateYearsCount: number = 0;
	let isLateRenewal: boolean = false;
	let lateRenewalCost: string = '';
	let serviceFee: string = '';
	let showRenewalErrorModal = false;
	let renewalErrorMessage = '';

	interface PaymentDetails {
		cost: string;
		rrr: string;
	}
	let searchParams: {
		query: string;
		classId?: number;
		fileType: string;
	} | null = null;
	const validPaymentOptions = [
		'newapplication',
		'update',
		'batchrenewal',
		'publication',
		'search',
		'renewal',
		'opposition',
		'assignment',
		'oppositionCounter',
		'oppositionResolution',
		'dashrenewal',
		'other',
		'tradecertificate',
		'statussearch',
		'availabilitysearch',
		'merger',
		'registeredusers',
		'changedatarecordal',
		'clerical',
		'publicationstatusupdate',
		'filewithdrawal'
	];
	let currentBaseurl: string = '';
	beforeUpdate(async () => {
		const paymentType = $page.url.searchParams.get('type') ?? '';
		if (!validPaymentOptions.includes(paymentType)) {
			await goto('/home/dashboard');
		}
	});
	onMount(async () => {
		const paymentType = $page.url.searchParams.get('type') ?? '';
		currentBaseurl = $page.url.host;
		isLoading = true;
		type = paymentType;
		// console.log('Payment Type:', type);
		// console.log('Amount:', cost);
		// console.log('RRR:', paymentId);
		const storedParams = sessionStorage.getItem('searchParams');
		searchParams = storedParams ? JSON.parse(storedParams) : null;

		if (type == null || cost == null) {
			console.log(type);
			console.log(cost);
			await setData();
		}
	});

	async function setData() {
		appData = $applicationData;
		if (type == 'newapplication') {
			// query cost from RRR
			if (appData == null) {
				return;
			}
			if (appData.applicationHistory[0].currentStatus !== ApplicationStatuses.AwaitingPayment) {
				return;
			}

			paymentId = appData.applicationHistory[0].paymentId;
			fileType = appData.type;
			const allApplicants = appData.applicants.map((x) => x.name);
			if (allApplicants.length > 1) {
				fileApplicant = allApplicants[0] + '. et al.';
			} else {
				fileApplicant = allApplicants[0];
			}

			fileNumber = appData.fileId;
			fileTitle =
				appData.type === 1
					? appData.titleOfDesign
					: appData.type == 0
						? appData.titleOfInvention
						: appData.titleOfTradeMark;

			if (appData.type === 0) {
				// patent
				title = 'New Patent Application';
			}
			if (appData.type === 1) {
				title = 'New Design Application';
			}
			if (appData.type === 2) {
				title = 'New Trademark Application';
			}
			//const response = await fetch(`${baseURL}/api/files/GetRRRCost?rrr=${paymentId}`);
			// Fetch cost based on patentType
			let response;
			if (appData.type === 0 && appData.fileOrigin === 'Local') {
				// Patent and Non-Conventional
				response = await fetch(`${baseURL}/api/files/GetNonConventionalCost?fileId=${appData.fileId}&fileType=${appData.type}`);
			} else if (appData.type === 0) {
				// Patent and Conventional or PCT
				response = await fetch(`${baseURL}/api/files/GetRRRCost?rrr=${paymentId}`);
			} else {
				// Design or Trademark
				response = await fetch(`${baseURL}/api/files/GetRRRCost?rrr=${paymentId}`);
			}
			if (response.ok) {
				const result = await response.json();
				cost = result.cost ?? result.amount; // Use 'cost' if present, else 'amount'
			}
			await setHash();
			fileId = appData.id;
			applicationId = appData.applicationHistory[0].id;

			const applicantName =
				appData.applicants.length > 1
					? appData.applicants[0].name + ' et al.'
					: appData.applicants[0].name;
			responseurl = `https://${currentBaseurl}/payment/status?rrr=${paymentId}&paymentType=${type}&fileId=${fileId}&applicationId=${applicationId}&title=${fileTitle}&amount=${cost}&applicantName=${applicantName}&fileType=${fileType}`;
			isLoading = false;
		}
		if (type === 'renewal') {
			const appDetails = sessionStorage.getItem('applicantDetails');
			const parsed = appDetails ? JSON.parse(appDetails) : null;

			const patentDataRaw = sessionStorage.getItem('applicationData');
			const patentParsed = patentDataRaw ? JSON.parse(patentDataRaw) : null;

			//const patentFileId = patentParsed?.id ?? appData?.id
			if (patentParsed?.type === 0 && patentParsed?.fileId) {
				// patent
				//console.log('Patent Parsed:', patentParsed);
				title = 'Patent Renewal';
				const response = await fetch(
					`${baseURL}/api/files/GetPatentRenewalCost?fileId=${patentParsed.fileId}&fileType=0`,
					{}
				);

				if (response.ok) {
					fileApplicant = patentParsed?.fileApplicant ?? '';
					const result = await response.json();
					cost = result.cost;
					paymentId = result.rrr;
					fileType = patentParsed.type;
					isLateRenewal = result.isLateRenewal;
					lateRenewalCost = result.lateRenewalCost;
					serviceFee = result.serviceFee;
					missedYearsCount = result.missedYearsCount;
					lateYearsCount = result.lateYearsCount;
					await setHash();
					fileNumber = patentParsed.fileId;
					applicationId = $page.url.searchParams.get('paymentId') ?? '';
					responseurl = `https://${currentBaseurl}/home/postregistration/paid?paymentType=renewal&fileId=${fileNumber}&rrr=${paymentId}`;
					isLoading = false;
				} else {
					// Handle error from backend (e.g., anniversary error)
					const err = await response.json();
					renewalErrorMessage = err.message || 'Could not fetch patent renewal cost.';
					showRenewalErrorModal = true;
					isLoading = false;
					return;
				}
				// else {
				// //toast.error('Could not fetch patent renewal cost.');
				// isLoading = false;
				// return;
        		// }
			}
			// if (appData.type === 1) {
			// 	title = 'Design Renewal';
			// }
			//appData?.type === 2 || appData?.type === null
			else if (parsed?.type === 2 && parsed?.fileId) {
				console.log('App Details:', appDetails);
				title = 'Trademark Renewal';
				// get cost and rrr
				const response = await fetch(
					`${baseURL}/api/files/GetRenewalCost?fileId=${parsed.fileId}&fileType=2`,
					{}
				);

				if (response.ok) {
					fileApplicant = parsed.name;
					const result = await response.json();
					cost = result.cost;
					paymentId = result.rrr;
					await setHash();
					fileNumber = parsed.fileId;
					applicationId = $page.url.searchParams.get('paymentId') ?? '';
					console.log(applicationId);
					responseurl = `https://${currentBaseurl}/home/postregistration/paid?paymentType=renewal&fileId=${fileNumber}&rrr=${paymentId}`;
					isLoading = false;
				}
				// else {
				// 	//toast.error('Could not fetch trademark renewal cost.');
				// 	isLoading = false;
				// 	return;
				// }
			}	//else {
			// 	//toast.error('Missing or invalid file details for payment.');
			// 	isLoading = false;
			// 	return;
			// }
		}
		if (type === 'dashrenewal') {
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('paymentId') ?? undefined;
			fileId = $page.url.searchParams.get('fileId') ?? undefined;
			title = 'Renewal';
			fileNumber = $page.url.searchParams.get('fileNumber') ?? undefined;
			fileTitle = $page.url.searchParams.get('title') ?? undefined;
			fileApplicant = $page.url.searchParams.get('applicant') ?? undefined;
			await setHash();
			responseurl = `https://${currentBaseurl}/payment/status?rrr=${paymentId}&paymentType=${type}&fileId=${fileId}&title=${fileTitle}&amount=${cost}`;
			isLoading = false;
		}
		if (type === 'tradecertificate') {
			title = 'Application for Issuance of  Trademark Certificate';
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('paymentId') ?? undefined;
			const fileNo = localStorage.getItem('fileId');
			fileNumber = fileNo;
			console.log('File ID:', fileNumber);
			fileTitle = $page.url.searchParams.get('title') ?? undefined;
			const name = localStorage.getItem('name');
			fileApplicant = name;
			let systemId = $page.url.searchParams.get('systemId') ?? undefined;
			await setHash();
			responseurl = `https://${currentBaseurl}/payment/paid?paymentType=tradecertificate&fileId=${fileNumber}&rrr=${paymentId}`;
			isLoading = false;
		}
		if (type === 'update') {
			fileTitle = appData.type === 1 ? appData.titleOfDesign : appData.titleOfInvention;
			const patentChangeType = $page.url.searchParams.get('patentChangeType') ?? '';
			// renew  license
			const allApplicants = appData.applicants.map((x) => x.name);
			fileType = appData.type;
			if (appData == null) {
				return;
			}
			if (allApplicants.length > 1) {
				fileApplicant = allApplicants[0] + '. et al.';
			} else {
				fileApplicant = allApplicants[0];
			}
			fileNumber = appData.fileId;
			title = 'Data update';
			// get cost and rrr
			const response = await fetch(`${baseURL}/api/files/updatecost`, {
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					number: appData.correspondence.phone,
					email: appData.correspondence.email,
					name:
						appData.applicants.length > 1
							? appData.applicants[0].name + ' et al.'
							: appData.applicants[0].name,
					fileType: appData.type,
					patentchangeType: patentChangeType
				})
			});
			if (response.ok) {
				const applicantName =
					appData.applicants.length > 1
						? appData.applicants[0].name + ' et al.'
						: appData.applicants[0].name;
				const result = await response.json();
				cost = result.cost;
				paymentId = result.rrr;
				await setHash();
				fileId = appData.id;
				applicationId = $page.url.searchParams.get('applicationId') ?? '';
				responseurl = `https://${currentBaseurl}/payment/status?rrr=${paymentId}&paymentType=${type}&fileId=${fileId}&title=${fileTitle}&amount=${cost}&applicantName=${applicantName}&fileType=${fileType}&applicationId=${applicationId}`;
				isLoading = false;
			}
		}
		if (type === 'batchrenewal') {
			// get all expired info for user and set data for batch
			// title, amount, id, applicants, fileId,
			var currentBatch = localStorage.getItem('next10Batch');
			var curr_str = localStorage.getItem('currentRenewalIndex');
			let atLimit = false;
			if (curr_str !== null) {
				atLimit = parseInt(curr_str) % 10 === 0;
			}
			if (currentBatch == null || atLimit) {
				await fetchMoreData();
			} else {
				// get current one
				currentRenewalIndex = parseInt(localStorage.getItem('currentRenewalIndex'));
				const batch = JSON.parse(currentBatch);
				const curr = batch.data[currentRenewalIndex];
				totalRenewalDue = batch.total;
				fileTitle = curr.fileTitle;
				fileApplicant = curr.applicant;
				fileNumber = curr.fileNumber;
				title = curr.title;
				fileType = curr.fileType;
				cost = curr.cost;
				paymentId = curr.paymentId;
				fileId = curr.id;
				await setHash();
				currentRenewalIndex += 1;
				localStorage.setItem('currentRenewalIndex', currentRenewalIndex.toString());
				responseurl = `https://${currentBaseurl}/payment/status?rrr=${paymentId}&paymentType=${type}&applicantName=${fileApplicant}&fileId=${fileId}&title=${fileTitle}&amount=${cost}&fileType=${fileType}`;
				isLoading = false;
			}
		}

		if (type === 'assignment') {
			title = 'Assignment Application';

			const appData = sessionStorage.getItem('searchParams');
			const parsed = appData ? JSON.parse(appData) : null;
			const fileData = sessionStorage.getItem('searchResults');
			const parsedData = fileData ? JSON.parse(fileData) : null;
			fileApplicant = parsedData[0].fileApplicant;
			console.log('File Applicant:', fileApplicant);
			fileNumber = parsed.query;
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;
			if (cost == undefined || paymentId == undefined) {
				console.log('Payment ID:', paymentId);
				console.log('Cost:', cost);
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/postregistration/paid`;
			isLoading = false;
		}

		if (type === 'opposition') {
			const data = localStorage.getItem('oppositionData');
			const opp = data ? JSON.parse(data) : null;
			const file = localStorage.getItem('fileData');
			const f = file ? JSON.parse(file) : null;

			const info = f.fileInfo;
			const rrr = opp.paymentId;
			paymentId = rrr;
			localStorage.setItem('rrr', rrr);
			cost = $page.url.searchParams.get('amount') ?? info.cost;
			
				title = `Opposition of  ${info.fileTitle}`;
				fileNumber = info.fileId;
				fileApplicant = opp.name;
				await setHash();
				responseurl = `https://${currentBaseurl}/opposition/paid?rrr=${paymentId}`;
				isLoading = false;
			
			// we already have the cost and RRR, show them and then proceed to payment,
			// applicant name, title, type
		}
		if (type === 'oppositionCounter') {
			const oppositionId = $page.url.searchParams.get('oppositionId') ?? undefined;
			const rrr = $page.url.searchParams.get('rrr') ?? undefined;
			fileApplicant = $page.url.searchParams.get('name') ?? undefined;
			const email = $page.url.searchParams.get('email') ?? undefined;
			const number = $page.url.searchParams.get('number') ?? undefined;
			title = $page.url.searchParams.get('title') ?? undefined;
			const fileUrl = $page.url.searchParams.get('fileUrl') ?? undefined;
			cost = $page.url.searchParams.get('cost');
			const address = $page.url.searchParams.get('address') ?? undefined;
			if (oppositionId === undefined || cost == undefined || rrr == undefined) {
				await goto('/home/dashboard');
				return;
			} else {
				await setHash();
				responseurl = `https://${currentBaseurl}/payment/status?rrr=${rrr}&paymentType=${type}&applicationId=${oppositionId}&name=${fileApplicant}&address=${address}&number=${number}&email=${email}&fileUrl=${fileUrl}&amount=${cost}&description=${title}`;
				isLoading = false;
			}
		}
		if (type === 'oppositionResolution') {
			const oppositionId = $page.url.searchParams.get('oppositionId') ?? undefined;
			const rrr = $page.url.searchParams.get('rrr') ?? undefined;
			const fileUrl = $page.url.searchParams.get('fileUrl') ?? undefined;
			title = $page.url.searchParams.get('title') ?? undefined;
			cost = $page.url.searchParams.get('cost');
			if (oppositionId === undefined || cost == undefined || rrr == undefined) {
				await goto('/home/dashboard');
				return;
			} else {
				await setHash();
				responseurl = `https://${currentBaseurl}/payment/status?rrr=${rrr}&paymentType=${type}&applicationId=${oppositionId}&fileUrl=${fileUrl}&amount=${cost}&description=${title}`;
				isLoading = false;
			}
		}

		if (type === 'statussearch') {
			title = 'Status search for external file';
			//fileApplicant =  ?? '';
			fileApplicant = sessionStorage.getItem('statussearch_applicantName') ?? '';
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;
			const requestId = $page.url.searchParams.get('requestId') ?? undefined;
			if (cost == undefined || paymentId == undefined) {
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/statussearch/result?rrr=${paymentId}`;
			isLoading = false;
		}

		if (type === 'publicationstatusupdate') {
			title = 'Publication Status Update Payment';
			fileNumber = $page.url.searchParams.get('fileNumber') ?? sessionStorage.getItem('publicationstatusupdate_fileNumber');
			cost = $page.url.searchParams.get('amount') ?? sessionStorage.getItem('publicationstatusupdate_cost');
			paymentId = $page.url.searchParams.get('rrr') ?? sessionStorage.getItem('publicationstatusupdate_rrr');
			fileApplicant = $loggedInUser.name; // If you have applicant info, set it here

			const requestId = crypto.randomUUID();
			if (cost == undefined || paymentId == undefined || requestId === undefined) {
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl =  `https://${currentBaseurl}/home/publications/publicationstatusupdate/result?rrr=${paymentId}&fileNumber=${fileNumber}`;
			isLoading = false;
		}

		if (type === 'filewithdrawal') {
			title = 'File Withdrawal Payment';
			fileNumber = $page.url.searchParams.get('fileNumber') ?? sessionStorage.getItem('withdrawal_fileNumber');
			cost = $page.url.searchParams.get('amount') ?? sessionStorage.getItem('withdrawal_cost');
			paymentId = $page.url.searchParams.get('rrr') ?? sessionStorage.getItem('withdrawal_rrr');
			fileApplicant = $loggedInUser.name;

			const requestId = crypto.randomUUID();
			if (cost == undefined || paymentId == undefined || requestId === undefined) {
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/file-withdrawal/file-withdrawal-result?rrr=${paymentId}&fileNumber=${fileNumber}`;
			isLoading = false;
		}

		if (type === 'availabilitysearch') {
			title = 'Availability Search';
			// console.log('Amount:', cost);
			// console.log('RRR:', paymentId);
			fileApplicant = $loggedInUser.name;
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;

			const requestId = crypto.randomUUID();
			if (cost == undefined || paymentId == undefined || requestId === undefined) {
				await goto(`/home/dashboard`);
				return;
			}

			await setHash();
			// console.log('Hash:', hash);
			responseurl = `https://${currentBaseurl}/availabilitysearch`;
			// console.log('Response URL:', responseurl);
			isLoading = false;
		}
		if (type === 'merger') {
			title = 'Merger Application';
			fileApplicant = $loggedInUser.name;
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;
			// const requestId = crypto.randomUUID();
			if (cost == undefined || paymentId == undefined) {
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/postregistration/paid`;
			isLoading = false;
		}
		if (type === 'registeredusers') {
			title = 'Registered Users Application';
			const fileData = sessionStorage.getItem('searchResults');
			const parsedData = fileData ? JSON.parse(fileData) : null;
			fileApplicant = parsedData[0].fileApplicant;
			console.log('File Applicant:', fileApplicant);
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;
			// const requestId = crypto.randomUUID();
			if (cost == undefined || paymentId == undefined) {
				console.log('Payment ID:', paymentId);
				console.log('Cost:', cost);
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/postregistration/paid`;
			isLoading = false;
		}
		if (type === 'changedatarecordal') {
			const change = sessionStorage.getItem('changeType');
			title = `Application for Change of Applicant ${change}`;
			const fileData = sessionStorage.getItem('searchResults');
			const parsedData = fileData ? JSON.parse(fileData) : null;
			fileApplicant = parsedData[0].fileApplicant;
			console.log('File Applicant:', fileApplicant);
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;
			// const requestId = crypto.randomUUID();
			console.log('Payment ID:', paymentId);
			console.log('Cost:', cost);
			if (cost == undefined || paymentId == undefined) {
				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/postregistration/paid`;
			isLoading = false;
		}
		if (type === 'clerical') {
			const appData = localStorage.getItem('formData');
			const parsed = appData ? JSON.parse(appData) : null;
			title = 'Clerical Update';
			fileApplicant = parsed.OldApplicantName;
			fileNumber = parsed.FileId;
			cost = $page.url.searchParams.get('amount') ?? undefined;
			paymentId = $page.url.searchParams.get('rrr') ?? undefined;

			// Determine applicant name for display
			if (parsed?.FileType === 0 ) {
				// For patent, get first applicant name from array if available
				    if (parsed.OldApplicantNames && Array.isArray(parsed.OldApplicantNames) && parsed.OldApplicantNames.length > 0) {
							fileApplicant = parsed.OldApplicantNames[0];
						} else {
							fileApplicant = '';
						}
					} else {
				// For trademark and others, use OldApplicantName
				fileApplicant = parsed?.OldApplicantName ?? '';
			}

			// fileApplicant = parsed?. ?? '';

			// const requestId = crypto.randomUUID();
			console.log('File Applicant:', fileApplicant);
			console.log('Payment ID:', paymentId);
			console.log('Cost:', cost);
			if (cost == undefined || paymentId == undefined) {
				console.log('something is undefined');
				console.log('Payment ID:', paymentId);
				console.log('Cost:', cost);

				await goto(`/home/dashboard`);
				return;
			}
			await setHash();
			responseurl = `https://${currentBaseurl}/home/clerical-update/paid?paymentType=clerical`;
			isLoading = false;
		}
	}
	async function setHash() {
		const merchantId = '6230040240';
		const apiKey = '192753';
		const test = merchantId + paymentId + apiKey;
		let hs = crypto.subtle.digest('SHA-512', new TextEncoder().encode(test)).then((res) => {
			return Array.prototype.map
				.call(new Uint8Array(res), (x) => ('00' + x.toString(16)).slice(-2))
				.join('');
		});
		hash = await hs;
	}
	function goBack() {
		window.history.back();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
	{#if isLoading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="relative w-16 h-16 mx-auto mb-4">
					<Icon icon="line-md:loading-loop" width="4rem" height="4rem" class="text-black-600" />
				</div>
				<p class="text-gray-600 text-lg">Processing payment details...</p>
			</div>
		</div>
	{:else if showRenewalErrorModal}
        <!-- Only show the modal, hide the rest of the page -->
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                <Icon icon="lucide:alert-triangle" width="2rem" height="2rem" class="mx-auto text-yellow-500 mb-2" />
                <h2 class="text-lg font-semibold mb-2">Your file is not yet due for Renewal</h2>
                <p class="mb-4">{renewalErrorMessage}</p>
                <Button class="outline bg-red-500 text-white" on:click={() => goto('/home/dashboard')}>Back</Button>
            </div>
        </div>
	{:else}
		<div class="max-w-2xl mx-auto">
			<!-- Header Section -->
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Payment Confirmation</h1>
				<p class="text-gray-600">Review your payment details before proceeding</p>
			</div>

			<!-- Payment Card -->
			<div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
				<!-- Card Header -->
				<div class="bg-gray-800 p-6 text-white">
					<h2 class="text-xl font-semibold mb-1">{title}</h2>
					<p class="text-blue-100 text-sm">Payment Reference: {paymentId}</p>
				</div>

				<!-- Payment Form -->
				<form action="https://login.remita.net/remita/ecomm/finalize.reg" method="post" class="p-8">
					<!-- Payment Details Grid -->
					<div class="space-y-6 mb-8">
						<!-- Amount Due - Highlighted -->
						{#if type === 'renewal' && fileType == 0 && cost}
							<div class="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
								<div class="font-semibold text-gray-700 mb-2">Patent Renewal Cost Breakdown</div>
								<div class="flex flex-col gap-1 text-sm text-gray-600">
									<div class="flex justify-between">
										<span>(Base Renewal Fee {missedYearsCount} )</span>
										<span>
											₦{(missedYearsCount * 11500).toLocaleString('en-NG')}
										</span>
									</div>
									{#if isLateRenewal}
										<div class="flex justify-between">
											<span>Late Renewal Penalty ({lateYearsCount} year{lateYearsCount > 1 ? 's' : ''})</span>
											<span>₦{(lateYearsCount * 5000).toLocaleString('en-NG')}</span>
										</div>
									{/if}
									<div class="flex justify-between font-bold border-t pt-2 mt-2">
										<span>Total</span>
										<span>₦{parseFloat(cost ?? '0').toLocaleString('en-NG')}</span>
									</div>
								</div>
							</div>
						{/if}
						<div
							class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
										<Icon
											icon="material-symbols:attach-money"
											width="1.5rem"
											height="1.5rem"
											class="text-green-600"
										/>
									</div>
									<span class="text-gray-700 font-medium">Amount Due</span>
								</div>
								<span class="text-2xl font-bold text-green-600">
									{parseFloat((cost ?? '0').toString()).toLocaleString('en-NG', {
										style: 'currency',
										currency: 'NGN'
									})}
								</span>
							</div>
						</div>
						<!-- Other Payment Details -->
						<div class="grid gap-4">
							{#if ['opposition', 'oppositionCounter', 'oppositionResolution', 'statussearch', 'availabilitysearch', 'merger', 'registeredusers', 'changedatarecordal'].includes(type) === false}
								<div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
									<div class="flex items-center gap-3">
										<Icon
											icon="material-symbols:folder-outline"
											width="1.2rem"
											height="1.2rem"
											class="text-gray-500"
										/>
										<span class="text-gray-700 font-medium">File Number</span>
									</div>
									<span class="text-gray-900 font-mono text-sm bg-white px-3 py-1 rounded border">
										{fileNumber}
									</span>
								</div>
							{/if}

							{#if ['availabilitysearch'].includes(type ?? '') === true}
								<div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
									<div class="flex items-center gap-3">
										<Icon
											icon="material-symbols:search"
											width="1.2rem"
											height="1.2rem"
											class="text-gray-500"
										/>
										<span class="text-gray-700 font-medium">Search Term</span>
									</div>
									<span class="text-gray-900 bg-white px-3 py-1 rounded border">
										{searchParams?.query}
									</span>
								</div>
							{/if}

							<div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
								<div class="flex items-center gap-3">
									<Icon
										icon="material-symbols:person-outline"
										width="1.2rem"
										height="1.2rem"
										class="text-gray-500"
									/>
									<span class="text-gray-700 font-medium">Applicant Name</span>
								</div>
								<span class="text-gray-900 bg-white px-3 py-1 rounded border">
									{fileApplicant}
								</span>
							</div>
						</div>
					</div>

					<!-- Security Notice -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<div class="flex items-start gap-3">
							<Icon
								icon="material-symbols:security"
								width="1.2rem"
								height="1.2rem"
								class="text-blue-600 mt-0.5"
							/>
							<div>
								<p class="text-blue-800 font-medium text-sm">Secure Payment</p>
								<p class="text-blue-700 text-xs mt-1">
									Your payment will be processed securely through Remita's encrypted payment
									gateway.
								</p>
							</div>
						</div>
					</div>

					<!-- Hidden Form Fields -->
					<input type="hidden" value={hash} name="hash" />
					<input type="hidden" value={'6230040240'} name="merchantId" />
					<input type="hidden" value={paymentId} name="rrr" />
					<input type="hidden" value={responseurl} name="responseurl" />

					<!-- Action Buttons -->
					<div class="flex flex-col sm:flex-row gap-3">
						<Button
							on:click={goBack}
							variant="outline"
							class="flex items-center justify-center gap-2 px-6 py-3 border-2 hover:bg-gray-50 transition-colors"
						>
							<Icon icon="material-symbols:arrow-back-rounded" width="1.2rem" height="1.2rem" />
							Back
						</Button>
						<Button
							type="submit"
							class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
						>
							<div class="flex items-center justify-center gap-2">
								<Icon icon="material-symbols:payment" width="1.2rem" height="1.2rem" />
								Pay with Remita
							</div>
						</Button>
					</div>
				</form>
			</div>

			<!-- Footer Info -->
			<div class="text-center mt-6 text-sm text-gray-500">
				<p>Need help? Contact our support team for assistance with your payment.</p>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom animations */
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Custom button styles for better visual hierarchy */
	:global(.btn-primary) {
		background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
		box-shadow: 0 4px 15px 0 rgba(59, 130, 246, 0.3);
		transition: all 0.3s ease;
	}

	:global(.btn-primary:hover) {
		box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
		transform: translateY(-2px);
	}
</style>
