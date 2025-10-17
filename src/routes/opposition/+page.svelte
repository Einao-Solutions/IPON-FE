<script lang="ts">
	import { onMount } from 'svelte';
	import coatOfArms from '$lib/assets/logo.png';
	import { baseURL } from '$lib/helpers';
	import { countriesMap } from '$lib/constants';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { string } from 'zod';
	interface FileInfo {
		fileNumber: string;
		fileTitle: string;
		class: string;
		representationUrl: string;
		applicantName: string;
		paymentId: string;
		cost: string;
		fileId: string;
	}
	type OppositionFormData = {
		fileNumber: string;
		name: string;
		phone: string;
		email: string;
		address: string;
		nationality: string;
		reason: string;
		paymentId: string;
		fileId: string;
		attachments?: File[];
		fileTitle?: string;
	};
	interface FormData {
		fileNumber: string;
		name: string;
		phone: string;
		email: string;
		address: string;
		nationality: string;
		reason: string;
		attachments: FileList | null;
		paymentId: string;
		fileId: string;
		fileTitle?: string;
	}

	let currentStep: 'search' | 'results' | 'form' = 'search';
	let searchInput: string = '';
	let fileInfo: FileInfo | null = null;
	let formData: FormData = {
		fileNumber: '',
		name: '',
		phone: '',
		email: '',
		address: '',
		nationality: '',
		reason: '',
		attachments: null,
		paymentId: '',
		fileId: '',
		fileTitle: ''
	};
	let pubFile: string | null = null;
	let isLoading: boolean = false;
	let fileInputElement: HTMLInputElement;
	onMount(() => {
		const urlFileId = $page.url.searchParams.get('fileId');
		pubFile = urlFileId;
		if (urlFileId) {
			// auto trigger search with fileId
			handleSearch(urlFileId);
		}
	});
	async function handleSearch(fileNumber: string) {
		isLoading = true;
		const query = fileNumber;

		// if(!fileNumber){
		// 	query = searchInput.trim();
		// }
		console.log('Searching for file number:', query);
		if (!query) {
			alert('Please enter a file number.');
			isLoading = false;
			return;
		}

		try {
			const response = await fetch(
				`${baseURL}/api/opposition/OppositionSearch?fileNumber=${query}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			const foundFile = await response.json();
			localStorage.setItem('fileData', JSON.stringify({ fileInfo: foundFile }));
			if (foundFile) {
				fileInfo = foundFile;
				currentStep = 'results';
			} else {
				alert('File not found. Please check the file number and try again.');
			}
		} catch (err) {
			console.error('Search error:', err);
			alert('An error occurred while searching. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function handleProceed() {
		currentStep = 'form';
		// Set the file number in the form data
		if (fileInfo) {
			formData.fileNumber = fileInfo.fileNumber;
			formData.paymentId = fileInfo.paymentId;
			formData.fileId = fileInfo.fileId;
			formData.fileTitle = fileInfo.fileTitle;
		}
		console.log(formData);
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			formData.attachments = target.files;
		}
	}
	async function handlePayment() {
		if (fileInfo?.cost && fileInfo.paymentId) {
			await goto(`/payment/?type=opposition&rrr=${fileInfo.paymentId}&cost=${fileInfo.cost}`);
		}
	}

	async function handleSubmit() {
		if (!formData.name.trim() || !formData.email.trim() || !formData.reason.trim()) {
			alert('Please fill in all required fields (Name, Email, and Reason).');
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			alert('Please enter a valid email address.');
			return;
		}

		isLoading = true;

		// Build FormData for submission
		const submitData = new FormData();
		submitData.append('FileNumber', formData.fileNumber);
		submitData.append('Name', formData.name);
		submitData.append('Phone', formData.phone);
		submitData.append('Email', formData.email);
		submitData.append('Address', formData.address);
		submitData.append('Nationality', formData.nationality);
		submitData.append('Reason', formData.reason);
		submitData.append('PaymentId', formData.paymentId);
		submitData.append('FileId', formData.fileId);
		submitData.append('FileTitle', formData.fileTitle ?? '');

		// Add supporting documents (for API only)
		if (formData.attachments) {
			for (let i = 0; i < formData.attachments.length; i++) {
				submitData.append('SupportingDocs', formData.attachments[i]);
			}
		}

		// Save only serializable data to sessionStorage
		const serializableData: Omit<OppositionFormData, 'attachments'> = {
			fileNumber: formData.fileNumber,
			name: formData.name,
			phone: formData.phone,
			email: formData.email,
			address: formData.address,
			nationality: formData.nationality,
			reason: formData.reason,
			paymentId: formData.paymentId,
			fileId: formData.fileId
		};
		localStorage.setItem('oppositionData', JSON.stringify(serializableData));

		try {
			const response = await fetch(`${baseURL}/api/opposition/NewOpposition`, {
				method: 'POST',
				body: submitData
			});

			if (response.ok) {
				await handlePayment();
			} else {
				const error = await response.text();
				alert(`Submission failed: ${error}`);
			}
		} catch (error) {
			console.error('Submission error:', error);
			alert('An error occurred while submitting the opposition. Please try again.');
		}

		isLoading = false;
	}

	function goBack() {
		if (currentStep === 'results') {
			currentStep = 'search';
		} else if (currentStep === 'form') {
			currentStep = 'results';
		}
	}
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4">
	<div class="max-w-2xl mx-auto">
		{#if currentStep === 'search'}
			<!-- Search Page -->
			<div class="bg-white rounded-lg shadow-md p-8">
				<div class="mb-8 text-center">
					<img src={coatOfArms} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
					<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
					<h3 class="text-md">Commercial Law Department</h3>
				</div>

				<h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">Opposition File Search</h1>

				<div class="space-y-6">
					<div>
						<label for="search-input" class="block text-sm font-medium text-gray-700 mb-2">
							File Number
						</label>
						<input
							id="search-input"
							type="text"
							bind:value={searchInput}
							placeholder={pubFile ?? "Enter file number"}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						/>
					</div>

					<button
						on:click={handleSearch(searchInput.trim())}
						disabled={isLoading || !searchInput.trim()}
						class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isLoading}
							<div class="flex items-center justify-center">
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
								Searching...
							</div>
						{:else}
							Search
						{/if}
					</button>
				</div>
			</div>
		{:else if currentStep === 'results'}
			<!-- Results Page -->
			<div class="bg-white rounded-lg shadow-md p-8">
				<div class="mb-8 text-center">
					<img src={coatOfArms} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
					<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
					<h3 class="text-md">Commercial Law Department</h3>
				</div>
				<div class="flex items-center justify-between mb-6">
					<h1 class="text-2xl font-bold text-gray-900">File Information</h1>
					<button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">
						← Back to Search
					</button>
				</div>

				{#if fileInfo}
					<div class="space-y-4 mb-8">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="p-4 bg-gray-50 rounded-lg">
								<label class="block text-sm font-medium text-gray-600 mb-1">File Number</label>
								<p class="text-lg font-semibold text-gray-900">{fileInfo.fileNumber}</p>
							</div>

							<div class="p-4 bg-gray-50 rounded-lg">
								<label class="block text-sm font-medium text-gray-600 mb-1">Class</label>
								<p class="text-lg font-semibold text-gray-900">{fileInfo.class}</p>
							</div>
						</div>

						<div class="p-4 bg-gray-50 rounded-lg">
							<label class="block text-sm font-medium text-gray-600 mb-1">Title</label>
							<p class="text-lg font-semibold text-gray-900">{fileInfo.fileTitle}</p>
						</div>

						<div class="p-4 bg-gray-50 rounded-lg">
							<label class="block text-sm font-medium text-gray-600 mb-1">Representation</label>
							{#if fileInfo.representationUrl}
								<img
									src={fileInfo.representationUrl}
									alt="Representation"
									class="w-64 h-64 object-contain rounded-lg border border-gray-300"
								/>
							{:else}
								<p class="text-lg font-semibold text-gray-500">No representation available</p>
							{/if}
						</div>

						<div class="p-4 bg-gray-50 rounded-lg">
							<label class="block text-sm font-medium text-gray-600 mb-1">Applicant Name</label>
							<p class="text-lg font-semibold text-gray-900">{fileInfo.applicantName}</p>
						</div>
					</div>

					<button
						on:click={handleProceed}
						class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
					>
						Proceed
					</button>
				{/if}
			</div>
		{:else if currentStep === 'form'}
			<!-- Form Page -->
			<div class="bg-white rounded-lg shadow-md p-8">
				<div class="mb-8 text-center">
					<img src={coatOfArms} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
					<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
					<h3 class="text-md">Commercial Law Department</h3>
				</div>
				<div class="flex items-center justify-between mb-6">
					<h1 class="text-2xl font-bold text-gray-900">File Opposition</h1>
					<button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">
						← Back to Results
					</button>
				</div>

				{#if fileInfo}
					<div class="mb-6 p-4 bg-blue-50 rounded-lg">
						<p class="text-sm text-blue-800">
							<strong>File:</strong>
							{fileInfo.fileNumber} - {fileInfo.fileTitle}
						</p>
					</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
								Full Name <span class="text-red-500">*</span>
							</label>
							<input
								id="name"
								type="text"
								bind:value={formData.name}
								placeholder="Enter your full name"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
								Phone Number
							</label>
							<input
								id="phone"
								type="tel"
								bind:value={formData.phone}
								placeholder="Enter your phone number"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isLoading}
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address <span class="text-red-500">*</span>
							</label>
							<input
								id="email"
								type="email"
								bind:value={formData.email}
								placeholder="Enter your email address"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label for="nationality" class="block text-sm font-medium text-gray-700 mb-2">
								Nationality
							</label>
							<select
								bind:value={formData.nationality}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
								required
							>
								<option value="" disabled selected>Select nationality</option>
								{#each Object.entries(countriesMap) as [code, name]}
									<option value={name}>{name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label for="address" class="block text-sm font-medium text-gray-700 mb-2">
							Address
						</label>
						<textarea
							id="address"
							bind:value={formData.address}
							rows="2"
							placeholder="Enter your full address"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
						></textarea>
					</div>

					<div>
						<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
							Reason for Opposition <span class="text-red-500">*</span>
						</label>
						<textarea
							id="reason"
							bind:value={formData.reason}
							rows="4"
							placeholder="Please provide detailed reasons for your opposition..."
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isLoading}
							required
						></textarea>
					</div>

					<div>
						<label for="file-upload" class="block text-sm font-medium text-gray-700 mb-2">
							Upload Supporting Documents
						</label>
						<input
							id="file-upload"
							type="file"
							multiple
							accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
							on:change={handleFileUpload}
							bind:this={fileInputElement}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							disabled={isLoading}
						/>
						<p class="mt-2 text-sm text-gray-500">
							Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum 10MB per file.
						</p>

						{#if formData.attachments && formData.attachments.length > 0}
							<div class="mt-3">
								<p class="text-sm font-medium text-gray-700">Selected files:</p>
								<ul class="mt-1 text-sm text-gray-600">
									{#each Array.from(formData.attachments) as file}
										<li>• {file.name} ({Math.round(file.size / 1024)} KB)</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>

					<button
						type="submit"
						disabled={isLoading ||
							!formData.name.trim() ||
							!formData.email.trim() ||
							!formData.reason.trim()}
						class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isLoading}
							<div class="flex items-center justify-center">
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
								Submitting...
							</div>
						{:else}
							Submit Opposition
						{/if}
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
