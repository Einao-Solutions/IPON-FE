<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { applicationData, DashStats, loggedInUser } from "$lib/store";
  import {
    baseURL,
    decodeUser,
    type ApplicationHistoryType,
  } from "$lib/helpers";
  import { toast } from "svelte-sonner";
  import { packSiblings } from "d3";
  import { Toaster } from "$lib/components/ui/sonner";
  
  let isLoading = true;
  let isSuccess = false;
  let errorMessage = "";
  let checkVisible = false;
  let messageVisible = false;
  let subMessageVisible = false;
  let isStatusUpdating: boolean = true;
  let code: string;
  let paymentType: string;
  let orderID: string;
  let receiptUrl: string | null;
  let ackUrl: string | null;
  let fileId: string | null;
  let applicationId: string | null;
  let fileType: number | null;
  let userName: string | null;
  let userId: string | null;
  let paymentId: string | null;
  let title: string | null;
  let applicantName: string | null;
  let amount: string | null;
  let patentChangeType: string | null;
  let simulate = false;

  onMount(async () => {
    // Get paymentType from URL
    paymentType = $page.url.searchParams.get("paymentType") ?? "";
    console.log("Payment Type:", paymentType);
    const data = JSON.parse(localStorage.getItem("FileData") ?? "{}");
    console.log("Form Data from localStorage:", data);
    
    let success = false;
    
    // Only call updateStatus if it's a tm certificate payment
    switch (paymentType) {
      case "tradecertificate":
        console.log("Processing trade certificate payment");
        success = await updateManual(data, true);
        break;
      case "opposition":
        console.log("Processing opposition payment");
        const rrr = localStorage.getItem("rrr") ?? undefined;
        paymentId = rrr ?? null;
        success = await updateOppositionPayment(paymentId);
        break;
      default:
        success = await updateManual(data, false);
    }
    
    isLoading = false;
    isSuccess = success;
    
    // Only show success animations if API call succeeded
    if (success) {
      setTimeout(() => {
        checkVisible = true;
      }, 300);
      setTimeout(() => {
        messageVisible = true;
      }, 1000);
      setTimeout(() => {
        subMessageVisible = true;
      }, 1800);
    }
  });

  async function updateManual(appData: any, isCertificate: boolean): Promise<boolean> {
    try {
      const res = await fetch(
        `${baseURL}/api/files/ManualUpdate?fileId=${appData.fileId}&applicationId=${appData.appId}&userId=${appData.userId}&userName=${name}&isCertificate=${isCertificate}`,
        { method: "POST" },
      );

      if (!res.ok) {
        // try to read error message if provided
        const txt = await res.text().catch(() => "");
        let msg = "Failed to update payment status";
        try {
          const jsonErr = txt ? JSON.parse(txt) : null;
          msg = jsonErr?.message || txt || msg;
        } catch {
          msg = txt || msg;
        }
        errorMessage = msg;
        toast.error("Failed to update application status");
        return false;
      }

      // safe parse: some endpoints return empty body (204) -> avoid json() error
      const text = await res.text().catch(() => "");
      if (text) {
        try {
          const updatedData = JSON.parse(text);
          applicationData.set(updatedData);
        } catch (err) {
          console.warn("Manual update: response not JSON:", err);
        }
      } else {
        // no body but OK response — treat as success
        toast.success("Successfully updated payment status");
      }
      return true;
    } catch (error) {
      console.error("Manual update error:", error);
      errorMessage = "Failed to update payment status";
      toast.error("Failed to update payment status");
      return false;
    }
  }

  async function awaitingCertifcateConfirmation() {
    console.log("Updating certificate payment status...");
    const rrr = localStorage.getItem("rrr") ?? undefined;
    const fileId = localStorage.getItem("fileId") ?? undefined;
    console.log("RRR:", rrr);
    console.log("File ID:", fileId);
    const result = await fetch(
      `${baseURL}/api/files/UpdateCertificatePaymentStatus?fileId=${fileId}&rrr=${rrr}`,
      { method: "POST" },
    );

    if (!result.ok) {
      const error = await result.json();
      toast.error(`Error updating status: ${error.message}`);
      isStatusUpdating = false;
      return;
    }
    isStatusUpdating = false;
  }

  async function updateOppositionPayment(paymentId: string | null): Promise<boolean> {
    if (!paymentId) {
      errorMessage = "Payment ID is missing.";
      toast.error("Payment ID is missing.");
      isStatusUpdating = false;
      return false;
    }

    console.log("Updating opposition payment status...");
    try {
      const result = await fetch(
        `${baseURL}/api/opposition/UpdateOppositionPayment?paymentId=${paymentId}`,
        { method: "POST" },
      );

      if (!result.ok) {
        const error = await result.json();
        errorMessage = error.message || "Failed to update opposition payment";
        toast.error(`Error updating status: ${error.message}`);
        isStatusUpdating = false;
        return false;
      }

      isStatusUpdating = false;
      return true;
    } catch (error) {
      console.error("Opposition payment error:", error);
      errorMessage = "Failed to update opposition payment";
      toast.error("Failed to update opposition payment");
      return false;
    }
  }

</script>
<Toaster/>
<main class="flex justify-center items-center min-h-screen bg-gray-50">
  <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center py-8" in:fade={{ duration: 200 }}>
        <div class="loader mb-4"></div>
        <p class="text-gray-600 font-medium">Processing your payment...</p>
      </div>
    {:else if !isSuccess}
      <div class="flex flex-col items-center justify-center py-8" in:fade={{ duration: 200 }}>
        <div class="h-32 w-32 mx-auto mb-6 bg-red-50 rounded-full flex justify-center items-center">
          <svg class="w-16 h-16 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mt-2 mb-4">Something went wrong</h1>
        <p class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto">
          {"Something went wrong. Please try again."}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <button
            class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 flex-1"
            on:click={() => location.reload()}
          >
            Try Again
          </button>
          <button
            class="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 flex-1"
            on:click={() => goto("/home/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    {:else}
      <div class="h-32 w-32 mx-auto mb-6 relative">
        {#if checkVisible}
          <div
            class="h-full w-full bg-green-50 rounded-full flex justify-center items-center"
            in:fade={{ duration: 400 }}
          >
            <svg class="w-16 h-16 text-green-500" viewBox="0 0 24 24">
              <path
                class="checkmark-path"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              >
              </path>
            </svg>
          </div>
        {/if}
      </div>

      {#if messageVisible}
        <h1
          class="text-3xl font-bold text-gray-900 mt-2 mb-4"
          in:fly={{ y: 20, duration: 500 }}
        >
          Payment Successful
        </h1>
      {/if}

      {#if subMessageVisible}
        <p
          class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
          in:fly={{ y: 15, duration: 500 }}
        >
          YOUR APPLICATION HAS BEEN RECEIVED AND IS RECEIVING DUE ATTENTION
        </p>

        <div class="mt-4" in:fade={{ duration: 300, delay: 300 }}>
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
            on:click={() => goto("/home/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  /* Loader spinner */
  .loader {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #22c55e;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* SVG checkmark animation */
  .checkmark-path {
    stroke-dasharray: 80;
    stroke-dashoffset: 80;
    animation: checkmark 0.8s ease-in-out forwards;
  }

  @keyframes checkmark {
    0% {
      stroke-dashoffset: 80;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
</style>
