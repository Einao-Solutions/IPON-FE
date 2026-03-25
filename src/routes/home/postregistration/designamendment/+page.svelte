<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { countriesMap } from '$lib/constants';
	import { baseURL } from '$lib/helpers';

	interface ApplicantInfo {
		id: string;
		name: string;
		address: string;
		email: string;
		phone: string;
		nationality: string;
		country: string;
		state: string;
		city: string;
	}

	interface DesignFileInfo {
		fileId: string;
		fileStatus: number;
		paymentRRR: string;
		cost: number;
		updateType: string;
		fileOrigin: string;
		fileTitle: string;
		applicants: ApplicantInfo[];
		correspondenceName: string;
		correspondenceAddress: string;
		correspondencePhone: string;
		correspondenceEmail: string;
		correspondenceState: string;
		correspondenceNationality: string;
		fileType: number;
	}

	let pageData = $page;
	let fileInfo: DesignFileInfo = {
		fileId: '', fileStatus: 0, paymentRRR: '', cost: 0, updateType: '', fileOrigin: '',
		fileTitle: '', applicants: [], correspondenceName: '', correspondenceAddress: '',
		correspondencePhone: '', correspondenceEmail: '', correspondenceState: '',
		correspondenceNationality: '', fileType: 0
	};

	let newApplicantNames: string[] = [];
	let newApplicantAddresses: string[] = [];
	let newApplicantEmails: string[] = [];
	let newApplicantPhones: string[] = [];
	let newApplicantNationalities: string[] = [];
	let newApplicantStates: string[] = [];
	let newApplicantCities: string[] = [];
	let newFileTitle = '';

	let correspondenceName = '';
	let correspondenceAddress = '';
	let correspondencePhone = '';
	let correspondenceEmail = '';
	let correspondenceState = '';
	let correspondenceNationality = '';

	let updateType = '';
	let isLoading = true;
	let isProcessing = false;
	let error: string | null = null;
	let formTitle = 'Design Amendment';

	let showNameSection = false;
	let showAddressSection = false;
	let showTitleSection = false;
	let showAddApplicantSection = false;
	let showCorrespondenceSection = false;

	let newApplicants: ApplicantInfo[] = [];
	let selectedRemoveIds: string[] = [];

	async function setData() {
		isLoading = true;
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
		const fileType = pageData.url.searchParams.get('fileType') ?? '';
		updateType = pageData.url.searchParams.get('updateType') ?? '';
		const updateTypeNum = parseInt(updateType);

		switch (updateTypeNum) {
			case 4: formTitle = 'Amendment: Update Applicant Name'; showNameSection = true; break;
			case 5: formTitle = 'Amendment: Update Applicant Address'; showAddressSection = true; break;
			case 7: formTitle = 'Amendment: Update Title of Design'; showTitleSection = true; break;
			case 10: formTitle = 'Amendment: Add or Remove Applicants'; showAddApplicantSection = true; break;
			case 0: formTitle = 'Amendment: Update Correspondence Information'; showCorrespondenceSection = true; break;
		}

		try {
			const response = await fetch(`${baseURL}/api/files/GetDesignAmendmentCost?fileId=${fileNumber}&fileType=${fileType}&updateType=${updateType}`);
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			const result = await response.json();

			if (result.success) {
				fileInfo = {
					fileId: result.data.fileId || '', fileStatus: result.data.fileStatus || 0,
					paymentRRR: result.data.rrr || '', cost: parseFloat(result.data.amount) || 0,
					updateType: result.data.updateType || updateType, fileOrigin: result.data.fileOrigin || '',
					fileTitle: result.data.titleOfDesign || result.data.fileTitle || '',
					applicants: result.data.applicants || [],
					correspondenceName: result.data.correspondence?.name || '',
					correspondenceAddress: result.data.correspondence?.address || '',
					correspondencePhone: result.data.correspondence?.phone || '',
					correspondenceEmail: result.data.correspondence?.email || '',
					correspondenceState: result.data.correspondence?.state || '',
					correspondenceNationality: result.data.correspondence?.nationality || '',
					fileType: result.data.fileType || 0
				};

				if (fileInfo.applicants.length > 0) {
					newApplicantNames = fileInfo.applicants.map(a => a.name);
					newApplicantAddresses = fileInfo.applicants.map(a => a.address);
					newApplicantEmails = fileInfo.applicants.map(a => a.email);
					newApplicantPhones = fileInfo.applicants.map(a => a.phone);
					newApplicantNationalities = fileInfo.applicants.map(a => a.country);
					newApplicantStates = fileInfo.applicants.map(a => a.state);
					newApplicantCities = fileInfo.applicants.map(a => a.city);
				}

				newFileTitle = fileInfo.fileTitle;
				correspondenceName = fileInfo.correspondenceName;
				correspondenceAddress = fileInfo.correspondenceAddress;
				correspondencePhone = fileInfo.correspondencePhone;
				correspondenceEmail = fileInfo.correspondenceEmail;
				correspondenceState = fileInfo.correspondenceState;
				correspondenceNationality = fileInfo.correspondenceNationality;
			} else {
				error = result.message || 'Failed to load data';
			}
		} catch (err) { error = 'An error occurred while loading data'; console.error(err); } finally { isLoading = false; }
	}

	onMount(async () => { await setData(); });

	function addApplicantForm() {
		newApplicants = [...newApplicants, { id: '', name: '', address: '', email: '', phone: '', nationality: '', country: '', state: '', city: '' }];
	}

	function removeApplicantForm(index: number) {
		newApplicants = newApplicants.filter((_, i) => i !== index);
	}

	function toggleApplicantRemoval(applicantId: string) {
		if (selectedRemoveIds.includes(applicantId)) { selectedRemoveIds = selectedRemoveIds.filter(id => id !== applicantId); }
		else { selectedRemoveIds = [...selectedRemoveIds, applicantId]; }
	}

	function validateForm(): boolean {
		if (showNameSection && newApplicantNames.some(n => !n.trim())) { error = 'Please enter the new name for all applicants.'; return false; }
		if (showAddressSection && (newApplicantAddresses.some(a => !a.trim()) || newApplicantEmails.some(e => !e.trim()) || newApplicantPhones.some(p => !p.trim()) || newApplicantNationalities.some(n => !n.trim()) || newApplicantStates.some(s => !s.trim()) || newApplicantCities.some(c => !c.trim()))) { error = 'Please fill all address fields for each applicant.'; return false; }
		if (showTitleSection && !newFileTitle?.trim()) { error = 'Please enter the new Title of Design.'; return false; }
		if (showCorrespondenceSection && (!correspondenceName?.trim() || !correspondenceAddress?.trim() || !correspondencePhone?.trim() || !correspondenceEmail?.trim() || !correspondenceState?.trim() || !correspondenceNationality?.trim())) { error = 'Please fill all correspondence fields.'; return false; }
		error = null; return true;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		isProcessing = true;
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
		const updateTypeNum = parseInt(updateType);
		try {
			const formObj: Record<string, any> = { FileId: fileNumber, UpdateType: updateTypeNum, FileType: fileInfo.fileType ?? 0, PaymentRRR: fileInfo.paymentRRR ?? '' };

			if (updateTypeNum === 10) {
				const editedApplicants = fileInfo.applicants.filter(a => !selectedRemoveIds.includes(a.id));
				formObj.EditedApplicants = editedApplicants;
				if (newApplicants.length > 0) formObj.NewApplicants = newApplicants;
				if (selectedRemoveIds.length > 0) formObj.RemoveApplicantIds = selectedRemoveIds;
			}
			if (updateTypeNum === 4) formObj.ApplicantNames = newApplicantNames;
			if (updateTypeNum === 5) {
				formObj.ApplicantAddresses = newApplicantAddresses; formObj.ApplicantEmails = newApplicantEmails;
				formObj.ApplicantPhones = newApplicantPhones; formObj.ApplicantNationalities = newApplicantNationalities;
				formObj.ApplicantStates = newApplicantStates; formObj.ApplicantCities = newApplicantCities;
			}
			if (updateTypeNum === 7) formObj.FileTitle = newFileTitle;
			if (updateTypeNum === 0) {
				formObj.CorrespondenceName = correspondenceName; formObj.CorrespondenceAddress = correspondenceAddress;
				formObj.CorrespondencePhone = correspondencePhone; formObj.CorrespondenceEmail = correspondenceEmail;
				formObj.CorrespondenceState = correspondenceState; formObj.CorrespondenceNationality = correspondenceNationality;
			}

			sessionStorage.setItem('designAmendmentPayload', JSON.stringify(formObj));
			await goto(`/payment/?type=designamendment&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}&fileId=${fileNumber}`);
		} catch (err) { error = 'Form processing failed. Please try again.'; console.error(err); } finally { isProcessing = false; }
	}

	function goBack() { window.history.back(); }
