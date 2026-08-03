<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Button } from '$lib/components/ui/button/index';
	import { baseURL, FileTypes, ApplicationStatuses } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { parseLoggedInUser } from '../../../dataview/datahelpers';
	import { filesToAttachment } from '$lib/utils/patent';

	let fileId = '';
	let fileType: FileTypes | null = null;
	let isLoading = true;
	let isSubmitting = false;
	let error: string | null = null;

	// Form fields
	let renewalYear = '';
	const currentYear = new Date().getFullYear();
	const renewalYears = Array.from({ length: currentYear - 2013 + 1 }, (_, i) => currentYear - i);
	let paymentDate = '';
	let paymentId = '';

	// Both attachments are required per backend validation
	let renewalReceiptFiles: File[] = [];
	let certificateFiles: File[] = [];

	const pageData = get(page);

	onMount(async () => {
		if (!$loggedInUser) {
			const user = parseLoggedInUser(document.cookie);
			if (!user) {
				await goto('/auth');
				return;
			}
			loggedInUser.set(user);
		}

		fileId = pageData.url.searchParams.get('fileId') ?? '';
		const fileTypeParam = pageData.url.searchParams.get('fileType');
		const parsed = Number(fileTypeParam);
		const validValues = Object.values(FileTypes).filter(
			(v) => typeof v === 'number'
		) as number[];
		fileType =
			!Number.isNaN(parsed) && validValues.includes(parsed) ? (parsed as FileTypes) : null;

		if (!fileId || fileType === null) {
			error = 'Missing file number or file type.';
		}
		isLoading = false;
	});

	function handleReceiptChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			renewalReceiptFiles = [...renewalReceiptFiles, ...Array.from(target.files)];
		}
	}

	function handleCertificateChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			certificateFiles = [...certificateFiles, ...Array.from(target.files)];
		}
	}

	function removeReceipt(index: number): void {
		renewalReceiptFiles = renewalReceiptFiles.filter((_, i) => i !== index);
	}

	function removeCertificate(index: number): void {
		certificateFiles = certificateFiles.filter((_, i) => i !== index);
	}

	function validate(): string | null {
		if (!renewalYear) {
			return 'Renewal year is required.';
		}
		if (!paymentDate) return 'Payment date is required.';
		if (!paymentId.trim()) return 'Payment ID is required.';
		if (renewalReceiptFiles.length === 0) return 'Please upload the renewal receipt.';
		if (certificateFiles.length === 0) return 'Please upload the renewal certificate.';
		return null;
	}

	async function handleSubmit(): Promise<void> {
		const validationError = validate();
		if (validationError) {
			toast.error(validationError, { position: 'top-right' });
			return;
		}

		isSubmitting = true;
		try {
			const receiptAttachments = await filesToAttachment('renewalReceipt', renewalReceiptFiles);
			const certAttachments = await filesToAttachment('renewalCertificate', certificateFiles);

			const body = {
				FileId: fileId,
				UserId: $loggedInUser?.id,
				RenewalYear: Number(renewalYear),
				PaymentDate: new Date(paymentDate).toISOString(),
				PaymentId: paymentId.trim(),
				RenewalReceiptAttachments: receiptAttachments,
				RenewalCertificateAttachments: certAttachments
			};

			const res = await fetch(`${baseURL}/api/files/offline-renewal/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const err = await res.json();
				toast.error(err.message || 'Submission failed. Please try again.', {
					position: 'top-right'
				});
				return;
			}

			toast.success('Offline renewal submitted successfully. Awaiting confirmation.', {
				position: 'top-right'
			});
			setTimeout(() => goto('/home/dashboard'), 1500);
		} catch (err) {
			toast.error('An error occurred. Please try again.', { position: 'top-right' });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Toaster />

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-2xl mx-auto">
		<div class="flex items-center gap-3 mb-6">
			<Button variant="outline" on:click={() => window.history.back()} class="flex items-center gap-2">
				<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
				Back
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Offline Renewal Submission</h1>
				{#if fileId}
					<p class="text-sm text-gray-500">File: <span class="font-medium text-gray-700">{fileId}</span></p>
				{/if}
			</div>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center p-12">
				<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-green-600" />
			</div>
		{:else if error}
			<div class="bg-red-50 text-red-600 p-4 rounded-md text-center">{error}</div>
		{:else}
			<div class="bg-white rounded-lg shadow p-6 space-y-6">
				<!-- Renewal Details -->
				<div>
					<h2 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<Icon icon="mdi:form-select" width="1.2rem" class="text-green-600" />
						Renewal Details
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="renewal-year" class="block text-sm font-medium text-gray-700 mb-1">
								Renewal Year <span class="text-red-500">*</span>
							</label>
						<select
							id="renewal-year"
							bind:value={renewalYear}
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							<option value="" disabled>Select year</option>
							{#each renewalYears as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
						</div>

						<div>
							<label for="payment-date" class="block text-sm font-medium text-gray-700 mb-1">
								Payment Date <span class="text-red-500">*</span>
							</label>
							<input
								id="payment-date"
								type="date"
								bind:value={paymentDate}
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="payment-id" class="block text-sm font-medium text-gray-700 mb-1">
								Payment ID / RRR <span class="text-red-500">*</span>
							</label>
							<input
								id="payment-id"
								type="text"
								bind:value={paymentId}
								placeholder="Enter payment reference number"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>
				</div>

				<hr class="border-gray-200" />

				<!-- Attachments -->
				<div>
					<h2 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<Icon icon="mdi:paperclip" width="1.2rem" class="text-green-600" />
						Attachments
					</h2>

					<!-- Renewal Receipt -->
					<div class="mb-5">
					<span class="block text-sm font-medium text-gray-700 mb-1">
						Renewal Receipt <span class="text-red-500">*</span>
					</span>
						<label
							class="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-md px-4 py-3 hover:border-blue-400 transition-colors w-fit"
						>
							<Icon icon="mdi:upload" width="1.2rem" class="text-gray-500" />
							<span class="text-sm text-gray-600">Choose file(s)</span>
							<input
								type="file"
								accept=".pdf,.jpeg,.jpg,.png"
								multiple
								class="hidden"
								on:change={handleReceiptChange}
							/>
						</label>
						{#if renewalReceiptFiles.length > 0}
							<ul class="mt-2 space-y-1">
								{#each renewalReceiptFiles as file, i}
									<li class="flex items-center justify-between bg-gray-50 px-3 py-1 rounded text-sm">
										<span class="truncate max-w-xs">{file.name}</span>
										<button
											class="text-red-500 hover:text-red-700 ml-2"
											on:click={() => removeReceipt(i)}
											type="button"
										>
											<Icon icon="mdi:close" width="1rem" />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Certificate -->
					<div>
					<span class="block text-sm font-medium text-gray-700 mb-1">
						Certificate <span class="text-red-500">*</span>
					</span>
						<label
							class="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-md px-4 py-3 hover:border-blue-400 transition-colors w-fit"
						>
							<Icon icon="mdi:upload" width="1.2rem" class="text-gray-500" />
							<span class="text-sm text-gray-600">Choose file(s)</span>
							<input
								type="file"
								accept=".pdf,.jpeg,.jpg,.png"
								multiple
								class="hidden"
								on:change={handleCertificateChange}
							/>
						</label>
						{#if certificateFiles.length > 0}
							<ul class="mt-2 space-y-1">
								{#each certificateFiles as file, i}
									<li class="flex items-center justify-between bg-gray-50 px-3 py-1 rounded text-sm">
										<span class="truncate max-w-xs">{file.name}</span>
										<button
											class="text-red-500 hover:text-red-700 ml-2"
											on:click={() => removeCertificate(i)}
											type="button"
										>
											<Icon icon="mdi:close" width="1rem" />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<hr class="border-gray-200" />

				<!-- Submit -->
				<div class="flex justify-end gap-3">
					<Button variant="outline" on:click={() => goto('/home/dashboard')} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button
						class="bg-green-800 hover:bg-green-700 text-white"
						on:click={handleSubmit}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Icon icon="line-md:loading-loop" width="1rem" height="1rem" class="mr-2" />
							Submitting...
						{:else}
							<Icon icon="mdi:send" width="1rem" height="1rem" class="mr-2" />
							Submit Renewal
						{/if}
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
