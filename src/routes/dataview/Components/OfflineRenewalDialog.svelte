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

  export let open = false;
  export let applicationId = "";
  export let status: number | null = null;

  interface RenewalDetails {
    fileId: string;
    renewalYear: number;
    paymentDate: string;
    paymentId: string;
    renewalReceiptAttachments: { url: string }[];
    renewalCertificateAttachments: { url: string }[];
  }

  let details: RenewalDetails | null = null;
  let loading = false;
  let error: string | null = null;
  let reason = "";
  let submitting = false;

  // ApplicationStatuses: Approved = 10, Rejected = 11
  $: isReadOnly = status === 10 || status === 11;

  $: if (open && applicationId && !details) {
    fetchDetails();
  }

  $: if (!open) {
    resetState();
  }

  async function fetchDetails() {
    loading = true;
    error = null;
    details = null;
    try {
      const user = get(loggedInUser);
      const res = await fetch(
        `${baseURL}/api/files/offline-renewal/application-history/${encodeURIComponent(applicationId)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch details");
      details = json.data;
    } catch (e) {
      error = (e as Error).message || "Error loading offline renewal details";
    } finally {
      loading = false;
    }
  }

  async function handleDecision(approve: boolean) {
    submitting = true;
    error = null;
    try {
      const user = get(loggedInUser);
      const res = await fetch(`${baseURL}/api/files/offline-renewal/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RequestId: applicationId,
          Approve: approve,
          Reason: reason.trim(),
          UserId: user?.id ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to submit decision");
      toast.success(
        approve
          ? "Offline renewal approved. Renewal history updated."
          : "Offline renewal refused.",
        { position: "top-right" },
      );
      open = false;
      setTimeout(() => location.reload(), 2000);
    } catch (e) {
      error = (e as Error).message || "Error submitting decision";
    } finally {
      submitting = false;
    }
  }

  function resetState() {
    details = null;
    loading = false;
    error = null;
    reason = "";
    submitting = false;
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="w-11/12 max-w-3xl mx-auto my-8 max-h-[90vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col"
  >
    <Dialog.Header class="flex-shrink-0">
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <Icon icon="mdi:history" width="1.5em" height="1.5em" class="text-green-600" />
        Offline Renewal Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process offline renewal application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if loading}
        <div class="flex items-center gap-2 text-green-600 py-8 justify-center">
          <Icon icon="line-md:loading-loop" width="2em" height="2em" class="animate-spin" />
          <span>Loading renewal details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {error}
        </div>
      {:else if details}
        <div class="space-y-6">
          <!-- Renewal Details -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon icon="mdi:form-select" class="text-green-600" />
              Renewal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label class="font-semibold text-gray-600">File ID</Label>
                <p class="mt-1 p-2 bg-white rounded border">{details.fileId}</p>
              </div>
              <div>
                <Label class="font-semibold text-gray-600">Renewal Year</Label>
                <p class="mt-1 p-2 bg-white rounded border">{details.renewalYear}</p>
              </div>
              <div>
                <Label class="font-semibold text-gray-600">Payment Date</Label>
                <p class="mt-1 p-2 bg-white rounded border">{formatDate(details.paymentDate)}</p>
              </div>
              <div>
                <Label class="font-semibold text-gray-600">Payment ID / RRR</Label>
                <p class="mt-1 p-2 bg-white rounded border font-mono">{details.paymentId}</p>
              </div>
            </div>
          </div>

          <!-- Renewal Receipt Attachments -->
          <div>
            <Label class="font-semibold mb-3 flex items-center gap-2">
              Renewal Receipt(s)
            </Label>
            {#if details.renewalReceiptAttachments?.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each details.renewalReceiptAttachments as att, index}
                  <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between gap-3">
                    <span class="text-sm text-gray-700 truncate">Receipt {index + 1}</span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener"
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Icon icon="mdi:file-eye" width="1.2em" />
                      View
                    </a>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-4 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed text-sm">
                No receipt attachments
              </div>
            {/if}
          </div>

          <!-- Certificate Attachments -->
          <div>
            <Label class="font-semibold mb-3 flex items-center gap-2">
              Certificate(s)
            </Label>
            {#if details.renewalCertificateAttachments?.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each details.renewalCertificateAttachments as att, index}
                  <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between gap-3">
                    <span class="text-sm text-gray-700 truncate">Certificate {index + 1}</span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener"
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Icon icon="mdi:file-eye" width="1.2em" />
                      View
                    </a>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-4 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed text-sm">
                No certificate attachments
              </div>
            {/if}
          </div>

          <!-- Decision Section -->
          {#if !isReadOnly}
            <div class="mb-4">
              <Label for="renewal-reason" class="font-medium mb-1 flex items-center gap-2">
                <Icon icon="mdi:comment-text-outline" class="text-green-600" />
                Decision Reason <span class="text-red-500">*</span>
              </Label>
              <Textarea
                id="renewal-reason"
                bind:value={reason}
                rows={3}
                class="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
                placeholder="Enter reason for your decision..."
              />
            </div>
          {:else}
            <p class="text-sm text-gray-500 italic">This application has already been processed.</p>
          {/if}

          <div class="flex gap-4 justify-end {isReadOnly ? 'opacity-40 pointer-events-none' : ''}">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50"
              on:click={() => handleDecision(true)}
              disabled={isReadOnly || submitting || !reason.trim()}
            >
              <Icon icon="mdi:check-circle-outline" width="1.2em" class="inline mr-1" />
              Approve
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50"
              on:click={() => handleDecision(false)}
              disabled={isReadOnly || submitting || !reason.trim()}
            >
              <Icon icon="mdi:close-circle-outline" width="1.2em" class="inline mr-1" />
              Refuse
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4 border-t bg-gray-50">
      <Button on:click={() => (open = false)} variant="outline">
        <Icon icon="mdi:close" width="1.2em" class="inline mr-1" />
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
