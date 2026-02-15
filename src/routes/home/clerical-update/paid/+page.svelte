<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { applicationData, DashStats, loggedInUser } from "$lib/store";
  import { baseURL, decodeUser } from "$lib/helpers";
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
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
  let application: string | null = null;

  function showSuccessAnimations() {
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

  onMount(async () => {
    const formDataString = localStorage.getItem("formData");
    let formDataObj = null;
    if (formDataString) {
      try {
        formDataObj = JSON.parse(formDataString);
      } catch (e) {
        console.error("Error parsing formData from localStorage", e);
      }
    }
    application = formDataString;

    // Get paymentType from URL
    paymentType = $page.url.searchParams.get("paymentType") ?? "";
    const clericalId = localStorage.getItem("clericalId");

    if (paymentType === "clerical") {
      // Only show animations after successful clerical update
      await updateClerical(formDataObj?.fileId, clericalId);
    } else {
      // For non-clerical types, show animations immediately
      showSuccessAnimations();
    }
  });

  function base64ToFile(
    base64: string,
    filename: string,
    mimeType: string,
  ): File {
    const byteString = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new File([ab], filename, { type: mimeType });
  }

  async function updateClerical(
    fileId: string | null = null,
    clericalId: string | null = null,
  ) {
    try {
      const result = await fetch(
        `${baseURL}/api/files/ConfirmClericalUpdate?fileId=${fileId}&clericalId=${clericalId}`,
        { method: "POST" },
      );

      if (!result.ok) {
        const errorText = await result.text();
        let errorMessage = "Failed to submit clerical update";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Response wasn't JSON
        }
        toast.error(errorMessage);
        return;
      }

      // Show success animations only after successful update
      showSuccessAnimations();
      toast.success("Clerical Update Submitted Successfully");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await goto("/home/dashboard");
    } catch (error) {
      console.error("Error updating clerical:", error);
      toast.error("An unexpected error occurred");
    } finally {
      isStatusUpdating = false;
    }
  }
</script>

<Toaster />
<main class="flex justify-center items-center min-h-screen bg-gray-50">
  <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
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
  </div>
</main>

<style>
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
