<script lang="ts">
  import { getServicesForIPType, getServicesByCategory, type IPService } from '$lib/services';
  import ServiceGrid from './ServiceGrid.svelte';
  import Icon from '@iconify/svelte';
  import { Button } from '$lib/components/ui/button';
  import AvailabilitySearchModal from './AvailabilitySearchModal.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { onMount, onDestroy } from 'svelte';
  import { baseURL } from '$lib/helpers';
  import { mapDateToString, fileTypeToString } from './dashboardutils';
  import { getLetterName } from '../../dataview/datahelpers';
  import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';

  export let ipType: 'trademark' | 'patent' | 'design';
  export let onBack: () => void;

  let viewMode: 'grid' | 'list' = 'grid';
  let selectedCategory: string | null = null;
  
  // Modal states - following the exact same pattern as dashboard
  let isAvailabilityModalOpen = false;
  let showPayCertModal: boolean = false;
  let showVerifyPaymentDialog = false;
  let showChangeOfAgentDialog = false;
  let showGetDocumentsDialog = false;
  let showFileAppealsDialog: boolean = false;

  // Pay Certificate variables - exact same as dashboard
  let payCertFileNumber: string = '';
  let payCertLoading: boolean = false;
  let payCertResults: any[] | null = null;
  let error: string | null = null;
  let filteredResults: any[] | undefined;

  // Verify Payment variables - exact same as dashboard  
  let verifyRRR = '';
  let verifyPaymentLoading = false;
  let verifyPaymentResult: any = null;
  let verifyPaymentError: string | null = null;

  // Change of Agent variables - exact same as dashboard
  let changeAgentError: string | null = null;
  let changeAgentResult: any[] = [];
  let changeAgentFileNumber: string = '';
  let changeAgentLoading = false;
  let changeAgentSearched = false;

  // Get Documents variables - exact same as dashboard
  let getDocFileNumber = '';
  let getDocPaymentId = '';
  let getDocLoading = false;
  let getDocResult: any = null;
  let getDocError: string | null = null;
  let documents: any[] = [];
  let appId: string = '';

  // File Appeals variables - exact same as dashboard
  let appealsFileNumber: string = '';
  let appealsResults: any[] | undefined;
  let appealsLoading: boolean = false;
  let appealsError: string | null = null;
  let selectedAppealFile: any = null;
  let appealFiles: File[] = [];
  let appealFileInput: HTMLInputElement;
  let appealUploadLoading: boolean = false;
  let appealUploadError: string | null = null;
  let appealUploadSuccess: boolean = false;
  let showFileAppealsResultsDialog: boolean = false;
  let showAppealUploadDialog: boolean = false;

  $: services = getServicesForIPType(ipType);
  $: servicesByCategory = getServicesByCategory(services);
  $: categories = Object.keys(servicesByCategory);

  // Functions - exact same implementations as dashboard
  async function searchPayCert() {
    payCertLoading = true;

    const response = await fetch(
      `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${payCertFileNumber}`
    );
    if (response.ok) {
      payCertResults = await response.json();
    } else {
      error = 'Failed to fetch search results';
    }

    filteredResults = payCertResults?.filter((result) => result.fileStatus == 20);
    payCertLoading = false;
  }

  async function verifyRemitaPayment() {
    verifyPaymentError = null;
    verifyPaymentResult = null;
    if (!verifyRRR.trim()) {
      verifyPaymentError = 'Please enter a valid RRR.';
      return;
    }
    verifyPaymentLoading = true;
    try {
      const response = await fetch(`${baseURL}/api/payments/check?id=${verifyRRR.trim()}`);
      if (!response.ok) throw new Error('Verification failed');
      const result = await response.json();
      verifyPaymentResult = result;
    } catch (e) {
      verifyPaymentError = 'Failed to verify payment. Please check the RRR and try again.';
    }
    verifyPaymentLoading = false;
  }

  // Additional functions - exact same implementations as dashboard
  async function searchChangeOfAgent() {
    changeAgentError = null;
    changeAgentResult = [];
    if (!changeAgentFileNumber.trim()) {
      changeAgentError = 'Please enter File Number';
      return;
    }
    changeAgentLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(changeAgentFileNumber.trim())}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        changeAgentError = errorData.message || 'An error occurred';
        throw new Error(changeAgentError ?? 'An error occurred');
      }
      changeAgentResult = await response.json();
    } catch (e: any) {
      changeAgentError = e.Message || e;
    }
    changeAgentLoading = false;
  }

  async function getDocuments() {
    getDocError = null;
    getDocResult = null;
    if (!getDocFileNumber.trim() || !getDocPaymentId.trim()) {
      getDocError = 'Please enter both File Number and Payment ID.';
      return;
    }
    getDocLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/letters/GetDocuments?fileId=${encodeURIComponent(getDocFileNumber.trim())}&paymentId=${encodeURIComponent(getDocPaymentId.trim())}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        getDocError = errorData.message || 'An error occurred';
        throw new Error(getDocError ?? 'An error occurred');
      }
      getDocResult = await response.json();
      if (getDocResult.documents && Array.isArray(getDocResult.documents)) {
        documents = getDocResult.documents;
        appId = getDocResult.applicationId;
      } else {
        documents = [];
      }
    } catch (e: any) {
      getDocError = e.Message || e;
    }
    getDocLoading = false;
  }

  function generateLetter(fileId: string, letterType: any, applicationId: string) {
    window.open(
      `${baseURL}/api/letters/generate?fileId=${fileId}&letterType=${letterType}&applicationId=${applicationId}`
    );
  }

  async function searchFileAppeals(): Promise<void> {
    if (!appealsFileNumber.trim()) {
      appealsError = 'Please enter a file number';
      return;
    }

    appealsLoading = true;
    appealsError = null;
    appealsResults = undefined;

    try {
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(appealsFileNumber.trim())}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        appealsError = errorData.message || 'An error occurred';
        throw new Error(appealsError || 'Unknown error');
      }

      const data = await response.json();
      const filteredAppealsResults = data.filter((result: any) => result.fileStatus == 11);

      if (filteredAppealsResults?.length == 0) {
        appealsError = 'Appeals can only be filed for files with status "Rejected".';
        return;
      } else {
        appealsResults = filteredAppealsResults;
      }

      showFileAppealsDialog = false;
      showFileAppealsResultsDialog = true;
    } catch (error: any) {
      console.error('Error searching for appeals:', error);
      appealsError = error.message || 'Error searching for file. Please try again.';
    } finally {
      appealsLoading = false;
    }
  }

  // Additional functions for modal functionality - exact same as dashboard
  let ownershipForm: any = undefined;
  let showOwnership = false;
  let ownershipData: any = null;
  
  async function showOwnershipForm() {
    if (!ownershipForm) {
      ownershipForm = (await import('../../dataview/Components/OwnershipForm.svelte')).default;
    }
    let closed = () => (showOwnership = false);
    const file = Array.isArray(changeAgentResult) ? changeAgentResult[0] : changeAgentResult;
    console.log(file);

    if (!file?.fileId) {
      console.error('File data incomplete. Cannot update ownership.');
      return;
    }
    ownershipData = {
      closed: closed,
      requiredData: {
        fileId: file?.fileId,
        oldCorrespondence: file?.correspondence,
        oldId: file?.creatorAccount || null
      }
    };
    showOwnership = true;
  }

  // Open appeal upload dialog
  function openAppealUpload(file: any): void {
    selectedAppealFile = file;
    appealFiles = [];
    appealUploadError = null;
    appealUploadSuccess = false;
    showFileAppealsResultsDialog = false;
    showAppealUploadDialog = true;
  }

  // Handle file selection
  function handleAppealFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    appealUploadError = null;
    appealUploadSuccess = false;

    // Validate files
    const validFiles = files.filter((file: File) => {
      if (file.type !== 'application/pdf') {
        appealUploadError = 'Only PDF files are allowed';
        return false;
      }

      // Optional: Check file size (e.g., 10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        appealUploadError = 'File size must be less than 10MB';
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      appealFiles = [...appealFiles, ...validFiles];
      // Clear the input so the same file can be selected again if needed
      if (appealFileInput) {
        appealFileInput.value = '';
      }
    }
  }

  // Remove a selected file
  function removeAppealFile(index: number): void {
    appealFiles = appealFiles.filter((_, i) => i !== index);
  }

  // Upload appeal documents
  async function uploadAppealDocuments(): Promise<void> {
    if (appealFiles.length === 0) {
      appealUploadError = 'Please select at least one PDF file';
      return;
    }

    appealUploadLoading = true;
    appealUploadError = null;
    appealUploadSuccess = false;

    try {
      const formData = new FormData();
      formData.append('FileNumber', selectedAppealFile.fileId);

      // Append each file to the FormData
      appealFiles.forEach((file, index) => {
        formData.append(`Docs`, file);
      });

      const response = await fetch(`${baseURL}/api/files/appeal-module`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Handle non-JSON error responses
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, fall back to text
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
        }
      }
      // const result = await response.json();
      appealUploadSuccess = true;
      appealUploadError = null;

      // Clear files after successful upload
      appealFiles = [];

      // Optional: Close dialog after a delay
      setTimeout(() => {
        closeAppealUpload();
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading appeal documents:', error);
      appealUploadError = error.message || 'Error uploading documents. Please try again.';
    } finally {
      appealUploadLoading = false;
    }
  }

  // Close appeal upload dialog
  function closeAppealUpload(): void {
    showAppealUploadDialog = false;
    selectedAppealFile = null;
    appealFiles = [];
    appealUploadError = null;
    appealUploadSuccess = false;
    showFileAppealsResultsDialog = true;
  }

  // Handle modal opening - following exact same pattern as dashboard
  function handleOpenAvailabilitySearch() {
    isAvailabilityModalOpen = true;
  }
  
  function handleOpenPayCertModal() {
    showPayCertModal = true;
  }
  
  function handleOpenVerifyPaymentModal() {
    showVerifyPaymentDialog = true;
  }
  
  function handleOpenChangeOfAgentModal() {
    showChangeOfAgentDialog = true;
  }
  
  function handleOpenGetDocumentsModal() {
    showGetDocumentsDialog = true;
  }
  
  function handleOpenFileAppealsModal() {
    showFileAppealsDialog = true;
  }

  // Event listeners for custom events from ServiceGrid - same pattern as dashboard
  onMount(() => {
    window.addEventListener('openAvailabilitySearch', handleOpenAvailabilitySearch);
    window.addEventListener('openPayCertModal', handleOpenPayCertModal);
    window.addEventListener('openVerifyPaymentModal', handleOpenVerifyPaymentModal);
    window.addEventListener('openChangeOfAgentModal', handleOpenChangeOfAgentModal);
    window.addEventListener('openGetDocumentsModal', handleOpenGetDocumentsModal);
    window.addEventListener('openFileAppealsModal', handleOpenFileAppealsModal);
  });

  onDestroy(() => {
    window.removeEventListener('openAvailabilitySearch', handleOpenAvailabilitySearch);
    window.removeEventListener('openPayCertModal', handleOpenPayCertModal);
    window.removeEventListener('openVerifyPaymentModal', handleOpenVerifyPaymentModal);
    window.removeEventListener('openChangeOfAgentModal', handleOpenChangeOfAgentModal);
    window.removeEventListener('openGetDocumentsModal', handleOpenGetDocumentsModal);
    window.removeEventListener('openFileAppealsModal', handleOpenFileAppealsModal);
  });

  function getIPIcon(type: string): string {
    const icons: Record<string, string> = {
      trademark: 'mdi:scale-balance',
      patent: 'mdi:lightbulb-outline',
      design: 'mdi:palette-outline'
    };
    return icons[type] || 'mdi:file';
  }

  function getIPTitle(type: string): string {
    const titles: Record<string, string> = {
      trademark: 'Trademark Services',
      patent: 'Patent Services', 
      design: 'Design Services'
    };
    return titles[type] || 'Services';
  }

  function getIPDescription(type: string): string {
    const descriptions: Record<string, string> = {
      trademark: 'Register and protect your brand identity',
      patent: 'Protect your inventions and innovations',
      design: 'Safeguard your creative designs'
    };
    return descriptions[type] || 'Available services';
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      filing: 'mdi:file-plus',
      search: 'mdi:magnify',
      management: 'mdi:cog',
      financial: 'mdi:cash',
      administrative: 'mdi:clipboard-text'
    };
    return icons[category] || 'mdi:folder';
  }
