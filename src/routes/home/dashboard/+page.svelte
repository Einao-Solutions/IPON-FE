<script lang="ts">
  import { fade } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  import { goto } from "$app/navigation";
  import {
    appattachmentsData,
    applicationData,
    applicationMode,
    applicationScreen,
    formsData,
    loggedInUser,
    newApplicationType,
    validatedPages,
    validatePage,
  } from "$lib/store";
  import UpdateFormView from "./components/UpdateFormView.svelte";
  import { onMount } from "svelte";
  import RenewView from "./components/RenewView.svelte";
  import { Toaster } from "$lib/components/ui/sonner";
  import {
    ApplicationLetters,
    ApplicationStatuses,
    baseURL,
    UserRoles,
    FileTypes,
    type DashBoardStats,
  } from "$lib/helpers";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Card from "$lib/components/ui/card";
  import { DashStats } from "$lib/store";
  import { getServiceCount } from "$lib/services";
  import AvailabilitySearchModal from "../../home/components/AvailabilitySearchModal.svelte";
  import UserDashboard from "../components/UserDashboard.svelte";
  import IPServiceView from "../components/IPServiceView.svelte";
  import { Description } from "formsnap";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { Result } from "postcss";
  import {
    fileTypeToString,
    mapDateToString,
  } from "../components/dashboardutils";
  import { getLetterName } from "../../dataview/datahelpers";
  import { toast } from "svelte-sonner";
  import { User } from "lucide-svelte";
  let isModalOpen = false;
  function toggleModal(): void {
    isModalOpen = !isModalOpen;
  }
  let updateForm: UpdateFormView | null = null;
  let renewForm: RenewView | null = null;
  let assignForm: AssignView | null = null;
  let selectedCreation: number | null = null;
  let showNewApplication: boolean = false;
  let showPreRegistrationDialog: boolean = false;
  let appPageLoading: boolean = false;
  let showUpdateForm: boolean = false;
  let showRenewForm: boolean = false;
  let showAssignForm: boolean = false;
  let typecomponent: any;
  let data = {};
  $: fileData = $applicationData;

  // New navigation state for IP category views
  let currentView = "main"; // 'main', 'trademark', 'patent', 'design'
  let viewToggle = "grid"; // 'grid' or 'list'

  // Dashboard statistics are now handled by UserDashboard component
  function openPreRegistrationDialog() {
    showPreRegistrationDialog = true;
  }

  function goBackToMain() {
    currentView = "main";
  }

  function NewApplication() {
    showPreRegistrationDialog = false;
    showNewApplication = true;
  }

  function NewSelectionChanged(state: boolean) {
    if (!state) {
      selectedCreation = null;
    }
  }

  function PreRegistrationSelectionChanged(state: boolean) {
    if (!state) {
      // Reset any state if needed when dialog closes
    }
  }

  let isStaff: boolean = false;
  
  function canCreateApplication() {
    return (
      $loggedInUser?.userRoles.includes(UserRoles.User) ||
      $loggedInUser?.userRoles.includes(UserRoles.Tech) ||
      $loggedInUser?.userRoles.includes(UserRoles.SuperAdmin)
    );
  }
  onMount(async () => {
    isLoading = true;
    let cookieUser = document.cookie
      .split(";")
      .find((x) => x.startsWith(" user=") || x.startsWith("user="));
    if (!cookieUser) {
      await goto("/auth/");
    } else {
      let user = cookieUser.trimStart();
      user = user.slice(5);
      loggedInUser.set(JSON.parse(decodeURIComponent(user)));
      // Determine if user should see StaffDashboard (all non-regular user roles except Agent)
      isStaff = !!$loggedInUser?.userRoles?.some((e) =>
        [
          // Generic staff roles
          UserRoles.Staff,
          // Patent-related roles
          UserRoles.PatentSearch,
          UserRoles.PatentExaminer,
          UserRoles.PatentCertification,
          UserRoles.PatentDesignRegistrar,
          // Trademark-related roles
          UserRoles.TrademarkSearch,
          UserRoles.TrademarkExaminer,
          UserRoles.TrademarkOpposition,
          UserRoles.TrademarkAcceptance,
          UserRoles.TrademarkCertification,
          UserRoles.TrademarkRegistrar,
          // Design-related roles
          UserRoles.DesignSearch,
          UserRoles.DesignExaminer,
          UserRoles.DesignCertification,
          // Administrative roles
          UserRoles.Minister,
          UserRoles.PermSec,
          UserRoles.Finance,
          // Note: Tech and SuperAdmin will use UserDashboard with detailed statistics
          // Note: Agent will use UserDashboard with totals only
        ].includes(e)
      );
    }
    if (isStaff) {
      typecomponent = (await import("../components/StaffDashboard.svelte"))
        .default;
    } else {
      {
        typecomponent = (await import("../components/UserDashboard.svelte"))
          .default;
      }
    }
    data = {
      user: $loggedInUser,
    };

    isLoading = false;
  });
  let isLoading: boolean = true;
  let updateData = {};
  let renewData = {};
  let assignData = {};

  // Pay for Certificate modal state variables
  let showPayCertModal: boolean = false;
  let showPayCertResultsModal: boolean = false;
  let payCertFileNumber: string = "";
  let payCertLoading: boolean = false;
  let payCertResults: any[] | null = null;
  let error: string | null = null;
  let filteredResults: any[] | undefined;
  async function searchPayCert() {
    payCertLoading = true;

    const response = await fetch(
      `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${payCertFileNumber}`
    );
    if (response.ok) {
      payCertResults = await response.json();
    } else {
      error = "Failed to fetch search results";
    }

    filteredResults = payCertResults?.filter(
      (result) => result.fileStatus == 20
    );

    showPayCertModal = false;
    showPayCertResultsModal = true;
    payCertLoading = false;
  }
  async function ShowCertificatePayment(result: any) {
    // const history = result?.applicationHistory;
    const fileNumber = result?.fileId;

    let response = await fetch(
      `${baseURL}/api/files/CertificatePayment?id=${fileNumber}&userId=${$loggedInUser?.id}`
    );
    if (response.ok) {
      let res = await response.json();
      localStorage.setItem("fileId", res.fileId);
      localStorage.setItem("name", res.name);
      localStorage.setItem("rrr", res.rrr);
      goto(
        `/payment?type=tradecertificate&amount=${res.total}&paymentId=${res.rrr}&fileId=${res.fileId}&name=${res.name}`
      );
    }
  }
  async function loadForm() {
    if (!updateForm) {
      updateForm = (await import("./components/UpdateFormView.svelte")).default;
      let closed = () => (showUpdateForm = false);
      updateData = { closed: closed };
    }
  }
  async function loadRenewForm() {
    if (!renewForm) {
      renewForm = (await import("./components/RenewView.svelte")).default;
      let closed = () => (showRenewForm = false);
      renewData = { closed: closed };
    }
  }

  async function loadAssignForm() {
    if (!assignForm) {
      assignForm = (await import("./components/AssignView.svelte")).default;
      let closed = () => (showAssignForm = false);
      assignData = { closed: closed };
    }
  }
  async function checkPayment(
    application: ApplicationHistoryType,
    id: string | null
  ) {
    if (!id) {
      showToast("error", "No Remita ID available");
      return;
    }

    isCertificate = fileData.applicationHistory[0].certificatePaymentId === id;
    manualUpdate = application;
    validateRRR = id;
    remita_confirmation = "checking";
    showAlertDialog = true;

    try {
      const response = await fetch(`${baseURL}/api/payments/check?id=${id}`);
      if (!response.ok) throw new Error("Payment check failed");

      const result = await response.json();
      ({ amount, paymentDate, status, paymentDesc } = result);
      remita_confirmation = "verify_update";

      if (
        application.currentStatus ===
        ApplicationStatuses.AwaitingCertificatePayment
      ) {
        await updateCertPaymentStatus(id, fileData.id);
      }

      showManualUpdate =
        status === "00" &&
        application.currentStatus === ApplicationStatuses.AwaitingPayment;
      showCancel = !showManualUpdate;
    } catch (error) {
      console.error("Payment check error:", error);
      showToast("error", "Failed to verify payment");
    }
  }

  $: {
    if (showUpdateForm) {
      loadForm();
    }
    if (showRenewForm) {
      loadRenewForm();
    }

    if (showAssignForm) {
      loadAssignForm();
    }
  }
  let showVerifyPaymentDialog = false;
  let verifyRRR = "";
  let verifyPaymentLoading = false;
  let verifyPaymentResult: any = null;
  let verifyPaymentError: string | null = null;

  async function verifyRemitaPayment() {
    verifyPaymentError = null;
    verifyPaymentResult = null;
    if (!verifyRRR.trim()) {
      verifyPaymentError = "Please enter a valid RRR.";
      return;
    }
    verifyPaymentLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/payments/check?id=${verifyRRR.trim()}`
      );
      if (!response.ok) throw new Error("Verification failed");
      const result = await response.json();
      verifyPaymentResult = result;
    } catch (e) {
      verifyPaymentError =
        "Failed to verify payment. Please check the RRR and try again.";
    }
    verifyPaymentLoading = false;
  }
  let showGetDocumentsDialog = false;
  let showChangeOfAgentDialog = false;
  let getDocFileNumber = "";
  let getDocPaymentId = "";
  let getDocLoading = false;
  let getDocResult: any = null;
  let getDocError: string | null = null;
  let documents: any[] = [];
  let appId: string = "";
  let changeAgentError: string | null;
  let changeAgentResult: any[] = [];
  let changeAgentFileNumber: string;
  let changeAgentLoading = false;
  let changeAgentSearched = false;
  async function getDocuments() {
    getDocError = null;
    getDocResult = null;
    if (!getDocFileNumber.trim() || !getDocPaymentId.trim()) {
      getDocError = "Please enter both File Number and Payment ID.";
      return;
    }
    getDocLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/letters/GetDocuments?fileId=${encodeURIComponent(getDocFileNumber.trim())}&paymentId=${encodeURIComponent(getDocPaymentId.trim())}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        getDocError = errorData.message || "An error occurred";
        throw new Error(getDocError ?? "An error occurred");
        // toast
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
  function generateLetter(
    fileId: string,
    letterType: ApplicationLetters,
    applicationId: string
  ) {
    window.open(
      `${baseURL}/api/letters/generate?fileId=${fileId}&letterType=${letterType}&applicationId=${applicationId}`
    );
  }
  async function searchChangeOfAgent() {
    changeAgentError = null;
    changeAgentResult = [];
    if (!changeAgentFileNumber.trim()) {
      getDocError = "Please enter File Number";
      return;
    }
    changeAgentLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(changeAgentFileNumber.trim())}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        changeAgentError = errorData.message || "An error occurred";
        throw new Error(changeAgentError ?? "An error occurred");
        // toast(g)
      }
      changeAgentResult = await response.json();
    } catch (e: any) {
      changeAgentError = e.Message || e;
    }
    changeAgentLoading = false;
  }
  let ownershipData = {};
  let showOwnership = false;
  let ownershipForm = undefined;
  async function showOwnershipForm() {
    if (!ownershipForm) {
      ownershipForm = (
        await import("../../dataview/Components/OwnershipForm.svelte")
      ).default;
    }
    let closed = () => (showOwnership = false);
    const file = Array.isArray(changeAgentResult)
      ? changeAgentResult[0]
      : changeAgentResult;
    console.log(file);

    if (!file?.fileId) {
      toast.error("File data incomplete. Cannot update ownership.");
      return;
    }
    ownershipData = {
      closed: closed,
      requiredData: {
        fileId: file?.fileId,
        oldCorrespondence: file?.correspondence,
        oldId: file?.creatorAccount || null,
      },
    };
    showOwnership = true;
  }
  // File Appeals Variables - TypeScript
  let showFileAppealsDialog: boolean = false;
  let showFileAppealsResultsDialog: boolean = false;
  let showAppealUploadDialog: boolean = false;
  let appealsFileNumber: string = "";
  let appealsResults: any[] | undefined;
  let appealsLoading: boolean = false;
  let appealsError: string | null = null;
  let selectedAppealFile: any = null;
  let appealFiles: File[] = [];
  let appealFileInput: HTMLInputElement;
  let appealUploadLoading: boolean = false;
  let appealUploadError: string | null = null;
  let appealUploadSuccess: boolean = false;

  // Search for files to appeal
  async function searchFileAppeals(): Promise<void> {
    if (!appealsFileNumber.trim()) {
      appealsError = "Please enter a file number";
      return;
    }

    appealsLoading = true;
    appealsError = null;
    appealsResults = null;

    try {
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(appealsFileNumber.trim())}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        appealsError = errorData.message || "An error occurred";
        throw new Error(appealsError);
      }

      const data = await response.json();
      filteredResults = data.filter((result) => result.fileStatus == 11);

      if (filteredResults?.length == 0) {
        appealsError =
          'Appeals can only be filed for files with status "Rejected".';
        return;
      } else {
        appealsResults = filteredResults;
      }

      showFileAppealsDialog = false;
      showFileAppealsResultsDialog = true;
    } catch (error: any) {
      console.error("Error searching for appeals:", error);
      appealsError =
        error.message || "Error searching for file. Please try again.";
    } finally {
      appealsLoading = false;
    }
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
      if (file.type !== "application/pdf") {
        appealUploadError = "Only PDF files are allowed";
        return false;
      }

      // Optional: Check file size (e.g., 10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        appealUploadError = "File size must be less than 10MB";
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      appealFiles = [...appealFiles, ...validFiles];
      // Clear the input so the same file can be selected again if needed
      if (appealFileInput) {
        appealFileInput.value = "";
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
      appealUploadError = "Please select at least one PDF file";
      return;
    }

    appealUploadLoading = true;
    appealUploadError = null;
    appealUploadSuccess = false;

    try {
      const formData = new FormData();
      formData.append("FileNumber", selectedAppealFile.fileId);

      // Append each file to the FormData
      appealFiles.forEach((file, index) => {
        formData.append(`Docs`, file);
      });

      const response = await fetch(`${baseURL}/api/files/appeal-module`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Handle non-JSON error responses
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (contentType && contentType.includes("application/json")) {
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
      console.error("Error uploading appeal documents:", error);
      appealUploadError =
        error.message || "Error uploading documents. Please try again.";
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
    if (appealFileInput) {
      appealFileInput.value = "";
    }
  }
  let showNoticeModal = false; // show on first load
  const noticeTitle = "Notice";
  const noticeMessage = "";

  function closeNotice() {
    showNoticeModal = false;
  }
</script>

{#if showUpdateForm && updateForm}
  <svelte:component this={updateForm} {...updateData} />
{/if}
{#if showRenewForm && renewForm}
  <svelte:component this={renewForm} {...renewData} />
{/if}
{#if showAssignForm && assignForm}
  <svelte:component this={assignForm} {...assignData} />
{/if}
<Toaster />
{#if showOwnership && ownershipForm}
  <svelte:component this={ownershipForm} {...ownershipData} />
{/if}





<!-- Pre-Registration Dialog -->
<Dialog.Root
  bind:open={showPreRegistrationDialog}
  onOpenChange={PreRegistrationSelectionChanged}
>
  <Dialog.Content class="max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Pre-Registration Options</Dialog.Title>
      <Dialog.Description
        >Choose the type of pre-registration service</Dialog.Description
      >
    </Dialog.Header>
    <br />
    <div class="gap-4 flex flex-col">
      <button
        type="button"
        on:click={() => {
          // Handle clerical update action here
          showPreRegistrationDialog = false;
          // Add your clerical update logic here
        }}
        class="border rounded-md flex p-4 items-center hover:bg-accent hover:cursor-pointer transition-colors"
      >
        <Icon
          icon="mdi:file-edit-outline"
          width="2rem"
          height="2rem"
          class="mr-3 text-blue-600"
        />
        <button
          class="text-left"
          on:click={() => goto("/home/clerical-update")}
        >
          <p class="font-semibold">Clerical Update</p>
          <p class="text-sm text-gray-600">
            Edit/Update existing application information
          </p>
        </button>
      </button>
      <button
        type="button"
        on:click={NewApplication}
        class="border rounded-md flex p-4 items-center hover:bg-accent hover:cursor-pointer transition-colors"
      >
        <Icon
          icon="mdi:file-plus-outline"
          width="2rem"
          height="2rem"
          class="mr-3 text-green-600"
        />
        <div class="text-left">
          <p class="font-semibold">New Applications</p>
          <p class="text-sm text-gray-600">
            File new patent, design, or trademark applications
          </p>
        </div>
      </button>
    </div>
    <br />
    <Dialog.Footer class="sm:flex">
      <Button
        variant="outline"
        on:click={() => {
          showPreRegistrationDialog = false;
        }}>Cancel</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- New Application Dialog -->
<Dialog.Root bind:open={showNewApplication} onOpenChange={NewSelectionChanged}>
  <Dialog.Content class="max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>New Application</Dialog.Title>
      <Dialog.Description>Select the application type</Dialog.Description>
    </Dialog.Header>
    <br />
    <div class="gap-4 flex">
      <button
        type="button"
        role="option"
        on:click={() => (selectedCreation = 0)}
        class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {selectedCreation ===
        0
          ? 'bg-accent'
          : 'bg-none'}  "
        aria-selected={selectedCreation === 0}
      >
        <Icon
          icon="arcticons:letter-uppercase-square-p"
          width="1.5rem"
          height="1.5rem"
          class="mr-1.5"
        />
        <p>Patent</p>
      </button>
      <button
        type="button"
        role="option"
        on:click={() => (selectedCreation = 1)}
        class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {selectedCreation ===
        1
          ? 'bg-accent'
          : 'bg-none'} "
        aria-selected={selectedCreation === 1}
      >
        <Icon
          icon="arcticons:letter-uppercase-square-d"
          width="1.5rem"
          height="1.5rem"
          class="mr-1.5"
        />
        <p>Design</p>
      </button>
      <button
        type="button"
        role="option"
        on:click={() => (selectedCreation = 2)}
        class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {selectedCreation ===
        2
          ? 'bg-accent'
          : 'bg-none'} "
        aria-selected={selectedCreation === 2}
      >
        <Icon
          icon="arcticons:letter-uppercase-square-t"
          width="1.5rem"
          height="1.5rem"
          class="mr-1.5"
        />
        <p>Trademark</p>
      </button>
    </div>
    <br />
    <Dialog.Footer class="sm:flex">
      <Button
        variant="outline"
        on:click={() => {
          showNewApplication = false;
          selectedCreation = null;
        }}>Cancel</Button
      >
      {#if selectedCreation != null}
        <div in:fade={{ duration: 500 }} out:fade>
          <Button
            class="flex-grow"
            on:click={() => {
              // if (selectedCreation == 2) {
              // 	toast.info('Trademark platform will be added soon, please check back later', {
              // 		position: 'top-right'
              // 	});
              // 	return;
              // }
              appPageLoading = true;
              applicationMode.set(2);
              formsData.set([]);
              applicationData.set(null);
              applicationScreen.set(0);
              appattachmentsData.set([{ name: "", data: [] }]);
              validatedPages.set([]);
              validatePage.set(null);
              newApplicationType.set(selectedCreation);
              goto(`/application?type=${selectedCreation}`);
              appPageLoading = false;
              showNewApplication = false;
            }}
          >
            <Icon
              class={appPageLoading ? "" : "hidden"}
              icon="eos-icons:loading"
              width="1.6rem"
              height="1.6rem"
            />
            Create {selectedCreation === 0
              ? "New Patent"
              : selectedCreation === 1
                ? "New Design"
                : "New Trademark"}
          </Button>
        </div>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Pay for Certificate Search Modal -->
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
          if (e.key === "Enter") searchPayCert();
        }}
      />
    </div>
    <Dialog.Footer class="sm:flex mt-4">
      <Button variant="outline" on:click={() => (showPayCertModal = false)}
        >Cancel</Button
      >
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

<!-- Pay for Certificate Results Modal -->
<Dialog.Root bind:open={showPayCertResultsModal}>
  <Dialog.Content class="max-w-[900px]">
    <Dialog.Header>
      <Dialog.Title>Certificate Payment Search Results</Dialog.Title>
    </Dialog.Header>
    {#if filteredResults && filteredResults.length > 0}
      <table class="min-w-full border mt-4">
        <thead>
          <tr>
            <th class="border px-2 py-1">File Number</th>
            <th class="border px-2 py-1">Type</th>
            <th class="border px-2 py-1">Title</th>
            <th class="border px-2 py-1">Status</th>
            <th class="border px-2 py-1">Class</th>
            <th class="border px-2 py-1">Applicant Name</th>
            <th class="border px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredResults as result}
            <tr>
              <td class="border px-2 py-1">{result.fileId}</td>
              <td class="border px-2 py-1"
                >{fileTypeToString(result.fileTypes)}</td
              >
              <td class="border px-2 py-1">{result.titleOfTradeMark}</td>
              <td class="border px-2 py-1"
                ><AppStatusTag value={result.fileStatus} /></td
              >
              <td class="border px-2 py-1">{result.tradeMarkClass}</td>
              <td class="border px-2 py-1">{result.fileApplicant}</td>
              <td class="border px-2 py-1">
                <button
                  type="button"
                  class="border rounded px-3 py-1 hover:bg-accent transition-colors"
                  on:click={() => ShowCertificatePayment(result)}
                >
                  Pay
                </button>
              </td></tr
            >
          {/each}
        </tbody>
      </table>
    {:else if filteredResults && filteredResults.length === 0}
      <p class="mt-4 text-center text-gray-600">
        No results found. Please ensure your file status is Awaiting
        Certification.
      </p>
    {:else}
      <p class="mt-4 text-center text-gray-600">
        Enter a file number to search.
      </p>
    {/if}
    <Dialog.Footer class="sm:flex mt-4">
      <Button
        variant="outline"
        on:click={() => (showPayCertResultsModal = false)}>Close</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
<!-- File Appeals Dialog -->
<Dialog.Root bind:open={showFileAppealsDialog}>
  <Dialog.Content class="max-w-[900px]">
    <Dialog.Header>
      <Dialog.Title>File Appeals</Dialog.Title>
      <Dialog.Description
        >Search file number to upload appeal documents</Dialog.Description
      >
    </Dialog.Header>
    <div class="mt-4">
      <input
        type="text"
        class="border rounded w-full p-2"
        placeholder="Enter file number"
        bind:value={appealsFileNumber}
        on:keydown={(e) => {
          if (e.key === "Enter") searchFileAppeals();
        }}
      />
    </div>

    {#if appealsError}
      <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-700 text-sm">{appealsError}</p>
      </div>
    {/if}

    <Dialog.Footer class="sm:flex mt-4">
      <Button variant="outline" on:click={() => (showFileAppealsDialog = false)}
        >Cancel</Button
      >
      <Button
        on:click={searchFileAppeals}
        class="ml-2"
        disabled={appealsLoading}
      >
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
              <td class="border px-2 py-1"
                >{fileTypeToString(result.fileTypes)}</td
              >
              <td class="border px-2 py-1">{result.titleOfTradeMark}</td>
              <td class="border px-2 py-1"
                ><AppStatusTag value={result.fileStatus} /></td
              >
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
      <p class="mt-4 text-center text-gray-600">
        No results found for the provided file number.
      </p>
    {:else}
      <p class="mt-4 text-center text-gray-600">
        Enter a file number to search.
      </p>
    {/if}
    <Dialog.Footer class="sm:flex mt-4">
      <Button
        variant="outline"
        on:click={() => (showFileAppealsResultsDialog = false)}>Close</Button
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
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
      >
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
              <div
                class="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
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
          <p class="text-green-700 text-sm">
            Appeal documents uploaded successfully!
          </p>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="sm:flex mt-4">
      <Button variant="outline" on:click={() => closeAppealUpload()}
        >Cancel</Button
      >
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
<!-- Verify Payment Dialog -->
<Dialog.Root bind:open={showVerifyPaymentDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title class="text-lg font-semibold text-gray-900"
        >Verify Remita Payment</Dialog.Title
      >
      <Dialog.Description class="text-sm text-gray-600">
        Enter your Remita Retrieval Reference (RRR) to verify payment.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4">
      <div>
        <label
          for="rrr-input"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          RRR Number
        </label>
        <input
          id="rrr-input"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Enter RRR"
          bind:value={verifyRRR}
          on:keydown={(e) => {
            if (e.key === "Enter") verifyRemitaPayment();
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
        {:else if verifyPaymentResult.status === "00"}
          <div class="bg-green-50 border border-green-200 rounded-md p-3">
            <p class="font-semibold text-green-700 mb-2">
              Payment Status: Successful
            </p>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <span class="font-medium">Amount:</span>
                {verifyPaymentResult.amount}
              </p>
              <p>
                <span class="font-medium">Date:</span>
                {mapDateToString(verifyPaymentResult.paymentDate)}
              </p>
              <p>
                <span class="font-medium">Description:</span>
                {verifyPaymentResult.paymentDescription}
              </p>
              <p>
                <span class="font-medium">Payer Name:</span>
                {verifyPaymentResult.payerName}
              </p>
            </div>
          </div>
        {:else if verifyPaymentResult.status === "021"}
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p class="font-semibold text-yellow-700 mb-2">
              Payment Status: Pending
            </p>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <span class="font-medium">Amount:</span>
                {verifyPaymentResult.amount}
              </p>
              <p>
                <span class="font-medium">Description:</span>
                {verifyPaymentResult.paymentDescription}
              </p>
              <p>
                <span class="font-medium">Payer Name:</span>
                {verifyPaymentResult.payerName}
              </p>
            </div>
          </div>
        {:else}
          <div class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="font-semibold text-red-700 mb-2">
              Payment Status: Unsuccessful ({verifyPaymentResult.status})
            </p>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <span class="font-medium">Amount:</span>
                {verifyPaymentResult.amount}
              </p>
              <p>
                <span class="font-medium">Description:</span>
                {verifyPaymentResult.paymentDescription}
              </p>
              <p>
                <span class="font-medium">Payer Name:</span>
                {verifyPaymentResult.payerName}
              </p>
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
          verifyRRR = "";
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
        <label class="block text-sm font-medium text-gray-700"
          >File Number</label
        >
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter File Number"
          bind:value={changeAgentFileNumber}
          on:keydown={(e) => {
            if (e.key === "Enter") searchChangeOfAgent();
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
          <p>
            <span class="font-semibold">File Number:</span>
            {changeAgentResult[0].fileId}
          </p>
          <p>
            <span class="font-semibold">Type:</span>
            {fileTypeToString(changeAgentResult[0].fileTypes)}
          </p>
          <p>
            <span class="font-semibold">Title:</span>
            {changeAgentResult[0].titleOfTradeMark}
          </p>
          <p>
            <span class="font-semibold">Applicant:</span>
            {changeAgentResult[0].fileApplicant}
          </p>
          <p>
            <span class="font-semibold">Correspondence:</span>
            {changeAgentResult[0].fileApplicant}
          </p>
          <Button class="mt-2" on:click={async () => await showOwnershipForm()}
            >Update</Button
          >
        </div>
      </div>
    {:else if changeAgentSearched}
      <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="text-yellow-700 text-sm">
          No file found for the provided file number.
        </p>
      </div>
    {/if}

    <Dialog.Footer
      class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200"
    >
      <Button
        variant="outline"
        on:click={() => {
          showChangeOfAgentDialog = false;
          changeAgentFileNumber = "";
          changeAgentResult = null;
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
        <label class="block text-sm font-medium text-gray-700"
          >File Number</label
        >
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          placeholder="Enter File Number"
          bind:value={getDocFileNumber}
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Payment ID</label
        >
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          placeholder="Enter Payment ID"
          bind:value={getDocPaymentId}
          on:keydown={(e) => {
            if (e.key === "Enter") getDocuments();
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
                    <Icon
                      icon="lucide:file-text"
                      class="w-5 h-5 text-gray-500"
                    />
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
                    on:click={() =>
                      generateLetter(getDocFileNumber, doc, appId)}
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
            <pre
              class="text-xs text-gray-700 overflow-auto max-h-32">{JSON.stringify(
                getDocResult,
                null,
                2
              )}</pre>
          </div>
        {/if}
      </div>
    {/if}

    <Dialog.Footer
      class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200"
    >
      <Button
        variant="outline"
        on:click={() => {
          showGetDocumentsDialog = false;
          getDocFileNumber = "";
          getDocPaymentId = "";
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
{#if showNoticeModal}
  <div
    class="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60"></div>

    <!-- Modal -->
    <div
      class="relative w-full max-w-[900px] bg-white rounded-xl shadow-2xl overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-notice-title"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div class="flex items-center gap-2">
          <Icon
            icon="mdi:bell"
            class="w-6 h-6 text-gray-700"
            aria-hidden="true"
          />
          <h2
            id="maintenance-notice-title"
            class="text-xl md:text-2xl font-semibold"
          >
            Notice of System Restoration and Updates
          </h2>
        </div>

        <button
          class="rounded-full p-2 hover:bg-gray-100"
          aria-label="Close"
          on:click={closeNotice}
        >
          <Icon icon="mdi:close" class="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 max-h-[80vh] overflow-y-auto">
        <!-- <div class="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 flex items-start gap-2">
          
          <span class="text-sm md:text-base">
            Scheduled maintenance will not affect access to the registration portal.
          </span>
        </div> -->

        <p class="text-sm md:text-base text-gray-700">
          Dear Esteemed Customer,
        </p>
        <p class="mt-3 text-sm md:text-base text-gray-700">
          We are pleased to inform you that online services on the official
          website of the Commercial Law Department, Federal Ministry of
          Industry, Trade and Investment — www.iponigeria.com — have now been
          fully restored.
        </p>

        <p class="mt-4 font-semibold text-gray-900">
          We have also introduced important updates to improve your experience.
          Here’s what has changed:
        </p>
        <ul
          class="mt-2 list-disc pl-6 space-y-2 text-sm md:text-base text-gray-700"
        >
          <li>
            We have deployed an improved user dashboard for easier access to the
            modules you use daily.
          </li>
          <li>
            Processing speed for payments has been significantly optimized.
          </li>
          <li>
            Key modules have been enhanced and reorganized for your filing
            convenience.
          </li>
        </ul>

        <p class="mt-4 text-sm md:text-base text-gray-700">
          We understand that you may need time to familiarize yourself with the
          new layout. Our support team is available 24/7 to assist with any
          requests, enquiries, or issues through the support link on your user
          dashboard.
        </p>
        <p class="mt-3 text-sm md:text-base text-gray-700">
          Thank you for choosing the Commercial Law Department, Federal Ministry
          of Industry, Trade and Investment — proudly supported by Einao
          Solutions, your trusted IP technology support partner.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t flex justify-end">
        <Button variant="outline" on:click={closeNotice}>Close</Button>
      </div>
    </div>
  </div>
{/if}
{#if isLoading}
  <Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
{:else}
  <!-- Show marquee banner only for regular users (non-staff) -->
  {#if !isStaff}
    <div class="relative">
      <div
        class="w-full bg-green-600 text-white py-3 px-3 text-sm rounded overflow-hidden relative h-8"
      >
        <div class="absolute whitespace-nowrap animate-marquee top-1.5">
        You can now file Withdrawals for all application types using the
        'Withdrawal' Module on the dashboard.
        <b>◆</b>
        You can now file Clerical Updates (Add/Remove Applicant, Edit/Add/Remove
        Inventor Information) for Patent applications.
        <b>◆</b>
        Claim your files not yet on the portal and move them into your platform using
        the 'Claim File' Module.
        <b>◆</b>
        You can now file Recordals (Merger, Registered User, and Assignment) for
        Trademark applications with status 'Publication', 'Awaiting Certification,
        and Awaiting Certificate Confirmation'.
        <b>◆</b>
        You can now file Clerical Updates (Change of Name, Address, Representation,
        Correspondence, and Attachment, ) for trademark applications with status
        'Publication' and 'AwaitingCertification'.
        <b>◆</b>
        You can now get your Trademark Recordal Certificates (Merger, Registered
        User, Assignment, Change of Applicant Name, and Change of Applicant Address)
        using the 'Print Documents' Module.
        <b>◆</b>
        You can now file clerical updates (change of name, address, or title of invention)
        for patent applications using the Clerical Update module on the dashboard.
        <b>◆</b>
        Patent Renewal can now be filed using the "Post-Registration" module on the
        dashboard.
        <b>◆</b>
        Use the Attachment Module to upload your patent application attachments.
        <b>◆</b>
        Files with status "Rejected" can file for appeal using the "APPEAL" module
        on the dashboard.
        <b>◆</b>
        All Patent application filed prior to Monday, 25th August, 2025 are required
        to be updated via the "Update Patent File" Module on the dashboard to ensure
        the completeness of all fields within the documents.
      </div>
    </div>
    </div>
  {/if}
{/if}

<!-- DEBUG INFO - COMMENTED OUT
	<div class="p-4 bg-yellow-100 border border-yellow-300 rounded mb-4">
		<p>Debug Info:</p>
		<p>canCreateApplication(): {canCreateApplication()}</p>
		<p>currentView: {currentView}</p>
		<p>User roles: {JSON.stringify($loggedInUser?.roles)}</p>
		<p>User ID: {$loggedInUser?.id}</p>
	</div>
	-->

<!-- NEW AGENT DASHBOARD - 3 IP CATEGORY STRUCTURE -->
{#if !isLoading && $loggedInUser && canCreateApplication() && currentView === "main"}
  <div
    class="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-full rounded-xl p-6 shadow-xl border border-slate-200/60"
  >
    <div class="max-w-7xl mx-auto flex flex-col">
      <!-- Header Section -->
      <div class="mb-5 flex-shrink-0">
        <div class="flex items-center space-x-3 mb-1">
          <!-- <div class="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
						<Icon icon="mdi:shield-crown-outline" class="text-white text-xl" />
					</div> -->
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-black bg-clip-text">
              Intellectual Property Office Nigeria
            </h1>
            <p class="text-slate-600 text-sm">
              Select a category to explore available services
            </p>
            <!-- <p class="text-slate-600 text-sm">Commercial Law Department</p> -->
          </div>
        </div>
      </div>

      <!-- Three IP Category Cards -->
      <!-- this div  -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4 flex-shrink-0 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm"
      >
        <button
          class="text-left w-full group relative overflow-hidden"
          on:click={() => (currentView = "trademark")}
        >
          <div
            class="relative bg-gradient-to-br from-green-50 via-white to-green-50 border border-green-200/40 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1"
          >
            <!-- Subtle background pattern -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            ></div>

            <div class="relative z-10">
              <div class="mb-5">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-green-100 via-white to-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl border border-green-200/30"
                >
                  <Icon
                    icon="mdi:scale-balance"
                    class="text-2xl text-green-600 group-hover:text-green-700"
                  />
                </div>
                <h3
                  class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900"
                >
                  Trademark
                </h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                  Register and protect your brand identity
                </p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500 font-medium"
                  >{getServiceCount("trademark")} services available</span
                >
                <div
                  class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300 shadow-md"
                >
                  <Icon
                    icon="heroicons:arrow-right"
                    class="text-green-600 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </button>

        <!-- Patent Card -->
        <button
          class="text-left w-full group relative overflow-hidden"
          on:click={() => (currentView = "patent")}
        >
          <div
            class="relative bg-gradient-to-br from-green-50 via-white to-green-50 border border-green-200/40 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1"
          >
            <!-- Subtle background pattern -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            ></div>

            <div class="relative z-10">
              <div class="mb-5">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-green-100 via-white to-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl border border-green-200/30"
                >
                  <Icon
                    icon="mdi:lightbulb-outline"
                    class="text-2xl text-green-600 group-hover:text-green-700"
                  />
                </div>
                <h3
                  class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900"
                >
                  Patent
                </h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                  Protect your inventions and innovations
                </p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500 font-medium"
                  >{getServiceCount("patent")} services available</span
                >
                <div
                  class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300 shadow-md"
                >
                  <Icon
                    icon="heroicons:arrow-right"
                    class="text-green-600 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </button>

        <!-- Design Card -->
        <button
          class="text-left w-full group relative overflow-hidden"
          on:click={() => (currentView = "design")}
        >
          <div
            class="relative bg-gradient-to-br from-green-50 via-white to-green-50 border border-green-200/40 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1"
          >
            <!-- Subtle background pattern -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            ></div>

            <div class="relative z-10">
              <div class="mb-5">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-green-100 via-white to-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl border border-green-200/30"
                >
                  <Icon
                    icon="mdi:palette-outline"
                    class="text-2xl text-green-600 group-hover:text-green-700"
                  />
                </div>
                <h3
                  class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900"
                >
                  Design
                </h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                  Safeguard your creative designs
                </p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500 font-medium"
                  >{getServiceCount("design")} services available</span
                >
                <div
                  class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300 shadow-md"
                >
                  <Icon
                    icon="heroicons:arrow-right"
                    class="text-green-600 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Portfolio Summary Section -->
      <div class="border-t border-slate-200/60 pt-6">
        <div class="mb-6">
          <div class="flex items-center space-x-3 mb-4">
            <!-- <div class="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
							<Icon icon="mdi:chart-box-outline" class="text-white text-lg" />
						</div> -->
            <div>
              <h2 class="text-xl font-bold text-slate-800">
                Portfolio Summary
              </h2>
              <p class="text-slate-600 text-sm">
                Track your intellectual property applications and registrations
              </p>
            </div>
          </div>
        </div>
        <!-- this div  -->
        <div
          class="bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm"
        >
          <UserDashboard user={$loggedInUser} showOnlyTotals={true} />
        </div>

        <!-- 
					DETAILED STATISTICS SECTION
					========================== 
					This section provides comprehensive statistical breakdowns for the logged-in user.
					It displays detailed application statistics organized by IP type (Patents, Designs, Trademarks) 
					and further broken down by application types and statuses for the user's own applications.
					
					Visibility Logic:
					- Visible to all users (similar to Portfolio Summary)
					- Shows user-specific detailed statistics (not system-wide)
					- Filtered to show only the logged-in user's applications
				-->
        <div class="mt-6">
          <!-- Section Header: Title and description for the detailed statistics -->
          <div class="mb-4">
            <div class="flex items-center space-x-3 mb-3">
              <!-- Optional: Icon for the statistics section (currently commented out) -->
              <!-- <div class="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
									<Icon icon="mdi:chart-line" class="text-white text-lg" />
								</div> -->
              <div>
                <!-- Main heading for the statistics section -->
                <h2 class="text-xl font-bold text-slate-800">
                  Detailed Statistics
                </h2>
                <!-- Descriptive subtext explaining what the statistics show -->
                <p class="text-slate-600 text-sm">
                  Your portfolio breakdown by application types and status
                </p>
              </div>
            </div>
          </div>
          <!-- 
							Statistics Content Container:
							- Styled with subtle background, blur effect, and soft borders
							- Contains the UserDashboard component with showOnlyStatistics=true
							- This prop tells UserDashboard to render only the detailed statistics accordions
						-->
          <div
            class="bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm"
          >
            <!-- 
								UserDashboard Component (Statistics Mode):
								- user={$loggedInUser}: Passes the logged-in user data
								- showOnlyStatistics={true}: Flag to render only the detailed statistics view
								- This will show accordion sections for Patents, Designs, and Trademarks
								- Each accordion contains application types and status breakdowns for the user's own applications
							-->
            <UserDashboard user={$loggedInUser} showOnlyStatistics={true} />
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- FALLBACK WHEN CONDITIONS NOT MET - COMMENTED OUT FOR CLEAN VIEW
		<div class="p-4 bg-red-100 border border-red-300 rounded">
			<h3 class="text-lg font-semibold text-red-800">Dashboard Not Showing</h3>
			<p class="text-red-600">Conditions not met:</p>
			<ul class="text-red-600">
				<li>isLoading: {isLoading}</li>
				<li>loggedInUser exists: {!!$loggedInUser}</li>
				<li>canCreateApplication(): {canCreateApplication()}</li>
				<li>currentView: {currentView}</li>
				<li>Expected: !isLoading AND loggedInUser AND canCreateApplication() AND currentView = 'main'</li>
			</ul>
		</div>
		-->
{/if}

<!-- IP SERVICE VIEWS - WITH PROPER HEIGHT CONTAINER -->
{#if currentView === "trademark" || currentView === "patent" || currentView === "design"}
  <div class="h-full">
    {#if currentView === "trademark"}
      <IPServiceView ipType="trademark" onBack={goBackToMain} />
    {:else if currentView === "patent"}
      <IPServiceView ipType="patent" onBack={goBackToMain} />
    {:else if currentView === "design"}
      <IPServiceView ipType="design" onBack={goBackToMain} />
    {/if}
  </div>
{/if}

<!-- 
	STAFF DASHBOARD RENDERING SECTION
	================================
	This section renders the appropriate dashboard component based on user role:
	- StaffDashboard: For IP-specific officers and staff roles
	- UserDashboard: Already rendered above for regular users, agents, tech, and superadmin
-->
{#if !isLoading && isStaff}
  <div class="rounded-md p-2 mt-4 bg-accent">
    <!-- 
			Render StaffDashboard for staff roles:
			- Will show role-specific sections based on user's actual roles
			- Uses isPatentRelated(), isDesignRelated(), isTradeMarkRelated() functions
			- Provides specialized workflow for IP officers
		-->
    <svelte:component this={typecomponent} {...data} />
  </div>
{:else if !isLoading && isStaff}
  <p>Loading staff dashboard...</p>
{/if}

<style>
  @keyframes marquee {
    0% {
      left: 100%;
    }
    100% {
      left: -100%;
    }
  }
  .animate-marquee {
    animation: marquee 25s linear infinite;
  }
  
</style>
