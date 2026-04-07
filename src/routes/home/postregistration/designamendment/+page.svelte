<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { countriesMap } from '$lib/constants';
	import { baseURL, ClericalUpdateTypes } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { mapDesignTypeToString } from '$lib/designutils';

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

	interface DesignAttachment {
		url: string;
		name: string;
	}

	interface DesignCreatorInfo {
		id: string;
		name: string;
		email: string;
		phone: string;
		address: string;
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
		titleOfDesign: string;
		statementOfNovelty: string;
		designType: number | null;
		designCreators: DesignCreatorInfo[];
		attachments: string[];
	}

	let pageData = $page;
	let fileInfo: DesignFileInfo = {
		fileId: '', fileStatus: 0, paymentRRR: '', cost: 0, updateType: '', fileOrigin: '',
		fileTitle: '', applicants: [], correspondenceName: '', correspondenceAddress: '',
		correspondencePhone: '', correspondenceEmail: '', correspondenceState: '',
		correspondenceNationality: '', fileType: 0,
		titleOfDesign: '', statementOfNovelty: '', designType: null, designCreators: [], attachments: []
	};

	let newApplicantNames: string[] = [];
	let newApplicantAddresses: string[] = [];
	let newApplicantEmails: string[] = [];
	let newApplicantPhones: string[] = [];
	let newApplicantNationalities: string[] = [];
	let newApplicantStates: string[] = [];
	let newApplicantCities: string[] = [];

	let correspondenceName = '';
	let correspondenceAddress = '';
	let correspondencePhone = '';
	let correspondenceEmail = '';
	let correspondenceState = '';
	let correspondenceNationality = '';

	// Design Information
	let newTitleOfDesign = '';
	let newNoveltyStatement = '';
	let newDesignType: string | null = null;

	// Creator Information
	let designCreators: DesignCreatorInfo[] = [];

	// Design Attachments
	let existingAttachments: DesignAttachment[] = [];
	let removedAttachments: DesignAttachment[] = [];
	let newAttachmentFiles: File[] = [];

	let updateType = '';
	let isLoading = true;
	let isProcessing = false;
	let error: string | null = null;
	let formTitle = 'Design Amendment';

	let showNameSection = false;
	let showAddressSection = false;
	let showCorrespondenceSection = false;
	let showDesignInfoSection = false;
	let showCreatorInfoSection = false;
	let showAttachmentsSection = false;

	let newApplicants: ApplicantInfo[] = [];
	let selectedRemoveIds: string[] = [];

	async function setData() {
		isLoading = true;
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
		const fileType = pageData.url.searchParams.get('fileType') ?? '';
		updateType = pageData.url.searchParams.get('updateType') ?? '';
		const updateTypeNum = parseInt(updateType);

		switch (updateTypeNum) {
			case ClericalUpdateTypes.ApplicantName: formTitle = 'Amendment: Update Applicant Name'; showNameSection = true; break;
			case ClericalUpdateTypes.ApplicantAddress: formTitle = 'Amendment: Update Applicant Address'; showAddressSection = true; break;
			case ClericalUpdateTypes.DesignInformation: formTitle = 'Amendment: Update Design Information'; showDesignInfoSection = true; break;
			case ClericalUpdateTypes.CreatorInformation: formTitle = 'Amendment: Update Creator Information'; showCreatorInfoSection = true; break;
			case ClericalUpdateTypes.CorrespondenceInformation: formTitle = 'Amendment: Update Correspondence Information'; showCorrespondenceSection = true; break;
			case ClericalUpdateTypes.DesignAttachments: formTitle = 'Amendment: Update Design Attachments'; showAttachmentsSection = true; break;
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
					fileType: result.data.fileType || 0,
					titleOfDesign: result.data.titleOfDesign || result.data.fileTitle || '',
					statementOfNovelty: result.data.statementOfNovelty || '',
					designType: result.data.designType ?? null,
					designCreators: result.data.designCreators || [],
					attachments: result.data.attachments || []
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

				correspondenceName = fileInfo.correspondenceName;
				correspondenceAddress = fileInfo.correspondenceAddress;
				correspondencePhone = fileInfo.correspondencePhone;
				correspondenceEmail = fileInfo.correspondenceEmail;
				correspondenceState = fileInfo.correspondenceState;
				correspondenceNationality = fileInfo.correspondenceNationality;
				newTitleOfDesign = fileInfo.titleOfDesign;
				newNoveltyStatement = fileInfo.statementOfNovelty;
				newDesignType = fileInfo.designType === 0 ? 'Textile' : fileInfo.designType === 1 ? 'NonTextile' : null;
				designCreators = fileInfo.designCreators.map(c => ({ ...c }));
				existingAttachments = (fileInfo.attachments || []).map((a: any) => {
					if (typeof a === 'string') return { url: a, name: a.split('/').pop()?.split('?')[0] || 'Attachment' };
					return { url: a.url || a.fileUrl || '', name: a.name || a.fileName || a.url?.split('/').pop()?.split('?')[0] || 'Attachment' };
				}).filter(a => a.url);
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

	function addCreator() {
		designCreators = [...designCreators, { id: '', name: '', email: '', phone: '', address: '', country: '', state: '', city: '' }];
	}

	function removeCreator(index: number) {
		designCreators = designCreators.filter((_, i) => i !== index);
	}

	const allowedAttachmentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

	function handleAddAttachments(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		const invalid = files.find(f => !allowedAttachmentTypes.includes(f.type) || f.size > 10 * 1024 * 1024);
		if (invalid) { error = 'Only image, PDF, or Word files up to 10MB are allowed.'; return; }
		newAttachmentFiles = [...newAttachmentFiles, ...files];
		input.value = '';
	}

	function removeNewAttachment(index: number) {
		newAttachmentFiles = newAttachmentFiles.filter((_, i) => i !== index);
	}

	function removeExistingAttachment(index: number) {
		const attachment = existingAttachments[index];
		if (!attachment) return;
		removedAttachments = [...removedAttachments, attachment];
		existingAttachments = existingAttachments.filter((_, i) => i !== index);
	}

	function undoRemoveAttachment(attachment: DesignAttachment) {
		removedAttachments = removedAttachments.filter(a => a.url !== attachment.url);
		existingAttachments = [...existingAttachments, attachment];
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise(resolve => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.readAsDataURL(file);
		});
	}

	function validateForm(): boolean {
		if (showNameSection && newApplicantNames.some(n => !n.trim())) { error = 'Please enter the new name for all applicants.'; return false; }
		if (showAddressSection && (newApplicantAddresses.some(a => !a.trim()) || newApplicantEmails.some(e => !e.trim()) || newApplicantPhones.some(p => !p.trim()) || newApplicantNationalities.some(n => !n.trim()) || newApplicantStates.some(s => !s.trim()) || newApplicantCities.some(c => !c.trim()))) { error = 'Please fill all address fields for each applicant.'; return false; }
		if (showDesignInfoSection && !newTitleOfDesign?.trim()) { error = 'Please enter the new Title of Design.'; return false; }
		if (showDesignInfoSection && !newNoveltyStatement?.trim()) { error = 'Please enter the new Statement of Novelty.'; return false; }
		if (showDesignInfoSection && !newDesignType) { error = 'Please select the new Design Type.'; return false; }
		if (showCreatorInfoSection && designCreators.length === 0) { error = 'Please add at least one creator.'; return false; }
		if (showCreatorInfoSection && designCreators.some(c => !c.name.trim())) { error = 'Each creator must have a name.'; return false; }
		if (showCreatorInfoSection && designCreators.some(c => !c.email.trim())) { error = 'Each creator must have an email address.'; return false; }
		if (showCorrespondenceSection && (!correspondenceName?.trim() || !correspondenceAddress?.trim() || !correspondencePhone?.trim() || !correspondenceEmail?.trim() || !correspondenceState?.trim() || !correspondenceNationality?.trim())) { error = 'Please fill all correspondence fields.'; return false; }
			if (showAttachmentsSection && existingAttachments.length === 0 && removedAttachments.length > 0 && newAttachmentFiles.length === 0) { error = 'Please keep at least one attachment or add a new one.'; return false; }
		error = null; return true;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		isProcessing = true;
		const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
		const updateTypeNum = parseInt(updateType);
		try {
			const formObj: Record<string, any> = { FileId: fileNumber, UpdateType: updateTypeNum, FileType: fileInfo.fileType ?? 0, PaymentRRR: fileInfo.paymentRRR ?? '' };

			if (updateTypeNum === ClericalUpdateTypes.ApplicantName) {
				formObj.ApplicantNames = newApplicantNames;
			}
			if (updateTypeNum === ClericalUpdateTypes.ApplicantAddress) {
				formObj.ApplicantAddresses = newApplicantAddresses; formObj.ApplicantEmails = newApplicantEmails;
				formObj.ApplicantPhones = newApplicantPhones; formObj.ApplicantNationalities = newApplicantNationalities;
				formObj.ApplicantStates = newApplicantStates; formObj.ApplicantCities = newApplicantCities;
			}
			if (updateTypeNum === ClericalUpdateTypes.DesignInformation) {
				formObj.UpdateType = 'DesignTitle';
				formObj.DesignTitle = newTitleOfDesign;
				formObj.StatementOfNovelty = newNoveltyStatement;
				formObj.DesignType = newDesignType;
			}
			if (updateTypeNum === ClericalUpdateTypes.CreatorInformation) {
				formObj.UpdateType = 'CreatorInformation';
				formObj.DesignCreators = designCreators.map(c => ({
					id: c.id,
					Name: c.name,
					Email: c.email,
					Phone: c.phone,
					Address: c.address,
					country: c.country,
					State: c.state,
					city: c.city
				}));
			}
			if (updateTypeNum === ClericalUpdateTypes.CorrespondenceInformation) {
				formObj.UpdateType = 'CorrespondenceInformation';
				formObj.CorrespondenceName = correspondenceName; formObj.CorrespondenceAddress = correspondenceAddress;
				formObj.CorrespondencePhone = correspondencePhone; formObj.CorrespondenceEmail = correspondenceEmail;
				formObj.CorrespondenceState = correspondenceState; formObj.CorrespondenceNationality = correspondenceNationality;
			}
			if (updateTypeNum === ClericalUpdateTypes.DesignAttachments) {
				formObj.UpdateType = 'DesignAttachments';
				formObj.RemoveDesignAttachmentUrls = removedAttachments.map(a => a.url);
				const base64Files = await Promise.all(
					newAttachmentFiles.map(async f => ({ name: f.name, type: f.type, data: await fileToBase64(f) }))
				);
				formObj.NewDesignAttachments = base64Files;
			}

			formObj.UserId = $loggedInUser?.id || null;

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
						<div><label class="block text-sm font-medium text-gray-700 mb-1">Design Type:</label><input type="text" value={mapDesignTypeToString(fileInfo.fileType)} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
						<div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Title of Design:</label><input type="text" value={fileInfo.fileTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled /></div>
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

				<!-- Design Information Section -->
				{#if showDesignInfoSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-green-300 px-4 py-2 font-medium text-black">UPDATE DESIGN INFORMATION</div>
						<div class="p-4 grid grid-cols-1 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Current Title of Design:</label>
								<p class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">{fileInfo.titleOfDesign || 'N/A'}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">New Title of Design: <span class="text-red-500">*</span></label>
								<input type="text" bind:value={newTitleOfDesign} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new title of design" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Current Design Type:</label>
								<p class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">{fileInfo.designType === 0 ? 'Textile' : fileInfo.designType === 1 ? 'Non-Textile' : 'N/A'}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">New Design Type:</label>
								<select bind:value={newDesignType} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
									<option value={null} disabled>Select design type</option>
								<option value="Textile">Textile</option>
								<option value="NonTextile">Non-Textile</option>
								</select>
							</div>
						<div>								<label class="block text-sm font-medium text-gray-700 mb-1">Current Statement of Novelty:</label>
								<p class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">{fileInfo.statementOfNovelty || 'N/A'}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">New Statement of Novelty:</label>
								<textarea bind:value={newNoveltyStatement} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" placeholder="Enter new statement of novelty"></textarea>
							</div>
						</div>
					</div>
				{/if}

				<!-- Creator Information Section -->
				{#if showCreatorInfoSection}
					<div class="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200">
						<div class="bg-blue-100 px-6 py-4 flex justify-between items-center">
							<span class="text-sm font-semibold tracking-widest text-blue-900 uppercase">Creator(s) Information</span>
							<button on:click={addCreator} class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
								<span class="text-lg leading-none">+</span> Add Creator
							</button>
						</div>
						<div class="bg-slate-50 p-5 space-y-4">
							{#if fileInfo.designCreators.length > 0}
								<div class="mb-3 p-4 border border-slate-200 rounded-lg bg-white">
									<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Creators (Reference)</p>
									{#each fileInfo.designCreators as c, i}
										<p class="text-sm text-slate-600 mb-1"><span class="font-medium">{i + 1}. {c.name || 'N/A'}</span> · {c.email || 'N/A'} · {c.phone || 'N/A'}</p>
									{/each}
								</div>
							{/if}
							{#each designCreators as creator, index}
								<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
									<div class="flex items-center justify-between px-5 py-3 bg-slate-100 border-b border-slate-200">
										<span class="text-sm font-semibold text-slate-700">{creator.name || `Creator ${index + 1}`}</span>
										<button on:click={() => removeCreator(index)} class="text-xs font-medium text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all">Remove</button>
									</div>
									<div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name <span class="text-red-500">*</span></label><input type="text" bind:value={creator.name} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. John Doe" /></div>
										<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label><input type="email" bind:value={creator.email} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. john@example.com" /></div>
										<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label><input type="text" bind:value={creator.phone} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. +234 801 234 5678" /></div>
										<div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Address</label><input type="text" bind:value={creator.address} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. 12 Main Street, Lagos" /></div>
										<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nationality</label><select bind:value={creator.country} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="">Select country</option>{#each Object.entries(countriesMap) as [code, cname]}<option value={code}>{cname}</option>{/each}</select></div>									<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">State</label><input type="text" bind:value={creator.state} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Lagos" /></div>
									<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label><input type="text" bind:value={creator.city} class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Ikeja" /></div>									</div>
								</div>
							{/each}
							{#if designCreators.length === 0}
								<div class="flex flex-col items-center gap-2 py-10 text-slate-400">
									<Icon icon="mdi:account-group-outline" width="2.5rem" height="2.5rem" />
									<p class="text-sm">Click <span class="font-semibold text-blue-500">+ Add Creator</span> to add creator information</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Design Attachments Section -->
				{#if showAttachmentsSection}
					<div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
						<div class="bg-gray-300 px-4 py-2 font-medium text-black flex items-center justify-between">
							<span>FILE ATTACHMENTS - SELECT DOCUMENTS TO KEEP OR REMOVE</span>
							{#if existingAttachments.length + newAttachmentFiles.length > 0}
								<span class="text-sm bg-green-600 text-white px-3 py-1 rounded-full">{existingAttachments.length + newAttachmentFiles.length} file{(existingAttachments.length + newAttachmentFiles.length) !== 1 ? 's' : ''}</span>
							{/if}
						</div>
						<div class="p-4">
							<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<p class="text-sm text-blue-800"><Icon icon="mdi:information" class="inline" width="1.2em" height="1.2em" /> Review the current attachments below. Remove any you want to replace, then upload new files if needed.</p>
							</div>

							<!-- Current Attachments -->
							{#if existingAttachments.length > 0}
								<div class="grid grid-cols-1 gap-3 mb-4">
								{#each existingAttachments as attachment, index}
									<div class="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
										<div class="flex items-center gap-3">
											<div class="flex-1 min-w-0">
												<div class="font-medium text-gray-800">{attachment.name || `Document ${index + 1}`}</div>
												<div class="text-xs text-gray-500 mt-1">Document {index + 1} of {existingAttachments.length + removedAttachments.length}</div>
											</div>
											<div class="flex-shrink-0 flex items-center gap-2">
												<a href={attachment.url} target="_blank" rel="noopener noreferrer" on:click={(e) => e.stopPropagation()} class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"><Icon icon="mdi:file-eye" width="1.2em" height="1.2em" /><span>View</span></a>
												<button on:click={() => removeExistingAttachment(index)} class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center shadow-sm"><Icon icon="mdi:trash-can-outline" width="1.2em" height="1.2em" /></button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else if removedAttachments.length === 0}
							<div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed mb-4"><Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" /><p>No current attachments on file</p></div>
						{/if}

						<!-- Pending Removal -->
						{#if removedAttachments.length > 0}
							<div class="mb-4">
								<p class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Pending Removal</p>
								<div class="grid grid-cols-1 gap-3">
									{#each removedAttachments as attachment, index}
										<div class="border border-red-200 rounded-lg p-3 bg-red-50 opacity-75">
											<div class="flex items-center gap-3">
												<div class="flex-1 min-w-0">
													<div class="font-medium text-red-700 line-through">{attachment.name || `Document ${index + 1}`}</div>
													<div class="text-xs text-red-400 mt-1">Scheduled for deletion</div>
												</div>
												<div class="flex-shrink-0">
													<button on:click={() => undoRemoveAttachment(attachment)} class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"><Icon icon="mdi:undo" width="1.2em" height="1.2em" /><span>Undo</span></button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

							<!-- Upload New Files -->
							<div class="border-t border-gray-200 pt-4">
								<p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upload New Files</p>
								<label for="attachment-upload" class="flex items-center gap-4 px-5 py-4 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-lg bg-gray-50 hover:bg-green-50 cursor-pointer transition-all duration-200">
									<Icon icon="mdi:cloud-upload-outline" width="1.5rem" height="1.5rem" class="text-gray-400" />
									<div>
										<p class="text-sm font-medium text-gray-600">Click to select files</p>
										<p class="text-xs text-gray-400">PNG, JPG, PDF, DOC, DOCX &middot; Max 10MB per file &middot; Multiple files allowed</p>
									</div>
									<input id="attachment-upload" type="file" accept="image/*,.pdf,.doc,.docx" multiple on:change={handleAddAttachments} class="hidden" />
								</label>
								{#if newAttachmentFiles.length > 0}
									<div class="mt-3 grid grid-cols-1 gap-3">
										{#each newAttachmentFiles as file, index}
											<div class="border border-blue-200 rounded-lg p-3 bg-blue-50 hover:bg-white transition-colors">
												<div class="flex items-center gap-3">
													<div class="flex-1 min-w-0">
														<div class="font-medium text-gray-800">{file.name}</div>
														<div class="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB &middot; <span class="text-blue-600 font-semibold">New</span></div>
													</div>
													<div class="flex-shrink-0">
														<button on:click={() => removeNewAttachment(index)} class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center shadow-sm"><Icon icon="mdi:trash-can-outline" width="1.2em" height="1.2em" /></button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
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
