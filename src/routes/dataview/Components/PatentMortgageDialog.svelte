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

  // Component state
  let mortgageDetails: any = null;
  let loading = false;
  let error: string | null = null;
  let comment = "";
  let submitting = false;

  // Reactive statement to fetch data when dialog opens
  $: if (open && fileId && !mortgageDetails) {
    fetchMortgageDetails();
  }

  // Reset state when dialog closes
  $: if (!open) {
    resetState();
  }

  async function fetchMortgageDetails() {
    loading = true;
    error = null;
    mortgageDetails = null;
    
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetPatentMortgageDetails?fileId=${encodeURIComponent(fileId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch mortgage details");
      }
      
      const data = await response.json();
      mortgageDetails = data.data; // Assuming ApiResponse<object> wrapper
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error loading mortgage details";
    } finally {
      loading = false;
    }
  }

  async function handleMortgageDecision(approve: boolean) {
    submitting = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/mortgage-decision`, 
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
            newMortgagee: approve && mortgageDetails?.newMortgagee ? {
              Name: mortgageDetails.newMortgagee.name,
              Address: mortgageDetails.newMortgagee.address,
              Email: mortgageDetails.newMortgagee.email,
              Phone: mortgageDetails.newMortgagee.phone,
              City: mortgageDetails.newMortgagee.city,
              State: mortgageDetails.newMortgagee.state,
              Nationality: mortgageDetails.newMortgagee.nationality
            } : null,
          }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");
      
      const successMessage = approve ? "Patent mortgage has been successfully approved." : "Patent mortgage has been successfully rejected.";
      toast.success(successMessage);
      open = false;
      
      // Reload page after 3 seconds like other dialogs
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
    mortgageDetails = null;
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
        Patent Mortgage Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process patent mortgage application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if loading}
        <div class="flex items-center gap-2 text-blue-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading mortgage details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {error}
        </div>
      {:else if mortgageDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="font-semibold">File Number:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {mortgageDetails.fileId}
              </p>
            </div>
            <div>
              <Label class="font-semibold">Filing Date:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {mortgageDetails.filingdate
                  ? new Date(mortgageDetails.filingdate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <!-- Mortgage Parties -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Mortgagor Details -->
            {#if mortgageDetails.oldMortgagor}
              <div class="border rounded-lg p-4 bg-red-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-minus" class="text-red-600" />
                  Mortgagor (From)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {mortgageDetails.oldMortgagor.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {mortgageDetails.oldMortgagor.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {mortgageDetails.oldMortgagor.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {mortgageDetails.oldMortgagor.phone || "N/A"}
                  </div>
                  <div>
                    <strong>City:</strong> {mortgageDetails.oldMortgagor.city || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {mortgageDetails.oldMortgagor.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {mortgageDetails.oldMortgagor.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Mortgagee Details -->
            {#if mortgageDetails.newMortgagee}
              <div class="border rounded-lg p-4 bg-green-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-plus" class="text-green-600" />
                  Mortgagee (To)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {mortgageDetails.newMortgagee.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {mortgageDetails.newMortgagee.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {mortgageDetails.newMortgagee.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {mortgageDetails.newMortgagee.phone || "N/A"}
                  </div>
                  <div>
                    <strong>City:</strong> {mortgageDetails.newMortgagee.city || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {mortgageDetails.newMortgagee.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {mortgageDetails.newMortgagee.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Mortgage Agreement Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-document" class="text-gray-600" />
              Mortgage Agreement Attachments:
            </Label>
            {#if mortgageDetails.deedOfMortgageAttachments && Array.isArray(mortgageDetails.deedOfMortgageAttachments) && mortgageDetails.deedOfMortgageAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each mortgageDetails.deedOfMortgageAttachments as attachmentGroup, groupIndex}
                  {#if attachmentGroup && attachmentGroup.url && Array.isArray(attachmentGroup.url) && attachmentGroup.url.length > 0}
                    {#each attachmentGroup.url as fileUrl, index}
                      {#if fileUrl}
                        <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                          <div class="flex items-center justify-between gap-3">
                            <div class="flex-1 min-w-0">
                              <div class="font-medium text-gray-800 truncate">
                                {attachmentGroup.name || "Mortgage Agreement"} - Document {index + 1}
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
                      {/if}
                    {/each}
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
                <p>No mortgage agreement attachments submitted</p>
              </div>
            {/if}
          </div>

          <!-- Supporting Document Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-multiple" class="text-gray-600" />
              Supporting Document Attachments:
            </Label>
            {#if mortgageDetails.supportingDocumentAttachments && Array.isArray(mortgageDetails.supportingDocumentAttachments) && mortgageDetails.supportingDocumentAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each mortgageDetails.supportingDocumentAttachments as attachmentGroup, groupIndex}
                  {#if attachmentGroup && attachmentGroup.url && Array.isArray(attachmentGroup.url) && attachmentGroup.url.length > 0}
                    {#each attachmentGroup.url as fileUrl, index}
                      {#if fileUrl}
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
                      {/if}
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
            <Label for="mortgage-comment" class="block font-medium mb-1">
              Decision Comment: <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="mortgage-comment"
              bind:value={comment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your review comment and decision reason..."
              required
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleMortgageDecision(true)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve Mortgage
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleMortgageDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject Mortgage
            </Button>
          </div>
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