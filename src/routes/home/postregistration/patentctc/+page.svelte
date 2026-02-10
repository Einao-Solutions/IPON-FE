<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL, getPatentTypeLabel, getPatentApplicationTypeLabel } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { toast } from 'svelte-sonner';

	interface PatentAttachment {
		name?: string;
		url?: string;
		fileName?: string;
		contentType?: string;
	}

	// API and UI state
	let error: string | null = null;
	let cost: number | null = null;
	let paymentId: string | null = null;
	let fileId: string | null = null;
	let patentTitle: string = '';
	let patentType: number | null = null;
	let patentApplicationType: number | null = null;
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
	let attachments: PatentAttachment[] = [];

	onMount(async () => {
		// Check if user is authenticated
		if (!$loggedInUser) {
			await goto('/auth');
			return;
		}

		const fileNumber = $page.url.searchParams.get('fileId') ?? '';
		const fileType = $page.url.searchParams.get('fileType') ?? '';
		await setData(fileNumber, fileType);
	});

	async function setData(fileNumber: string, fileType: string): Promise<void> {
		isLoading = true;
		try {
			// Get cost information and attachments for patent CTC
			const res = await fetch(
				`${baseURL}/api/files/GetPatentCTCCost?fileId=${fileNumber}&fileType=${fileType}`
			);
			if (!res.ok) {
				error = 'Unable to retrieve cost info and attachments.';
				return;
			}

			const response = await res.json();
			const data = response.data || response;
			
			cost = data.amount;
			paymentId = data.rrr;
			applicantName = data.applicantName;
			patentTitle = data.fileTitle || data.titleOfInvention;
			patentType = data.patentType;
			patentApplicationType = data.patentApplicationType;
			fileOrigin = data.fileOrigin || '';
			fileId = data.fileId;
			applicantEmail = data.applicantEmail;
			applicantPhone = data.applicantPhone;
			applicantAddress = data.applicantAddress || '';
			applicantNationality = data.applicantNationality || '';
			applicantCity = data.applicantCity || '';
			applicantState = data.applicantState || '';
			
			// Extract attachments from the response
			attachments = data.attachments || [];
			
		} catch (err) {
			error = 'Error fetching patent CTC information.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit() {
		isProcessing = true;
		try {
			// Store CTC request data for submission on result page
			sessionStorage.setItem('patentCTCPayload', JSON.stringify({
				fileId: fileId,
				rrr: paymentId,
				ctcRequestDate: new Date().toISOString()
			}));
			
			// Navigate to payment page
			await handlePayment();
		} catch (err) {
			error = 'CTC request processing failed. Please try again.';
			console.error(err);
		} finally {
			isProcessing = false;
		}
	}

	async function handlePayment() {
		if (cost && paymentId) {
			await goto(`/payment/?type=patentctc&rrr=${paymentId}&amount=${cost}&fileId=${fileId}`);
		}
	}

	function goBack() {
		window.history.back();
	}
</script>

<div class="min-h-screen py-4 px-4">
	<div class="w-full mx-auto">
		<!-- Header -->
		<div class="flex items-center">
			<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
				<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
				Back
			</Button>
			<div class="flex-1 flex flex-col items-center justify-center">
				<h1 class="text-xl font-bold">Patent CTC (Certified True Copy)</h1>
				<p class="font-light">Request certified true copies of patent documents</p>
			</div>
		</div>

		<!-- Form -->
		<div class="px-6 py-6">
			{#if error}
				<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<!-- Patent Information Section -->
			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">PATENT INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12">
						<div class="flex flex-col items-center gap-2">
							<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
							<span class="text-sm text-gray-500">Loading Patent Information...</span>
						</div>
					</div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="fileNumber" class="block text-sm font-medium text-gray-700 mb-1">
								File Number:
							</label>
							<input
								id="fileNumber"
								type="text"
								value={fileId || ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label for="fileOrigin" class="block text-sm font-medium text-gray-700 mb-1">
								File Origin:
							</label>
							<input
								id="fileOrigin"
								type="text"
								value={fileOrigin}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label for="patentType" class="block text-sm font-medium text-gray-700 mb-1">
								Patent Type:
							</label>
							<input
								id="patentType"
								type="text"
								value={patentType !== null ? getPatentTypeLabel(patentType) : ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label for="patentApplicationType" class="block text-sm font-medium text-gray-700 mb-1">
								Patent Application Type:
							</label>
							<input
								id="patentApplicationType"
								type="text"
								value={patentApplicationType !== null ? getPatentApplicationTypeLabel(patentApplicationType) : ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div class="md:col-span-2">
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
								Title of Invention:
							</label>
							<input
								id="title"
								type="text"
								value={patentTitle}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Applicant Information Section -->
			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">APPLICANT INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12">
						<div class="flex flex-col items-center gap-2">
							<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
							<span class="text-sm text-gray-500">Loading Applicant Information...</span>
						</div>
					</div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Name:</label>
							<input
								type="text"
								value={applicantName}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Email:</label>
							<input
								type="email"
								value={applicantEmail}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
							<input
								type="text"
								value={applicantPhone}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label>
							<input
								type="text"
								value={applicantNationality}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">City:</label>
							<input
								type="text"
								value={applicantCity}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">State:</label>
							<input
								type="text"
								value={applicantState}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-gray-700 mb-1">Address:</label>
							<input
								type="text"
								value={applicantAddress}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- File Attachments Section -->
			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">FILE ATTACHMENTS</div>
				<div class="p-4">
					{#if isLoading}
						<div class="flex items-center justify-center py-8">
							<div class="flex flex-col items-center gap-2">
								<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
								<span class="text-sm text-gray-500">Loading File Attachments...</span>
							</div>
						</div>
					{:else if attachments && attachments.length}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each attachments as attachment, index}
								<div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
									<div class="flex items-center justify-between gap-3">
										<div class="flex-1 min-w-0">
											<div class="font-medium text-gray-800 truncate">
												{attachment.name || attachment.fileName || `Document ${index + 1}`}
											</div>
											<div class="text-xs text-gray-500 mt-1">
												Document {index + 1} of {attachments.length}
											</div>
										</div>
										<div class="flex-shrink-0">
											{#if attachment.url}
												<a
													href={attachment.url}
													target="_blank"
													rel="noopener"
													class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
												>
													<Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
													<span>View</span>
												</a>
											{:else}
												<span class="text-gray-400 px-3 py-2 rounded-lg text-sm">
													No URL
												</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
							<Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
							<p>No file attachments found for this patent</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end">
				{#if cost !== null}
					<button
						on:click={handleSubmit}
						class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
						disabled={isProcessing}
					>
						{#if isProcessing}
							<svg
								class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Processing...
						{:else}
							Request CTC - Pay ₦{cost?.toLocaleString()}
						{/if}
					</button>
				{:else}
					<button class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>
						Loading...
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
