<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { mapDesignTypeToString } from '$lib/designutils';

	interface DesignAttachment {
		id?: string;
		name?: string;
		url?: string;
		fileName?: string;
		contentType?: string;
	}

	let error: string | null = null;
	let baseCost: number | null = null;
	let calculatedCost: number = 0;
	let paymentId: string | null = null;
	let fileId: string | null = null;
	let designTitle: string = '';
	let designType: number | null = null;
	let fileOrigin: string = '';
	let applicantName: string = '';
	let applicantEmail: string = '';
	let applicantPhone: string = '';
	let applicantAddress: string = '';
	let applicantNationality: string = '';
	let applicantCity: string = '';
	let applicantState: string = '';
	let isLoading = false;
	let isProcessing = false;
	let attachments: DesignAttachment[] = [];
	let selectedAttachmentIndices: number[] = [];
	let showExistingApplicationModal = false;

	$: {
		if (baseCost && selectedAttachmentIndices.length > 0) {
			calculatedCost = baseCost * selectedAttachmentIndices.length;
		} else {
			calculatedCost = 0;
		}
	}

	function toggleAttachmentSelection(index: number) {
		if (selectedAttachmentIndices.includes(index)) {
			selectedAttachmentIndices = selectedAttachmentIndices.filter(i => i !== index);
		} else {
			selectedAttachmentIndices = [...selectedAttachmentIndices, index];
		}
	}

	onMount(async () => {
		if (!$loggedInUser) { await goto('/auth'); return; }
		const fileNumber = $page.url.searchParams.get('fileId') ?? '';
		const fileType = $page.url.searchParams.get('fileType') ?? '';
		await setData(fileNumber, fileType);
	});

	async function setData(fileNumber: string, fileType: string): Promise<void> {
		isLoading = true;
		try {
			const res = await fetch(`${baseURL}/api/files/GetDesignCTCCost?fileId=${fileNumber}&fileType=${fileType}`);
			if (!res.ok) { error = 'Unable to retrieve cost info and attachments.'; return; }
			const response = await res.json();
			const data = response.data || response;
			if (data.hasExistingApplication) { showExistingApplicationModal = true; return; }
			baseCost = data.amount;
			calculatedCost = 0;
			paymentId = data.rrr;
			applicantName = data.applicantName;
			designTitle = data.fileTitle || data.titleOfDesign;
			designType = data.designType;
			fileOrigin = data.fileOrigin || '';
			fileId = data.fileId;
			applicantEmail = data.applicantEmail;
			applicantPhone = data.applicantPhone;
			applicantAddress = data.applicantAddress || '';
			applicantNationality = data.applicantNationality || '';
			applicantCity = data.applicantCity || '';
			applicantState = data.applicantState || '';
			attachments = data.attachments || [];
		} catch (err) {
			error = 'Error fetching design CTC information.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit() {
		if (selectedAttachmentIndices.length === 0) { toast.error('Please select at least one attachment'); return; }
		isProcessing = true;
		try {
			const selectedAttachments = selectedAttachmentIndices.map(index => attachments[index]);
			const attachmentIds = selectedAttachments.map((attachment, idx) =>
				attachment.id || attachment.name || attachment.fileName || `attachment_${selectedAttachmentIndices[idx]}`
			);
			const rrrResponse = await fetch(`${baseURL}/api/files/GetDesignCTCCost?fileId=${fileId}&fileType=1&numberOfAttachments=${selectedAttachmentIndices.length}`);
			if (!rrrResponse.ok) { toast.error('Failed to generate payment reference'); return; }
			const rrrData = await rrrResponse.json();
			const finalRRR = rrrData.data?.rrr || rrrData.rrr;
			sessionStorage.setItem('designCTCPayload', JSON.stringify({
				fileId, rrr: finalRRR, attachmentIds, ctcRequestDate: new Date().toISOString()
			}));
			await goto(`/payment/?type=designctc&rrr=${finalRRR}&amount=${calculatedCost}&fileId=${fileId}`);
		} catch (err) {
			error = 'CTC request processing failed. Please try again.';
			console.error(err);
			toast.error('An error occurred while processing your request');
		} finally {
			isProcessing = false;
		}
	}

	function goBack() { window.history.back(); }
</script>

<div class="min-h-screen py-4 px-4">
	<div class="w-full mx-auto">
		<div class="flex items-center">
			<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
				<Icon icon="lucide:arrow-left" width="1rem" height="1rem" /> Back
			</Button>
			<div class="flex-1 flex flex-col items-center justify-center">
				<h1 class="text-xl font-bold">Design CTC (Certified True Copy)</h1>
				<p class="font-light">Request certified true copies of design documents</p>
			</div>
		</div>

		<div class="px-6 py-6">
			{#if error}<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"><p class="text-sm text-red-700">{error}</p></div>{/if}

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">DESIGN INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Design Information...</span></div></div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Number:</label><input type="text" value={fileId || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Origin:</label><input type="text" value={fileOrigin} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Design Type:</label><input type="text" value={designType !== null ? mapDesignTypeToString(designType) : ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Title of Design:</label><input type="text" value={designTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
					</div>
				{/if}
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">APPLICANT INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Applicant Information...</span></div></div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Name:</label><input type="text" value={applicantName} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Email:</label><input type="email" value={applicantEmail} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone:</label><input type="text" value={applicantPhone} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label><input type="text" value={applicantNationality} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">City:</label><input type="text" value={applicantCity} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">State:</label><input type="text" value={applicantState} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Address:</label><input type="text" value={applicantAddress} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
					</div>
				{/if}
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black flex items-center justify-between">
					<span>FILE ATTACHMENTS - SELECT DOCUMENTS FOR CERTIFIED TRUE COPY</span>
					{#if selectedAttachmentIndices.length > 0}<span class="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">{selectedAttachmentIndices.length} selected</span>{/if}
				</div>
				<div class="p-4">
					{#if isLoading}
						<div class="flex items-center justify-center py-8"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading File Attachments...</span></div></div>
					{:else if attachments && attachments.length}
						<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"><p class="text-sm text-blue-800"><Icon icon="mdi:information" class="inline" width="1.2em" height="1.2em" /> Select the documents you want certified true copies of. Cost per document: ₦{baseCost?.toLocaleString()}</p></div>
						<div class="grid grid-cols-1 gap-3">
							{#each attachments as attachment, index}
								<div class="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors {selectedAttachmentIndices.includes(index) ? 'border-blue-500 bg-blue-50' : ''}">
									<div class="flex items-center gap-3">
										<input type="checkbox" checked={selectedAttachmentIndices.includes(index)} on:change={() => toggleAttachmentSelection(index)} class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
										<div class="flex-1 min-w-0"><label for="attachment-{index}" class="cursor-pointer"><div class="font-medium text-gray-800">{attachment.name || attachment.fileName || `Document ${index + 1}`}</div><div class="text-xs text-gray-500 mt-1">Document {index + 1} of {attachments.length}</div></label></div>
										<div class="flex-shrink-0">
											{#if attachment.url}<a href={attachment.url} target="_blank" rel="noopener" class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap" on:click={(e) => e.stopPropagation()}><Icon icon="mdi:file-eye" width="1.2em" height="1.2em" /><span>View</span></a>{:else}<span class="text-gray-400 px-3 py-2 rounded-lg text-sm">No URL</span>{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed"><Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" /><p>No file attachments found for this design</p></div>
					{/if}
				</div>
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">COST SUMMARY</div>
				<div class="p-4">
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
						<div class="flex justify-between items-center mb-2"><span class="text-gray-700">Cost per document:</span><span class="font-semibold text-gray-900">₦{baseCost?.toLocaleString() || '0'}</span></div>
						<div class="flex justify-between items-center mb-2"><span class="text-gray-700">Number of documents selected:</span><span class="font-semibold text-gray-900">{selectedAttachmentIndices.length}</span></div>
						<div class="border-t border-blue-300 pt-2 mt-2"><div class="flex justify-between items-center"><span class="text-lg font-semibold text-gray-900">Total Cost:</span><span class="text-2xl font-bold text-blue-600">₦{calculatedCost.toLocaleString()}</span></div></div>
					</div>
					{#if selectedAttachmentIndices.length === 0}<div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"><p class="text-sm text-amber-800"><Icon icon="mdi:alert" class="inline" width="1.2em" height="1.2em" /> Please select at least one document to proceed</p></div>{/if}
				</div>
			</div>

			<div class="flex justify-end">
				{#if baseCost !== null}
					<button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={isProcessing || selectedAttachmentIndices.length === 0}>
						{#if isProcessing}<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...{:else}Proceed To Pay{/if}
					</button>
				{:else}<button class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>Loading...</button>{/if}
			</div>
		</div>
	</div>
</div>

<Dialog.Root bind:open={showExistingApplicationModal}>
	<Dialog.Content class="w-11/12 max-w-md mx-auto">
		<Dialog.Header><Dialog.Title class="text-xl font-bold text-red-600 flex items-center gap-2"><Icon icon="mdi:alert-circle" width="1.5em" height="1.5em" />Application Already Exists</Dialog.Title></Dialog.Header>
		<div class="py-4"><p class="text-gray-700">A Design CTC (Certified True Copy) application has already been submitted for this file. You cannot create multiple CTC applications for the same design.</p></div>
		<Dialog.Footer class="flex gap-3 justify-end"><Button variant="outline" on:click={() => showExistingApplicationModal = false}>Close</Button><Button on:click={goBack} class="bg-blue-600 hover:bg-blue-700">Go to Dashboard</Button></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
