<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';
    import { Button } from '$lib/components/ui/button';
    import { countriesMap } from '$lib/constants';
    import { baseURL } from '$lib/helpers';
    import {
        ClericalUpdateTypes
    } from '$lib/helpers';
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

    interface CreatorInfo {
        id: string;
        name: string;
        address: string;
        email: string;
        phone: string;
        country: string;
        state: string;
        city: string;
    }

    interface PriorityInfo {
        priorityNumber: string;
        priorityDate: string;
        country: string;
    }

    interface DesignFileInfo {
        fileId: string;
        fileStatus: number;
        paymentRRR: string;
        cost: number;
        updateType: string;
        designType: number;
        fileOrigin: string;
        fileTitle: string;
        statementOfNovelty: string;
        applicants: ApplicantInfo[];
        creators: CreatorInfo[];
        priorityInfoList: PriorityInfo[];
        correspondenceName: string;
        correspondenceAddress: string;
        correspondencePhone: string;
        correspondenceEmail: string;
        correspondenceState: string;
        correspondenceNationality: string;
        fileType: number;
    }

    interface NewData {
        applicantNames: string[];
        applicantAddresses: string[];
        applicantEmails: string[];
        applicantPhones: string[];
        applicantNationalities: string[];
        applicantStates: string[];
        applicantCities: string[];
        fileTitle: string;
        statementOfNovelty: string;
    }

    let pageData = $page;
    let fileInfo: DesignFileInfo = {
        fileId: '',
        fileStatus: 0,
        paymentRRR: '',
        cost: 0,
        updateType: '',
        designType: 0,
        fileOrigin: '',
        fileTitle: '',
        statementOfNovelty: '',
        applicants: [],
        creators: [],
        priorityInfoList: [],
        correspondenceName: '',
        correspondenceAddress: '',
        correspondencePhone: '',
        correspondenceEmail: '',
        correspondenceState: '',
        correspondenceNationality: '',
        fileType: 1
    };

    let newData: NewData = {
        applicantNames: [],
        applicantAddresses: [],
        applicantEmails: [],
        applicantPhones: [],
        applicantNationalities: [],
        applicantStates: [],
        applicantCities: [],
        fileTitle: '',
        statementOfNovelty: ''
    };

    let correspondenceName = '';
    let correspondenceAddress = '';
    let correspondencePhone = '';
    let correspondenceEmail = '';
    let correspondenceState = '';
    let correspondenceNationality = '';

    let priorityInfoList: PriorityInfo[] = [];

    let updateType = '';
    let isLoading = true;
    let isProcessing = false;
    let error: string | null = null;
    let formTitle = 'Design Amendment';

    // Conditional sections visibility
    let showNameSection = false;
    let showAddressSection = false;
    let showTitleSection = false;
    let showAddApplicantSection = false;
    let showCreatorsSection = false;
    let showPriorityInfoSection = false;
    let showCorrespondenceSection = false;

    async function setData() {
        isLoading = true;
        const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
        const fileType = pageData.url.searchParams.get('fileType') ?? '';
        updateType = pageData.url.searchParams.get('updateType') ?? '';

        const updateTypeNum = parseInt(updateType);

        switch (updateTypeNum) {
            case ClericalUpdateTypes.ApplicantName:
                formTitle = 'Amendment: Update Applicant Name';
                showNameSection = true;
                break;
            case ClericalUpdateTypes.ApplicantAddress:
                formTitle = 'Amendment: Update Applicant Address';
                showAddressSection = true;
                break;
            case ClericalUpdateTypes.FileTitle:
                formTitle = 'Amendment: Update Design Title';
                showTitleSection = true;
                break;
            case ClericalUpdateTypes.AddAndRemoveApplicant:
                formTitle = 'Amendment: Add or Remove Applicants';
                showAddApplicantSection = true;
                break;
            case ClericalUpdateTypes.EditInventors:
                formTitle = 'Amendment: Edit Creators';
                showCreatorsSection = true;
                break;
            case ClericalUpdateTypes.PriorityInfo:
                formTitle = 'Amendment: Update Priority Information';
                showPriorityInfoSection = true;
                break;
            case ClericalUpdateTypes.CorrespondenceInformation:
                formTitle = 'Amendment: Update Correspondence Information';
                showCorrespondenceSection = true;
                break;
        }

        try {
            const response = await fetch(
                `${baseURL}/api/files/GetDesignAmendmentCost?fileId=${fileNumber}&fileType=${fileType}&updateType=${updateType}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                fileInfo = {
                    fileId: result.data.fileId || '',
                    fileStatus: result.data.fileStatus || 0,
                    paymentRRR: result.data.rrr || '',
                    cost: parseFloat(result.data.amount) || 0,
                    updateType: result.data.updateType || updateType,
                    designType: result.data.designType || 0,
                    fileOrigin: result.data.fileOrigin || 'National',
                    fileTitle: result.data.titleOfDesign || result.data.fileTitle || '',
                    statementOfNovelty: result.data.statementOfNovelty || '',
                    applicants: result.data.applicants || [],
                    creators: result.data.creators || [],
                    priorityInfoList: result.data.priorityInfo || [],
                    correspondenceName: result.data.correspondence?.name || '',
                    correspondenceAddress: result.data.correspondence?.address || '',
                    correspondencePhone: result.data.correspondence?.phone || '',
                    correspondenceEmail: result.data.correspondence?.email || '',
                    correspondenceState: result.data.correspondence?.state || '',
                    correspondenceNationality: result.data.correspondence?.nationality || '',
                    fileType: result.data.fileType || 1
                };

                if (fileInfo.applicants && fileInfo.applicants.length > 0) {
                    newData.applicantNames = fileInfo.applicants.map((a) => a.name);
                    newData.applicantAddresses = fileInfo.applicants.map((a) => a.address);
                    newData.applicantEmails = fileInfo.applicants.map((a) => a.email);
                    newData.applicantPhones = fileInfo.applicants.map((a) => a.phone);
                    newData.applicantNationalities = fileInfo.applicants.map((a) => a.country);
                    newData.applicantStates = fileInfo.applicants.map((a) => a.state);
                    newData.applicantCities = fileInfo.applicants.map((a) => a.city);
                }

                newData.fileTitle = fileInfo.fileTitle;
                newData.statementOfNovelty = fileInfo.statementOfNovelty;

                correspondenceName = fileInfo.correspondenceName;
                correspondenceAddress = fileInfo.correspondenceAddress;
                correspondencePhone = fileInfo.correspondencePhone;
                correspondenceEmail = fileInfo.correspondenceEmail;
                correspondenceState = fileInfo.correspondenceState;
                correspondenceNationality = fileInfo.correspondenceNationality;

                priorityInfoList = (result.data.priorityInfo || []).map((p: any) => ({
                    priorityNumber: p.number || '',
                    priorityDate: p.date || '',
                    country: p.country || ''
                }));

                creators = fileInfo.creators || [];
            } else {
                error = result.message || 'Failed to load data';
            }
        } catch (err) {
            error = 'An error occurred while loading data';
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    onMount(async () => {
        await setData();
    });

    // Applicant management
    let newApplicants: ApplicantInfo[] = [];
    let selectedRemoveIds: string[] = [];

    function addApplicantForm() {
        newApplicants = [
            ...newApplicants,
            {
                id: '',
                name: '',
                address: '',
                email: '',
                phone: '',
                nationality: '',
                country: '',
                state: '',
                city: ''
            }
        ];
    }

    function removeApplicantForm(index: number) {
        newApplicants = newApplicants.filter((_, i) => i !== index);
    }

    function toggleApplicantRemoval(applicantId: string) {
        if (selectedRemoveIds.includes(applicantId)) {
            selectedRemoveIds = selectedRemoveIds.filter((id) => id !== applicantId);
        } else {
            selectedRemoveIds = [...selectedRemoveIds, applicantId];
        }
    }

    // Creator management
    let openCreators: Record<number, boolean> = {};
    let creators: CreatorInfo[] = [];
    let creatorsMarkedForDeletion: string[] = [];

    function addCreatorForm() {
        creators = [
            ...creators,
            {
                id: '',
                name: '',
                address: '',
                email: '',
                phone: '',
                country: '',
                state: '',
                city: ''
            }
        ];
        openCreators[creators.length - 1] = true;
    }

    function toggleCreatorDeletion(creatorId: string) {
        if (creatorsMarkedForDeletion.includes(creatorId)) {
            creatorsMarkedForDeletion = creatorsMarkedForDeletion.filter((id) => id !== creatorId);
        } else {
            creatorsMarkedForDeletion = [...creatorsMarkedForDeletion, creatorId];
        }
    }

    // Priority info management
    function addPriorityInfo() {
        priorityInfoList = [
            ...priorityInfoList,
            {
                priorityNumber: '',
                priorityDate: '',
                country: ''
            }
        ];
    }

    function removePriorityInfo(index: number) {
        priorityInfoList = priorityInfoList.filter((_, i) => i !== index);
    }

    function validateForm(): boolean {
        if (showNameSection) {
            if (!newData.applicantNames || newData.applicantNames.some((n) => !n.trim())) {
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
                newData.applicantAddresses.some((a) => !a.trim()) ||
                newData.applicantEmails.some((e) => !e.trim()) ||
                newData.applicantPhones.some((p) => !p.trim()) ||
                newData.applicantNationalities.some((n) => !n.trim()) ||
                newData.applicantStates.some((s) => !s.trim()) ||
                newData.applicantCities.some((c) => !c.trim())
            ) {
                error = 'Please fill all address fields for each applicant.';
                return false;
            }
        }
        if (showTitleSection) {
            if (!newData.fileTitle?.trim()) {
                error = 'Please enter the new Design Title.';
                return false;
            }
        }
        if (showCorrespondenceSection) {
            if (
                !correspondenceName?.trim() ||
                !correspondenceAddress?.trim() ||
                !correspondencePhone?.trim() ||
                !correspondenceEmail?.trim() ||
                !correspondenceState?.trim() ||
                !correspondenceNationality?.trim()
            ) {
                error = 'Please fill all correspondence fields.';
                return false;
            }
        }
        error = null;
        return true;
    }

    async function handleSubmit() {
        if (!validateForm()) return;

        isProcessing = true;
        const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
        const updateTypeNum = parseInt(updateType);

        try {
            const formObj: Record<string, any> = {
                FileId: fileNumber,
                UpdateType: updateTypeNum,
                FileType: fileInfo.fileType ?? 1,
                PaymentRRR: fileInfo.paymentRRR ?? ''
            };

            if (updateTypeNum === ClericalUpdateTypes.PriorityInfo) {
                formObj.PriorityInfo = (priorityInfoList || []).map(p => ({
                    number: p.priorityNumber,
                    Date: p.priorityDate,
                    country: p.country
                }));
            }

            if (updateTypeNum === ClericalUpdateTypes.EditInventors) {
                const filteredCreators = creators.filter(
                    (c) => !creatorsMarkedForDeletion.includes(c.id)
                );
                formObj.NewCreators = filteredCreators;
            }

            if (updateTypeNum === ClericalUpdateTypes.AddAndRemoveApplicant) {
                const editedApplicants = fileInfo.applicants.filter(
                    (a) => !selectedRemoveIds.includes(a.id)
                );
                formObj.EditedApplicants = editedApplicants;
                if (newApplicants.length > 0) {
                    formObj.NewApplicants = newApplicants;
                }
                if (selectedRemoveIds.length > 0) {
                    formObj.RemoveApplicantIds = selectedRemoveIds;
                }
            }

            if (updateTypeNum === ClericalUpdateTypes.ApplicantName) {
                formObj.ApplicantNames = newData.applicantNames;
                formObj.OldApplicantNames = fileInfo.applicants?.map((a) => a.name) ?? [];
            } else if (updateTypeNum === ClericalUpdateTypes.ApplicantAddress) {
                formObj.ApplicantAddresses = newData.applicantAddresses;
                formObj.ApplicantEmails = newData.applicantEmails;
                formObj.ApplicantPhones = newData.applicantPhones;
                formObj.ApplicantNationalities = newData.applicantNationalities;
                formObj.ApplicantStates = newData.applicantStates;
                formObj.ApplicantCities = newData.applicantCities;
            } else if (updateTypeNum === ClericalUpdateTypes.FileTitle) {
                formObj.FileTitle = newData.fileTitle;
                formObj.StatementOfNovelty = newData.statementOfNovelty;
            } else if (updateTypeNum === ClericalUpdateTypes.CorrespondenceInformation) {
                formObj.CorrespondenceName = correspondenceName;
                formObj.CorrespondenceAddress = correspondenceAddress;
                formObj.CorrespondencePhone = correspondencePhone;
                formObj.CorrespondenceEmail = correspondenceEmail;
                formObj.CorrespondenceState = correspondenceState;
                formObj.CorrespondenceNationality = correspondenceNationality;
            }

            sessionStorage.setItem('designAmendmentPayload', JSON.stringify(formObj));

            goto(
                `/payment/?type=design-amendment&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}&fileId=${fileNumber}`
            );
        } catch (err) {
            error = 'An error occurred while preparing submission';
            console.error(err);
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="flex w-full h-full flex-col bg-white">
    <div class="flex items-center bg-white border-b px-6 py-4">
        <Button
            variant="ghost"
            size="icon"
            on:click={() => window.history.back()}
            class="mr-4"
        >
            <Icon icon="mdi:arrow-left" width="1.5rem" height="1.5rem" />
        </Button>
        <div class="flex-1 flex flex-col items-center justify-center">
            <h1 class="text-xl font-bold">{formTitle}</h1>
            <p class="font-light">Fill in the new information</p>
        </div>
    </div>

    <div class="px-6 py-6 overflow-y-auto">
        {#if error}
            <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p class="text-sm text-red-700">{error}</p>
            </div>
        {/if}

        <!-- Design Information -->
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
            <div class="bg-gray-300 px-4 py-2 font-medium text-black">DESIGN INFORMATION</div>
            {#if isLoading}
                <div class="flex items-center justify-center p-12">
                    <div class="flex flex-col items-center gap-2">
                        <Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
                        <span class="text-sm text-gray-500">Loading Design Information...</span>
                    </div>
                </div>
            {:else}
                <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="file-number" class="block text-sm font-medium text-gray-700 mb-1">File Number:</label>
                            <input id="file-number" type="text" value={fileInfo.fileId} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <div>
                            <label for="file-origin" class="block text-sm font-medium text-gray-700 mb-1">File Origin:</label>
                            <input id="file-origin" type="text" value={fileInfo.fileOrigin} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <div>
                            <label for="design-type" class="block text-sm font-medium text-gray-700 mb-1">Design Type:</label>
                            <input id="design-type" type="text" value={mapDesignTypeToString(fileInfo.designType) || ''} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                    </div>
                    <div class="mt-4">
                        <label for="design-title" class="block text-sm font-medium text-gray-700 mb-1">Title of Design:</label>
                        <input id="design-title" type="text" value={fileInfo.fileTitle} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled />
                    </div>
                    <div class="mt-4">
                        <label for="novelty" class="block text-sm font-medium text-gray-700 mb-1">Statement of Novelty:</label>
                        <textarea id="novelty" value={fileInfo.statementOfNovelty} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" disabled rows="3"></textarea>
                    </div>
                </div>
            {/if}
        </div>

        <!-- New Applicant Name -->
        {#if showNameSection && fileInfo.applicants && fileInfo.applicants.length > 0}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">NEW APPLICANT NAME(S)</div>
                <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each fileInfo.applicants as applicant, i}
                            <div>
                                <label for={`applicant-name-${i}`} class="block text-sm font-medium text-gray-700 mb-1">Applicant Name {i + 1}:</label>
                                <input id={`applicant-name-${i}`} type="text" bind:value={newData.applicantNames[i]} placeholder={`Enter new name for applicant ${i + 1}`} class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                                <p class="text-xs text-gray-500 mt-1">Current name: <b>{applicant.name}</b></p>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        <!-- New Applicant Address -->
        {#if showAddressSection && fileInfo.applicants && fileInfo.applicants.length > 0}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">NEW ADDRESS INFORMATION(S)</div>
                <div class="p-4">
                    {#each fileInfo.applicants as applicant, i}
                        <details class="mb-4" open={i === 0}>
                            <summary class="cursor-pointer font-medium text-gray-700">Applicant {i + 1} Details</summary>
                            <div class="mt-2 grid grid-cols-1 gap-4">
                                <div>
                                    <label for={`applicant-name-${i}`} class="block text-sm font-medium text-gray-700 mb-1">Applicant Name:</label>
                                    <input id={`applicant-name-${i}`} type="text" value={applicant.name} class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" readonly />
                                </div>
                                <div>
                                    <label for={`applicant-address-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Address:</label>
                                    <textarea id={`applicant-address-${i}`} bind:value={newData.applicantAddresses[i]} placeholder="Enter new address" rows="2" class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                                    <p class="text-xs text-gray-500 mt-1">Current address: <b>{applicant.address}</b></p>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for={`applicant-email-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Email:</label>
                                        <input id={`applicant-email-${i}`} type="email" bind:value={newData.applicantEmails[i]} placeholder={applicant.email} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                                    </div>
                                    <div>
                                        <label for={`applicant-phone-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Phone:</label>
                                        <input id={`applicant-phone-${i}`} type="tel" bind:value={newData.applicantPhones[i]} placeholder={applicant.phone} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for={`applicant-state-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New State:</label>
                                        <input id={`applicant-state-${i}`} type="text" bind:value={newData.applicantStates[i]} placeholder={applicant.state} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                                    </div>
                                    <div>
                                        <label for={`applicant-city-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New City:</label>
                                        <input id={`applicant-city-${i}`} type="text" bind:value={newData.applicantCities[i]} placeholder={applicant.city} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <label for={`applicant-nationality-${i}`} class="block text-sm font-medium text-gray-700 mb-1">New Nationality:</label>
                                    <select id={`applicant-nationality-${i}`} bind:value={newData.applicantNationalities[i]} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500">
                                        <option value="" disabled>Select nationality</option>
                                        {#each Object.entries(countriesMap) as [code, name]}
                                            <option value={name}>{name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </details>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Title of Design Section -->
        {#if showTitleSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">UPDATE DESIGN TITLE</div>
                <div class="p-4 space-y-4">
                    <div>
                        <label for="new-title" class="block text-sm font-medium text-gray-700 mb-1">New Title of Design:</label>
                        <input id="new-title" type="text" bind:value={newData.fileTitle} placeholder="Enter new title" class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                        <label for="new-novelty" class="block text-sm font-medium text-gray-700 mb-1">New Statement of Novelty:</label>
                        <textarea id="new-novelty" bind:value={newData.statementOfNovelty} placeholder="Enter new statement of novelty" rows="3" class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"></textarea>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Add/Remove Applicants Section -->
        {#if showAddApplicantSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex items-center justify-between">
                    <span>MANAGE APPLICANTS</span>
                    <button type="button" on:click={addApplicantForm} class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Applicant
                    </button>
                </div>
                <div class="p-4">
                    <h4 class="font-medium text-gray-700 mb-2">Current Applicants</h4>
                    {#each fileInfo.applicants as applicant}
                        <div class="flex items-center gap-2 mb-2 p-2 border rounded {selectedRemoveIds.includes(applicant.id) ? 'bg-red-50 border-red-300' : ''}">
                            <input type="checkbox" checked={selectedRemoveIds.includes(applicant.id)} on:change={() => toggleApplicantRemoval(applicant.id)} />
                            <span class={selectedRemoveIds.includes(applicant.id) ? 'line-through text-red-500' : ''}>{applicant.name}</span>
                            {#if selectedRemoveIds.includes(applicant.id)}
                                <span class="text-xs text-red-500 ml-auto">Marked for removal</span>
                            {/if}
                        </div>
                    {/each}

                    {#if newApplicants.length > 0}
                        <h4 class="font-medium text-gray-700 mb-2 mt-4">New Applicants</h4>
                        {#each newApplicants as applicant, i}
                            <div class="border rounded p-3 mb-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium">New Applicant {i + 1}</span>
                                    <button type="button" on:click={() => removeApplicantForm(i)} class="text-red-500 text-sm">Remove</button>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input type="text" bind:value={applicant.name} placeholder="Name" class="px-3 py-2 border rounded-md" />
                                    <input type="email" bind:value={applicant.email} placeholder="Email" class="px-3 py-2 border rounded-md" />
                                    <input type="tel" bind:value={applicant.phone} placeholder="Phone" class="px-3 py-2 border rounded-md" />
                                    <select bind:value={applicant.nationality} class="px-3 py-2 border rounded-md">
                                        <option value="" disabled>Nationality</option>
                                        {#each Object.entries(countriesMap) as [code, name]}
                                            <option value={name}>{name}</option>
                                        {/each}
                                    </select>
                                    <input type="text" bind:value={applicant.state} placeholder="State" class="px-3 py-2 border rounded-md" />
                                    <input type="text" bind:value={applicant.city} placeholder="City" class="px-3 py-2 border rounded-md" />
                                    <textarea bind:value={applicant.address} placeholder="Address" rows="2" class="px-3 py-2 border rounded-md md:col-span-2"></textarea>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Creators Section -->
        {#if showCreatorsSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex items-center justify-between">
                    <span>MANAGE CREATORS</span>
                    <button type="button" on:click={addCreatorForm} class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Creator
                    </button>
                </div>
                <div class="p-4">
                    {#each creators as creator, i}
                        <div class="border rounded p-3 mb-3 {creatorsMarkedForDeletion.includes(creator.id) ? 'bg-red-50 border-red-300' : ''}">
                            <div class="flex items-center justify-between mb-2">
                                <button type="button" on:click={() => openCreators[i] = !openCreators[i]} class="font-medium text-gray-700 flex items-center gap-1">
                                    <Icon icon={openCreators[i] ? 'mdi:chevron-down' : 'mdi:chevron-right'} width="1.2rem" />
                                    Creator {i + 1}: {creator.name || 'New Creator'}
                                </button>
                                {#if creator.id}
                                    <button type="button" on:click={() => toggleCreatorDeletion(creator.id)} class="text-sm {creatorsMarkedForDeletion.includes(creator.id) ? 'text-green-600' : 'text-red-500'}">
                                        {creatorsMarkedForDeletion.includes(creator.id) ? 'Undo Remove' : 'Remove'}
                                    </button>
                                {/if}
                            </div>
                            {#if openCreators[i]}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input type="text" bind:value={creator.name} placeholder="Name" class="px-3 py-2 border rounded-md" />
                                    <input type="email" bind:value={creator.email} placeholder="Email" class="px-3 py-2 border rounded-md" />
                                    <input type="tel" bind:value={creator.phone} placeholder="Phone" class="px-3 py-2 border rounded-md" />
                                    <select bind:value={creator.country} class="px-3 py-2 border rounded-md">
                                        <option value="" disabled>Country</option>
                                        {#each Object.entries(countriesMap) as [code, name]}
                                            <option value={name}>{name}</option>
                                        {/each}
                                    </select>
                                    <input type="text" bind:value={creator.state} placeholder="State" class="px-3 py-2 border rounded-md" />
                                    <input type="text" bind:value={creator.city} placeholder="City" class="px-3 py-2 border rounded-md" />
                                    <textarea bind:value={creator.address} placeholder="Address" rows="2" class="px-3 py-2 border rounded-md md:col-span-2"></textarea>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Priority Info Section -->
        {#if showPriorityInfoSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex items-center justify-between">
                    <span>PRIORITY INFORMATION</span>
                    <button type="button" on:click={addPriorityInfo} class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                        + Add Priority
                    </button>
                </div>
                <div class="p-4">
                    {#each priorityInfoList as priority, i}
                        <div class="border rounded p-3 mb-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium">Priority {i + 1}</span>
                                <button type="button" on:click={() => removePriorityInfo(i)} class="text-red-500 text-sm">Remove</button>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="text" bind:value={priority.priorityNumber} placeholder="Priority Number" class="px-3 py-2 border rounded-md" />
                                <input type="date" bind:value={priority.priorityDate} class="px-3 py-2 border rounded-md" />
                                <select bind:value={priority.country} class="px-3 py-2 border rounded-md">
                                    <option value="" disabled>Country</option>
                                    {#each Object.entries(countriesMap) as [code, name]}
                                        <option value={name}>{name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Correspondence Section -->
        {#if showCorrespondenceSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">UPDATE CORRESPONDENCE</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="corr-name" class="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                        <input id="corr-name" type="text" bind:value={correspondenceName} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                        <label for="corr-email" class="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                        <input id="corr-email" type="email" bind:value={correspondenceEmail} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                        <label for="corr-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                        <input id="corr-phone" type="tel" bind:value={correspondencePhone} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                        <label for="corr-state" class="block text-sm font-medium text-gray-700 mb-1">State:</label>
                        <input id="corr-state" type="text" bind:value={correspondenceState} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                        <label for="corr-nationality" class="block text-sm font-medium text-gray-700 mb-1">Nationality:</label>
                        <select id="corr-nationality" bind:value={correspondenceNationality} class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500">
                            <option value="" disabled>Select nationality</option>
                            {#each Object.entries(countriesMap) as [code, name]}
                                <option value={name}>{name}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label for="corr-address" class="block text-sm font-medium text-gray-700 mb-1">Address:</label>
                        <textarea id="corr-address" bind:value={correspondenceAddress} rows="2" class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"></textarea>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Cost & Submit -->
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
            <div class="bg-gray-300 px-4 py-2 font-medium text-black">COST SUMMARY</div>
            <div class="p-4">
                {#if isLoading}
                    <p class="text-gray-500">Loading...</p>
                {:else}
                    <div class="flex justify-between items-center">
                        <span class="text-gray-700">Amendment Cost:</span>
                        <span class="text-xl font-bold text-green-600">₦{fileInfo.cost.toLocaleString()}</span>
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex justify-end">
            {#if !isLoading && fileInfo.cost > 0}
                <button on:click={handleSubmit} class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center" disabled={isProcessing}>
                    {#if isProcessing}
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    {:else}
                        Proceed To Pay
                    {/if}
                </button>
            {:else if !isLoading}
                <button class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>Loading...</button>
            {/if}
        </div>
    </div>
</div>
