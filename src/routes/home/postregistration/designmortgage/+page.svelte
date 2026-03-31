<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { page } from '$app/stores';
	import { countriesMap } from '$lib/constants';
	import { mapDesignTypeToString } from '$lib/designutils';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';

	interface DesignMortgageData {
		mortgageDeeds: File[];
		supportingDocuments: File[];
	}

	interface NewMortgagorData {
		name: string;
		email: string;
		phone: string;
		nationality: string;
		address: string;
		city: string;
		state: string;
	}

	let formData: DesignMortgageData = { mortgageDeeds: [], supportingDocuments: [] };

	let newMortgagorData: NewMortgagorData = { name: '', email: '', phone: '', nationality: '', address: '', city: '', state: '' };

	let error: string | null = null;
	let cost: number | null = null;
	let paymentId: string | null = null;
	let fileId: string | null = null;
	let designTitle: string = '';
	let designType: string = '';
	let applicantName: string = '';
	let applicantEmail: string = '';
	let applicantPhone: string = '';
	let applicantAddress: string = '';
	let applicantNationality: string = '';
	let applicantCity: string = '';
	let applicantState: string = '';
	let isProcessing = false;
	let isLoading = false;
	let showExistingApplicationModal = false;

	onMount(async () => {
		if (!$loggedInUser) { await goto('/auth'); return; }
		const fileNumber = $page.url.searchParams.get('fileId') ?? '';
		const fileType = $page.url.searchParams.get('fileType') ?? '';
		await setData(fileNumber, fileType);
	});

	async function setData(fileNumber: string, fileType: string): Promise<void> {
		isLoading = true;
		try {
			const res = await fetch(`${baseURL}/api/files/GetDesignMortgageCost?fileId=${fileNumber}&fileType=${fileType}`);
			if (!res.ok) { error = 'Unable to retrieve cost info.'; return; }
			const response = await res.json();
			const data = response.data || response;
			if (data.hasExistingApplication) { showExistingApplicationModal = true; return; }
			cost = data.amount; paymentId = data.rrr; applicantName = data.applicantName;
			designTitle = data.fileTitle || data.titleOfDesign || ''; designType = mapDesignTypeToString(data.designType) || '';
			fileId = data.fileId; applicantEmail = data.applicantEmail; applicantPhone = data.applicantPhone;
			applicantAddress = data.applicantAddress || ''; applicantNationality = data.applicantNationality || '';
			applicantCity = data.applicantCity || ''; applicantState = data.applicantState || '';
		} catch (err) { error = 'Error fetching design mortgage cost.'; console.error(err); } finally { isLoading = false; }
	}

	function handleFileChange(event: Event, type: 'mortgageDeeds' | 'supportingDocuments') {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) { formData[type] = [...formData[type], ...Array.from(files)]; }
		target.value = '';
	}

	function removeFile(type: 'mortgageDeeds' | 'supportingDocuments', index: number) {
		formData[type] = formData[type].filter((_, i) => i !== index);
	}

	function validateForm(): boolean {
		if (formData.mortgageDeeds.length === 0) { error = 'Please upload at least one deed of mortgage document.'; return false; }
		if (formData.supportingDocuments.length === 0) { error = 'Please upload at least one supporting document.'; return false; }
		if (!newMortgagorData.name.trim()) { error = 'Please enter new mortgagor name.'; return false; }
		if (!newMortgagorData.email.trim()) { error = 'Please enter new mortgagor email.'; return false; }
		if (!newMortgagorData.phone.trim()) { error = 'Please enter new mortgagor phone number.'; return false; }
		if (!newMortgagorData.nationality.trim()) { error = 'Please select new mortgagor nationality.'; return false; }
		if (!newMortgagorData.address.trim()) { error = 'Please enter new mortgagor address.'; return false; }
		if (!newMortgagorData.city.trim()) { error = 'Please enter new mortgagor city.'; return false; }
		if (!newMortgagorData.state.trim()) { error = 'Please enter new mortgagor state.'; return false; }
		error = null; return true;
	}

	async function convertToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1]); };
			reader.onerror = (error) => reject(error);
		});
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		isProcessing = true;
		try {
			const mortgageDeedData = [];
			for (const file of formData.mortgageDeeds) {
				const base64Data = await convertToBase64(file);
				mortgageDeedData.push({ fileName: file.name, contentType: file.type, data: base64Data, name: 'DeedofMortgage' });
			}
			const supportingDocsData = [];
			for (const file of formData.supportingDocuments) {
				const base64Data = await convertToBase64(file);
				supportingDocsData.push({ fileName: file.name, contentType: file.type, data: base64Data, name: 'DesignMortgageSupportingDocuments' });
			}
			const now = new Date();
			const payload = {
				fileId, rrr: paymentId, mortgageDate: now.toISOString(), mortgageRequestDate: now.toISOString(),
				Deedofmortgage: mortgageDeedData, DesignMortgageSupportingDocuments: supportingDocsData,
				oldMortgageeName: applicantName, oldMortgageeEmail: applicantEmail, oldMortgageePhone: applicantPhone,
				oldMortgageeAddress: applicantAddress, oldMortgageeNationality: applicantNationality,
				oldMortgageeCity: applicantCity, oldMortgageeState: applicantState,
				newMortgagorName: newMortgagorData.name, newMortgagorEmail: newMortgagorData.email, newMortgagorPhone: newMortgagorData.phone,
				newMortgagorAddress: newMortgagorData.address, newMortgagorNationality: newMortgagorData.nationality,
				newMortgagorCity: newMortgagorData.city, newMortgagorState: newMortgagorData.state
			};
			sessionStorage.setItem('designMortgagePayload', JSON.stringify(payload));
			sessionStorage.setItem('designMortgageFormData', JSON.stringify({
				mortgageDeeds: formData.mortgageDeeds.map(f => f.name), supportingDocuments: formData.supportingDocuments.map(f => f.name),
				designTitle, applicantName, applicantEmail
			}));
			await handlePayment();
		} catch (err) { error = 'Form processing failed. Please try again.'; console.error(err); } finally { isProcessing = false; }
	}

	async function handlePayment() {
		if (cost && paymentId) { await goto(`/payment/?type=designmortgage&rrr=${paymentId}&amount=${cost}&fileId=${fileId}`); }
	}

	function goBack() { window.history.back(); }
	function goToDashboard() { goto('/home/dashboard'); }
