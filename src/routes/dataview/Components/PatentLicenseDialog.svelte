<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
  import { baseURL } from "$lib/helpers";

  // Props
  export let open = false;
  export let fileId = "";
  export let applicationId = "";
  export let status: number | null = null;

  // Component state
  let licenseDetails: any = null;
  let loading = false;
  let error: string | null = null;
  let comment = "";
  let submitting = false;

  // Check if application is already processed (read-only mode)
  // ApplicationStatuses: Approved = 10, Rejected = 11
  $: isReadOnly = status === 10 || status === 11;

  // Reactive statement to fetch data when dialog opens
  $: if (open && fileId && !licenseDetails) {
    fetchLicenseDetails();
  }

  // Reset state when dialog closes
  $: if (!open) {
    resetState();
  }

  async function fetchLicenseDetails() {
    loading = true;
    error = null;
    licenseDetails = null;
    
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetPatentLicenseDetails?fileId=${encodeURIComponent(fileId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch license details");
      }
      
      const data = await response.json();
      licenseDetails = data.data; // Assuming ApiResponse<object> wrapper
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error loading license details";
    } finally {
      loading = false;
    }
  }

  async function handleLicenseDecision(approve: boolean) {
    submitting = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/license-decision`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: fileId,
            appId: applicationId,
            approve: approve,
            reason: comment,
            newLicensee: approve && licenseDetails?.newLicensee ? {
              Name: licenseDetails.newLicensee.name,
              Address: licenseDetails.newLicensee.address,
              Email: licenseDetails.newLicensee.email,
              Phone: licenseDetails.newLicensee.phone,
              City: licenseDetails.newLicensee.city,
              State: licenseDetails.newLicensee.state,
              Country: licenseDetails.newLicensee.nationality
            } : null,
          }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");
      
      const successMessage = approve ? "Patent license has been successfully approved." : "Patent license has been successfully rejected.";
      toast.success(successMessage);
      open = false;
      
      // Reload page after 3 seconds like the assignment dialog
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error submitting decision";
    } finally {
      submitting = false;
    }
  }

  function resetState() {
    licenseDetails = null;
    loading = false;
    error = null;
    comment = "";
    submitting = false;
  }

  function closeDialog() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="w-11/12 max-w-4xl mx-auto my-8 max-h-[90vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col"
  >
    <Dialog.Header class="flex-shrink-0">
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <!-- <Icon
          icon="mdi:license"
          width="1.5em"
          height="1.5em"
          class="text-purple-600"
        /> -->
        Patent License Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process patent license application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if loading}
        <div class="flex items-center gap-2 text-purple-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading license details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {error}
        </div>
      {:else if licenseDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="font-semibold">File Number:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {licenseDetails.fileId}
              </p>
            </div>
            <div>
              <Label class="font-semibold">Filing Date:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {licenseDetails.filingdate
                  ? new Date(licenseDetails.filingdate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <!-- License Parties -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Old Licensor Details -->
            {#if licenseDetails.oldLicensor}
              <div class="border rounded-lg p-4 bg-red-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-minus" class="text-red-600" />
                  Licensor (From)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {licenseDetails.oldLicensor.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {licenseDetails.oldLicensor.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {licenseDetails.oldLicensor.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {licenseDetails.oldLicensor.phone || "N/A"}
                  </div>
                  <div>
                    <strong>City:</strong> {licenseDetails.oldLicensor.city || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {licenseDetails.oldLicensor.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {licenseDetails.oldLicensor.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}

            <!-- New Licensee Details -->
            {#if licenseDetails.newLicensee}
              <div class="border rounded-lg p-4 bg-green-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-plus" class="text-green-600" />
                  Licensee (To)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {licenseDetails.newLicensee.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {licenseDetails.newLicensee.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {licenseDetails.newLicensee.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {licenseDetails.newLicensee.phone || "N/A"}
                  </div>
                  <div>
                    <strong>City:</strong> {licenseDetails.newLicensee.city || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {licenseDetails.newLicensee.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {licenseDetails.newLicensee.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- License Agreement Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-document" class="text-gray-600" />
              Deed of License Attachments:
            </Label>
            {#if licenseDetails.deedOfLicenseAttachments && Array.isArray(licenseDetails.deedOfLicenseAttachments) && licenseDetails.deedOfLicenseAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each licenseDetails.deedOfLicenseAttachments as attachmentGroup}
                  {#if attachmentGroup.url && Array.isArray(attachmentGroup.url)}
                    {#each attachmentGroup.url as fileUrl, index}
                      <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                        <div class="flex items-center justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-800 truncate">
                              {attachmentGroup.name || "Deed of License"} - Document {index + 1}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                              Document {index + 1} of {attachmentGroup.url.length}
                            </div>
                          </div>
                          <div class="flex-shrink-0">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener"
                              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                              <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                              <span>View</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    {/each}
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
                <p>No deed of license attachments submitted</p>
              </div>
            {/if}
          </div>

          <!-- Supporting Document Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-multiple" class="text-gray-600" />
              Supporting Document Attachments:
            </Label>
            {#if licenseDetails.supportingDocumentAttachments && Array.isArray(licenseDetails.supportingDocumentAttachments) && licenseDetails.supportingDocumentAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each licenseDetails.supportingDocumentAttachments as attachmentGroup}
                  {#if attachmentGroup.url && Array.isArray(attachmentGroup.url)}
                    {#each attachmentGroup.url as fileUrl, index}
                      <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                        <div class="flex items-center justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-800 truncate">
                              {attachmentGroup.name || "Supporting Document"} - Document {index + 1}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                              Document {index + 1} of {attachmentGroup.url.length}
                            </div>
                          </div>
                          <div class="flex-shrink-0">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener"
                              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                              <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                              <span>View</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    {/each}
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
                <p>No supporting documents submitted</p>
              </div>
            {/if}
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="license-comment" class="block font-medium mb-1">
              Decision Comment: {#if !isReadOnly}<span class="text-red-500">*</span>{/if}
            </Label>
            <Textarea
              id="license-comment"
              bind:value={comment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-purple-200"
              placeholder="Enter your review comment and decision reason..."
              required
              disabled={isReadOnly}
            />
            {#if isReadOnly}
              <p class="text-sm text-gray-500 mt-1">This application has already been processed.</p>
            {/if}
          </div>

          <!-- Action Buttons -->
          {#if !isReadOnly}
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleLicenseDecision(true)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve License
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleLicenseDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject License
            </Button>
          </div>
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4 border-t bg-gray-50">
      <Button on:click={closeDialog} variant="outline">
        <Icon
          icon="mdi:close"
          width="1.2em"
          height="1.2em"
          class="inline mr-1"
        />
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>