</script>

<div class="min-h-screen py-4 px-4">
	<div class="w-full mx-auto">
		<div class="flex items-center mb-6">
			<Button variant="outline" on:click={goBack} class="flex items-center gap-2"><Icon icon="lucide:arrow-left" width="1rem" height="1rem" /> Back</Button>
			<div class="flex-1 flex flex-col items-center justify-center">
				<h1 class="text-xl font-bold">{formTitle}</h1>
				<p class="font-light">Submit amendment for your design application</p>
			</div>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center p-12"><div class="flex flex-col items-center gap-2"><Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" /><span class="text-sm text-gray-500">Loading Design Information...</span></div></div>
		{:else}
			<div class="px-6 py-6">
				{#if error}<div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"><p class="text-sm text-red-700">{error}</p></div>{/if}

				<!-- Design Information -->
				<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
					<div class="bg-gray-300 px-4 py-2 font-medium text-black">DESIGN INFORMATION</div>
					<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Number:</label><input type="text" value={fileInfo.fileId} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">File Origin:</label><input type="text" value={fileInfo.fileOrigin} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Title of Design:</label><input type="text" value={fileInfo.fileTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Cost:</label><input type="text" value="₦{fileInfo.cost.toLocaleString()}" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div><label class="block text-sm font-medium text-gray-700 mb-1">RRR:</label><input type="text" value={fileInfo.paymentRRR} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
					</div>
				</div>

				<!-- Name Section -->
				{#if showNameSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black">UPDATE APPLICANT NAME</div>
						<div class="p-4 space-y-4">
							{#each fileInfo.applicants as applicant, index}
								<div class="border p-4 rounded-lg">
									<p class="text-sm text-gray-500 mb-2">Applicant {index + 1} - Current: <strong>{applicant.name}</strong></p>
									<label class="block text-sm font-medium text-gray-700 mb-1">New Name: <span class="text-red-500">*</span></label>
									<input type="text" bind:value={newApplicantNames[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new name" />
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Address Section -->
				{#if showAddressSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black">UPDATE APPLICANT ADDRESS</div>
						<div class="p-4 space-y-4">
							{#each fileInfo.applicants as applicant, index}
								<div class="border p-4 rounded-lg">
									<p class="text-sm text-gray-500 mb-2">Applicant {index + 1}: <strong>{applicant.name}</strong></p>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label><input type="text" bind:value={newApplicantAddresses[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label><input type="email" bind:value={newApplicantEmails[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone: <span class="text-red-500">*</span></label><input type="tel" bind:value={newApplicantPhones[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label><select bind:value={newApplicantNationalities[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"><option value="" disabled>Select</option>{#each Object.entries(countriesMap) as [code, name]}<option value={name}>{name}</option>{/each}</select></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">State: <span class="text-red-500">*</span></label><input type="text" bind:value={newApplicantStates[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">City: <span class="text-red-500">*</span></label><input type="text" bind:value={newApplicantCities[index]} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Title Section -->
				{#if showTitleSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black">UPDATE TITLE OF DESIGN</div>
						<div class="p-4">
							<label class="block text-sm font-medium text-gray-700 mb-1">New Title of Design: <span class="text-red-500">*</span></label>
							<input type="text" bind:value={newFileTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new title" />
						</div>
					</div>
				{/if}

				<!-- Add/Remove Applicants Section -->
				{#if showAddApplicantSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black">CURRENT APPLICANTS</div>
						<div class="p-4 space-y-3">
							{#each fileInfo.applicants as applicant}
								<div class="flex items-center gap-3 border p-3 rounded-lg {selectedRemoveIds.includes(applicant.id) ? 'bg-red-50 border-red-300' : ''}">
									<input type="checkbox" checked={selectedRemoveIds.includes(applicant.id)} on:change={() => toggleApplicantRemoval(applicant.id)} class="w-5 h-5 text-red-600" />
									<div class="flex-1"><p class="font-medium">{applicant.name}</p><p class="text-sm text-gray-500">{applicant.email} | {applicant.phone}</p></div>
									{#if selectedRemoveIds.includes(applicant.id)}<span class="text-xs text-red-600 font-medium">Marked for removal</span>{/if}
								</div>
							{/each}
						</div>
					</div>

					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black flex justify-between items-center">
							<span>NEW APPLICANTS</span>
							<button type="button" class="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700" on:click={addApplicantForm}>+ Add Applicant</button>
						</div>
						<div class="p-4 space-y-4">
							{#each newApplicants as applicant, index}
								<div class="border p-4 rounded-lg relative">
									<button type="button" class="absolute top-2 right-2 text-red-600 hover:text-red-800" on:click={() => removeApplicantForm(index)}>
										<Icon icon="mdi:close-circle" width="1.2em" height="1.2em" />
									</button>
									<p class="text-sm font-semibold mb-3">New Applicant {index + 1}</p>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Name: <span class="text-red-500">*</span></label><input type="text" bind:value={applicant.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label><input type="email" bind:value={applicant.email} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone: <span class="text-red-500">*</span></label><input type="tel" bind:value={applicant.phone} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label><select bind:value={applicant.nationality} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"><option value="" disabled>Select</option>{#each Object.entries(countriesMap) as [code, name]}<option value={name}>{name}</option>{/each}</select></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">State: <span class="text-red-500">*</span></label><input type="text" bind:value={applicant.state} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div><label class="block text-sm font-medium text-gray-700 mb-1">City: <span class="text-red-500">*</span></label><input type="text" bind:value={applicant.city} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
										<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label><textarea bind:value={applicant.address} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" rows="2"></textarea></div>
									</div>
								</div>
							{/each}
							{#if newApplicants.length === 0}<p class="text-gray-500 text-sm text-center py-4">No new applicants added. Click "+ Add Applicant" to add one.</p>{/if}
						</div>
					</div>
				{/if}

				<!-- Correspondence Section -->
				{#if showCorrespondenceSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black">UPDATE CORRESPONDENCE INFORMATION</div>
						<div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
							<div><label class="block text-sm font-medium text-gray-700 mb-1">Name: <span class="text-red-500">*</span></label><input type="text" bind:value={correspondenceName} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
							<div><label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label><input type="email" bind:value={correspondenceEmail} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
							<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone: <span class="text-red-500">*</span></label><input type="tel" bind:value={correspondencePhone} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
							<div><label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label><select bind:value={correspondenceNationality} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"><option value="" disabled>Select</option>{#each Object.entries(countriesMap) as [code, name]}<option value={name}>{name}</option>{/each}</select></div>
							<div><label class="block text-sm font-medium text-gray-700 mb-1">State: <span class="text-red-500">*</span></label><input type="text" bind:value={correspondenceState} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" /></div>
							<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label><textarea bind:value={correspondenceAddress} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" rows="3"></textarea></div>
						</div>
					</div>
				{/if}

				<!-- Submit -->
				<div class="flex justify-end">
					<button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>
						{#if isProcessing}<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...{:else}Proceed To Pay{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