</script>

<div class="min-h-screen py-4 px-4">
	<div class="w-full mx-auto">
		<div class="flex items-center">
			<Button variant="outline" on:click={goBack} class="flex items-center gap-2"><Icon icon="lucide:arrow-left" width="1rem" height="1rem" /> Back</Button>
			<div class="flex-1 flex flex-col items-center justify-center">
				<h1 class="text-xl font-bold">Design Mortgage Application</h1>
				<p class="font-light">Submit mortgage documentation for design mortgage</p>
			</div>
		</div>

		<div class="px-6 py-6">
			{#if error}<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"><p class="text-sm text-red-700">{error}</p></div>{/if}

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">MORTGAGE FORM</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Design Information...</span></div></div>
				{:else}
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div><label for="fileNumber" class="block text-sm font-medium text-gray-700 mb-1">File Number:</label><input id="fileNumber" type="text" value={fileId || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label for="designType" class="block text-sm font-medium text-gray-700 mb-1">Design Type:</label><input id="designType" type="text" value={designType} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title of Design:</label><input id="title" type="text" value={designTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
					</div>
				{/if}
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">MORTGAGEE INFORMATION</div>
				{#if isLoading}
					<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Mortgagee Information...</span></div></div>
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
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">MORTGAGOR INFORMATION</div>
				<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div><label class="block text-sm font-medium text-gray-700 mb-1">Name: <span class="text-red-500">*</span></label><input type="text" bind:value={newMortgagorData.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor name" required /></div>
					<div><label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label><input type="email" bind:value={newMortgagorData.email} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor email" required /></div>
					<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone Number: <span class="text-red-500">*</span></label><input type="tel" bind:value={newMortgagorData.phone} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor phone number" required /></div>
					<div><label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label><select bind:value={newMortgagorData.nationality} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" required><option value="" disabled selected>Select nationality</option>{#each Object.entries(countriesMap) as [code, name]}<option value={name}>{name}</option>{/each}</select></div>
					<div><label class="block text-sm font-medium text-gray-700 mb-1">City: <span class="text-red-500">*</span></label><input type="text" bind:value={newMortgagorData.city} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor city" required /></div>
					<div><label class="block text-sm font-medium text-gray-700 mb-1">State: <span class="text-red-500">*</span></label><input type="text" bind:value={newMortgagorData.state} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor state" required /></div>
					<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label><textarea bind:value={newMortgagorData.address} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new mortgagor full address" rows="3" required></textarea></div>
				</div>
			</div>

			<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-gray-300 px-4 py-2 font-medium text-black">DOCUMENT UPLOADS</div>
				<div class="p-4 space-y-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Deed of Mortgage: <span class="text-red-500">*</span></label>
						<div class="flex items-center mb-3"><input type="file" accept=".pdf,.doc,.docx" on:change={(e) => handleFileChange(e, 'mortgageDeeds')} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" multiple /></div>
						{#if formData.mortgageDeeds.length > 0}<div class="space-y-2"><p class="text-sm text-gray-600">Uploaded files:</p>{#each formData.mortgageDeeds as file, index}<div class="flex items-center gap-2"><input class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100" value={file.name} readonly /><button type="button" class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors" on:click={() => { const url = URL.createObjectURL(file); window.open(url, '_blank'); }} title="View file"><svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button><button type="button" class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" on:click={() => removeFile('mortgageDeeds', index)}>Remove</button></div>{/each}</div>{/if}
						<p class="text-xs text-gray-500">Upload the signed deed of mortgage documents (PDF, DOC, or DOCX format)</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Other Supporting Documents: <span class="text-red-500">*</span></label>
						<div class="flex items-center mb-3"><input type="file" accept=".pdf,.doc,.docx" on:change={(e) => handleFileChange(e, 'supportingDocuments')} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" multiple /></div>
						{#if formData.supportingDocuments.length > 0}<div class="space-y-2"><p class="text-sm text-gray-600">Uploaded files:</p>{#each formData.supportingDocuments as file, index}<div class="flex items-center gap-2"><input class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100" value={file.name} readonly /><button type="button" class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors" on:click={() => { const url = URL.createObjectURL(file); window.open(url, '_blank'); }} title="View file"><svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button><button type="button" class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" on:click={() => removeFile('supportingDocuments', index)}>Remove</button></div>{/each}</div>{/if}
						<p class="text-xs text-gray-500">Upload any additional supporting documents (authorization letters, corporate resolutions, etc.)</p>
					</div>
				</div>
			</div>

			<div class="flex justify-end">
				{#if cost !== null}<button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>{#if isProcessing}<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...{:else}Proceed To Pay{/if}</button>{:else}<button class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>Loading...</button>{/if}
			</div>
		</div>
	</div>

	<Dialog.Root bind:open={showExistingApplicationModal}>
		<Dialog.Content class="w-11/12 max-w-md mx-auto">
			<Dialog.Header><Dialog.Title class="text-xl font-bold text-red-600 flex items-center gap-2"><Icon icon="mdi:alert-circle" width="1.5em" height="1.5em" />Application Already Exists</Dialog.Title></Dialog.Header>
			<div class="py-4"><p class="text-gray-700">A design mortgage application has already been submitted for this file. You cannot create multiple mortgage applications for the same design.</p></div>
			<Dialog.Footer class="flex gap-3 justify-end"><Button variant="outline" on:click={() => showExistingApplicationModal = false}>Close</Button><Button on:click={goToDashboard} class="bg-blue-600 hover:bg-blue-700">Go to Dashboard</Button></Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
