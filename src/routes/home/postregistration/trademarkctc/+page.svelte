<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { toast } from 'svelte-sonner';

	let pageData = $page;
	let fileId = '';
	let fileOrigin = '';
	let applicantName = '';
	let applicantEmail: string | null = null;
	let applicantPhone: string | null = null;
	let applicantAddress = '';
	let applicantNationality = '';
	let applicantCity = '';
	let applicantState = '';
	let trademarkTitle = '';
	let attachments: any[] = [];

	let baseCost: number | null = null;
	let calculatedCost: number | null = null;
	let paymentId: string | null = null;

	let isLoading = false;
	let isProcessing = false;
	let error: string | null = null;
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
			const res = await fetch(`${baseURL}/api/files/GetTrademarkCTCCost?fileId=${fileNumber}&fileType=TradeMark`);
			if (!res.ok) { error = 'Unable to retrieve cost info and attachments.'; return; }
			const response = await res.json();
			const data = response.data || response;
			if (data.hasExistingApplication) { showExistingApplicationModal = true; return; }
			baseCost = data.amount; calculatedCost = 0; paymentId = data.rrr;
			applicantName = data.applicantName;
			trademarkTitle = data.fileTitle || '';
			fileOrigin = data.fileOrigin || '';
			fileId = data.fileId;
			applicantEmail = data.applicantEmail;
			applicantPhone = data.applicantPhone;
			applicantAddress = data.applicantAddress || '';
			applicantNationality = data.applicantNationality || '';
			applicantCity = data.applicantCity || '';
			applicantState = data.applicantState || '';
			attachments = data.attachments || [];
		} catch (err) { error = 'Error fetching trademark CTC information.'; console.error(err); } finally { isLoading = false; }
	}

	async function handleSubmit() {
		if (selectedAttachmentIndices.length === 0) { toast.error('Please select at least one attachment'); return; }
		isProcessing = true;
		try {
			const selectedAttachments = selectedAttachmentIndices.map(index => attachments[index]);
			const attachmentIds = selectedAttachments.map((attachment, idx) =>
				typeof attachment === 'string'
					? attachment
					: attachment.id || attachment.name || attachment.fileName || `attachment_${selectedAttachmentIndices[idx]}`
			);
			const finalCost = calculatedCost;
			const rrrResponse = await fetch(`${baseURL}/api/files/GetTrademarkCTCCost?fileId=${fileId}&fileType=TradeMark&numberOfAttachments=${selectedAttachmentIndices.length}`);
			if (!rrrResponse.ok) { toast.error('Failed to generate payment reference'); return; }
			const rrrData = await rrrResponse.json();
			const finalRRR = rrrData.data?.rrr || rrrData.rrr;
			sessionStorage.setItem('trademarkCTCPayload', JSON.stringify({
				fileId, rrr: finalRRR, attachmentIds, ctcRequestDate: new Date().toISOString(),
				userId: $loggedInUser?.email || null
			}));
			await goto(`/payment/?type=trademarkctc&rrr=${finalRRR}&amount=${finalCost}&fileId=${fileId}`);
		} catch (err) { error = 'CTC request processing failed. Please try again.'; console.error(err); toast.error('An error occurred while processing your request'); } finally { isProcessing = false; }
	}

	function goBack() { window.history.back(); }
	function goToDashboard() { goto('/home/dashboard'); }
</script>

<div class="min-h-screen py-4 px-4">
	<div class="w-full mx-auto">
		<div class="flex items-center">
			<Button variant="outline" on:click={goBack} class="flex items-center gap-2"><Icon icon="lucide:arrow-left" width="1rem" height="1rem" /> Back</Button>
			<div class="flex-1 flex flex-col items-center justify-center">
				<h1 class="text-xl font-bold">Trademark CTC (Certified True Copy)</h1>
				<p class="font-light">Request certified true copies of trademark documents</p>
			</div>
		</div>

		<div class="px-6 py-6">
			{#if error}<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"><p class="text-sm text-red-700">{error}</p></div>{/if}

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">TRADEMARK INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Trademark Information...</span></div></div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Number:</label><input type="text" value={fileId || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Origin:</label><input type="text" value={fileOrigin} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Trademark Title:</label><input type="text" value={trademarkTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant Name:</label><input type="text" value={applicantName} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant Email:</label><input type="text" value={applicantEmail || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant Phone:</label><input type="text" value={applicantPhone || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant Nationality:</label><input type="text" value={applicantNationality} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant State:</label><input type="text" value={applicantState} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Applicant City:</label><input type="text" value={applicantCity} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Applicant Address:</label><textarea rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled>{applicantAddress}</textarea></div>
					</div>
				{/if}
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">AVAILABLE ATTACHMENTS</div>
				<div class="p-4">
					{#if attachments.length === 0}
						<p class="text-sm text-gray-500">No attachments available for CTC.</p>
					{:else}
						<div class="space-y-3">
							{#each attachments as attachment, index}
								<label class="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50">
									<div class="flex items-center gap-3">
										<input type="checkbox" checked={selectedAttachmentIndices.includes(index)} on:change={() => toggleAttachmentSelection(index)} />
										<div>
										<p class="text-sm font-medium text-gray-800">{typeof attachment === 'string' ? (attachment) : (attachment.name || attachment.fileName || `Attachment ${index + 1}`)}</p>
										<p class="text-xs text-gray-500">{typeof attachment === 'string' ? '' : (attachment.description || attachment.type || 'Document')}</p>
										</div>
									</div>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">PAYMENT SUMMARY</div>
				<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-600">Cost per Attachment</p>
						<p class="text-lg font-semibold">₦{baseCost ?? 0}</p>
						<p class="text-xs text-gray-400 mt-0.5">Base ₦8,000 + Service Fee ₦3,500</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Number of Attachments Selected</p>
						<p class="text-lg font-semibold">{selectedAttachmentIndices.length}</p>
					</div>
					<div class="md:col-span-2 bg-green-50 rounded-md p-3">
						<p class="text-sm text-gray-600">Total Cost <span class="text-xs text-gray-400">(₦{baseCost ?? 0} × {selectedAttachmentIndices.length})</span></p>
						<p class="text-2xl font-bold text-green-700">₦{calculatedCost ?? 0}</p>
					</div>
				</div>
			</div>

			<div class="flex justify-end">
				<button on:click={handleSubmit} class="bg-green-800 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>
					{#if isProcessing}<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...{:else}Proceed To Pay{/if}
				</button>
			</div>
		</div>
	</div>

	{#if showExistingApplicationModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
				<h2 class="text-xl font-bold mb-4">Existing CTC Application</h2>
				<p class="text-sm text-gray-600 mb-6">
					A Trademark CTC (Certified True Copy) application has already been submitted for this file.
					You cannot create multiple CTC applications for the same trademark.
				</p>
				<div class="flex justify-center gap-3">
					<Button variant="outline" on:click={goToDashboard}>Go to Dashboard</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
