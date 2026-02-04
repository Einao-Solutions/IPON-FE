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
  let assignmentDetails: any = null;
  let loading = false;
  let error: string | null = null;
  let comment = "";
  let submitting = false;

  // Reactive statement to fetch data when dialog opens
  $: if (open && fileId && !assignmentDetails) {
    fetchAssignmentDetails();
  }

  // Reset state when dialog closes
  $: if (!open) {
    resetState();
  }

  async function fetchAssignmentDetails() {
    loading = true;
    error = null;
    assignmentDetails = null;
    
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetPatentAssignmentDetails?fileId=${encodeURIComponent(fileId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch assignment details");
      }
      
      const data = await response.json();
      assignmentDetails = data.data; // Assuming ApiResponse<object> wrapper
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error loading assignment details";
    } finally {
      loading = false;
    }
  }

  async function handleAssignmentDecision(approve: boolean) {
    submitting = true;
    try {
      // You'll need to implement the assignment decision endpoint similar to withdrawal
      const response = await fetch(
        `${baseURL}/api/files/patentassignmentdecision`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            FileId: fileId,
            ApplicationId: applicationId,
            Approve: approve,
            Comment: comment,
          }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");
      
      toast.success(data.message);
      open = false;
      
      // Reload page after 3 seconds like the withdrawal dialog
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
    assignmentDetails = null;
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
        <Icon
          icon="mdi:transfer-right"
          width="1.5em"
          height="1.5em"
          class="text-blue-600"
        />
        Patent Assignment Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process patent assignment application details.
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
          <span>Loading assignment details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {error}
        </div>
      {:else if assignmentDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label class="font-semibold">File Number:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {assignmentDetails.fileId}
              </p>
            </div>
            <div>
              <Label class="font-semibold">Filing Date:</Label>
              <p class="mt-1 p-2 bg-gray-50 rounded border">
                {assignmentDetails.filingdate
                  ? new Date(assignmentDetails.filingdate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <!-- Assignment Parties -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Old Assignor Details -->
            {#if assignmentDetails.oldAssignor}
              <div class="border rounded-lg p-4 bg-red-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-minus" class="text-red-600" />
                  Old Assignor (From)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {assignmentDetails.oldAssignor.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {assignmentDetails.oldAssignor.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {assignmentDetails.oldAssignor.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {assignmentDetails.oldAssignor.phone || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {assignmentDetails.oldAssignor.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {assignmentDetails.oldAssignor.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}

            <!-- New Assignee Details -->
            {#if assignmentDetails.newAssignee}
              <div class="border rounded-lg p-4 bg-green-50">
                <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account-plus" class="text-green-600" />
                  New Assignee (To)
                </h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {assignmentDetails.newAssignee.name || "N/A"}
                  </div>
                  <div>
                    <strong>Address:</strong> {assignmentDetails.newAssignee.address || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {assignmentDetails.newAssignee.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {assignmentDetails.newAssignee.phone || "N/A"}
                  </div>
                  <div>
                    <strong>State:</strong> {assignmentDetails.newAssignee.state || "N/A"}
                  </div>
                  <div>
                    <strong>Nationality:</strong> {assignmentDetails.newAssignee.nationality || "N/A"}
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Assignment Deed Attachments -->
          <div class="mb-4">
            <Label class="font-semibold mb-1">Assignment Deed Attachments:</Label>
            {#if assignmentDetails.assignmentDeedAttachments && assignmentDetails.assignmentDeedAttachments.length}
              <ul class="list-disc pl-5 space-y-2">
                {#each assignmentDetails.assignmentDeedAttachments as attachment}
                  <li>
                    <span class="font-medium">{attachment.name}:</span>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener"
                      class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                      <span>View Document</span>
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <span class="text-gray-500 ml-6">No assignment deed attachments</span>
            {/if}
          </div>

          <!-- Supporting Document Attachments -->
          <div class="mb-4">
            <Label class="font-semibold mb-1">Supporting Document Attachments:</Label>
            {#if assignmentDetails.supportingDocumentAttachments && assignmentDetails.supportingDocumentAttachments.length}
              <ul class="list-disc pl-5 space-y-2">
                {#each assignmentDetails.supportingDocumentAttachments as attachment}
                  <li>
                    <span class="font-medium">{attachment.name}:</span>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener"
                      class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                      <span>View Document</span>
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <span class="text-gray-500 ml-6">No supporting documents</span>
            {/if}
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="assignment-comment" class="block font-medium mb-1">
              Decision Comment: <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="assignment-comment"
              bind:value={comment}
              rows="3"
              class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your review comment and decision reason..."
              required
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleAssignmentDecision(true)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve Assignment
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleAssignmentDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject Assignment
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