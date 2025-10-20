<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { ApplicationStatuses, baseURL, FileTypes, PatentTypes, PatentApplicationTypes } from '$lib/helpers';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import Icon from '@iconify/svelte';
    import { Button } from '$lib/components/ui/button/index';
    import { toast } from 'svelte-sonner';
    import { countriesMap } from '$lib/constants';

    interface ApplicantInfo {
        name: string;
        address?: string;
        email?: string;
        phone?: string;
        country?: string;
        state?: string;
        city?: string;
    }
    
    interface InventorInfo {
        name: string;
        address?: string;
        email?: string;
        phone?: string;
        country?: string;
        state?: string;
        city?: string;
    }

    interface PatentFileInfo {
        fileId: string | null;
        fileStatus: ApplicationStatuses | null;
        paymentRRR: string | null;
        cost: number | null;
        serviceFee: number | null;
        updateType: string;
        fileType: FileTypes | null;
        patentType: PatentTypes | null;
        patentApplicationType: PatentApplicationTypes | null;
        fileOrigin: string | null;
        fileTitle: string | null;
        applicants?: ApplicantInfo[];
        patentAbstract?: string | null;
    }

    interface NewData {
        applicantNames?: string[];        // For change of name
        applicantAddresses?: string[];    // For change of address
        applicantEmails?: string[];
        applicantPhones?: string[];
        applicantNationalities?: string[];
        applicantStates?: string[];
        applicantCities?: string[];
        fileTitle?: string | null;
        patentAbstract?: string | null;
        patentApplicationType?: number | null;
    }

    let fileInfo: PatentFileInfo = {
        fileId: null,
        fileStatus: null,
        paymentRRR: null,
        cost: null,
        serviceFee: null,
        updateType: '',
        fileType: null,
        patentType: null,
        patentApplicationType: null,
        fileOrigin: null,
        fileTitle: null,
        applicants: [],
        patentAbstract: null
    };

    interface PriorityInfo {
        number: string;
        country: string;
        date: string;
    }

    // Use Priority for your state
    let firstPriorityInfo: PriorityInfo = { number: '', country: '', date: '' };
    let priorityInfoList: PriorityInfo[] = [];
    let inventorsMarkedForDeletion: number[] = [];

    let error: string | null = null;
    let isProcessing = false;
    let isLoading = false;
    let updateType: string | null = null;
    let fileType = '';
    const pageData = get(page);
    let patentTypeValue: number | null = null;

    let correspondenceName: string = '';
    let correspondenceAddress: string = '';
    let correspondencePhone: string = '';
    let correspondenceEmail: string = '';
    let correspondenceState: string = '';
    let correspondenceNationality: string = 'Nigeria';
    // let editablePatentAbstract: string = '';
    // let editablePatentApplicationType: number | null = null;

    let newData: NewData = {};

    function removeApplicantForm(index: number) {
     newApplicants = newApplicants.filter((_, i) => i !== index);
    }

    onMount(async () => {
        const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
        fileType = pageData.url.searchParams.get('fileType') ?? '';
        updateType = pageData.url.searchParams.get('updateType') ?? '';
        sessionStorage.setItem('updateType', updateType);
        await setData(fileNumber, fileType, updateType);
    });

    async function setData(fileNumber: string, fileType: string, updateType: string): Promise<void> {
        isLoading = true;
        try {
            const res = await fetch(
                `${baseURL}/api/files/GetPatentClericalUpdateCost?fileId=${fileNumber}&fileType=${fileType}&updateType=${updateType}`
            );
            if (!res.ok) {
                error = 'Unable to retrieve cost info.';
                return;
            }
            const data = await res.json();

            fileInfo = {
                fileId: data.fileId ?? null,
                fileStatus: Number(data.fileStatus) as ApplicationStatuses,
                fileType: data.fileType,
                paymentRRR: data.paymentRRR ?? null,
                cost: data.cost ?? null,
                serviceFee: data.serviceFee ?? null,
                updateType: updateType,
                patentType: data.patentType ?? null,
                patentApplicationType: data.patentApplicationType ?? null,
                fileOrigin: data.fileOrigin ?? null,
                fileTitle: data.titleOfInvention ?? null,
                applicants: data.applicants ?? [],
                patentAbstract: data.patentAbstract ?? null
            };

            patentTypeValue = Number(data.patentType);

            if (updateType === 'Correspondence' && data.correspondenceName) {
                correspondenceName = data.correspondenceName ?? '';
                correspondenceAddress = data.correspondenceAddress ?? '';
                correspondencePhone = data.correspondencePhone ?? '';
                correspondenceEmail = data.correspondenceEmail ?? '';
                correspondenceState = data.correspondenceState ?? '';
                correspondenceNationality = data.correspondenceNationality ?? 'Nigeria';
            }

            // Ensure nationality defaults to Nigeria for correspondence updates
            if (updateType === 'Correspondence') {
                if (!correspondenceNationality || correspondenceNationality.trim() === '') {
                    correspondenceNationality = 'Nigeria';
                }
            }

            if(updateType === 'EditInventors' && data.inventors) {
                inventors = data.inventors;

                // Initialize openInventors for all loaded inventors as collapsed
                openInventors = {};
                inventors.forEach((_, i) => openInventors[i] = false);
            }

            // Initialize newData arrays based on applicants count
            if (fileInfo.applicants && fileInfo.applicants.length > 0) {
                if (showNameSection) {
                    newData.applicantNames = fileInfo.applicants.map(() => '');
                }
                if (showAddressSection) {
                    newData.applicantAddresses = fileInfo.applicants.map(() => '');
                    newData.applicantEmails = fileInfo.applicants.map(() => '');
                    newData.applicantPhones = fileInfo.applicants.map(() => '');
                    newData.applicantNationalities = fileInfo.applicants.map(() => '');
                    newData.applicantStates = fileInfo.applicants.map(() => '');
                    newData.applicantCities = fileInfo.applicants.map(() => '');
                }
            }

            if (isPCTorConventional() && Array.isArray(data.firstPriorityInfo) && data.firstPriorityInfo.length > 0) {
                    firstPriorityInfo = { ...data.firstPriorityInfo[0] };
                } else {
                    firstPriorityInfo = { number: '', country: '', date: '' };
                }
                if (Array.isArray(data.priorityInfo) && data.priorityInfo.length > 0) {
                    priorityInfoList = data.priorityInfo.map(p => ({ ...p }));
                } else {
                    priorityInfoList = [{ number: '', country: '', date: '' }];
            }

        } catch (err) {
            error = 'Error fetching clerical update cost.';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

   function isPCTorConventional() {
        return patentTypeValue === 0 || patentTypeValue === 2;
    }

    function getFormTitle(type: string): string {
        switch (type) {
            case 'ApplicantName':
                return 'Application for Clerical Update Of Applicant Name';
            case 'ApplicantAddress':
                return 'Application for Clerical Update Of Applicant Address';
            case 'FileTitle':
                return 'Application for Clerical Update of File Title/Representation';
            default:
                return 'Application for Clerical Update';
        }
    }

        // Add, edit, delete handlers for Priority Info
    function addPriorityInfo() {
        priorityInfoList = [...priorityInfoList, { number: '', country: '', date: '' }];
    }
    function removePriorityInfo(index: number) {
        priorityInfoList = priorityInfoList.filter((_, i) => i !== index);
    }

    // Show sections for Patent clerical update
    $: showNameSection = updateType === 'ApplicantName';
    $: showAddressSection = updateType === 'ApplicantAddress';
    $: showTitleOfInventionSection = updateType === 'FileTitle';
    $: formTitle = getFormTitle(fileInfo.updateType);
    $: showAddApplicantSection = updateType === 'AddApplicant' || updateType === null || updateType === '';

    let newApplicants: ApplicantInfo[] = [];

    function addApplicantForm() {
        newApplicants = [
            ...newApplicants,
            {
                name: '',
                address: '',
                email: '',
                phone: '',
                country: '',
                state: '',
                city: ''
            }
        ];
    }

    let openInventors: Record<number, boolean> = {};
    let inventors: InventorInfo[] = [];
    function addInventorForm() {
        inventors = [
            ...inventors,
            {
                name: '',
                address: '',
                email: '',
                phone: '',
                country: '',
                state: '',
                city: ''
            }
        ];
        openInventors[inventors.length - 1] = true; // Open the new inventor form
    }

    function toggleInventorDeletion(index: number) {
        if (inventorsMarkedForDeletion.includes(index)) {
            inventorsMarkedForDeletion = inventorsMarkedForDeletion.filter(i => i !== index);
        } else {
            inventorsMarkedForDeletion = [...inventorsMarkedForDeletion, index];
        }
    }

    function validateAddApplicantForm(): boolean {
        if (newApplicants.length === 0) {
            error = 'Please add at least one applicant.';
            return false;
        }
        for (const applicant of newApplicants) {
            if (
                !applicant.name?.trim() ||
                !applicant.address?.trim() ||
                !applicant.email?.trim() ||
                !applicant.phone?.trim() ||
                !applicant.country?.trim() ||
                !applicant.state?.trim() ||
                !applicant.city?.trim()
            ) {
                error = 'Please fill all fields for each new applicant.';
                return false;
            }
        }
        error = null;
        return true;
    }

    function validateForm(): boolean {
        if (showNameSection) {
            if (!newData.applicantNames || newData.applicantNames.some(n => !n.trim())) {
                error = 'Please enter the new name for all applicants.';
                return false;
            }
        }
        if (showAddressSection) {
            if (
                !newData.applicantAddresses ||
                !newData.applicantEmails ||
                !newData.applicantPhones ||
                !newData.applicantNationalities ||
                !newData.applicantStates ||
                !newData.applicantCities ||
                newData.applicantAddresses.some(a => !a.trim()) ||
                newData.applicantEmails.some(e => !e.trim()) ||
                newData.applicantPhones.some(p => !p.trim()) ||
                newData.applicantNationalities.some(n => !n.trim()) ||
                newData.applicantStates.some(s => !s.trim()) ||
                newData.applicantCities.some(c => !c.trim())
            ) {
                error = 'Please fill all address fields for each applicant.';
                return false;
            }
        }
        if (showTitleOfInventionSection && !newData.fileTitle?.trim()) {
            error = 'Please enter the new Title of Invention.';
            return false;
        }
        error = null;
        return true;
    }

    let showSuccessToast = false;

    async function handleSubmit() {
        // console.log('Submit clicked');
        // if (showAddApplicantSection && !validateAddApplicantForm()) return;
        // if (!validateForm()) return;
        isProcessing = true;
        const fileNumber = pageData.url.searchParams.get('fileId') ?? '';

        if (showAddApplicantSection && selectedRemoveIds.length > 0 && newApplicants.length === 0) {
            showDeleteModal = true;
            isProcessing = false;
            return;
        }

        try {
            const formObj: Record<string, any> = {
                FileId: fileNumber,
                UpdateType: updateType,
                FileType: fileInfo.fileType ?? '',
                PaymentRRR: fileInfo.paymentRRR ?? ''
            };
            
           // console.log('fileType', fileInfo.fileType);
           if (updateType === 'PriorityInfo') {
                if (isPCTorConventional()) {
                    formObj.FirstPriorityInfo = [firstPriorityInfo];
                }
                formObj.PriorityInfo = priorityInfoList;
            }

           if (updateType === 'EditInventors') {
                // Remove inventors marked for deletion before sending
                const filteredInventors = inventors.filter((_, i) => !inventorsMarkedForDeletion.includes(i));
                formObj.NewInventors = filteredInventors;
                formObj.UpdateType = 'EditInventors';
            }

            if (showAddApplicantSection) {
                if (newApplicants.length > 0 && selectedRemoveIds.length === 0) {
                    formObj.UpdateType = 'AddApplicant';
                    formObj.NewApplicants = newApplicants;
                } else if (selectedRemoveIds.length > 0 && newApplicants.length === 0) {
                    formObj.UpdateType = 'RemoveApplicant';
                    formObj.RemoveApplicantIds = selectedRemoveIds;
                } else if (newApplicants.length > 0 && selectedRemoveIds.length > 0) {
                    formObj.UpdateType = 'AddAndRemoveApplicant'; // or whatever your backend expects for both
                    formObj.NewApplicants = newApplicants;
                    formObj.RemoveApplicantIds = selectedRemoveIds; 
                }
            }

            if (updateType === 'ApplicantName') {
                formObj.ApplicantNames = newData.applicantNames;
                 if (fileInfo.fileType === 0) {
                        formObj.OldApplicantNames = fileInfo.applicants?.map(a => a.name) ?? [];
                    } else {
                        formObj.OldApplicantName = fileInfo.applicants?.[0]?.name ?? '';
                    }
            } else if (updateType === 'ApplicantAddress') {
                formObj.ApplicantAddresses = newData.applicantAddresses;
                formObj.ApplicantEmails = newData.applicantEmails;
                formObj.ApplicantPhones = newData.applicantPhones;
                formObj.ApplicantNationalities = newData.applicantNationalities;
                formObj.ApplicantStates = newData.applicantStates;
                formObj.ApplicantCities = newData.applicantCities;
            } else if (updateType === 'FileTitle') {
                formObj.FileTitle = newData.fileTitle ?? '';
                formObj.PatentAbstract = newData.patentAbstract ?? '';
                if (newData.patentApplicationType !== undefined && newData.patentApplicationType !== null && newData.patentApplicationType !== '') {
                    formObj.PatentApplicationType = Number(newData.patentApplicationType);
                }
            }

            if (updateType === 'Correspondence') {
                formObj.CorrespondenceName = correspondenceName;
                formObj.CorrespondenceAddress = correspondenceAddress;
                formObj.CorrespondencePhone = correspondencePhone;
                formObj.CorrespondenceEmail = correspondenceEmail;
                formObj.CorrespondenceState = correspondenceState;
                formObj.CorrespondenceNationality = correspondenceNationality;  
            }

            if (fileInfo.applicants && fileInfo.applicants.length > 0) {
                formObj.FileApplicant = fileInfo.applicants[0].name;
            } else {
                formObj.FileApplicant = '';
            }

            localStorage.setItem('formData', JSON.stringify(formObj));

            if (fileInfo.fileStatus === ApplicationStatuses.Withdrawn) {
                const formData = new FormData();
                for (const key in formObj) {
                    if (
                        Object.prototype.hasOwnProperty.call(formObj, key) &&
                        formObj[key] !== undefined &&
                        formObj[key] !== null
                    ) {
                        formData.append(key, JSON.stringify(formObj[key]));
                    }
                }

                if (showAddApplicantSection && Array.isArray(newApplicants)) {
                newApplicants.forEach((apps, i) => {
                    formData.append(`NewApplicants[${i}].name`, apps.name ?? '');
                    formData.append(`NewApplicants[${i}].address`, apps.address ?? '');
                    formData.append(`NewApplicants[${i}].email`, apps.email ?? '');
                    formData.append(`NewApplicants[${i}].phone`, apps.phone ?? '');
                    formData.append(`NewApplicants[${i}].nationality`, apps.country ?? '');
                    formData.append(`NewApplicants[${i}].state`, apps.state ?? '');
                    formData.append(`NewApplicants[${i}].city`, apps.city ?? '');
                });
            }

                await freeUpdate(formData);
                showSuccessToast = true;
                setTimeout(() => {
                    goto(`/home/dashboard`);
                }, 5000);
                return;
            }
            await handlePayment();
        } catch (err) {
            error = 'Form submission failed.';
            console.error(err);
        } finally {
            isProcessing = false;
        }
    }

    let showDeleteModal = false;
    let openApplicants: Record<number, boolean> = {};

    function confirmDelete() {
            showDeleteModal = false;
            isProcessing = true;

            // Build the payload for removal
            const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
            const formObj: Record<string, any> = {
                FileId: fileNumber,
                UpdateType: 'RemoveApplicant',
                FileType: fileInfo.fileType ?? '',
                PaymentRRR: fileInfo.paymentRRR ?? '',
                RemoveApplicantIds: selectedRemoveIds
            };

            // Save to localStorage for the paid page
            localStorage.setItem('formData', JSON.stringify(formObj));

            // If awaiting search, submit directly; otherwise, go to payment
            if (fileInfo.fileStatus === ApplicationStatuses.Withdrawn) {
                const formData = new FormData();
                formData.append('FileId', fileNumber);
                formData.append('UpdateType', 'RemoveApplicant');
                formData.append('FileType', String(fileInfo.fileType ?? ''));
                formData.append('PaymentRRR', fileInfo.paymentRRR ?? '');
                selectedRemoveIds.forEach((id, i) => {
                    formData.append(`RemoveApplicantIds[${i}]`, id);
                });

                freeUpdate(formData).then(() => {
                    showSuccessToast = true;
                    setTimeout(() => {
                        goto(`/home/dashboard`);
                    }, 5000);
                }).catch((err) => {
                    error = 'Form submission failed.';
                    console.error(err);
                }).finally(() => {
                    isProcessing = false;
                });
            } else {
                // Go to payment page
                handlePayment();
                isProcessing = false;
            }
        }

    async function freeUpdate(data: FormData) {
        if (fileInfo.fileStatus === ApplicationStatuses.Withdrawn) {
            const result = await fetch(`${baseURL}/api/files/ClericalUpdate`, {
                method: 'POST',
                body: data
            });
            if (!result.ok) {
                const errorRes = await result.json();
                toast.error(`Error submitting clerical update: ${errorRes.message}`);
                return;
            }
        }
    }

    async function handlePayment() {
        // console.log('handlePayment called');
        if (fileInfo.cost && fileInfo.paymentRRR) {
            await goto(`/payment/?type=clerical&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}`);
        }
    }

    function goBack() {
        window.history.back();
    }

    let selectedRemoveIds: string[] = [];

    function toggleRemoveApplicant(id: string) {
        if (selectedRemoveIds.includes(id)) {
            selectedRemoveIds = selectedRemoveIds.filter(x => x !== id);
        } else {
            selectedRemoveIds = [...selectedRemoveIds, id];
        }
    }

    function getPatentTypeLabel(type: PatentTypes | null): string {
        switch (type) {
            case PatentTypes.Conventional:
                return 'Conventional';
            case PatentTypes.Non_Conventional:
                return 'Non-Conventional';
            case PatentTypes.PCT:
                return 'PCT';
            default:
                return '';
        }
    }

    function getPatentApplicationTypeLabel(type: PatentApplicationTypes | null): string {
        switch (type) {
            case PatentApplicationTypes.Patent:
                return 'Patent';
            case PatentApplicationTypes.Business_Method:
                return 'Business Method';
            case PatentApplicationTypes.Utility_Model:
                return 'Utility Model';
            default:
                return '';
        }
    }

    $: isWithdrawn = fileInfo.fileStatus === ApplicationStatuses.Withdrawn;
    $: isReadyForPayment = fileInfo.fileStatus != null && fileInfo.fileStatus !== ApplicationStatuses.Withdrawn;
    $: isPriorityInfoNotAllowed = updateType === 'PriorityInfo' && patentTypeValue !== null && fileInfo.patentType === 1;
</script>

{#if showSuccessToast}
    <div class="fixed inset-0 flex items-end justify-center z-50 pointer-events-none">
        <div class="mb-8 bg-green-600 text-white px-6 py-4 rounded shadow-lg flex items-center gap-2 pointer-events-auto animate-fade-in-up">
            <Icon icon="lucide:check-circle" width="1.5rem" height="1.5rem" />
            <span>Clerical update submitted successfully!</span>
        </div>
    </div>
{/if}

<div class="min-h-screen py-4 px-4">
    <div class="w-full mx-auto">
        <!-- Header -->
        <div class="flex items-center">
            <Button variant="outline" on:click={goBack} class="flex items-center gap-2">
                <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
                Back
            </Button>
            <div class="flex-1 flex flex-col items-center justify-center">
                <h1 class="text-xl font-bold">
                    {formTitle}
                </h1>
                <p class="font-light">Fill in the new information</p>
            </div>
        </div>

        <!-- Form -->
        <div class="px-6 py-6">
            {#if error}
                <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p class="text-sm text-red-700">{error}</p>
                </div>
            {/if}

            <!-- Section 1: Current Patent Information (no applicant details) -->
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
                    <div class="p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="file-number" class="block text-sm font-medium text-gray-700 mb-1">File Number:</label>
                                <input id="file-number" type="text" value={fileInfo.fileId} placeholder={fileInfo.fileId} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                            </div>
                            <div>
                                <label for="file-origin" class="block text-sm font-medium text-gray-700 mb-1">File Origin:</label>
                                <input id="file-origin" type="text" value={fileInfo.fileOrigin} placeholder={fileInfo.fileOrigin} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                            </div>
                            <div>
                                <label for="patent-type" class="block text-sm font-medium text-gray-700 mb-1">Patent Type:</label>
                                <input id="patent-type" type="text" value={getPatentTypeLabel(fileInfo.patentType)} placeholder={getPatentTypeLabel(fileInfo.patentType)} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                            </div>
                            <div>
                                <label for="patent-application-type" class="block text-sm font-medium text-gray-700 mb-1">Patent Application Type:</label>
                                <input id="patent-application-type" type="text" value={getPatentApplicationTypeLabel(fileInfo.patentApplicationType)} placeholder={getPatentApplicationTypeLabel(fileInfo.patentApplicationType)} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                            </div>
                           
                        </div>
                         <div class="mt-4">
                            <label for="title-of-invention" class="block text-sm font-medium text-gray-700 mb-1">Title of Invention:</label>
                            <input id="title-of-invention" type="text" value={fileInfo.fileTitle} placeholder={fileInfo.fileTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <!-- Patent Abstract as a full-width row below -->
                        <div class="mt-4">
                            <label for="patent-abstract" class="block text-sm font-medium text-gray-700 mb-1">Patent Abstract:</label>
                            <textarea id="patent-abstract" value={fileInfo.patentAbstract} placeholder={fileInfo.patentAbstract} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled></textarea>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Section 2: New Applicant Name (multi-applicant editable) -->
            {#if showNameSection && fileInfo.applicants && fileInfo.applicants.length > 0}
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-blue-100 px-4 py-2 font-medium text-blue-900">NEW APPLICANT NAME(S)</div>
                    <div class="p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each fileInfo.applicants as applicant, i}
                                <div>
                                    <label for={`applicant-name-${i}`} class="block text-sm font-medium text-gray-700 mb-1">
                                        Applicant Name {i + 1}:
                                    </label>
                                    <input
                                        id={`applicant-name-${i}`}
                                        type="text"
                                        bind:value={newData.applicantNames[i]}
                                        placeholder={`Enter new name for applicant ${i + 1}`}
                                        class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        class:border-red-500={error && showNameSection}
                                        required
                                    />
                                    <p class="text-xs text-gray-500 mt-1">Current name: <b>{applicant.name}</b></p>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Section 3: New Applicant Address (multi-applicant collapsible) -->
            {#if showAddressSection && fileInfo.applicants && fileInfo.applicants.length > 0}
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-green-100 px-4 py-2 font-medium text-green-900">NEW ADDRESS INFORMATION(S)</div>
                    <div class="p-4">
                        {#each fileInfo.applicants as applicant, i}
                            <details class="mb-4">
                                <summary class="cursor-pointer font-medium text-gray-700">
                                    Applicant {i + 1} Details
                                </summary>
                                <div class="mt-2 grid grid-cols-1 gap-4">
                                    <!-- Name -->
                                    <div>
                                        <label for={`applicant-name-${i}`} class="block text-sm font-medium text-gray-700 mb-1">Applicant Name:</label>
                                        <input
                                            id={`applicant-name-${i}`}
                                            type="text"
                                            value={applicant.name}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                            readonly
                                        />
                                        <p class="text-xs text-gray-500 mt-1">Current name: <b>{applicant.name}</b></p>
                                    </div>
                                    <!-- Address -->
                                    <div>
                                        <label for={`applicant-address-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Address:</label>
                                        <textarea
                                            id={`applicant-address-${i}`}
                                            bind:value={newData.applicantAddresses[i]}
                                            placeholder="Enter new address"
                                            rows="2"
                                            class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                            class:border-red-500={error && showAddressSection}
                                        />
                                        <p class="text-xs text-gray-500 mt-1">Current address: <b>{applicant.address}</b></p>
                                    </div>
                                    <!-- Email & Phone side by side -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for={`applicant-email-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Email:</label>
                                            <input
                                                id={`applicant-email-${i}`}
                                                type="email"
                                                bind:value={newData.applicantEmails[i]}
                                                placeholder={applicant.email}
                                                class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                                class:border-red-500={error && showAddressSection}
                                            />
                                            <p class="text-xs text-gray-500 mt-1">Current email: <b>{applicant.email}</b></p>
                                        </div>
                                        <div>
                                            <label for={`applicant-phone-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Phone:</label>
                                            <input
                                                id={`applicant-phone-${i}`}
                                                type="tel"
                                                bind:value={newData.applicantPhones[i]}
                                                placeholder={applicant.phone}
                                                class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                                class:border-red-500={error && showAddressSection}
                                            />
                                            <p class="text-xs text-gray-500 mt-1">Current phone: <b>{applicant.phone}</b></p>
                                        </div>
                                    </div>
                                    <!-- State & Country side by side -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for={`applicant-state-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New State:</label>
                                            <input
                                                id={`applicant-state-${i}`}
                                                type="text"
                                                bind:value={newData.applicantStates[i]}
                                                placeholder={applicant.state}
                                                class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                                class:border-red-500={error && showAddressSection}
                                            />
                                            <p class="text-xs text-gray-500 mt-1">Current state: <b>{applicant.state}</b></p>
                                        </div>
                                        <div>
                                            <label for={`applicant-country-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Country:</label>
                                            <select
                                                id={`applicant-country-${i}`}
                                                bind:value={newData.applicantNationalities[i]}
                                                class="w-full px-3 py-2 border rounded-md focus:ring-gray-900 focus:border-gray-900"
                                                class:border-red-500={error && showAddressSection}
                                                required
                                            >
                                                <option value="" disabled selected>Select nationality</option>
                                                {#each Object.entries(countriesMap) as [code, name]}
                                                    <option value={name}>{name}</option>
                                                {/each}
                                            </select>
                                            <p class="text-xs text-gray-500 mt-1">Current nationality: <b>{applicant.nationality}</b></p>
                                        </div>
                                    </div>
                                    <!-- City alone -->
                                    <div>
                                        <label for={`applicant-city-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New City:</label>
                                        <input
                                            id={`applicant-city-${i}`}
                                            type="text"
                                            bind:value={newData.applicantCities[i]}
                                            placeholder={applicant.city}
                                            class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                            class:border-red-500={error && showAddressSection}
                                        />
                                        <p class="text-xs text-gray-500 mt-1">Current city: <b>{applicant.city}</b></p>
                                    </div>
                                </div>
                            </details>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Section 4: New Title of Invention -->
            {#if showTitleOfInventionSection}
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-yellow-300 px-4 py-2 font-medium text-yellow-900">NEW PATENT ABSTRACT</div>
                    <div class="p-4">
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label for={`patent-abstract`} class="block text-sm font-medium text-gray-700 mb-1">New Patent Abstract:</label>
                                <textarea
                                    id={`patent-abstract`}
                                    bind:value={newData.patentAbstract}
                                    placeholder="Enter new patent abstract"
                                    class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                                    rows="3"
                                ></textarea>
                                <p class="text-xs text-gray-500 mt-1">This will replace the current patent abstract shown above.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-yellow-200 px-4 py-2 font-medium text-yellow-900">NEW TITLE OF INVENTION & APPLICATION TYPE</div>
                    <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label for={`title-of-invention`} class="block text-sm font-medium text-gray-700 mb-1">New Title of Invention:</label>
                            <input
                                type="text"
                                bind:value={newData.fileTitle}
                                placeholder="Enter new title of invention"
                                class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                                class:border-red-500={error && showTitleOfInventionSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">This will replace the current title of invention shown above.</p>
                        </div>
                        <div>
                            <label for={`patent-application-type`} class="block text-sm font-medium text-gray-700 mb-1">New Patent Application Type:</label>
                            <select
                                bind:value={newData.patentApplicationType}
                                class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="" disabled selected>Select application type</option>
                                <option value={PatentApplicationTypes.Patent}>Patent</option>
                                <option value={PatentApplicationTypes.Business_Method}>Business Method</option>
                                <option value={PatentApplicationTypes.Utility_Model}>Utility Model</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">This will replace the current application type shown above.</p>
                        </div>
                    </div>
                </div>
            {/if}

            {#if selectedRemoveIds.length > 0}
                <div class="mb-2 text-red-700 font-semibold">
                    {selectedRemoveIds.length} applicant{selectedRemoveIds.length > 1 ? 's' : ''} selected for removal
                </div>
            {/if}

            <!-- Section: Existing Applicants (collapsible, read-only) -->
            {#if showAddApplicantSection && fileInfo.applicants && fileInfo.applicants.length > 0}
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-gray-100 px-4 py-2 font-medium text-gray-900">EXISTING APPLICANTS</div>
                    <div class="p-4">
                        {#each fileInfo.applicants as applicant, i}
                            <details class="mb-4 border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                                <summary class="cursor-pointer font-semibold text-lg bg-gray-200 px-4 py-2 flex items-center justify-between">
                                 
                                    <span>Applicant {i + 1}</span>
                                    {#if selectedRemoveIds.includes(applicant.id)}
                                        <span class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">To be deleted</span>
                                    {/if}
                                </summary>
                                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                                    <div>
                                        <label for={`applicant-${i}-name`} class="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                                        <input id={`applicant-${i}-name`} type="text" value={applicant.name} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-address`} class="block text-sm font-medium text-gray-700 mb-1">Address:</label>
                                        <input id={`applicant-${i}-address`} type="text" value={applicant.address} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-email`} class="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                                        <input id={`applicant-${i}-email`} type="text" value={applicant.email} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-phone`} class="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                                        <input id={`applicant-${i}-phone`} type="text" value={applicant.phone} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-nationality`} class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label>
                                        <input id={`applicant-${i}-nationality`} type="text" value={applicant.country} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-state`} class="block text-sm font-medium text-gray-700 mb-1">State:</label>
                                        <input id={`applicant-${i}-state`} type="text" value={applicant.state} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-city`} class="block text-sm font-medium text-gray-700 mb-1">City:</label>
                                        <input id={`applicant-${i}-city`} type="text" value={applicant.city} class="w-full px-3 py-2 border rounded-md bg-gray-100" readonly />
                                    </div>
                                </div>
                                <!-- <button type="button"
                                    class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                    on:click={() => toggleRemoveApplicant(applicant.id)}>
                                    {selectedRemoveIds.includes(applicant.id) ? 'Undo Remove' : 'Delete Applicant'}
                                </button> -->
                                <button
                                    type="button"
                                    class="mt-4 px-4 py-2 rounded transition-colors
                                        {selectedRemoveIds.includes(applicant.id)
                                            ? 'bg-gray-400 text-white border border-gray-600'
                                            : 'bg-red-600 text-white hover:bg-red-700'}"
                                    on:click={() => toggleRemoveApplicant(applicant.id)}>
                                    {selectedRemoveIds.includes(applicant.id) ? 'Undo Remove' : 'Delete Applicant'}
                                </button>
                            </details>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if showDeleteModal}
                <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 class="text-lg font-bold mb-4 text-red-700">Confirm Removal</h2>
                        <p class="mb-6">Are you sure you want to remove {selectedRemoveIds.length} applicant{selectedRemoveIds.length > 1 ? 's' : ''}?</p>
                        <div class="flex justify-end gap-2">
                            <button class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" on:click={() => showDeleteModal = false}>Cancel</button>
                            <button class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" on:click={confirmDelete}>Yes, Remove</button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Section: Add New Applicants -->
            {#if showAddApplicantSection}
                <div class="mb-6 border border-blue-300 rounded-md overflow-hidden">
                    <div class="bg-blue-100 px-4 py-2 font-medium text-blue-900">ADD NEW APPLICANT(S)</div>
                    <div class="p-4">
                        {#each newApplicants as applicant, i}
                            <div class="mb-6 border border-gray-200 rounded-md p-4 relative">
                                <button type="button" class="absolute top-2 right-2 text-red-600" on:click={() => removeApplicantForm(i)} title="Remove Applicant">
                                    <Icon icon="lucide:x" width="1.2rem" height="1.2rem" />
                                </button>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for={`applicant-${i}-name`} class="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                                        <input id={`applicant-${i}-name`} type="text" bind:value={applicant.name} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-address`} class="block text-sm font-medium text-gray-700 mb-1">Address:</label>
                                        <input id={`applicant-${i}-address`} type="text" bind:value={applicant.address} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-email`} class="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                                        <input id={`applicant-${i}-email`} type="email" bind:value={applicant.email} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-phone`} class="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                                        <input id={`applicant-${i}-phone`} type="tel" bind:value={applicant.phone} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-nationality`} class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label>
                                        <select id={`applicant-${i}-nationality`} bind:value={applicant.country} class="w-full px-3 py-2 border rounded-md" required>
                                            <option value="" disabled selected>Select nationality</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-state`} class="block text-sm font-medium text-gray-700 mb-1">State:</label>
                                        <input id={`applicant-${i}-state`} type="text" bind:value={applicant.state} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`applicant-${i}-city`} class="block text-sm font-medium text-gray-700 mb-1">City:</label>
                                        <input id={`applicant-${i}-city`} type="text" bind:value={applicant.city} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                </div>
                            </div>
                        {/each}
                        <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors" on:click={addApplicantForm}>
                            Add Applicant
                        </button>
                    </div>
                </div>
            {/if}

            {#if updateType === 'EditInventors'}
                <div class="mb-6 border border-purple-300 rounded-md overflow-hidden">
                    <div class="bg-purple-100 px-4 py-2 font-medium text-purple-900">EXISTING INVENTORS</div>
                    <div class="p-4">
                        {#each inventors as inventor, i}
                            <details class="mb-4 border border-gray-300 rounded-lg shadow-sm overflow-hidden relative"
                                bind:open={openInventors[i]}>
                                <summary class="cursor-pointer font-semibold text-lg bg-gray-200 px-4 py-2 flex items-center justify-between">
                                    <span>Inventor {i + 1}</span>
                                    {#if inventorsMarkedForDeletion.includes(i)}
                                        <span class="ml-20 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">To be deleted</span>
                                    {/if}
                                </summary>
                                <!-- Delete button at top right, always visible -->
                                <button
                                    type="button"
                                    class="absolute top-2 right-2 px-2 py-1 rounded transition-colors z-10 mb-2
                                        {inventorsMarkedForDeletion.includes(i)
                                            ? 'bg-red-800 text-white border border-red-700'
                                            : 'bg-red-600 text-white hover:bg-red-700'}"
                                    on:click={() => toggleInventorDeletion(i)}
                                    title={inventorsMarkedForDeletion.includes(i) ? 'Undo Remove' : 'Delete Inventor'}>
                                    {inventorsMarkedForDeletion.includes(i) ? 'Undo Remove' : 'Delete'}
                                </button>
                                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4
                                    {inventorsMarkedForDeletion.includes(i) ? 'bg-red-50 opacity-70' : ''}">
                                    <div>
                                        <label for={`inventor-${i}-name`} class="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                                        <input id={`inventor-${i}-name`} type="text" bind:value={inventor.name} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-address`} class="block text-sm font-medium text-gray-700 mb-1">Address:</label>
                                        <input id={`inventor-${i}-address`} type="text" bind:value={inventor.address} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-email`} class="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                                        <input id={`inventor-${i}-email`} type="email" bind:value={inventor.email} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-phone`} class="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                                        <input id={`inventor-${i}-phone`} type="tel" bind:value={inventor.phone} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-nationality`} class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label>
                                        <select id={`inventor-${i}-nationality`} bind:value={inventor.country} class="w-full px-3 py-2 border rounded-md" required>
                                            <option value="" disabled selected>Select nationality</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-state`} class="block text-sm font-medium text-gray-700 mb-1">State:</label>
                                        <input id={`inventor-${i}-state`} type="text" bind:value={inventor.state} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label for={`inventor-${i}-city`} class="block text-sm font-medium text-gray-700 mb-1">City:</label>
                                        <input id={`inventor-${i}-city`} type="text" bind:value={inventor.city} class="w-full px-3 py-2 border rounded-md" required />
                                    </div>
                                </div>
                            </details>
                        {/each}

                        <!-- Add Inventor Button -->
                        <button type="button" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors mt-4" on:click={addInventorForm}>
                            Add Inventor
                        </button>
                    </div>
                </div>
            {/if}

            {#if isLoading}
                <!-- Show loading spinner or nothing -->
                <div class="flex items-center justify-center p-12">
                    <div class="flex flex-col items-center gap-2">
                        <Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
                        <span class="text-sm text-gray-500">Loading...</span>
                    </div>
                </div>
            {:else if updateType === 'PriorityInfo' && patentTypeValue !== null && fileInfo.patentType !== 1}
                 {#if isPCTorConventional()}
                    <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                        <div class="bg-blue-100 px-4 py-2 font-medium text-blue-900">FIRST PRIORITY INFORMATION</div>
                        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for={`first-priority-number`} class="block text-sm font-medium text-gray-700 mb-1">Priority Number</label>
                                <input id={`first-priority-number`} type="text" bind:value={firstPriorityInfo.number} class="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label for={`first-priority-country`} class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <select id={`first-priority-country`} bind:value={firstPriorityInfo.country} class="w-full px-3 py-2 border rounded-md">
                                    <option value="" disabled selected>Select country</option>
                                    {#each Object.entries(countriesMap) as [code, name]}
                                        <option value={name}>{name}</option>
                                    {/each}
                                </select>
                            </div>
                            <div>
                                <label for={`first-priority-date`} class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input id={`first-priority-date`} type="date" bind:value={firstPriorityInfo.date} class="w-full px-3 py-2 border rounded-md" />
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Priority Info Section -->
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-green-100 px-4 py-2 font-medium text-green-900">PRIORITY INFORMATION</div>
                    <div class="p-4">
                        {#each priorityInfoList as info, i}
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 items-center">
                                <input type="text" bind:value={info.number} placeholder="Priority Number" class="px-3 py-2 border rounded-md" />
                                <select bind:value={info.country} class="w-full px-3 py-2 border rounded-md">
                                    <option value="" disabled selected>Select country</option>
                                    {#each Object.entries(countriesMap) as [code, name]}
                                        <option value={name}>{name}</option>
                                    {/each}
                                </select>
                                <input type="date" bind:value={info.date} class="px-3 py-2 border rounded-md" />
                                <div class="flex justify-end">
                                    <button type="button" class="bg-red-600 hover:bg-red-700 text-white px-1 py-1 rounded-md transition-colors" on:click={() => removePriorityInfo(i)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        {/each}
                        <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded-md mt-2" on:click={addPriorityInfo}>
                            Add Priority Info
                        </button>
                    </div>
                </div>
            {:else if updateType === 'PriorityInfo' && patentTypeValue !== null && fileInfo.patentType === 1}
                <div class="mb-6 border border-red-300 rounded-md overflow-hidden">
                    <div class="bg-red-100 px-4 py-2 font-medium text-red-900">NOT ALLOWED</div>
                    <div class="p-4 text-red-700">
                        Clerical update for Priority Information is not allowed for Non-Conventional patent files.
                    </div>
                </div>
            {/if}

            {#if updateType === 'Correspondence'}
                <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                    <div class="bg-indigo-100 px-4 py-2 font-medium text-indigo-900">CORRESPONDENCE INFORMATION</div>
                    <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="correspondenceName" class="block text-sm font-medium text-gray-700 mb-1">Correspondence Name</label>
                            <input type="text" bind:value={correspondenceName} class="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label for="correspondenceAddress"  class="block text-sm font-medium text-gray-700 mb-1">Correspondence Address</label>
                            <input type="text" bind:value={correspondenceAddress} class="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label for="correspondencePhone"  class="block text-sm font-medium text-gray-700 mb-1">Correspondence Phone</label>
                            <input type="text" bind:value={correspondencePhone} class="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label for="correspondenceEmail" class="block text-sm font-medium text-gray-700 mb-1">Correspondence Email</label>
                            <input type="email" bind:value={correspondenceEmail} class="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label for="correspondenceNationality" class="block text-sm font-medium text-gray-700 mb-1">Correspondence Country</label>
                           <input type="text" bind:value={correspondenceNationality} class="w-full px-3 py-2 border rounded-md" readonly/>
                        </div>
                        <div>
                            <label for="correspondenceState" class="block text-sm font-medium text-gray-700 mb-1">Correspondence State</label>
                            <input type="text" bind:value={correspondenceState} class="w-full px-3 py-2 border rounded-md" />
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Submit Button -->
            <div class="flex justify-end">
                {#if isWithdrawn}
                    <button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>
                        {#if isProcessing}
                            Processing...
                        {:else}
                            Submit
                        {/if}
                    </button>
                {:else if isReadyForPayment && !isPriorityInfoNotAllowed}
                    <button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>
                        {#if isProcessing}
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

<style>
    @keyframes fade-in-up {
        from {
            opacity: 0;
            transform: translateY(40px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fade-in-up {
        animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
</style>