</script>

<div class="h-full flex flex-col bg-slate-50/50 rounded-xl">
  <div class="max-w-7xl mx-auto w-full h-full flex flex-col">
    <!-- FIXED HEADER SECTION - Does not scroll -->
    <div class="flex-shrink-0 p-6 pb-4">
      <!-- Back Button and View Toggle -->
      <div class="flex items-center justify-between mb-4">
        <Button 
          on:click={onBack}
          class="flex items-center"
        >
          <Icon icon="mdi:arrow-left" class="text-xl group-hover:translate-x-[-2px] transition-transform" />
          <span class="">Back</span>
        </Button>
        
        <div class="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            on:click={() => (viewMode = 'grid')}
            class="flex items-center space-x-1"
          >
            <Icon icon="mdi:grid" class="text-sm" />
            <span>Grid</span>
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm" 
            on:click={() => (viewMode = 'list')}
            class="flex items-center space-x-1"
          >
            <Icon icon="mdi:format-list-bulleted" class="text-sm" />
            <span>List</span>
          </Button>
        </div>
      </div>

      <!-- Service Header -->
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
          <Icon icon={getIPIcon(ipType)} class="text-2xl text-green-600" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">{getIPTitle(ipType)}</h1>
          <p class="text-slate-600 text-sm">{getIPDescription(ipType)}</p>
        </div>
      </div>

      <!-- Category Filters -->
      <div class="flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          on:click={() => (selectedCategory = null)}
        >
          All Services ({services.length})
        </Button>
        {#each categories as category}
          <Button 
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            on:click={() => (selectedCategory = category)}
            class="flex items-center space-x-1 capitalize"
          >
            <Icon icon={getCategoryIcon(category)} class="text-sm" />
            <span>{category} ({servicesByCategory[category].length})</span>
          </Button>
        {/each}
      </div>
    </div>

    <!-- SCROLLABLE CONTENT AREA - Only this section scrolls -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
      <ServiceGrid 
        {services} 
        {viewMode} 
        categoryFilter={selectedCategory} 
        {ipType}
      />
    </div>
  </div>
</div>

<!-- Availability Search Modal -->
<AvailabilitySearchModal 
  isOpen={isAvailabilityModalOpen} 
  on:close={() => (isAvailabilityModalOpen = false)} 
/>

<!-- Pay for Certificate Modal - exact same as dashboard -->
<Dialog.Root bind:open={showPayCertModal}>
	<Dialog.Content class="max-w-[400px]">
		<Dialog.Header>
			<Dialog.Title>Pay for Certificate</Dialog.Title>
			<Dialog.Description>Search file number</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4">
			<input
				type="text"
				class="border rounded w-full p-2"
				placeholder="Enter file number"
				bind:value={payCertFileNumber}
				on:keydown={(e) => {
					if (e.key === 'Enter') searchPayCert();
				}}
			/>
		</div>
		<Dialog.Footer class="sm:flex mt-4">
			<Button variant="outline" on:click={() => (showPayCertModal = false)}>Cancel</Button>
			<Button on:click={searchPayCert} class="ml-2" disabled={payCertLoading}>
				{#if payCertLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Search
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Verify Payment Dialog - exact same as dashboard -->
<Dialog.Root bind:open={showVerifyPaymentDialog}>
	<Dialog.Content class="max-w-[400px]">
		<Dialog.Header>
			<Dialog.Title>Verify Remita Payment</Dialog.Title>
			<Dialog.Description
				>Enter your Remita Retrieval Reference (RRR) to verify payment.</Dialog.Description
			>
		</Dialog.Header>
		<div class="mt-4">
			<input
				type="text"
				class="border rounded w-full p-2"
				placeholder="Enter RRR"
				bind:value={verifyRRR}
				on:keydown={(e) => {
					if (e.key === 'Enter') verifyRemitaPayment();
				}}
			/>
		</div>
		{#if verifyPaymentError}
			<p class="text-red-600 mt-2">{verifyPaymentError}</p>
		{/if}
		{#if verifyPaymentResult}
			{#if verifyPaymentResult.status == null}
				<div class="mt-4 bg-red-50 border border-red-200 rounded p-2">
					<p class="font-semibold text-red-700">Payment not found.</p>
				</div>
			{:else if verifyPaymentResult.status === '00'}
				<div class="mt-4 bg-green-50 border border-green-200 rounded p-2">
					<p class="font-semibold text-green-700">Payment Status: Successful</p>
					<p>Amount: {verifyPaymentResult.amount}</p>
					<p>Date: {mapDateToString(verifyPaymentResult.paymentDate)}</p>
					<p>Description: {verifyPaymentResult.paymentDescription}</p>
					<p>Payer Name: {verifyPaymentResult.payerName}</p>
				</div>
			{:else if verifyPaymentResult.status === '021'}
				<div class="mt-4 bg-yellow-50 border border-yellow-200 rounded p-2">
					<p class="font-semibold text-yellow-700">Payment Status: Pending</p>
					<p>Amount: {verifyPaymentResult.amount}</p>
					<p>Description: {verifyPaymentResult.paymentDescription}</p>
					<p>Payer Name: {verifyPaymentResult.payerName}</p>
				</div>
			{:else}
				<div class="mt-4 bg-red-50 border border-red-200 rounded p-2">
					<p class="font-semibold text-red-700">
						Payment Status: Unsuccessful ({verifyPaymentResult.status})
					</p>
					<p>Amount: {verifyPaymentResult.amount}</p>
					<p>Description: {verifyPaymentResult.paymentDescription}</p>
					<p>Payer Name: {verifyPaymentResult.payerName}</p>
				</div>
			{/if}
		{/if}
		<Dialog.Footer class="sm:flex mt-4">
			<Button
				variant="outline"
				on:click={() => {
					showVerifyPaymentDialog = false;
					verifyRRR = '';
					verifyPaymentResult = null;
					verifyPaymentError = null;
				}}>Close</Button
			>
			<Button on:click={verifyRemitaPayment} class="ml-2" disabled={verifyPaymentLoading}>
				{#if verifyPaymentLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Verify
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Change of Agent Dialog -->
<Dialog.Root bind:open={showChangeOfAgentDialog}>
	<Dialog.Content class="max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Change of Agent</Dialog.Title>
			<Dialog.Description class="text-gray-600">
				Enter File Number to search for a file to change agent.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-6 space-y-4">
			<div class="space-y-2">
				<label for="changeAgentFileNumber" class="block text-sm font-medium text-gray-700">File Number</label>
				<input
					id="changeAgentFileNumber"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="Enter File Number"
					bind:value={changeAgentFileNumber}
					on:keydown={(e) => {
						if (e.key === 'Enter') searchChangeOfAgent();
					}}
				/>
			</div>
		</div>

		{#if changeAgentError}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
				<p class="text-red-700 text-sm">{changeAgentError}</p>
			</div>
		{/if}

		<!-- Search Result -->
		{#if changeAgentResult && Array.isArray(changeAgentResult) && changeAgentResult.length > 0}
			<div class="mt-6">
				<h3 class="text-lg font-medium text-gray-900 mb-3">File Details:</h3>
				<div class="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-2">
					<p><span class="font-semibold">File Number:</span> {changeAgentResult[0].fileId}</p>
					<p>
						<span class="font-semibold">Type:</span>
						{fileTypeToString(changeAgentResult[0].fileTypes)}
					</p>
					<p><span class="font-semibold">Title:</span> {changeAgentResult[0].titleOfTradeMark}</p>
					<p><span class="font-semibold">Applicant:</span> {changeAgentResult[0].fileApplicant}</p>
					<p>
						<span class="font-semibold">Correspondence:</span>
						{changeAgentResult[0].fileApplicant}
					</p>
					<Button class="mt-2" on:click={async () => await showOwnershipForm()}>Update</Button>
				</div>
			</div>
		{:else if changeAgentSearched}
			<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
				<p class="text-yellow-700 text-sm">No file found for the provided file number.</p>
			</div>
		{/if}

		<Dialog.Footer class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
			<Button
				variant="outline"
				on:click={() => {
					showChangeOfAgentDialog = false;
					changeAgentFileNumber = '';
					changeAgentResult = [];
					changeAgentError = null;
					changeAgentSearched = false;
				}}
				class="px-4 py-2"
			>
				Close
			</Button>
			<Button
				on:click={searchChangeOfAgent}
				disabled={changeAgentLoading || !changeAgentFileNumber}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
			>
				{#if changeAgentLoading}
					<Icon icon="eos-icons:loading" class="w-4 h-4 mr-2" />
					Searching...
				{:else}
					<Icon icon="lucide:search" class="w-4 h-4 mr-2" />
					Search
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Get Documents Dialog -->
<Dialog.Root bind:open={showGetDocumentsDialog}>
	<Dialog.Content class="max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Get Documents</Dialog.Title>
			<Dialog.Description class="text-gray-600">
				Enter File Number and Payment ID to retrieve documents.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-6 space-y-4">
			<div class="space-y-2">
				<label for="getDocFileNumber" class="block text-sm font-medium text-gray-700">File Number</label>
				<input
					id="getDocFileNumber"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="Enter File Number"
					bind:value={getDocFileNumber}
				/>
			</div>

			<div class="space-y-2">
				<label for="getDocPaymentId" class="block text-sm font-medium text-gray-700">Payment ID</label>
				<input
					id="getDocPaymentId"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="Enter Payment ID"
					bind:value={getDocPaymentId}
					on:keydown={(e) => {
						if (e.key === 'Enter') getDocuments();
					}}
				/>
			</div>
		</div>

		{#if getDocError}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
				<p class="text-red-700 text-sm">{getDocError}</p>
			</div>
		{/if}

		<!-- Documents Results -->
		{#if documents.length > 0}
			<div class="mt-6">
				<h3 class="text-lg font-medium text-gray-900 mb-3">Documents:</h3>
				{#if Array.isArray(documents) && documents.length === 0}
					<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
						<p class="text-yellow-700 text-sm flex items-center">
							<Icon icon="lucide:info" class="w-4 h-4 mr-2" />
							No documents found for the provided credentials.
						</p>
					</div>
				{:else if Array.isArray(documents)}
					<div class="space-y-2">
						{#each documents as doc, index}
							<div
								class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
							>
								<div class="flex items-center space-x-3">
									<div class="flex-shrink-0">
										<Icon icon="lucide:file-text" class="w-5 h-5 text-gray-500" />
									</div>
									<div>
										<p class="text-sm font-medium text-gray-900">
											{getLetterName(doc)}
										</p>
									</div>
								</div>
								<div class="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										on:click={() => generateLetter(getDocFileNumber, doc, appId)}
										class="text-xs"
									>
										<Icon icon="lucide:eye" class="w-3 h-3 mr-1" />
										View
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-4 bg-gray-50 border border-gray-200 rounded-md">
						<pre class="text-xs text-gray-700 overflow-auto max-h-32">{JSON.stringify(
								getDocResult,
								null,
								2
							)}</pre>
					</div>
				{/if}
			</div>
		{/if}

		<Dialog.Footer class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
			<Button
				variant="outline"
				on:click={() => {
					showGetDocumentsDialog = false;
					getDocFileNumber = '';
					getDocPaymentId = '';
					getDocResult = null;
					getDocError = null;
					documents = [];
				}}
				class="px-4 py-2"
			>
				Close
			</Button>
			<Button
				on:click={getDocuments}
				disabled={getDocLoading || !getDocFileNumber || !getDocPaymentId}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
			>
				{#if getDocLoading}
					<Icon icon="eos-icons:loading" class="w-4 h-4 mr-2" />
					Loading...
				{:else}
					<Icon icon="lucide:search" class="w-4 h-4 mr-2" />
					Get Documents
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- File Appeals Dialog -->
<Dialog.Root bind:open={showFileAppealsDialog}>
	<Dialog.Content class="max-w-[900px]">
		<Dialog.Header>
			<Dialog.Title>File Appeals</Dialog.Title>
			<Dialog.Description>Search file number to upload appeal documents</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4">
			<input
				type="text"
				class="border rounded w-full p-2"
				placeholder="Enter file number"
				bind:value={appealsFileNumber}
				on:keydown={(e) => {
					if (e.key === 'Enter') searchFileAppeals();
				}}
			/>
		</div>

		{#if appealsError}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
				<p class="text-red-700 text-sm">{appealsError}</p>
			</div>
		{/if}

		<Dialog.Footer class="sm:flex mt-4">
			<Button variant="outline" on:click={() => (showFileAppealsDialog = false)}>Cancel</Button>
			<Button on:click={searchFileAppeals} class="ml-2" disabled={appealsLoading}>
				{#if appealsLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Search
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- File Appeals Results Dialog -->
<Dialog.Root bind:open={showFileAppealsResultsDialog}>
	<Dialog.Content class="max-w-[900px]">
		<Dialog.Header>
			<Dialog.Title>File Appeals Search Results</Dialog.Title>
		</Dialog.Header>
		{#if appealsResults && appealsResults.length > 0}
			<table class="min-w-full border mt-4">
				<thead>
					<tr>
						<th class="border px-2 py-1">File Number</th>
						<th class="border px-2 py-1">Type</th>
						<th class="border px-2 py-1">Title</th>
						<th class="border px-2 py-1">Status</th>
						<th class="border px-2 py-1">Class</th>
						<th class="border px-2 py-1">Applicant Name</th>
						<th class="border px-2 py-1">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each appealsResults as result}
						<tr>
							<td class="border px-2 py-1">{result.fileId}</td>
							<td class="border px-2 py-1">{fileTypeToString(result.fileTypes)}</td>
							<td class="border px-2 py-1">{result.titleOfTradeMark}</td>
							<td class="border px-2 py-1"><AppStatusTag value={result.fileStatus} /></td>
							<td class="border px-2 py-1">{result.tradeMarkClass}</td>
							<td class="border px-2 py-1">{result.fileApplicant}</td>
							<td class="border px-2 py-1">
								<button
									type="button"
									class="border rounded px-3 py-1 hover:bg-accent transition-colors"
									on:click={() => openAppealUpload(result)}
								>
									Upload Appeal
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else if appealsResults && appealsResults.length === 0}
			<p class="mt-4 text-center text-gray-600">No results found for the provided file number.</p>
		{:else}
			<p class="mt-4 text-center text-gray-600">Enter a file number to search.</p>
		{/if}
		<Dialog.Footer class="sm:flex mt-4">
			<Button variant="outline" on:click={() => (showFileAppealsResultsDialog = false)}
				>Close</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Appeal Upload Dialog -->
<Dialog.Root bind:open={showAppealUploadDialog}>
	<Dialog.Content class="max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Upload Appeal Documents</Dialog.Title>
			<Dialog.Description>
				File Number: {selectedAppealFile?.fileId} - {selectedAppealFile?.titleOfTradeMark}
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-4">
			<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
				<input
					type="file"
					multiple
					accept=".pdf"
					class="hidden"
					bind:this={appealFileInput}
					on:change={handleAppealFileSelect}
				/>
				<Icon
					icon="mdi:cloud-upload"
					width="3rem"
					height="3rem"
					class="mx-auto text-gray-400 mb-2"
				/>
				<p class="text-gray-600 mb-2">Upload PDF documents for your appeal</p>
				<button
					type="button"
					class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
					on:click={() => appealFileInput?.click()}
				>
					Choose Files
				</button>
				<p class="text-xs text-gray-500 mt-2">Only PDF files are allowed</p>
			</div>

			{#if appealFiles.length > 0}
				<div class="mt-4">
					<h4 class="font-medium mb-2">Selected Files:</h4>
					<div class="space-y-2">
						{#each appealFiles as file, index}
							<div class="flex items-center justify-between p-2 bg-gray-50 rounded border">
								<div class="flex items-center space-x-2">
									<Icon icon="mdi:file-pdf-box" class="text-red-600" />
									<span class="text-sm">{file.name}</span>
									<span class="text-xs text-gray-500"
										>({(file.size / 1024 / 1024).toFixed(2)} MB)</span
									>
								</div>
								<button
									type="button"
									class="text-red-600 hover:text-red-800 text-sm"
									on:click={() => removeAppealFile(index)}
								>
									Remove
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if appealUploadError}
				<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p class="text-red-700 text-sm">{appealUploadError}</p>
				</div>
			{/if}

			{#if appealUploadSuccess}
				<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
					<p class="text-green-700 text-sm">Appeal documents uploaded successfully!</p>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="sm:flex mt-4">
			<Button variant="outline" on:click={() => closeAppealUpload()}>Cancel</Button>
			<Button
				on:click={uploadAppealDocuments}
				class="ml-2"
				disabled={appealUploadLoading || appealFiles.length === 0}
			>
				{#if appealUploadLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Upload Documents
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>