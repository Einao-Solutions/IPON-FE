<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { countriesMap } from '$lib/constants';

	interface MergerData {
		name: string;
		email: string;
		phone: string;
		dateOfMerger: string;
		address: string;
		document: File | null;
		nationality: string;
	}

	let mergerData: MergerData = {
		name: '',
		email: '',
		phone: '',
		dateOfMerger: '',
		nationality: '',
		address: '',
		document: null
	};

	let nameOfApplicant = '';
	let fileTitle = '';
	let tmClass: number | null = null;
	let fileId: string | null = null;
	let paymentId: string | null = null;
	let cost: number | null = null;
	let error: string | null = null;
	let isProcessing = false;
	let isLoading = false;

	const pageData = get(page);

	onMount(async () => {
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
		const fileType = pageData.url.searchParams.get('fileType') ?? '';
		await setData(fileNumber, fileType);
	});

	async function setData(fileNumber: string, fileType: string): Promise<void> {
		isLoading = true;

		try {
			const res = await fetch(
				`${baseURL}/api/files/GetMergerCost?fileId=${fileNumber}&fileType=${fileType}`
			);
			if (!res.ok) {
				error = 'Unable to retrieve cost info.';
				return;
			}
			const data = await res.json();
			nameOfApplicant = data.applicantName;
			fileTitle = data.fileTitle;
			tmClass = data.trademarkClass;
			fileId = data.fileId;
			paymentId = data.rrr;
			cost = data.amount;
		} catch (err) {
			error = 'Error fetching merger cost.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function validateForm(): boolean {
		const required = [
			mergerData.name,
			mergerData.email,
			mergerData.phone,
			mergerData.dateOfMerger,
			mergerData.nationality,
			mergerData.address
		];
		if (required.some((v) => !v)) {
			error = 'Please fill in all required fields.';
			return false;
		}
		if (!mergerData.document) {
			error = 'Please upload the deed of merger.';
			return false;
		}
		error = null;
		return true;
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Check file size (max 10MB)
		const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSizeInBytes) {
			error = 'File size exceeds the maximum limit of 10MB.';
			mergerData.document = null;
			return;
		}
		if (file.type !== 'application/pdf') {
			error = 'Only PDF files are allowed.';
			mergerData.document = null;
			return;
		}

		mergerData.document = file;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		isProcessing = true;
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';

		try {
			const form = new FormData();
			form.append('FileId', fileNumber);
			form.append('rrr', paymentId ?? '');
			form.append('Name', mergerData.name);
			form.append('Email', mergerData.email);
			form.append('Phone', mergerData.phone);
			form.append('Nationality', mergerData.nationality);
			form.append('MergerDate', mergerData.dateOfMerger);
			form.append('Address', mergerData.address);
			form.append('document', mergerData.document as File);
			console.log(form);

			const resp = await fetch(`${baseURL}/api/files/MergerApplication`, {
				method: 'POST',
				body: form
			});
			if (resp.ok) {
				// Store form data in local storage (convert FormData to plain object)
				const formObj: Record<string, any> = {};
				form.forEach((value, key) => {
					// For files, just store the name (or you can skip storing files)
					formObj[key] = value instanceof File ? value.name : value;
				});
				localStorage.setItem('formData', JSON.stringify(formObj));
				await handlePayment();
			} else {
				console.error('Upload failed');
			}
		} catch (err) {
			error = 'Form submission failed.';
			console.error(err);
		} finally {
			isProcessing = false;
		}
	}

	async function handlePayment() {
		if (cost && paymentId) {
			await goto(`/payment/?type=merger&rrr=${paymentId}&amount=${cost}`);
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
				<h1 class="text-xl font-bold">Merger Application [Form 17]</h1>
				<p class="font-light">Fill in the details for the merger</p>
			</div>
		</div>

		<!-- Form -->
		<div class="px-6 py-6">
			{#if error}
				<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<!-- Form sections  -->
			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">MERGER FORM</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12">
						<div class="flex flex-col items-center gap-2">
							<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
							<span class="text-sm text-gray-500">Loading Trademark Information...</span>
						</div>
					</div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Applicant Name: <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={nameOfApplicant}
								placeholder={nameOfApplicant}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
								disabled
							/>
						</div>

						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
								Title:
							</label>
							<input
								id="title"
								type="text"
								bind:value={fileTitle}
								placeholder={fileTitle}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
								disabled
							/>
						</div>

						<div>
							<label for="productClass" class="block text-sm font-medium text-gray-700 mb-1">
								Product Class: <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="productClass"
								bind:value={tmClass}
								placeholder={tmClass !== null ? String(tmClass) : ''}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
								disabled
							/>
						</div>

						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1"> File number: </label>
							<input
								type="text"
								bind:value={fileId}
								placeholder={fileId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
								disabled
							/>
						</div>
					</div>
				{/if}
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">MERGER INFORMATION</div>
				<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Name: <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={mergerData.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						/>
					</div>

					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Email: <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							bind:value={mergerData.email}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						/>
					</div>

					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Phone number: <span class="text-red-500">*</span>
						</label>
						<input
							type="tel"
							bind:value={mergerData.phone}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						/>
					</div>
					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Nationality: <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={mergerData.nationality}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						>
							<option value="" disabled selected>Select nationality</option>
							{#each Object.entries(countriesMap) as [code, name]}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</div>

					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Date of merger: <span class="text-red-500">*</span>
						</label>
						<input
							type="date"
							bind:value={mergerData.dateOfMerger}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						/>
					</div>
					<div class="md:col-span-1">
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Upload deed of merger: <span class="text-red-500">*</span>
						</label>
						<div class="flex items-center">
							<input
								type="file"
								accept=".pdf"
								on:change={handleFileChange}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
								required
							/>
						</div>
					</div>
					<div class="md:col-span-2">
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Address: <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={mergerData.address}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
							required
						/>
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
							Pay
						{/if}
					</button>
				{:else}
					<button class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>
						Pay
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
