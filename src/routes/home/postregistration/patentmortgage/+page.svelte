<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { toast } from 'svelte-sonner';

	interface PatentMortgageData {
		mortgageDeeds: File[];
		supportingDocuments: File[];
	}

	let formData: PatentMortgageData = {
		mortgageDeeds: [],
		supportingDocuments: []
	};

	// API and UI state
	let error: string | null = null;
	let cost: number | null = null;
	let paymentId: string | null = null;
	let fileId: string | null = null;
	let patentTitle: string = '';
	let applicantName: string = '';
	let applicantEmail: string = '';
	let applicantPhone: string = '';
	let isProcessing = false;
	let isLoading = false;

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
			// Get cost information for patent mortgage
			const res = await fetch(
				`${baseURL}/api/files/GetPatentMortgageCost?fileId=${fileNumber}&fileType=${fileType}`
			);
			if (!res.ok) {
				error = 'Unable to retrieve cost info.';
				return;
			}

			const response = await res.json();
			const data = response.data || response; // Handle both nested and direct response formats
			cost = data.amount;
			paymentId = data.rrr;
			applicantName = data.applicantName;
			patentTitle = data.fileTitle || data.titleOfInvention;
			fileId = data.fileId;
			applicantEmail = data.applicantEmail;
			applicantPhone = data.applicantPhone;
		} catch (err) {
			error = 'Error fetching patent mortgage cost.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function handleFileChange(event: Event, type: 'mortgageDeeds' | 'supportingDocuments') {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (files && files.length > 0) {
			const newFiles = Array.from(files);
			formData[type] = [...formData[type], ...newFiles];
		}
		
		// Reset the input so the same file can be selected again if needed
		target.value = '';
	}

	function removeFile(type: 'mortgageDeeds' | 'supportingDocuments', index: number) {
		formData[type] = formData[type].filter((_, i) => i !== index);
	}

	function validateForm(): boolean {
		if (formData.mortgageDeeds.length === 0) {
			error = 'Please upload at least one deed of mortgage document.';
			return false;
		}

		if (formData.supportingDocuments.length === 0) {
			error = 'Please upload at least one supporting document.';
			return false;
		}

		error = null;
		return true;
	}

	async function convertToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const result = reader.result as string;
				// Remove the data:mime/type;base64, prefix
				const base64Data = result.split(',')[1];
				resolve(base64Data);
			};
			reader.onerror = (error) => reject(error);
		});
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isProcessing = true;
		try {
			// Convert files to base64
			const mortgageDeedData = [];
			for (const file of formData.mortgageDeeds) {
				const base64Data = await convertToBase64(file);
				mortgageDeedData.push({
					fileName: file.name,
					contentType: file.type,
					data: base64Data,
					name: 'DeedofMortgage'
				});
			}
			
			const supportingDocsData = [];
			for (const file of formData.supportingDocuments) {
				const base64Data = await convertToBase64(file);
				supportingDocsData.push({
					fileName: file.name,
					contentType: file.type,
					data: base64Data,
					name: 'PatentMortgageSupportingDocuments'
				});
			}

			const now = new Date();
			const payload = {
				fileId: fileId,
				rrr: paymentId,
				mortgageDate: now.toISOString(),
				mortgageRequestDate: now.toISOString(),
				Deedofmortgage: mortgageDeedData,
				PatentMortgageSupportingDocuments: supportingDocsData
			};

			// Debug: Log the payload before storing
			console.log('Patent Mortgage Payload before storing:', payload);
			console.log('Supporting docs with names:', supportingDocsData);

			// Store payload data for submission on result page
			sessionStorage.setItem('patentMortgagePayload', JSON.stringify(payload));
			
			// Store form metadata for display
			sessionStorage.setItem('patentMortgageFormData', JSON.stringify({
				mortgageDeeds: formData.mortgageDeeds.map(f => f.name),
				supportingDocuments: formData.supportingDocuments.map(f => f.name),
				patentTitle: patentTitle,
				applicantName: applicantName,
				applicantEmail: applicantEmail
			}));

			// Navigate to payment page
			await handlePayment();
		} catch (err) {
			error = 'Form processing failed. Please try again.';
			console.error(err);
		} finally {
			isProcessing = false;
		}
	}

	async function handlePayment() {
		if (cost && paymentId) {
			await goto(`/payment/?type=patentmortgage&rrr=${paymentId}&amount=${cost}&fileId=${fileId}`);
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
				<h1 class="text-xl font-bold">Patent Mortgage Application</h1>
				<p class="font-light">Submit mortgage documentation for patent mortgage</p>
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
							<label for="applicantName" class="block text-sm font-medium text-gray-700 mb-1">
								Applicant Name:
							</label>
							<input
								id="applicantName"
								type="text"
								value={applicantName}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
						<div>
							<label for="applicantEmail" class="block text-sm font-medium text-gray-700 mb-1">
								Applicant Email:
							</label>
							<input
								id="applicantEmail"
								type="email"
								value={applicantEmail}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Document Upload Section -->
			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">DOCUMENT UPLOADS</div>
				<div class="p-4 space-y-6">
					<!-- Mortgage Deeds -->
					<div>
						<label for="mortgageDeeds" class="block text-sm font-medium text-gray-700 mb-2">
							Deed of Mortgage: <span class="text-red-500">*</span>
						</label>
						
						<!-- File Upload Input -->
						<div class="flex items-center mb-3">
							<input
								type="file"
								accept=".pdf,.doc,.docx"
								on:change={(e) => handleFileChange(e, 'mortgageDeeds')}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
								multiple
							/>
						</div>
						
						<!-- Uploaded Files List -->
						{#if formData.mortgageDeeds.length > 0}
							<div class="space-y-2">
								<p class="text-sm text-gray-600">Uploaded files:</p>
								{#each formData.mortgageDeeds as file, index}
									<div class="flex items-center gap-2">
										<input
											class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
											value={file.name}
											readonly
										/>
										
										<!-- View Button with Eye Icon -->
										<button
											type="button"
											class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
											on:click={() => {
												const url = URL.createObjectURL(file);
												window.open(url, '_blank');
											}}
											title="View file"
										>
											<svg
												class="w-4 h-4 text-blue-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												></path>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												></path>
											</svg>
										</button>

										<!-- Remove Button -->
										<button
											type="button"
											class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
											on:click={() => removeFile('mortgageDeeds', index)}
										>
											Remove
										</button>
									</div>
								{/each}
							</div>
						{/if}
						
						<p class="text-xs text-gray-500">
							Upload the signed deed of mortgage documents (PDF, DOC, or DOCX format)
						</p>
					</div>

					<!-- Supporting Documents -->
					<div>
						<label for="supportingDocuments" class="block text-sm font-medium text-gray-700 mb-2">
							Other Supporting Documents: <span class="text-red-500">*</span>
						</label>
						
						<!-- File Upload Input -->
						<div class="flex items-center mb-3">
							<input
								type="file"
								accept=".pdf,.doc,.docx"
								on:change={(e) => handleFileChange(e, 'supportingDocuments')}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
								multiple
							/>
						</div>
						
						<!-- Uploaded Files List -->
						{#if formData.supportingDocuments.length > 0}
							<div class="space-y-2">
								<p class="text-sm text-gray-600">Uploaded files:</p>
								{#each formData.supportingDocuments as file, index}
									<div class="flex items-center gap-2">
										<input
											class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
											value={file.name}
											readonly
										/>
										
										<!-- View Button with Eye Icon -->
										<button
											type="button"
											class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
											on:click={() => {
												const url = URL.createObjectURL(file);
												window.open(url, '_blank');
											}}
											title="View file"
										>
											<svg
												class="w-4 h-4 text-blue-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												></path>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												></path>
											</svg>
										</button>

										<!-- Remove Button -->
										<button
											type="button"
											class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
											on:click={() => removeFile('supportingDocuments', index)}
										>
											Remove
										</button>
									</div>
								{/each}
							</div>
						{/if}
						
						<p class="text-xs text-gray-500">
							Upload any additional supporting documents (authorization letters, corporate resolutions, etc.)
						</p>
					</div>
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
					Proceed To Pay
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
