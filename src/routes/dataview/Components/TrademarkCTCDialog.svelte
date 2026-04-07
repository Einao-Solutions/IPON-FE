<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
  import { baseURL } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import { get } from "svelte/store";

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

  $: isReadOnly = status === 10 || status === 11;
  $: isApproved = status === 10;
  $: isRejected = status === 11;

  $: if (open && fileId && !ctcDetails) {
    fetchCTCDetails();
  }

  $: if (!open) {
    resetState();
  }

  async function fetchCTCDetails() {
    loading = true;
    error = null;
    ctcDetails = null;

    try {
      const response = await fetch(
        `${baseURL}/api/files/GetTrademarkCtcDetails?fileId=${encodeURIComponent(fileId)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch CTC details");
      }

      const data = await response.json();
      ctcDetails = data.data;
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
      const user = get(loggedInUser);
      const appUserId = user?.id || null;

      const response = await fetch(
        `${baseURL}/api/files/TrademarkCtcDecision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: fileId,
            appId: ctcDetails?.appId || applicationId,
            approve: approve,
            reason: comment,
            userId: appUserId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");

      const successMessage = approve
        ? "Trademark CTC application has been successfully approved."
        : "Trademark CTC application has been successfully rejected.";
      toast.success(successMessage);
      open = false;

      setTimeout(() => {
        location.reload();
      }, 2000);
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

  function downloadLetter(letterType: string) {
    const appIdToUse = ctcDetails?.appId || applicationId;
    const url = `${baseURL}/api/Letters/GetLetter?fileId=${encodeURIComponent(fileId)}&letterType=${letterType}&applicationId=${encodeURIComponent(appIdToUse)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
        <Icon icon="mdi:file-certificate" class="text-green-600" />
        Trademark Certified True Copy (CTC) Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process trademark CTC application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if loading}
        <div class="flex items-center gap-2 text-green-600 py-8 justify-center">
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
          <!-- File & Application Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="font-semibold">File Number:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">{ctcDetails.fileId || fileId || 'N/A'}</p>
            </div>
            <div>
              <Label class="font-semibold">Application ID:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">{ctcDetails.appId || applicationId || 'N/A'}</p>
            </div>
            <div>
              <Label class="font-semibold">Applicant Name:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">{ctcDetails.applicantName || 'N/A'}</p>
            </div>
            <div>
              <Label class="font-semibold">Payment Reference (RRR):</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border font-mono">{ctcDetails.paymentRRR || 'N/A'}</p>
            </div>
            <div>
              <Label class="font-semibold">Request Date:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">{ctcDetails.filingDate ? new Date(ctcDetails.filingDate).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <Label class="font-semibold">Status:</Label>
              <p class="mt-1 p-2 rounded border font-semibold
                {isApproved ? 'bg-green-50 text-green-700 border-green-200' :
                 isRejected ? 'bg-red-50 text-red-700 border-red-200' :
                 'bg-blue-50 text-blue-700 border-blue-200'}">
                {ctcDetails.status || 'AwaitingRecordalProcess'}
              </p>
            </div>
          </div>

          <!-- Requested Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block">
              <Icon icon="mdi:file-document-multiple" class="inline text-green-600 mr-2" />
              Requested Certified True Copy Attachments:
            </Label>
            {#if ctcDetails.requestedAttachments && Array.isArray(ctcDetails.requestedAttachments) && ctcDetails.requestedAttachments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each ctcDetails.requestedAttachments as attachment, attachmentIndex}
                  {#if typeof attachment === 'string'}
                    <div class="border rounded-lg p-3 bg-gray-50">
                      <div class="flex items-center gap-3">
                        <Icon icon="mdi:file-document-outline" class="text-green-600" width="1.5em" height="1.5em" />
                        <span class="font-medium text-gray-800">{attachment}</span>
                      </div>
                    </div>
                  {:else if attachment && attachment.urls && Array.isArray(attachment.urls) && attachment.urls.length > 0}
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
                  {:else}
                    <div class="border rounded-lg p-3 bg-gray-50">
                      <div class="flex items-center gap-3">
                        <Icon icon="mdi:file-document-outline" class="text-green-600" width="1.5em" height="1.5em" />
                        <span class="font-medium text-gray-800">{attachment.name || `Attachment ${attachmentIndex + 1}`}</span>
                      </div>
                    </div>
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

          <!-- Letter Downloads (read-only states) -->
          {#if isReadOnly}
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:download" width="1.2em" height="1.2em" class="text-gray-600" />
                Download Letters
              </p>
              <div class="flex flex-wrap gap-3">
                {#if isApproved}
                  <Button
                    variant="outline"
                    class="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50"
                    on:click={() => downloadLetter('TrademarkCtcAcknowledgement')}
                  >
                    <Icon icon="mdi:file-check-outline" width="1.2em" height="1.2em" />
                    Acknowledgement Letter
                  </Button>
                  <Button
                    variant="outline"
                    class="flex items-center gap-2 border-blue-500 text-blue-700 hover:bg-blue-50"
                    on:click={() => downloadLetter('TrademarkCtcReceipt')}
                  >
                    <Icon icon="mdi:receipt" width="1.2em" height="1.2em" />
                    Payment Receipt
                  </Button>
                {/if}
                {#if isRejected}
                  <Button
                    variant="outline"
                    class="flex items-center gap-2 border-red-500 text-red-700 hover:bg-red-50"
                    on:click={() => downloadLetter('TrademarkCtcRefusalLetter')}
                  >
                    <Icon icon="mdi:file-cancel-outline" width="1.2em" height="1.2em" />
                    Refusal Letter
                  </Button>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Summary Information -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="mdi:information" width="1.5em" height="1.5em" class="text-green-600 mt-0.5" />
              <div>
                <p class="font-semibold text-green-900">CTC Application Summary</p>
                <p class="text-sm text-green-800 mt-1">
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
              class="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
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
              {#if submitting}
                <Icon icon="line-md:loading-loop" width="1.2em" height="1.2em" class="inline mr-1" />
              {:else}
                <Icon icon="mdi:check-circle-outline" width="1.2em" height="1.2em" class="inline mr-1" />
              {/if}
              Approve CTC
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleCTCDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              {#if submitting}
                <Icon icon="line-md:loading-loop" width="1.2em" height="1.2em" class="inline mr-1" />
              {:else}
                <Icon icon="mdi:close-circle-outline" width="1.2em" height="1.2em" class="inline mr-1" />
              {/if}
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
