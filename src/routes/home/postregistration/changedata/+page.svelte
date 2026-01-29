<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { baseURL } from "$lib/helpers";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button/index";

  interface NewData {
    name: string;
    address: string;
    document: File | null;
  }

  let newData: NewData = {
    name: "",
    address: "",
    document: null,
  };

  let nameOfApplicant = "";
  let applicantAddress = "";
  let applicantEmail = "";
  let applicantPhone = "";
  let applicantNationality = "";
  let fileTitle = "";
  let tmClass: number | null = null;
  let fileId: string | null = null;
  let paymentId: string | null = null;
  let cost: number | null = null;
  let error: string | null = null;
  let isProcessing = false;
  let isLoading = false;
  let changeType = "";
  const pageData = get(page);

  onMount(async () => {
    const fileNumber = pageData.url.searchParams.get("fileId") ?? "";
    const fileType = pageData.url.searchParams.get("fileType") ?? "";
    changeType = pageData.url.searchParams.get("changeType") ?? "";
    sessionStorage.setItem("changeType", changeType);

    await setData(fileNumber, fileType);
  });

  async function setData(fileNumber: string, fileType: string): Promise<void> {
    isLoading = true;
    try {
      const res = await fetch(
        `${baseURL}/api/files/GetChangeDataRecordalCost?fileId=${fileNumber}&fileType=${fileType}&changeType=${changeType}`,
      );
      if (!res.ok) {
        error = "Unable to retrieve cost info.";
        return;
      }
      const data = await res.json();
      nameOfApplicant = data.applicantName;
      fileTitle = data.fileTitle;
      tmClass = data.trademarkClass;
      fileId = data.fileId;
      paymentId = data.rrr;
      cost = data.amount;
      applicantAddress = data.applicantAddress;
      applicantEmail = data.applicantEmail;
      applicantPhone = data.applicantPhone;
      applicantNationality = data.applicantNationality;
    } catch (err) {
      error = "Error fetching change of name cost.";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function validateForm(): boolean {
    const required = [newData.name || newData.address];
    if (required.some((v) => !v)) {
      error = "Please fill in all required fields.";
      return false;
    }
    error = null;
    return true;
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      error = "File size exceeds the maximum limit of 10MB.";
      newData.document = null;
      return;
    }
    if (file.type !== "application/pdf") {
      error = "Only PDF files are allowed.";
      newData.document = null;
      return;
    }

    newData.document = file;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    isProcessing = true;
    const fileNumber = pageData.url.searchParams.get("fileId") ?? "";

    try {
      const form = new FormData();
      form.append("FileId", fileNumber);
      form.append("rrr", paymentId ?? "");
      if (changeType === "Name") {
        form.append("NewName", newData.name);
      } else if (changeType === "Address") {
        form.append("NewAddress", newData.address);
      }
      form.append("document", newData.document as File);
      form.append("changeType", changeType);

      const resp = await fetch(`${baseURL}/api/files/ChangeDataRecordal`, {
        method: "POST",
        body: form,
      });
      if (resp.ok) {
        // Store form data in local storage (convert FormData to plain object)
        const formObj: Record<string, any> = {};
        form.forEach((value, key) => {
          // For files, just store the name (or you can skip storing files)
          formObj[key] = value instanceof File ? value.name : value;
        });
        localStorage.setItem("formData", JSON.stringify(formObj));
        await handlePayment();
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      error = "Form submission failed.";
      console.error(err);
    } finally {
      isProcessing = false;
    }
  }

  async function handlePayment() {
    if (cost && paymentId) {
      await goto(
        `/payment/?type=changedatarecordal&rrr=${paymentId}&amount=${cost}`,
      );
    }
  }
  function goBack() {
    window.history.back();
  }
</script>

<div class="min-h-screen py-4 px-4">
  <div class="w-full mx-auto">
    <!-- Header -->
    <div class="flex items-center">
      <Button
        variant="outline"
        on:click={goBack}
        class="flex items-center gap-2"
      >
        <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
        Back
      </Button>
      <div class="flex-1 flex flex-col items-center justify-center">
        <h1 class="text-xl font-bold">
          Application for Change Of Applicant {changeType}
          {#if changeType === "Name"}
            [Form 22]
          {:else if changeType === "Address"}
            [Form 19]
          {/if}
        </h1>
        <p class="font-light">Fill in the new Applicant {changeType}</p>
      </div>
    </div>

    <!-- Form -->
    <div class="px-6 py-6">
      {#if error}
        <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      {/if}

      <!-- Form sections  -->
      <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
        <div class="bg-gray-300 px-4 py-2 font-medium text-black">
          CHANGE OF APPLICANT {changeType.toUpperCase()} FORM
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
              <span class="text-sm text-gray-500"
                >Loading Trademark Information...</span
              >
            </div>
          </div>
        {:else}
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Applicant Name: <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                bind:value={nameOfApplicant}
                placeholder={nameOfApplicant}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>

            <div>
              <label
                for="title"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Title:
              </label>
              <input
                id="title"
                type="text"
                bind:value={fileTitle}
                placeholder={fileTitle}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>

            <div>
              <label
                for="productClass"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Product Class: <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="productClass"
                bind:value={tmClass}
                placeholder={tmClass !== null ? String(tmClass) : ""}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>

            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                File number:
              </label>
              <input
                type="text"
                bind:value={fileId}
                placeholder={fileId}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Address:
              </label>
              <input
                type="text"
                bind:value={applicantAddress}
                placeholder={applicantAddress}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>
          </div>
        {/if}
      </div>

      <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
        <div class="bg-gray-300 px-4 py-2 font-medium text-black">
          NEW {changeType.toUpperCase()} INFORMATION
        </div>
        <div class="p-4 grid grid-cols-2 md:grid-cols-2 gap-4">
          {#if changeType === "Name"}
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Applicant Name: <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                bind:value={newData.name}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                required
              />
            </div>
          {:else if changeType === "Address"}
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                New Applicant Address: <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                bind:value={newData.address}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                required
              />
            </div>
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Applicant Email:
              </label>
              <input
                type="email"
                bind:value={applicantEmail}
                placeholder={applicantEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Applicant Phone:
              </label>
              <input
                type="tel"
                bind:value={applicantPhone}
                placeholder={applicantPhone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Applicant Nationality:
              </label>
              <input
                type="text"
                bind:value={applicantNationality}
                placeholder={applicantNationality}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                disabled
              />
            </div>
          {/if}
          <div class="md:col-span-1">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Upload document:
            </label>
            <div class="flex items-center">
              <input
                type="file"
                accept=".pdf"
                on:change={handleFileChange}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        {#if cost !== null}
          <button
            on:click={handleSubmit}
            class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            disabled={isProcessing}
          >
            {#if isProcessing}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            {:else}
              Pay
            {/if}
          </button>
        {:else}
          <button
            class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed"
            disabled
          >
            Pay
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
