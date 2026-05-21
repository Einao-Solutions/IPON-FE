<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button/index";
  import * as Card from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label/index";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import { baseURL, FileTypes } from "$lib/helpers";
  import { MapTradeMarkClass } from "$lib/constants";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";

  interface FileInfo {
    fileId: string | null;
    fileTitle: string;
    fileClass: Number | null;
    classDescription: string | null;
    fileStatus: Number | null;
    applicantName: string;
    applicantEmail: string | null;
    applicantPhone: string | null;
    applicantAddress: string | null;
    representationUrl: string | null;
    trademarkLogo: number | null;
    disclaimer: string | null;
    additionalDescription: string | null;
    paymentRRR: string | null;
    cost: number | null;
  }

  let fileInfo: FileInfo = {
    fileId: null,
    fileTitle: "",
    fileClass: null,
    classDescription: null,
    fileStatus: null,
    applicantName: "",
    applicantEmail: null,
    applicantPhone: null,
    applicantAddress: null,
    representationUrl: null,
    trademarkLogo: null,
    disclaimer: null,
    additionalDescription: null,
    paymentRRR: null,
    cost: null,
  };

  let fileNumber = "";
  let fileType: FileTypes | null = null;

  // Editable fields
  let newAdditionalDescription = "";
  let newDisclaimer = "";
  let newRepresentation: File | null = null;
  let newRepresentationPreview: string | null = null;

  let isLoading = true;
  let isProcessing = false;
  let error: string | null = null;

  const pageData = get(page);

  onMount(async () => {
    fileNumber = pageData.url.searchParams.get("fileId") ?? "";
    const fileTypeParam = pageData.url.searchParams.get("fileType");
    const parsed = Number(fileTypeParam);
    const validValues = Object.values(FileTypes).filter(
      (v) => typeof v === "number",
    ) as number[];
    fileType =
      !Number.isNaN(parsed) && validValues.includes(parsed)
        ? (parsed as FileTypes)
        : null;

    if (!fileNumber || fileType === null) {
      error = "Missing file number or file type.";
      isLoading = false;
      return;
    }

    await loadFileData();
  });

  async function loadFileData() {
    isLoading = true;
    try {
      const requestBody = {
        UserId: $loggedInUser?.id,
        FileNumber: fileNumber,
        // FileType: fileType,
        // No specific update type — amendment loads the full record
        // UpdateType: null
      };

      const res = await fetch(
        `${baseURL}/api/opposition/OppositionAmendmentCost`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${$loggedInToken}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!res.ok) {
        error = "Unable to retrieve file information.";
        return;
      }

      const data = await res.json();

      fileInfo = {
        fileId: data.fileId ?? fileNumber,
        fileTitle: data.fileTitle ?? "",
        fileClass: data.class ?? null,
        classDescription: MapTradeMarkClass(data.class) ?? null,
        fileStatus: Number(data.fileStatus),
        applicantName: data.applicant.name ?? "",
        applicantEmail: data.applicant.email ?? null,
        applicantPhone: data.applicant.phone ?? null,
        applicantAddress: data.applicant.address ?? null,
        representationUrl: data.representationUrl ?? null,
        trademarkLogo: data.trademarkLogo ?? null,
        disclaimer: data.disclaimer ?? null,
        additionalDescription: data.additionalSpecs ?? null,
        paymentRRR: data.paymentId ?? null,
        cost: data.amount ?? null,
      };

      newAdditionalDescription = fileInfo.additionalDescription ?? "";
      newDisclaimer = fileInfo.disclaimer ?? "";
    } catch (err) {
      console.error(err);
      error = "An error occurred while loading file data.";
    } finally {
      isLoading = false;
    }
  }

  function handleRepresentationChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    newRepresentation = file;
    if (newRepresentationPreview) {
      URL.revokeObjectURL(newRepresentationPreview);
      newRepresentationPreview = null;
    }
    if (file) {
      newRepresentationPreview = URL.createObjectURL(file);
    }
  }

  function clearRepresentation() {
    newRepresentation = null;
    if (newRepresentationPreview) {
      URL.revokeObjectURL(newRepresentationPreview);
      newRepresentationPreview = null;
    }
    const input = document.getElementById(
      "representation-input",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  $: hasChanges =
    newAdditionalDescription !== (fileInfo.additionalDescription ?? "") ||
    newDisclaimer !== (fileInfo.disclaimer ?? "") ||
    newRepresentation !== null;

  async function submitAmendment() {
    if (!hasChanges) {
      toast.error("No changes to submit.");
      return;
    }

    isProcessing = true;
    try {
      const formData = new FormData();
      formData.append("UserId", $loggedInUser?.id ?? "");
      formData.append("FileNumber", fileNumber);
      formData.append("PaymentId", fileInfo.paymentRRR ?? "");
      formData.append(
        "NewAdditionalDescription",
        newAdditionalDescription ?? "",
      );
      formData.append("NewDisclaimer", newDisclaimer ?? "");
      if (newRepresentation) {
        formData.append("NewRepresentation", newRepresentation);
      }

      const res = await fetch(`${baseURL}/api/opposition/OppositionAmendment`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let message = res.statusText;
        try {
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          // not JSON
        }
        toast.error(`Error submitting amendment: ${message}`);
        return;
      }
      // Read application id from the response (used by the /payment/paid handler).
      let applicationId: string | null = null;
      try {
        const respText = await res.text();
        if (respText) {
          const respJson = JSON.parse(respText);
          applicationId =
            respJson.applicationId ?? respJson.appId ?? respJson.id ?? null;
        }
      } catch {
        // non-JSON response; ignore
      }

      // Persist the data needed by the payment flow handler.
      localStorage.setItem(
        "amendmentFormData",
        JSON.stringify({
          UserId: $loggedInUser?.id ?? "",
          FileId: fileNumber,
          FileType: fileType,
          PaymentId: fileInfo.paymentRRR ?? "",
          Cost: fileInfo.cost ?? null,
          ApplicantName: fileInfo.applicantName ?? "",
          FileTitle: fileInfo.fileTitle ?? "",
          ApplicationId: applicationId,
          NewAdditionalDescription: newAdditionalDescription ?? "",
          NewDisclaimer: newDisclaimer ?? "",
        }),
      );

      // Persist AppData so /payment/paid (updateManual) can update the status.
      localStorage.setItem(
        "AppData",
        JSON.stringify({
          fileId: fileNumber,
          appId: applicationId,
          userId: $loggedInUser?.id ?? "",
        }),
      );

      toast.success("Application saved, Proceed to Payment");

      // If a payment is required, route through the payment flow.
      if (fileInfo.cost && fileInfo.paymentRRR) {
        await goto(
          `/payment/?type=amendment&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}`,
        );
      } else {
        await goto("/home/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Form submission failed.");
    } finally {
      isProcessing = false;
    }
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="space-y-4 m-4 p-2">
  <div class="flex items-center justify-between">
    <Button variant="outline" on:click={goBack} class="flex items-center gap-2">
      <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
      Back
    </Button>
    <h1 class="text-xl font-semibold">Trademark Amendment</h1>
    <div></div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center p-12">
      <div class="flex flex-col items-center gap-2">
        <Icon
          icon="line-md:loading-loop"
          width="2rem"
          height="2rem"
          class="text-blue-600"
        />
        <span class="text-sm text-gray-500">Loading file information...</span>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-600 p-4 rounded-md text-center">
      <p>{error}</p>
    </div>
  {:else}
    <!-- Read-only file information -->
    <Card.Root>
      <Card.Header>
        <Card.Title>File Information</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">File Number:</span>
            <span class="ml-2 font-medium">{fileInfo.fileId}</span>
          </div>
          <div>
            <span class="text-gray-500">Title of Trademark:</span>
            <span class="ml-2 font-medium">{fileInfo.fileTitle}</span>
          </div>
          <div>
            <span class="text-gray-500">Applicant:</span>
            <span class="ml-2 font-medium">{fileInfo.applicantName}</span>
          </div>
          <div>
            <span class="text-gray-500">Class:</span>
            <span class="ml-2 font-medium">{fileInfo.fileClass ?? "—"}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">File Status:</span>
            {#if fileInfo.fileStatus != null}
              <AppStatusTag value={Number(fileInfo.fileStatus)} />
            {:else}
              <span class="ml-2 font-medium">—</span>
            {/if}
          </div>
          <div class="md:col-span-2">
            <span class="text-gray-500">Class Description:</span>
            <span class="ml-2 font-medium">
              {fileInfo.classDescription ?? "—"}
            </span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Editable: Additional Description -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Specification of Goods</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        <Label for="additional-description">Specification of Goods</Label>
        <textarea
          id="additional-description"
          rows="4"
          bind:value={newAdditionalDescription}
          class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        ></textarea>
      </Card.Content>
    </Card.Root>

    <!-- Editable: Trademark Disclaimer -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Trademark Disclaimer</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        <Label for="disclaimer">Disclaimer</Label>
        <textarea
          id="disclaimer"
          rows="3"
          bind:value={newDisclaimer}
          class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        ></textarea>
      </Card.Content>
    </Card.Root>

    <!-- Editable: Representation -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Representation</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-1">Current</p>
            {#if fileInfo.representationUrl}
              <img
                src={fileInfo.representationUrl}
                alt="Current representation"
                class="max-h-48 border border-gray-200 rounded-md object-contain bg-white"
              />
            {:else}
              <div
                class="h-48 flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-md text-sm text-gray-400"
              >
                No representation on file
              </div>
            {/if}
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">New</p>
            {#if newRepresentationPreview}
              <img
                src={newRepresentationPreview}
                alt="New representation preview"
                class="max-h-48 border border-gray-200 rounded-md object-contain bg-white"
              />
            {:else}
              <div
                class="h-48 flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-md text-sm text-gray-400"
              >
                No new image selected
              </div>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <input
            id="representation-input"
            type="file"
            accept="image/*"
            on:change={handleRepresentationChange}
            class="text-sm"
          />
          {#if newRepresentation}
            <Button variant="outline" size="sm" on:click={clearRepresentation}>
              <Icon icon="mdi:close" width="1rem" height="1rem" class="mr-1" />
              Clear
            </Button>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <div class="flex justify-end gap-3 pt-2">
      <Button variant="outline" on:click={goBack}>Cancel</Button>
      <Button
        class="bg-green-800 hover:bg-green-700 text-white"
        disabled={isProcessing || !hasChanges}
        on:click={submitAmendment}
      >
        {#if isProcessing}
          <Icon
            icon="line-md:loading-loop"
            width="1rem"
            height="1rem"
            class="mr-2"
          />
          Submitting...
        {:else}
          Submit Amendment
        {/if}
      </Button>
    </div>
  {/if}
</div>
