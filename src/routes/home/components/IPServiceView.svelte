<script lang="ts">
  import { getServicesForIPType, getServicesByCategory, type IPService } from '$lib/services';
  import ServiceGrid from './ServiceGrid.svelte';
  import Icon from '@iconify/svelte';
  import { Button } from '$lib/components/ui/button';
  import AvailabilitySearchModal from './AvailabilitySearchModal.svelte';
  import StreamlinedPostRegModal from './StreamlinedPostRegModal.svelte';
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
  
  // Mobile-specific: Set default view mode to list for mobile screens
  let isMobile = false;
  
  function handleResize() {
    isMobile = window.innerWidth < 768; // Mobile breakpoint
    if (isMobile) {
      viewMode = 'list'; // Force list view on mobile
    }
  }
  
  // Modal states - following the exact same pattern as dashboard
  let isAvailabilityModalOpen = false;
  let showPayCertModal: boolean = false;
  let showVerifyPaymentDialog = false;
  let showChangeOfAgentDialog = false;
  let showGetDocumentsDialog = false;
  let showFileAppealsDialog: boolean = false;

  // NEW STREAMLINED MODAL - Context-aware post-registration
  let showStreamlinedPostRegModal: boolean = false;
  let streamlinedService: {
    serviceId: string;
    serviceName: string;
    ipType: string;
  } | null = null;

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
      
      // First filter by status (rejected files)
      const rejectedFiles = data.filter((result: any) => result.fileStatus == 11);

      if (rejectedFiles?.length == 0) {
        appealsError = 'Appeals can only be filed for files with status "Rejected".';
        return;
      }

      // Then filter by file type to match current IP service context
      const expectedFileType = ipType === 'trademark' ? 2 : ipType === 'patent' ? 0 : ipType === 'design' ? 1 : null;
      const filteredAppealsResults = rejectedFiles.filter((result: any) => result.fileTypes === expectedFileType);

      if (filteredAppealsResults?.length == 0) {
        const currentServiceName = ipType === 'trademark' ? 'Trademark' : ipType === 'patent' ? 'Patent' : 'Design';
        appealsError = `This file is not a ${currentServiceName} file. Please use the ${currentServiceName} services to file appeals for ${currentServiceName} applications.`;
        return;
      }

      appealsResults = filteredAppealsResults;
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

  // NEW - Handle streamlined post-registration modal
  function handleOpenStreamlinedPostRegModal(event: Event) {
    const customEvent = event as CustomEvent;
    streamlinedService = customEvent.detail;
    showStreamlinedPostRegModal = true;
  }

  // Event listeners for custom events from ServiceGrid - same pattern as dashboard
  onMount(() => {
    // Initialize mobile detection
    handleResize();
    window.addEventListener('resize', handleResize);
    
    window.addEventListener('openAvailabilitySearch', handleOpenAvailabilitySearch);
    window.addEventListener('openPayCertModal', handleOpenPayCertModal);
    window.addEventListener('openVerifyPaymentModal', handleOpenVerifyPaymentModal);
    window.addEventListener('openChangeOfAgentModal', handleOpenChangeOfAgentModal);
    window.addEventListener('openGetDocumentsModal', handleOpenGetDocumentsModal);
    window.addEventListener('openFileAppealsModal', handleOpenFileAppealsModal);
    // NEW - Streamlined post-registration modal
    window.addEventListener('openStreamlinedPostRegModal', handleOpenStreamlinedPostRegModal);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('openAvailabilitySearch', handleOpenAvailabilitySearch);
    window.removeEventListener('openPayCertModal', handleOpenPayCertModal);
    window.removeEventListener('openVerifyPaymentModal', handleOpenVerifyPaymentModal);
    window.removeEventListener('openChangeOfAgentModal', handleOpenChangeOfAgentModal);
    window.removeEventListener('openGetDocumentsModal', handleOpenGetDocumentsModal);
    window.removeEventListener('openFileAppealsModal', handleOpenFileAppealsModal);
    // NEW - Streamlined post-registration modal
    window.removeEventListener('openStreamlinedPostRegModal', handleOpenStreamlinedPostRegModal);
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

<div class="relative h-full bg-slate-50/50 rounded-xl border border-slate-200 shadow-lg overflow-hidden">
  <!-- FIXED HEADER SECTION - Absolutely positioned at top -->
  <div class="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 p-6 pb-4 shadow-sm rounded-t-xl">
      <!-- Compressed Header - Back Button + Service Info + View Toggle -->
      <div class="flex items-center justify-between mb-4">
        <!-- Left side: Back Button + Service Info -->
        <div class="flex items-center space-x-4">
          <Button 
            on:click={onBack}
            size="sm"
            variant="outline"
            class="flex items-center space-x-1 px-3 py-2"
          >
            <Icon icon="mdi:arrow-left" class="text-sm group-hover:translate-x-[-2px] transition-transform" />
            <span class="text-sm">Back</span>
          </Button>
          
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
              <Icon icon={getIPIcon(ipType)} class="text-xl text-green-600" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800">{getIPTitle(ipType)}</h1>
              <p class="text-slate-500 text-xs">{getIPDescription(ipType)}</p>
            </div>
          </div>
        </div>
        
        <!-- Right side: Grid/List Toggle - Hidden on Mobile -->
        <div class="hidden md:flex items-center space-x-2">
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

      <!-- Category Filters -->
      <!-- Desktop: Button Layout -->
      <div class="hidden md:flex flex-wrap gap-2">
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
      
      <!-- Mobile: Dropdown Layout -->
      <div class="md:hidden">
        <!-- <label for="category-select" class="block text-sm font-medium text-slate-700 mb-2">
          Filter by Category
        </label> -->
        <select 
          id="category-select"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          on:change={(e) => {
            const value = e.currentTarget.value;
            selectedCategory = value === 'all' ? null : value;
          }}
        >
          <option value="all" selected={selectedCategory === null}>
            All Services ({services.length})
          </option>
          {#each categories as category}
            <option value={category} selected={selectedCategory === category} class="capitalize">
              {category} ({servicesByCategory[category].length})
            </option>
          {/each}
        </select>
      </div>
  </div>

  <!-- SCROLLABLE CONTENT AREA - Positioned below fixed header -->
  <div class="absolute top-[150px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden px-6 pt-4 pb-6">
    <ServiceGrid 
      {services} 
      {viewMode} 
      categoryFilter={selectedCategory} 
      {ipType}
    />
  </div>
</div>

<!-- Availability Search Modal -->
<!-- OLD IMPLEMENTATION (commented for future deletion) -->
<!-- <AvailabilitySearchModal 
  isOpen={isAvailabilityModalOpen} 
  on:close={() => (isAvailabilityModalOpen = false)} 
/> -->

<!-- NEW IMPLEMENTATION - Context-aware modal -->
<AvailabilitySearchModal 
  isOpen={isAvailabilityModalOpen}
  ipContext={ipType}
  on:close={() => (isAvailabilityModalOpen = false)} 
/>

<!-- Pay for Certificate Modal -->
<Dialog.Root bind:open={showPayCertModal}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-lg font-semibold text-gray-900">Pay for Certificate</Dialog.Title>
			<Dialog.Description class="text-sm text-gray-600">
				Enter the file number to search for certificate payment.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div>
				<label for="file-number-input" class="block text-sm font-medium text-gray-700 mb-2">
					File Number
				</label>
				<input
					id="file-number-input"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					placeholder="Enter file number"
					bind:value={payCertFileNumber}
					on:keydown={(e) => {
						if (e.key === 'Enter') searchPayCert();
					}}
				/>
			</div>
		</div>
		<Dialog.Footer class="flex gap-2 pt-4">
			<Button 
				variant="outline" 
				class="flex-1" 
				on:click={() => (showPayCertModal = false)}
			>
				Cancel
			</Button>
			<Button 
				class="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500" 
				on:click={searchPayCert} 
				disabled={payCertLoading}
			>
				{#if payCertLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Search File
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Verify Payment Dialog -->
<Dialog.Root bind:open={showVerifyPaymentDialog}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-lg font-semibold text-gray-900">Verify Remita Payment</Dialog.Title>
			<Dialog.Description class="text-sm text-gray-600">
				Enter your Remita Retrieval Reference (RRR) to verify payment.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div>
				<label for="rrr-input" class="block text-sm font-medium text-gray-700 mb-2">
					RRR Number
				</label>
				<input
					id="rrr-input"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					placeholder="Enter RRR"
					bind:value={verifyRRR}
					on:keydown={(e) => {
						if (e.key === 'Enter') verifyRemitaPayment();
					}}
				/>
			</div>
			
			{#if verifyPaymentError}
				<div class="bg-red-50 border border-red-200 rounded-md p-3">
					<p class="text-sm text-red-600">{verifyPaymentError}</p>
				</div>
			{/if}
			
			{#if verifyPaymentResult}
				{#if verifyPaymentResult.status == null}
					<div class="bg-red-50 border border-red-200 rounded-md p-3">
						<p class="font-semibold text-red-700">Payment not found.</p>
					</div>
				{:else if verifyPaymentResult.status === '00'}
					<div class="bg-green-50 border border-green-200 rounded-md p-3">
						<p class="font-semibold text-green-700 mb-2">Payment Status: Successful</p>
						<div class="space-y-1 text-sm text-gray-600">
							<p><span class="font-medium">Amount:</span> {verifyPaymentResult.amount}</p>
							<p><span class="font-medium">Date:</span> {mapDateToString(verifyPaymentResult.paymentDate)}</p>
							<p><span class="font-medium">Description:</span> {verifyPaymentResult.paymentDescription}</p>
							<p><span class="font-medium">Payer Name:</span> {verifyPaymentResult.payerName}</p>
						</div>
					</div>
				{:else if verifyPaymentResult.status === '021'}
					<div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
						<p class="font-semibold text-yellow-700 mb-2">Payment Status: Pending</p>
						<div class="space-y-1 text-sm text-gray-600">
							<p><span class="font-medium">Amount:</span> {verifyPaymentResult.amount}</p>
							<p><span class="font-medium">Description:</span> {verifyPaymentResult.paymentDescription}</p>
							<p><span class="font-medium">Payer Name:</span> {verifyPaymentResult.payerName}</p>
						</div>
					</div>
				{:else}
					<div class="bg-red-50 border border-red-200 rounded-md p-3">
						<p class="font-semibold text-red-700 mb-2">
							Payment Status: Unsuccessful ({verifyPaymentResult.status})
						</p>
						<div class="space-y-1 text-sm text-gray-600">
							<p><span class="font-medium">Amount:</span> {verifyPaymentResult.amount}</p>
							<p><span class="font-medium">Description:</span> {verifyPaymentResult.paymentDescription}</p>
							<p><span class="font-medium">Payer Name:</span> {verifyPaymentResult.payerName}</p>
						</div>
					</div>
				{/if}
			{/if}
		</div>
		
		<Dialog.Footer class="flex gap-2 pt-4">
			<Button
				variant="outline"
				class="flex-1"
				on:click={() => {
					showVerifyPaymentDialog = false;
					verifyRRR = '';
					verifyPaymentResult = null;
					verifyPaymentError = null;
				}}
			>
				Close
			</Button>
			<Button 
				class="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500" 
				on:click={verifyRemitaPayment} 
				disabled={verifyPaymentLoading}
			>
				{#if verifyPaymentLoading}
					<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
				{:else}
					Verify Payment
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
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
				class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
					placeholder="Enter File Number"
					bind:value={getDocFileNumber}
				/>
			</div>

			<div class="space-y-2">
				<label for="getDocPaymentId" class="block text-sm font-medium text-gray-700">Payment ID</label>
				<input
					id="getDocPaymentId"
					type="text"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
				class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
{#if showFileAppealsDialog}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
		on:click={(e) => { if (e.target.classList.contains('modal-overlay')) showFileAppealsDialog = false; }}
	>
		<div class="bg-white rounded-lg p-6 w-full max-w-md mx-4" on:click|stopPropagation>
			<div class="flex items-center justify-between mb-4">
				<h3 id="modal-title" class="text-lg font-bold text-black">File Appeals</h3>
				<button
					type="button"
					class="text-gray-400 hover:text-gray-600"
					on:click={() => (showFileAppealsDialog = false)}
				>
					<Icon icon="mdi:close" class="w-6 h-6" />
				</button>
			</div>

			<div class="space-y-4">
				<!-- File Type Display - Context-aware, no selection needed -->
				<div class="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
					<Icon icon={ipType === 'trademark' ? 'mdi:scale-balance' : ipType === 'patent' ? 'mdi:lightbulb-outline' : 'mdi:palette-outline'} class="text-green-600 w-5 h-5" />
					<span class="text-sm font-medium text-gray-700">
						File Type: {ipType === 'trademark' ? 'Trademark' : ipType === 'patent' ? 'Patent' : 'Design'}
					</span>
				</div>

				<!-- File Number Input -->
				<div>
					<label for="appealFileNumber" class="block text-sm font-medium text-gray-700 mb-1">
						File Number <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="appealFileNumber"
						bind:value={appealsFileNumber}
						placeholder="Enter file number"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
						on:keydown={(e) => {
							if (e.key === 'Enter') searchFileAppeals();
						}}
					/>
				</div>

				<!-- Error Display -->
				{#if appealsError}
					<div class="flex items-center space-x-2 text-red-600 text-sm">
						<Icon icon="mdi:alert-circle" class="w-4 h-4" />
						<span>{appealsError}</span>
					</div>
				{/if}

				<!-- Info Message -->
				<div class="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
					<Icon icon="mdi:information-outline" class="w-4 h-4 inline mr-1" />
					File appeals for {ipType} applications. Upload appeal documents after finding your file.
				</div>

				<!-- Action Buttons -->
				<div class="flex space-x-2 pt-4">
					<button
						type="button"
						class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
						on:click={() => (showFileAppealsDialog = false)}
					>
						Cancel
					</button>
					<button
						type="button"
						class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
						disabled={appealsLoading}
						on:click={searchFileAppeals}
					>
						{#if appealsLoading}
							<Icon icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin inline" />
							Searching...
						{:else}
							Search File
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

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
					class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
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

<!-- NEW STREAMLINED POST-REGISTRATION MODAL -->
{#if streamlinedService}
<StreamlinedPostRegModal 
  isOpen={showStreamlinedPostRegModal}
  serviceId={streamlinedService.serviceId}
  serviceName={streamlinedService.serviceName}
  ipType={streamlinedService.ipType}
  onClose={() => {
    showStreamlinedPostRegModal = false;
    streamlinedService = null;
  }}
/>
{/if}