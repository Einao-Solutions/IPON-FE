<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { baseURL, ApplicationStatuses } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { FileTypes } from "$lib/helpers";
  export let isOpen = false;
  export let serviceId: string;
  export let serviceName: string;
  export let ipType: string;
  export let onClose: () => void;

  // Form data
  let searchQuery = "";
  let isLoading = false;
  let error: string | null = null;

  // Service ID groups (defined once, reused across validation & routing)
  const recordalServices = ["renewal", "merger", "assignment", "registered-user"];
  const changeServices = ["change-applicant-name", "change-applicant-address"];
  const patentPostRegServices = [
    "patent-amendment", "patent-assignment", "patent-ctc",
    "patent-license", "patent-mortgage", "patent-merger",
  ];
  const designPostRegServices = [
    "design-amendment", "design-assignment", "design-ctc",
    "design-license", "design-mortgage", "design-merger",
  ];

  // Fetch file details by file number (shared helper — avoids duplicate API calls)
  async function fetchFileDetails(fileNumber: string): Promise<any | null> {
    const res = await fetch(
      `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(fileNumber)}`,
    );
    const data = await res.json();
    if (!res.ok || !data || data.length === 0) return null;
    return data[0];
  }

  // Map serviceId to the appropriate changeType for changedata services
  function getChangeType(serviceId: string): string | null {
    const changeTypeMap: Record<string, string> = {
      "change-applicant-name": "Name",
      "change-applicant-address": "Address",
      reclassification: "Class",
    };
    return changeTypeMap[serviceId] || null;
  }

  // Map serviceId to the route for post-registration services
  function getPostRegistrationRoute(
    serviceId: string,
    fileId: string,
    fileType: string,
  ): string {
    const routeMap: Record<string, string> = {
      assignment: `/home/postregistration/assignment?fileId=${fileId}&fileType=${fileType}`,
      merger: `/home/postregistration/merger?fileId=${fileId}&fileType=${fileType}`,
      "registered-user": `/home/postregistration/registeredusers?fileId=${fileId}&fileType=${fileType}`,
      reclassification: `/home/postregistration/changedata?fileId=${fileId}&fileType=${fileType}&changeType=Class`,

      // Patent post-registration services
      "patent-amendment": `/home/postregistration/patentamendment?fileId=${fileId}&fileType=${fileType}`,
      "patent-assignment": `/home/postregistration/patentassignment?fileId=${fileId}&fileType=${fileType}`,
      "patent-ctc": `/home/postregistration/patentctc?fileId=${fileId}&fileType=${fileType}`,
      "patent-license": `/home/postregistration/patentlicense?fileId=${fileId}&fileType=${fileType}`,
      "patent-mortgage": `/home/postregistration/patentmortgage?fileId=${fileId}&fileType=${fileType}`,
      "patent-merger": `/home/postregistration/patentmerger?fileId=${fileId}&fileType=${fileType}`,

      // Design post-registration services
      "design-amendment": `/home/postregistration/designamendment?fileId=${fileId}&fileType=${fileType}`,
      "design-assignment": `/home/postregistration/designassignment?fileId=${fileId}&fileType=${fileType}`,
      "design-ctc": `/home/postregistration/designctc?fileId=${fileId}&fileType=${fileType}`,
      "design-license": `/home/postregistration/designlicense?fileId=${fileId}&fileType=${fileType}`,
      "design-mortgage": `/home/postregistration/designmortgage?fileId=${fileId}&fileType=${fileType}`,
      "design-merger": `/home/postregistration/designmerger?fileId=${fileId}&fileType=${fileType}`,
      "trademark-ctc": `/home/postregistration/trademarkctc?fileId=${fileId}&fileType=${fileType}`,
    };
    return routeMap[serviceId] || "";
  }

  // Close modal function
  function closeModal(): void {
    onClose();
    isOpen = false;
  }

  // Function to get readable status name from ApplicationStatuses enum
  function getStatusName(statusValue: number): string {
    // Find the key name for the given status value
    const statusKey = Object.keys(ApplicationStatuses).find(
      (key) =>
        ApplicationStatuses[key as keyof typeof ApplicationStatuses] ===
        statusValue,
    );
    return statusKey || "Unknown";
  }

  // Handle search submission - following same pattern as existing implementation
  async function handleSearch(): Promise<void> {
    if (!searchQuery) {
      error = "Please enter a file number";
      return;
    }

    isLoading = true;
    error = null;

    try {
      const trimmedQuery = searchQuery.trim();

      // Check file type from backend
      const res = await fetch(
        `${baseURL}/api/files/files/${encodeURIComponent(trimmedQuery)}/type`,
      );
      const data = await res.json();

      if (!res.ok) {
        error = data.message || "File not found.";
        return;
      }

      const actualType = data.type?.toLowerCase();
      if (actualType !== ipType) {
        error = `File type mismatch. You selected "${ipType}", but file is "${actualType}".`;
        return;
      }

      // Determine if we need file details for status validation
      const isRecordal = recordalServices.includes(serviceId);
      const isChange = changeServices.includes(serviceId);
      const isPatentPostReg = patentPostRegServices.includes(serviceId);
      const needsStatusCheck = isRecordal || isChange || isPatentPostReg;

      let file: any = null;

      if (needsStatusCheck) {
        file = await fetchFileDetails(trimmedQuery);
        if (!file) {
          error = "Unable to verify file status. Please try again.";
          return;
        }

        const fileStatus = file.fileStatus;

        // Build allowed statuses based on service group
        let allowedStatuses: number[];
        if (isRecordal) {
          allowedStatuses = [
            ApplicationStatuses.Publication,
            ApplicationStatuses.AwaitingCertification,
            ApplicationStatuses.AwaitingCertificateConfirmation,
            ApplicationStatuses.Active,
            ApplicationStatuses.PendingRenewal,
          ];
        } else if (isChange) {
          allowedStatuses = [
            ApplicationStatuses.Active,
            ApplicationStatuses.Publication,
            ApplicationStatuses.AwaitingCertification,
          ];
        } else {
          // Patent post-registration: Active only
          allowedStatuses = [ApplicationStatuses.Active];
        }

        if (!allowedStatuses.includes(fileStatus)) {
          if (isPatentPostReg) {
            error = `${serviceName} is only available for Active patent files. Current file status: ${getStatusName(fileStatus)}`;
          } else if (isChange) {
            error = `${serviceName} is NOT available for this file status. Current file status: ${getStatusName(fileStatus)}`;
          } else {
            error = `${serviceName} is only available for files with status: Publication, Awaiting Certification, Awaiting Certificate Confirmation, or Active. Current file status: ${file.statusText || "Unknown"}`;
          }
          return;
        }
      }

      // Route to appropriate destination
      const changeType = getChangeType(serviceId);
      const fileTypeNum =
        ipType === "trademark" ? "2" : ipType === "patent" ? "0" : "1";

      if (changeType) {
        await goto(`/home/postregistration/changedata?fileId=${trimmedQuery}&fileType=${fileTypeNum}&changeType=${changeType}`);
      } else if (serviceId === "renewal") {
        await handleRenewalService(trimmedQuery, ipType, false);
      } else if (serviceId === "restoration") {
        await handleRenewalService(trimmedQuery, ipType, true);
      } else if (isPatentPostReg || designPostRegServices.includes(serviceId)) {
        const fileType = isPatentPostReg ? "patent" : "design";
        sessionStorage.setItem(
          "searchParams",
          JSON.stringify({ query: trimmedQuery, fileType, serviceType: serviceId }),
        );
        await goto("/home/postregistration/search");
      } else {
        const route = getPostRegistrationRoute(serviceId, trimmedQuery, fileTypeNum);
        if (route) {
          await goto(route);
        }
      }
    } catch (err) {
      const catchError = err as Error;
      error = catchError.message || "An error occurred during search";
    } finally {
      isLoading = false;
    }
  }

  // Handle renewal service - following exact same logic as postregistration/search
  async function handleRenewalService(
    fileNumber: string,
    ipType: string,
    restoration: boolean,
  ): Promise<void> {
    try {
      const file = await fetchFileDetails(fileNumber);
      if (!file) {
        error = restoration ? "Failed to fetch file details for renewal." : "File not found.";
        return;
      }

      const applicantName =
        file.fileApplicant ?? `${$loggedInUser?.firstName} ${$loggedInUser?.lastName}`;

      // Handle restoration separately
      if (restoration) {
        const restorationRes = await fetch(
          `${baseURL}/api/files/RestorationRequest?fileId=${fileNumber}&userId=${$loggedInUser?.id}`,
        );
        const restorationData = await restorationRes.json();
        if (!restorationRes.ok) {
          error = "This file is not eligible for restoration.";
          return;
        }
        sessionStorage.setItem(
          "formData",
          JSON.stringify({ ...restorationData, fileId: fileNumber, applicantName }),
        );
        await goto(`/payment?type=restoration`);
        return;
      }

      // Map file type to FileTypes enum and payment route
      const fileTypeMap: Record<number, { fileType: number; paymentType: string }> = {
        0: { fileType: FileTypes.Patent, paymentType: "patentRenewal" },
        2: { fileType: FileTypes.Trademark, paymentType: "trademarkRenewal" },
        1: { fileType: FileTypes.Design, paymentType: "designRenewal" },
      };

      const config = fileTypeMap[file.fileTypes];
      if (!config) return;

      const renewalRes = await fetch(
        `${baseURL}/api/files/RenewalCost?fileNumber=${fileNumber}&fileType=${config.fileType}&userId=${$loggedInUser?.id}`,
      );
      const renewalData = await renewalRes.json();
      sessionStorage.setItem(
        "renewalData",
        JSON.stringify({ ...renewalData, fileId: fileNumber, applicantName }),
      );
      await goto(`/payment?type=${config.paymentType}`);
    } catch (err) {
      error = "Error processing renewal request.";
    }
  }

  // Handle outside click
  function handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains("modal-overlay")) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    on:click={handleOutsideClick}
  >
    <div
      class="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      on:click|stopPropagation
    >
      <div class="flex items-center justify-between mb-4">
        <h3 id="modal-title" class="text-lg font-bold text-black">
          {serviceName}
        </h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600"
          on:click={closeModal}
        >
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- File Type Display - No selection needed, context-aware -->
        <div class="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
          <Icon
            icon={ipType === "trademark"
              ? "mdi:scale-balance"
              : ipType === "patent"
                ? "mdi:lightbulb-outline"
                : "mdi:palette-outline"}
            class="text-green-600 w-5 h-5"
          />
          <span class="text-sm font-medium text-gray-700">
            File Type: {ipType === "trademark"
              ? "Trademark"
              : ipType === "patent"
                ? "Patent"
                : "Design"}
          </span>
        </div>

        <!-- File Number Input -->
        <div>
          <label
            for="fileNumber"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            File Number <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fileNumber"
            bind:value={searchQuery}
            placeholder="Enter file number"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            on:keydown={(e) => {
              if (e.key === "Enter" && searchQuery.trim() && !isLoading) {
                handleSearch();
              }
            }}
          />
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="flex items-center space-x-2 text-red-600 text-sm">
            <Icon icon="mdi:alert-circle" class="w-4 h-4" />
            <span>{error}</span>
          </div>
        {/if}

        <!-- Info Message -->
        <div class="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          <Icon icon="mdi:information-outline" class="w-4 h-4 inline mr-1" />
          {#if patentPostRegServices.includes(serviceId)}
            This service is only available for Active patent files.
          {:else if ["renewal"].includes(serviceId)}
            Renewal is only available for registered {ipType} files with status 'Active' within 90 days to the due date, or 'Pending Renewal' status.
          {:else if ["restoration"].includes(serviceId)}
            Restoration is only available for Inactive {ipType} files
          {:else}
            This service is only available for accepted and registered {ipType} files
            with status 'Publication' 'Awaiting Certification' and 'Active'
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2 pt-4">
          <button
            type="button"
            class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            on:click={closeModal}
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
            on:click={handleSearch}
          >
            {#if isLoading}
              <Icon
                icon="mdi:loading"
                class="w-4 h-4 mr-2 animate-spin inline"
              />
              Searching...
            {:else}
              Continue
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
