<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';
    import { Button } from '$lib/components/ui/button';
    import { countriesMap } from '$lib/constants';
    import { baseURL } from '$lib/helpers';
    import {
        ClericalUpdateTypes,
        PatentTypes,
        PatentApplicationTypes
    } from '$lib/helpers';

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

    interface InventorInfo {
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

    interface PatentFileInfo {
        fileId: string;
        fileStatus: number;
        paymentRRR: string;
        cost: number;
        updateType: string;
        patentType: number;
        patentApplicationType: number;
        fileOrigin: string;
        fileTitle: string;
        patentAbstract: string;
        applicants: ApplicantInfo[];
        inventors: InventorInfo[];
        firstPriorityInfo?: PriorityInfo;
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
        patentAbstract: string;
        patentApplicationType: number;
    }

    let pageData = $page;
    let fileInfo: PatentFileInfo = {
        fileId: '',
        fileStatus: 0,
        paymentRRR: '',
        cost: 0,
        updateType: '',
        patentType: 0,
        patentApplicationType: 0,
        fileOrigin: '',
        fileTitle: '',
        patentAbstract: '',
        applicants: [],
        inventors: [],
        priorityInfoList: [],
        correspondenceName: '',
        correspondenceAddress: '',
        correspondencePhone: '',
        correspondenceEmail: '',
        correspondenceState: '',
        correspondenceNationality: '',
        fileType: 0
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
        patentAbstract: '',
        patentApplicationType: 0
    };

    let correspondenceName = '';
    let correspondenceAddress = '';
    let correspondencePhone = '';
    let correspondenceEmail = '';
    let correspondenceState = '';
    let correspondenceNationality = '';

    let firstPriorityInfo: PriorityInfo = {
        priorityNumber: '',
        priorityDate: '',
        country: ''
    };

    let priorityInfoList: PriorityInfo[] = [];

    let updateType = '';
    let isLoading = true;
    let isProcessing = false;
    let error: string | null = null;
    let formTitle = 'Patent Amendment';

    // Conditional sections visibility
    let showNameSection = false;
    let showAddressSection = false;
    let showTitleOfInventionSection = false;
    let showAddApplicantSection = false;
    let showInventorsSection = false;
    let showPriorityInfoSection = false;
    let showCorrespondenceSection = false;

    // Reactive variable to check if patent type allows priority info
    $: isPCTorConventional = fileInfo.patentType === PatentTypes.Conventional || 
                             fileInfo.patentType === PatentTypes.PCT;

    async function setData() {
        isLoading = true;
        const fileNumber = pageData.url.searchParams.get('fileId') ?? '';
        const fileType = pageData.url.searchParams.get('fileType') ?? '';
        updateType = pageData.url.searchParams.get('updateType') ?? '';

        // Convert to number for comparison with enum values
        const updateTypeNum = parseInt(updateType);

        // Set form title based on update type (using enum numeric values)
        switch (updateTypeNum) {
            case ClericalUpdateTypes.ApplicantName: // 4
                formTitle = 'Amendment: Update Applicant Name';
                showNameSection = true;
                break;
            case ClericalUpdateTypes.ApplicantAddress: // 5
                formTitle = 'Amendment: Update Applicant Address';
                showAddressSection = true;
                break;
            case ClericalUpdateTypes.FileTitle: // 7
                formTitle = 'Amendment: Update Title of Invention';
                showTitleOfInventionSection = true;
                break;
            case ClericalUpdateTypes.AddAndRemoveApplicant: // 10
                formTitle = 'Amendment: Add or Remove Applicants';
                showAddApplicantSection = true;
                break;
            case ClericalUpdateTypes.EditInventors: // 11
                formTitle = 'Amendment: Edit Inventors';
                showInventorsSection = true;
                break;
            case ClericalUpdateTypes.PriorityInfo: // 12
                formTitle = 'Amendment: Update Priority Information';
                showPriorityInfoSection = true;
                break;
            case ClericalUpdateTypes.CorrespondenceInformation: // 0
                formTitle = 'Amendment: Update Correspondence Information';
                showCorrespondenceSection = true;
                break;
        }

        try {
            const response = await fetch(
                `${baseURL}/api/files/GetPatentAmendmentCost?fileId=${fileNumber}&fileType=${fileType}&updateType=${updateType}`
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
                    patentType: result.data.patentType || 0,
                    patentApplicationType: result.data.patentApplicationType || 0,
                    fileOrigin: result.data.fileOrigin || 'National',
                    fileTitle: result.data.titleOfInvention || result.data.fileTitle || '',
                    patentAbstract: result.data.patentAbstract || '',
                    applicants: result.data.applicants || [],
                    inventors: result.data.inventors || [],
                    priorityInfoList: result.data.priorityInfo || [],
                    correspondenceName: result.data.correspondence?.name || '',
                    correspondenceAddress: result.data.correspondence?.address || '',
                    correspondencePhone: result.data.correspondence?.phone || '',
                    correspondenceEmail: result.data.correspondence?.email || '',
                    correspondenceState: result.data.correspondence?.state || '',
                    correspondenceNationality: result.data.correspondence?.nationality || '',
                    fileType: result.data.fileType || 0
                };

                // Initialize newData arrays based on applicants
                if (fileInfo.applicants && fileInfo.applicants.length > 0) {
                    newData.applicantNames = fileInfo.applicants.map((a) => a.name);
                    newData.applicantAddresses = fileInfo.applicants.map((a) => a.address);
                    newData.applicantEmails = fileInfo.applicants.map((a) => a.email);
                    newData.applicantPhones = fileInfo.applicants.map((a) => a.phone);
                    newData.applicantNationalities = fileInfo.applicants.map((a) => a.country);
                    newData.applicantStates = fileInfo.applicants.map((a) => a.state);
                    newData.applicantCities = fileInfo.applicants.map((a) => a.city);
                }

                // Initialize title and abstract
                newData.fileTitle = fileInfo.fileTitle;
                newData.patentAbstract = fileInfo.patentAbstract;
                newData.patentApplicationType = fileInfo.patentApplicationType;

                // Initialize correspondence
                correspondenceName = fileInfo.correspondenceName;
                correspondenceAddress = fileInfo.correspondenceAddress;
                correspondencePhone = fileInfo.correspondencePhone;
                correspondenceEmail = fileInfo.correspondenceEmail;
                correspondenceState = fileInfo.correspondenceState;
                correspondenceNationality = fileInfo.correspondenceNationality;

                // Initialize priority info
                if (result.data.firstPriorityInfo && result.data.firstPriorityInfo.length > 0) {
                    firstPriorityInfo = {
                        priorityNumber: result.data.firstPriorityInfo[0].number || '',
                        priorityDate: result.data.firstPriorityInfo[0].date || '',
                        country: result.data.firstPriorityInfo[0].country || ''
                    };
                }
                
                // Map priorityInfo array to priorityInfoList with correct field names
                priorityInfoList = (result.data.priorityInfo || []).map((p: any) => ({
                    priorityNumber: p.number || '',
                    priorityDate: p.date || '',
                    country: p.country || ''
                }));

                // Initialize inventors
                inventors = fileInfo.inventors || [];
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

    // function isPCTorConventional(): boolean {
    //     return (
    //         fileInfo.patentType === PatentTypes.Conventional ||
    //         fileInfo.patentType === PatentTypes.PCT
    //     );
    // }

    function getPatentTypeLabel(type: number): string {
        switch (type) {
            case PatentTypes.Conventional:
                return 'Conventional';
            case PatentTypes.Non_Conventional:
                return 'Non-Conventional';
            case PatentTypes.PCT:
                return 'PCT';
            default:
                return 'Unknown';
        }
    }

    function getPatentApplicationTypeLabel(type: number): string {
        switch (type) {
            case PatentApplicationTypes.Patent:
                return 'Patent';
            case PatentApplicationTypes.Business_Method:
                return 'Business Method';
            case PatentApplicationTypes.Utility_Model:
                return 'Utility Model';
            default:
                return 'Unknown';
        }
    }

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

    // Inventor management
    let openInventors: Record<number, boolean> = {};
    let inventors: InventorInfo[] = [];
    let inventorsMarkedForDeletion: string[] = [];

    function addInventorForm() {
        inventors = [
            ...inventors,
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
        openInventors[inventors.length - 1] = true;
    }

    function toggleInventorDeletion(inventorId: string) {
        if (inventorsMarkedForDeletion.includes(inventorId)) {
            inventorsMarkedForDeletion = inventorsMarkedForDeletion.filter((id) => id !== inventorId);
        } else {
            inventorsMarkedForDeletion = [...inventorsMarkedForDeletion, inventorId];
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
        if (showTitleOfInventionSection) {
            if (!newData.fileTitle?.trim() || !newData.patentAbstract?.trim()) {
                error = 'Please enter the new Title and Abstract.';
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
                FileType: fileInfo.fileType ?? 0,
                PaymentRRR: fileInfo.paymentRRR ?? ''
            };

            if (updateTypeNum === ClericalUpdateTypes.PriorityInfo) {
                if (isPCTorConventional) {
                    formObj.FirstPriorityInfo = [{
                        number: firstPriorityInfo.priorityNumber,
                        Date: firstPriorityInfo.priorityDate,
                        country: firstPriorityInfo.country
                    }];
                }
                formObj.PriorityInfo = (priorityInfoList || []).map(p => ({
                    number: p.priorityNumber,
                    Date: p.priorityDate,
                    country: p.country
                }));
            }

            if (updateTypeNum === ClericalUpdateTypes.EditInventors) {
                const filteredInventors = inventors.filter(
                    (inv) => !inventorsMarkedForDeletion.includes(inv.id)
                );
                formObj.NewInventors = filteredInventors;
            }

            if (updateTypeNum === ClericalUpdateTypes.AddAndRemoveApplicant) {
                // Get existing applicants that were not marked for deletion
                const editedApplicants = fileInfo.applicants.filter(
                    (a) => !selectedRemoveIds.includes(a.id)
                );
                
                // Send all data
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
                formObj.PatentAbstract = newData.patentAbstract;
                formObj.PatentApplicationType = String(newData.patentApplicationType);
            } else if (updateTypeNum === ClericalUpdateTypes.CorrespondenceInformation) {
                formObj.CorrespondenceName = correspondenceName;
                formObj.CorrespondenceAddress = correspondenceAddress;
                formObj.CorrespondencePhone = correspondencePhone;
                formObj.CorrespondenceEmail = correspondenceEmail;
                formObj.CorrespondenceState = correspondenceState;
                formObj.CorrespondenceNationality = correspondenceNationality;
            }

            // Store the form data in sessionStorage for the result page to submit
            sessionStorage.setItem('patentAmendmentPayload', JSON.stringify(formObj));

            // Navigate to payment
            goto(
                `/payment/?type=patent-amendment&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}&fileId=${fileNumber}`
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
    <!-- Header -->
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
            <h1 class="text-xl font-bold">
                {formTitle}
            </h1>
            <p class="font-light">Fill in the new information</p>
        </div>
    </div>

    <!-- Form -->
    <div class="px-6 py-6 overflow-y-auto">
        {#if error}
            <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p class="text-sm text-red-700">{error}</p>
            </div>
        {/if}

        <!-- Section 1: Current Patent Information -->
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
            <div class="bg-gray-300 px-4 py-2 font-medium text-black">PATENT INFORMATION</div>
            {#if isLoading}
                <div class="flex items-center justify-center p-12">
                    <div class="flex flex-col items-center gap-2">
                        <Icon
                            icon="line-md:loading-loop"
                            width="2rem"
                            height="2rem"
                            class="text-blue-600"
                        />
                        <span class="text-sm text-gray-500">Loading Patent Information...</span>
                    </div>
                </div>
            {:else}
                <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="file-number" class="block text-sm font-medium text-gray-700 mb-1"
                                >File Number:</label
                            >
                            <input
                                id="file-number"
                                type="text"
                                value={fileInfo.fileId}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                disabled
                            />
                        </div>
                        <div>
                            <label for="file-origin" class="block text-sm font-medium text-gray-700 mb-1"
                                >File Origin:</label
                            >
                            <input
                                id="file-origin"
                                type="text"
                                value={fileInfo.fileOrigin}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                disabled
                            />
                        </div>
                        <div>
                            <label for="patent-type" class="block text-sm font-medium text-gray-700 mb-1"
                                >Patent Type:</label
                            >
                            <input
                                id="patent-type"
                                type="text"
                                value={getPatentTypeLabel(fileInfo.patentType)}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                disabled
                            />
                        </div>
                        <div>
                            <label
                                for="patent-application-type"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Patent Application Type:</label
                            >
                            <input
                                id="patent-application-type"
                                type="text"
                                value={getPatentApplicationTypeLabel(fileInfo.patentApplicationType)}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                disabled
                            />
                        </div>
                    </div>
                    <div class="mt-4">
                        <label
                            for="title-of-invention"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Title of Invention:</label
                        >
                        <input
                            id="title-of-invention"
                            type="text"
                            value={fileInfo.fileTitle}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            disabled
                        />
                    </div>
                    <div class="mt-4">
                        <label for="patent-abstract" class="block text-sm font-medium text-gray-700 mb-1"
                            >Patent Abstract:</label
                        >
                        <textarea
                            id="patent-abstract"
                            value={fileInfo.patentAbstract}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            disabled
                            rows="3"
                        ></textarea>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Section 2: New Applicant Name -->
        {#if showNameSection && fileInfo.applicants && fileInfo.applicants.length > 0}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    NEW APPLICANT NAME(S)
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each fileInfo.applicants as applicant, i}
                            <div>
                                <label
                                    for={`applicant-name-${i}`}
                                    class="block text-sm font-medium text-gray-700 mb-1"
                                >
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
                                <p class="text-xs text-gray-500 mt-1">
                                    Current name: <b>{applicant.name}</b>
                                </p>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Section 3: New Applicant Address -->
        {#if showAddressSection && fileInfo.applicants && fileInfo.applicants.length > 0}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    NEW ADDRESS INFORMATION(S)
                </div>
                <div class="p-4">
                    {#each fileInfo.applicants as applicant, i}
                        <details class="mb-4" open={i === 0}>
                            <summary class="cursor-pointer font-medium text-gray-700">
                                Applicant {i + 1} Details
                            </summary>
                            <div class="mt-2 grid grid-cols-1 gap-4">
                                <div>
                                    <label
                                        for={`applicant-name-${i}`}
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Applicant Name:</label
                                    >
                                    <input
                                        id={`applicant-name-${i}`}
                                        type="text"
                                        value={applicant.name}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                        readonly
                                    />
                                </div>
                                <div>
                                    <label
                                        for={`applicant-address-${i}`}
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >New Address:</label
                                    >
                                    <textarea
                                        id={`applicant-address-${i}`}
                                        bind:value={newData.applicantAddresses[i]}
                                        placeholder="Enter new address"
                                        rows="2"
                                        class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                        class:border-red-500={error && showAddressSection}
                                    />
                                    <p class="text-xs text-gray-500 mt-1">
                                        Current address: <b>{applicant.address}</b>
                                    </p>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            for={`applicant-email-${i}`}
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >New Email:</label
                                        >
                                        <input
                                            id={`applicant-email-${i}`}
                                            type="email"
                                            bind:value={newData.applicantEmails[i]}
                                            placeholder={applicant.email}
                                            class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                            class:border-red-500={error && showAddressSection}
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            Current email: <b>{applicant.email}</b>
                                        </p>
                                    </div>
                                    <div>
                                        <label
                                            for={`applicant-phone-${i}`}
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >New Phone:</label
                                        >
                                        <input
                                            id={`applicant-phone-${i}`}
                                            type="tel"
                                            bind:value={newData.applicantPhones[i]}
                                            placeholder={applicant.phone}
                                            class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                            class:border-red-500={error && showAddressSection}
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            Current phone: <b>{applicant.phone}</b>
                                        </p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            for={`applicant-state-${i}`}
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >New State:</label
                                        >
                                        <input
                                            id={`applicant-state-${i}`}
                                            type="text"
                                            bind:value={newData.applicantStates[i]}
                                            placeholder={applicant.state}
                                            class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                            class:border-red-500={error && showAddressSection}
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            Current state: <b>{applicant.state}</b>
                                        </p>
                                    </div>
                                    <div>
                                        <label
                                            for={`applicant-country-${i}`}
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >New Country:</label
                                        >
                                        <select
                                            id={`applicant-country-${i}`}
                                            bind:value={newData.applicantNationalities[i]}
                                            class="w-full px-3 py-2 border rounded-md focus:ring-gray-900 focus:border-gray-900"
                                            class:border-red-500={error && showAddressSection}
                                            required
                                        >
                                            <option value="" disabled>Select nationality</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                        <p class="text-xs text-gray-500 mt-1">
                                            Current nationality: <b>{applicant.country}</b>
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label
                                        for={`applicant-city-${i}`}
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >New City:</label
                                    >
                                    <input
                                        id={`applicant-city-${i}`}
                                        type="text"
                                        bind:value={newData.applicantCities[i]}
                                        placeholder={applicant.city}
                                        class="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                        class:border-red-500={error && showAddressSection}
                                    />
                                    <p class="text-xs text-gray-500 mt-1">
                                        Current city: <b>{applicant.city}</b>
                                    </p>
                                </div>
                            </div>
                        </details>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Section 4: New Title, Abstract, and Application Type -->
        {#if showTitleOfInventionSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    NEW PATENT ABSTRACT
                </div>
                <div class="p-4">
                    <div>
                        <label
                            for="patent-abstract-new"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >New Patent Abstract:</label
                        >
                        <textarea
                            id="patent-abstract-new"
                            bind:value={newData.patentAbstract}
                            placeholder="Enter new patent abstract"
                            class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            rows="3"
                        ></textarea>
                        <p class="text-xs text-gray-500 mt-1">
                            This will replace the current patent abstract shown above.
                        </p>
                    </div>
                </div>
            </div>
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    NEW TITLE OF INVENTION & APPLICATION TYPE
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            for="title-of-invention-new"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >New Title of Invention:</label
                        >
                        <input
                            id="title-of-invention-new"
                            type="text"
                            bind:value={newData.fileTitle}
                            placeholder="Enter new title of invention"
                            class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            class:border-red-500={error && showTitleOfInventionSection}
                        />
                        <p class="text-xs text-gray-500 mt-1">
                            This will replace the current title shown above.
                        </p>
                    </div>
                    <div>
                        <label
                            for="patent-application-type-new"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >New Patent Application Type:</label
                        >
                        <select
                            id="patent-application-type-new"
                            bind:value={newData.patentApplicationType}
                            class="w-full px-3 py-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        >
                            <option value="" disabled>Select application type</option>
                            <option value={PatentApplicationTypes.Patent}>Patent</option>
                            <option value={PatentApplicationTypes.Business_Method}
                                >Business Method</option
                            >
                            <option value={PatentApplicationTypes.Utility_Model}>Utility Model</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">
                            This will replace the current application type shown above.
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Section 5: Add or Remove Applicants -->
        {#if showAddApplicantSection}
            <!-- Existing Applicants -->
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-100 px-4 py-2 font-medium text-gray-900 flex justify-between items-center">
                    <span>EXISTING APPLICANTS (Edit or Mark for Removal)</span>
                    {#if selectedRemoveIds.length > 0}
                        <span class="text-sm text-red-600">
                            {selectedRemoveIds.length} marked for removal
                        </span>
                    {/if}
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-600 mb-4 italic">
                        You can edit the details below, or mark applicants for removal. Fields will be disabled once marked for removal.
                    </p>
                    {#if fileInfo.applicants && fileInfo.applicants.length > 0}
                        {#each fileInfo.applicants as applicant, i}
                            <details
                                class="mb-4 border border-gray-300 rounded-lg shadow-sm overflow-hidden"
                            >
                                <summary
                                    class="cursor-pointer font-semibold text-lg bg-gray-200 px-4 py-2 flex items-center justify-between"
                                >
                                    <span>Applicant {i + 1}</span>
                                    {#if selectedRemoveIds.includes(applicant.id)}
                                        <span
                                            class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                                            >To be deleted</span
                                        >
                                    {/if}
                                </summary>
                                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Name:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.name}
                                            placeholder="Enter applicant name"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Email:</label
                                        >
                                        <input
                                            type="email"
                                            bind:value={applicant.email}
                                            placeholder="Enter email"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Phone:</label
                                        >
                                        <input
                                            type="tel"
                                            bind:value={applicant.phone}
                                            placeholder="Enter phone"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Address:</label
                                        >
                                        <textarea
                                            bind:value={applicant.address}
                                            placeholder="Enter address"
                                            rows="2"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >City:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.city}
                                            placeholder="Enter city"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >State:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.state}
                                            placeholder="Enter state"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Country:</label
                                        >
                                        <select
                                            bind:value={applicant.country}
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={selectedRemoveIds.includes(applicant.id)}
                                        >
                                            <option value="" disabled>Select country</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="md:col-span-2 flex justify-end mt-2">
                                        <Button
                                            variant={selectedRemoveIds.includes(applicant.id)
                                                ? 'default'
                                                : 'destructive'}
                                            on:click={() => toggleApplicantRemoval(applicant.id)}
                                        >
                                            {selectedRemoveIds.includes(applicant.id)
                                                ? 'Undo Removal'
                                                : 'Mark for Removal'}
                                        </Button>
                                    </div>
                                </div>
                            </details>
                        {/each}
                    {:else}
                        <p class="text-sm text-gray-500">No existing applicants.</p>
                    {/if}
                </div>
            </div>

            <!-- New Applicants -->
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex justify-between items-center">
                    <span>NEW APPLICANTS</span>
                    <Button variant="outline" size="sm" on:click={addApplicantForm}>
                        <Icon icon="mdi:plus" class="mr-1" />
                        Add Applicant
                    </Button>
                </div>
                <div class="p-4">
                    {#if newApplicants.length > 0}
                        {#each newApplicants as applicant, i}
                            <div class="mb-4 border border-gray-300 rounded-lg p-4 relative">
                                <button
                                    type="button"
                                    class="absolute top-2 right-2 text-red-600 hover:text-red-800"
                                    on:click={() => removeApplicantForm(i)}
                                >
                                    <Icon icon="mdi:close" width="1.5rem" height="1.5rem" />
                                </button>
                                <h4 class="font-medium mb-3">New Applicant {i + 1}</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Name:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.name}
                                            placeholder="Enter applicant name"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Email:</label
                                        >
                                        <input
                                            type="email"
                                            bind:value={applicant.email}
                                            placeholder="Enter email"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Phone:</label
                                        >
                                        <input
                                            type="tel"
                                            bind:value={applicant.phone}
                                            placeholder="Enter phone number"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Address:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.address}
                                            placeholder="Enter address"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >City:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.city}
                                            placeholder="Enter city"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >State:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={applicant.state}
                                            placeholder="Enter state"
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Country:</label
                                        >
                                        <select
                                            bind:value={applicant.country}
                                            class="w-full px-3 py-2 border rounded-md"
                                            required
                                        >
                                            <option value="" disabled selected>Select country</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <p class="text-sm text-gray-500">
                            No new applicants added. Click "Add Applicant" to add one.
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Section 6: Edit Inventors -->
        {#if showInventorsSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex justify-between items-center">
                    <span>INVENTORS</span>
                    <Button variant="outline" size="sm" on:click={addInventorForm}>
                        <Icon icon="mdi:plus" class="mr-1" />
                        Add Inventor
                    </Button>
                </div>
                <div class="p-4">
                    {#if inventors.length > 0}
                        {#each inventors as inventor, i}
                            <details
                                class="mb-4 border border-gray-300 rounded-lg shadow-sm overflow-hidden"
                                open={openInventors[i]}
                            >
                                <summary
                                    class="cursor-pointer font-semibold text-lg bg-gray-200 px-4 py-2 flex items-center justify-between"
                                >
                                    <span>Inventor {i + 1}</span>
                                    {#if inventorsMarkedForDeletion.includes(inventor.id)}
                                        <span
                                            class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                                            >To be deleted</span
                                        >
                                    {/if}
                                </summary>
                                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Name:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={inventor.name}
                                            placeholder="Enter inventor name"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Email:</label
                                        >
                                        <input
                                            type="email"
                                            bind:value={inventor.email}
                                            placeholder="Enter email"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Phone:</label
                                        >
                                        <input
                                            type="tel"
                                            bind:value={inventor.phone}
                                            placeholder="Enter phone"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Address:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={inventor.address}
                                            placeholder="Enter address"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >City:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={inventor.city}
                                            placeholder="Enter city"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >State:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={inventor.state}
                                            placeholder="Enter state"
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Country:</label
                                        >
                                        <select
                                            bind:value={inventor.country}
                                            class="w-full px-3 py-2 border rounded-md"
                                            disabled={inventorsMarkedForDeletion.includes(inventor.id)}
                                        >
                                            <option value="" disabled>Select country</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    {#if inventor.id}
                                        <div class="md:col-span-2 flex justify-end mt-2">
                                            <Button
                                                variant={inventorsMarkedForDeletion.includes(inventor.id)
                                                    ? 'default'
                                                    : 'destructive'}
                                                on:click={() => toggleInventorDeletion(inventor.id)}
                                            >
                                                {inventorsMarkedForDeletion.includes(inventor.id)
                                                    ? 'Undo Removal'
                                                    : 'Mark for Removal'}
                                            </Button>
                                        </div>
                                    {/if}
                                </div>
                            </details>
                        {/each}
                    {:else}
                        <p class="text-sm text-gray-500">
                            No inventors added. Click "Add Inventor" to add one.
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Section 7: Priority Information -->
        <!-- First Priority Info - Only for Conventional/PCT -->
        {#if showPriorityInfoSection && isPCTorConventional}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    FIRST PRIORITY INFORMATION
                </div>
                    <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Priority Number:</label
                            >
                            <input
                                type="text"
                                bind:value={firstPriorityInfo.priorityNumber}
                                placeholder="Enter priority number"
                                class="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Priority Date:</label
                            >
                            <input
                                type="date"
                                bind:value={firstPriorityInfo.priorityDate}
                                class="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Country:</label
                            >
                            <select
                                bind:value={firstPriorityInfo.country}
                                class="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="" disabled>Select country</option>
                                {#each Object.entries(countriesMap) as [code, name]}
                                    <option value={name}>{name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>
        {/if}

        <!-- Priority Information List - For ALL patent types -->
        {#if showPriorityInfoSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900 flex justify-between items-center">
                    <span>PRIORITY INFORMATION LIST</span>
                    <Button variant="outline" size="sm" on:click={addPriorityInfo}>
                        <Icon icon="mdi:plus" class="mr-1" />
                        Add Priority
                    </Button>
                </div>
                <div class="p-4">
                    {#if priorityInfoList.length > 0}
                        {#each priorityInfoList as priority, i}
                            <div class="mb-4 border border-gray-300 rounded-lg p-4 relative">
                                <button
                                    type="button"
                                    class="absolute top-2 right-2 text-red-600 hover:text-red-800"
                                    on:click={() => removePriorityInfo(i)}
                                >
                                    <Icon icon="mdi:close" width="1.5rem" height="1.5rem" />
                                </button>
                                <h4 class="font-medium mb-3">Priority {i + 1}</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Priority Number:</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={priority.priorityNumber}
                                            placeholder="Enter number"
                                            class="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Priority Date:</label
                                        >
                                        <input
                                            type="date"
                                            bind:value={priority.priorityDate}
                                            class="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1"
                                            >Country:</label
                                        >
                                        <select
                                            bind:value={priority.country}
                                            class="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="" disabled>Select country</option>
                                            {#each Object.entries(countriesMap) as [code, name]}
                                                <option value={name}>{name}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <p class="text-sm text-gray-500">
                            No priority information added. Click "Add Priority" to add one.
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Section 8: Correspondence Information -->
        {#if showCorrespondenceSection}
            <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
                <div class="bg-gray-200 px-4 py-2 font-medium text-gray-900">
                    EDIT CORRESPONDENCE INFORMATION
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-600 mb-4 italic">
                        Edit the correspondence details below. Current values are shown for reference.
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence Name:</label
                            >
                            <input
                                type="text"
                                bind:value={correspondenceName}
                                placeholder="Enter correspondence name"
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondenceName}</b>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence Email:</label
                            >
                            <input
                                type="email"
                                bind:value={correspondenceEmail}
                                placeholder="Enter email"
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondenceEmail}</b>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence Phone:</label
                            >
                            <input
                                type="tel"
                                bind:value={correspondencePhone}
                                placeholder="Enter phone"
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondencePhone}</b>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence Address:</label
                            >
                            <input
                                type="text"
                                bind:value={correspondenceAddress}
                                placeholder="Enter address"
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondenceAddress}</b>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence State:</label
                            >
                            <input
                                type="text"
                                bind:value={correspondenceState}
                                placeholder="Enter state"
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            />
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondenceState}</b>
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1"
                                >Correspondence Nationality:</label
                            >
                            <select
                                bind:value={correspondenceNationality}
                                class="w-full px-3 py-2 border rounded-md"
                                class:border-red-500={error && showCorrespondenceSection}
                            >
                                <option value="" disabled>Select nationality</option>
                                {#each Object.entries(countriesMap) as [code, name]}
                                    <option value={name}>{name}</option>
                                {/each}
                            </select>
                            <p class="text-xs text-gray-500 mt-1">
                                Current: <b>{fileInfo.correspondenceNationality}</b>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Submit Button -->
        <div class="flex justify-end mt-6">
            <Button
                on:click={handleSubmit}
                disabled={isProcessing || isLoading}
                class="w-full md:w-auto bg-green-600"
            >
                {#if isProcessing}
                    <Icon icon="line-md:loading-loop" class="mr-2" />
                    Processing...
                {:else}
                    Proceed To Pay 
                {/if}
            </Button>
        </div>
    </div>
</div>
