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
  let ctcDetails: any = null;
  let loading = false;
  let error: string | null = null;
  let comment = "";
  let submitting = false;

  // Check if application is already processed (read-only mode)
  // ApplicationStatuses: Approved = 10, Rejected = 11
  $: isReadOnly = status === 10 || status === 11;

  // Helper function to parse DD/MM/YYYY HH:mm:ss format
  function parseFilingDate(dateStr: string): string {
    if (!dateStr) return "N/A";
    try {
      // Expected format: "18/02/2026 15:09:14"
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/');
      const isoDate = `${year}-${month}-${day}${timePart ? 'T' + timePart : ''}`;
      const date = new Date(isoDate);
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr; // Return original if parsing fails
    }
  }

  // Reactive statement to fetch data when dialog opens
  $: if (open && fileId && !ctcDetails) {
    fetchCTCDetails();
  }

  // Reset state when dialog closes
  $: if (!open) {
    resetState();
  }

  async function fetchCTCDetails() {
    loading = true;
    error = null;
    ctcDetails = null;
    
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetPatentCtcDetails?fileId=${encodeURIComponent(fileId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch CTC details");
      }
      
      const data = await response.json();
      ctcDetails = data.data; // Assuming ApiResponse<object> wrapper
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error loading CTC details";
    } finally {
      loading = false;
    }
  }

  async function handleCTCDecision(approve: boolean) {
    submitting = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/ctc-decision`, 
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
          }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");
      
      const successMessage = approve 
        ? "Patent CTC application has been successfully approved." 
        : "Patent CTC application has been successfully rejected.";
      toast.success(successMessage);
      open = false;
      
      // Reload page after 3 seconds like other dialogs
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error submitting decision";
      toast.error(error);
    } finally {
      submitting = false;
    }
  }

  function resetState() {
    ctcDetails = null;
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
        <Icon icon="mdi:file-certificate" class="text-blue-600" />
        Patent Certified True Copy (CTC) Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process patent CTC application details.
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
          <span>Loading CTC details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {error}
        </div>
      {:else if ctcDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="font-semibold">File Number:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {ctcDetails.fileId || "N/A"}
              </p>
            </div>
            <div>
              <Label class="font-semibold">Filing Date:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {parseFilingDate(ctcDetails.filingDate)}
              </p>
            </div>
          </div>

          <!-- Requested Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block">
              <Icon icon="mdi:file-document-multiple" class="inline text-blue-600 mr-2" />
              Requested Certified True Copy Attachments:
            </Label>
            {#if ctcDetails.requestedAttachments && Array.isArray(ctcDetails.requestedAttachments) && ctcDetails.requestedAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each ctcDetails.requestedAttachments as attachment, attachmentIndex}
                     {#if attachment && attachment.urls && Array.isArray(attachment.urls) && attachment.urls.length > 0}
                    {#each attachment.urls as fileUrl, index}
                      {#if fileUrl}
                        <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                          <div class="flex items-center justify-between gap-3">
                            <div class="flex-1 min-w-0">
                              <div class="font-medium text-gray-800 truncate">
                                {attachment.name || `Attachment ${attachmentIndex + 1}`} - Document {index + 1}
                              </div>
                              <div class="text-xs text-gray-500 mt-1">
                                Document {index + 1} of {attachment.urls.length}
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
                <p>No attachments requested</p>
              </div>
            {/if}
          </div>

          <!-- Summary Information -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="mdi:information" width="1.5em" height="1.5em" class="text-blue-600 mt-0.5" />
              <div>
                <p class="font-semibold text-blue-900">CTC Application Summary</p>
                <p class="text-sm text-blue-800 mt-1">
                  This applicant has requested certified true copies of 
                  <strong>{ctcDetails.requestedAttachments?.length || 0}</strong>
                  attachment{ctcDetails.requestedAttachments?.length !== 1 ? 's' : ''} for file 
                  <strong>{ctcDetails.fileId}</strong>.
                </p>
              </div>
            </div>
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="ctc-comment" class="block font-medium mb-1">
              Decision Comment: {#if !isReadOnly}<span class="text-red-500">*</span>{/if}
            </Label>
            <Textarea
              id="ctc-comment"
              bind:value={comment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
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
              on:click={() => handleCTCDecision(true)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve CTC
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleCTCDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject CTC
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
