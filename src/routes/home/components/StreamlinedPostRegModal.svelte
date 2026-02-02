<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { baseURL, ApplicationStatuses } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import * as Dialog from "$lib/components/ui/dialog";

  export let isOpen = false;
  export let serviceId: string;
  export let serviceName: string;
  export let ipType: string;
  export let onClose: () => void;

  // Form data
  let searchQuery = "";
  let isLoading = false;
  let error: string | null = null;

  // Map serviceId to the appropriate changeType for changedata services
  function getChangeType(serviceId: string): string | null {
    const changeTypeMap: Record<string, string> = {
      "change-applicant-name": "Name",
      "change-applicant-address": "Address",
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
      // Patent post-registration services
      "patent-amendment": `/home/postregistration/patentamendment?fileId=${fileId}&fileType=${fileType}`,
      "patent-assignment": `/home/postregistration/patentassignment?fileId=${fileId}&fileType=${fileType}`,
      "patent-ctc": `/home/postregistration/patentctc?fileId=${fileId}&fileType=${fileType}`,
      "patent-license": `/home/postregistration/patentlicense?fileId=${fileId}&fileType=${fileType}`,
      "patent-mortgage": `/home/postregistration/patentmortgage?fileId=${fileId}&fileType=${fileType}`,
      "patent-merger": `/home/postregistration/patentmerger?fileId=${fileId}&fileType=${fileType}`,
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
      // Check file type from backend - preserve exact same validation logic
      const res = await fetch(
        `${baseURL}/api/files/files/${encodeURIComponent(searchQuery.trim())}/type`,
      );
      const data = await res.json();

      if (!res.ok) {
        error = data.message || "File not found.";
        return;
      }

      const actualType = data.type?.toLowerCase();
      const expectedType = ipType; // 'trademark', 'patent', or 'design'

      if (actualType !== expectedType) {
        error = `File type mismatch. You selected "${expectedType}", but file is "${actualType}".`;
        return;
      }

      // Check file status for recordals (renewal, merger, assignment, registered users)
      if (
        ["renewal", "merger", "assignment", "registered-user"].includes(
          serviceId,
        )
      ) {
        // Get file details to check status
        const fileRes = await fetch(
          `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(searchQuery.trim())}`,
        );
        const fileData = await fileRes.json();

        if (!fileRes.ok || !fileData || fileData.length === 0) {
          error = "Unable to verify file status. Please try again.";
          return;
        }

        const file = fileData[0];
        const fileStatus = file?.fileStatus;
        const statusText = file?.statusText?.toLowerCase() || "";

        // Allow only specific statuses: Publication, AwaitingCertification, AwaitingCertificateConfirmation, and Active
        const allowedStatuses = [
          ApplicationStatuses.Publication,
          ApplicationStatuses.AwaitingCertification,
          ApplicationStatuses.AwaitingCertificateConfirmation,
          ApplicationStatuses.Active,
        ];

        const isStatusAllowed = allowedStatuses.includes(fileStatus);

        if (!isStatusAllowed) {
          error = `${serviceName} is only available for files with status: Publication, Awaiting Certification, Awaiting Certificate Confirmation, or Active. Current file status: ${file?.statusText || "Unknown"}`;
          return;
        }
      }

      // Check file status for change of name/address services
      if (
        ["change-applicant-name", "change-applicant-address"].includes(
          serviceId,
        )
      ) {
        // Get file details to check status
        const fileRes = await fetch(
          `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(searchQuery.trim())}`,
        );
        const fileData = await fileRes.json();

        if (!fileRes.ok || !fileData || fileData.length === 0) {
          error = "Unable to verify file status. Please try again.";
          return;
        }

        const file = fileData[0];
        const fileStatus = file?.fileStatus;

        // Allowed statuses for change of name/address
        const allowedStatuses = [
          ApplicationStatuses.Active,
          ApplicationStatuses.Publication,
          ApplicationStatuses.AwaitingCertification,
        ];
        const isStatusAllowed = allowedStatuses.includes(fileStatus);
        if (!isStatusAllowed) {
          error = `${serviceName} is NOT available for this file status. Current file status: ${getStatusName(file?.fileStatus)}`;
          return;
        }
      }

      // Check file status for patent post-registration services
      if (
        [
          "patent-amendment",
          "patent-assignment",
          "patent-ctc",
          "patent-license",
          "patent-mortgage",
        ].includes(serviceId)
      ) {
        // Get file details to check status
        const fileRes = await fetch(
          `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(searchQuery.trim())}`,
        );
        const fileData = await fileRes.json();

        if (!fileRes.ok || !fileData || fileData.length === 0) {
          error = "Unable to verify file status. Please try again.";
          return;
        }

        const file = fileData[0];
        const fileStatus = file?.fileStatus;

        // Patent post-registration services only allowed for Active files
        if (fileStatus !== ApplicationStatuses.Active) {
          error = `${serviceName} is only available for Active patent files. Current file status: ${getStatusName(file?.fileStatus)}`;
          return;
        }
      }

      // Route to appropriate destination based on service type
      const changeType = getChangeType(serviceId);
      const fileTypeNum =
        ipType === "trademark" ? "2" : ipType === "patent" ? "0" : "1";

      if (changeType) {
        // Handle changedata services (name/address changes)
        const route = `/home/postregistration/changedata?fileId=${searchQuery.trim()}&fileType=${fileTypeNum}&changeType=${changeType}`;
        await goto(route);
      } else {
        // Handle post-registration services (renewal, assignment, merger, registered-user)

        // For renewal, get file details and route directly to payment
        if (serviceId === "renewal") {
          await handleRenewalService(searchQuery.trim(), ipType);
        } else if (
          [
            "patent-amendment",
            "patent-assignment",
            "patent-ctc",
            "patent-license",
            "patent-mortgage",
          ].includes(serviceId)
        ) {
          // For patent post-registration services, go to search page first with service type
          sessionStorage.setItem(
            "searchParams",
            JSON.stringify({
              query: searchQuery.trim(),
              fileType: "patent",
              serviceType: serviceId,
            }),
          );
          await goto("/home/postregistration/search");
        } else {
          // For other post-registration services, go directly to service page
          const route = getPostRegistrationRoute(
            serviceId,
            searchQuery.trim(),
            fileTypeNum,
          );
          if (route) {
            await goto(route);
          }
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
  ): Promise<void> {
    try {
      // Get file details - same API call as postregistration search
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${fileNumber}`,
      );

      if (!response.ok) {
        error = "Failed to fetch file details for renewal.";
        return;
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        error = "File not found.";
        return;
      }

      const fileResult = results[0];
      const isPatent = fileResult.fileTypes === 0;

      // Follow exact same renewal logic as postregistration/search
      if (isPatent) {
        const currentStatus = fileResult?.fileStatus;
        // Only allow Active (0) or Inactive (1) status for patents
        if (currentStatus !== 0 && currentStatus !== 1) {
          error = "Patent file must be Active or Inactive.";
          return;
        }

        // Check for PCT or Conventional patent type
        const patentTypeStr = (fileResult.patentType || "").toLowerCase();
        if (["pct", "conventional"].includes(patentTypeStr)) {
          if (
            !Array.isArray(fileResult.firstPriorityInfo) ||
            fileResult.firstPriorityInfo.length === 0
          ) {
            error =
              "First Priority Information does not exist for this file. Please use the Update Patent module on the dashboard to update your file before filing for a renewal.";
            return;
          }
        }

        // Store patent data for payment
        sessionStorage.removeItem("applicantDetails");
        const patentData = {
          fileId: fileResult.fileId,
          type: 0, // patent
          titleOfInvention: fileResult.titleOfInvention,
          fileApplicant: fileResult.fileApplicant,
          applicantEmail: fileResult.applicantEmail,
          applicantPhone: fileResult.applicantPhone,
          patentType: fileResult.patentType,
          patentApplicationType: fileResult.patentApplicationType,
          filingDate: fileResult.filingDate,
          correspondence: fileResult.correspondence,
        };
        sessionStorage.setItem("applicationData", JSON.stringify(patentData));
      } else {
        // Trademark renewal logic
        const currentStatus = fileResult?.fileStatus;
        if (currentStatus === "20") {
          // AwaitingPayment status
          error = "Cannot renew an application currently under review";
          return;
        }

        // Store trademark data for payment
        sessionStorage.removeItem("applicationData");
        const applicantDetails = {
          name: fileResult.fileApplicant || "",
          email: fileResult.applicantEmail || "",
          phone: fileResult.applicantPhone || "",
          fileId: fileResult.fileId,
          type: 2, // trademark
        };
        sessionStorage.setItem(
          "applicantDetails",
          JSON.stringify(applicantDetails),
        );
      }

      // Route to payment page
      await goto(`/payment?type=renewal&fileId=${fileResult.fileId}`);
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
          {#if ["patent-amendment", "patent-assignment", "patent-ctc", "patent-license", "patent-mortgage"].includes(serviceId)}
            This service is only available for Active patent files.
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
