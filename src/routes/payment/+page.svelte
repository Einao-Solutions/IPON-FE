<script lang="ts">
  import { beforeUpdate, onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import { applicationData, assignmentData, loggedInUser } from "$lib/store";
  import { ApplicationStatuses, baseURL, type PatentData } from "$lib/helpers";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import { toast } from "svelte-sonner";

  /* ✅ IMPORT YOUR EXISTING HANDLERS */
  import { paymentHandlers } from "./payment.handlers";
  import { Toaster } from "$lib/components/ui/sonner";
  //   import { form } from "$app/server";
  //   import { loginSchema } from "../auth/schema";

  /* ---------------- STATE (UNCHANGED) ---------------- */

  let cost: string;
  let type: string | null = null;
  let title: string | null = null;
  let isLoading = false;
  let freeApplication = false;

  let appData: PatentData | null = null;
  let fileNumber: string | null = null;
  let fileApplicant: string | null = null;
  let applicantEmail: string | null = null;
  let paymentId: string;
  let hash: string | null = null;
  let fileId: string | null = null;
  let applicationId: string | null = null;
  let fileType: string | null = null;
  let responseurl: string | null = null;
  let fileTitle: string | null = null;
  let clericalId: string | null = null;
  let totalRenewalDue: number | null = 0;
  let currentRenewalIndex = 0;

  let missedYearsCount = 0;
  let lateYearsCount = 0;
  let isLateRenewal = false;
  let isRenewalEligible = false;
  let lateRenewalCost = "";
  let serviceFee = "";

  let showRenewalErrorModal = false;
  let renewalErrorMessage = "";
  let clerical: string | null = null;
  let searchParams: {
    query: string;
    classId?: number;
    fileType: string;
  } | null = null;

  const validPaymentOptions = Object.keys(paymentHandlers);
  let currentBaseurl = "";

  const userName = $loggedInUser?.firstName + " " + $loggedInUser?.lastName;

  /* ---------------- ROUTE GUARD ---------------- */

  beforeUpdate(async () => {
    const paymentType = $page.url.searchParams.get("type") ?? "";
    if (!validPaymentOptions.includes(paymentType)) {
      await goto("/home/dashboard");
    }
  });

  /* ---------------- INIT ---------------- */

  onMount(async () => {
    isLoading = true;

    const $page = get(page);
    currentBaseurl = $page.url.host;

    type = $page.url.searchParams.get("type");
    const storedParams = sessionStorage.getItem("searchParams");

    try {
      searchParams = storedParams ? JSON.parse(storedParams) : null;
    } catch (e) {
      console.error("Failed to parse searchParams from sessionStorage:", e);
      searchParams = null;
    }

    clerical = localStorage.getItem("clericalId");

    const handler = paymentHandlers[type ?? ""];

    if (!handler) {
      await goto("/home/dashboard");
      return;
    }

    try {
      await handler({
        page: $page,
        applicationData,
        assignmentData,
        loggedInUser,
        state: {
          setTitle: (v) => (title = v),
          setCost: (v) => (cost = v),
          setPaymentId: (v) => (paymentId = v),
          setFileNumber: (v) => (fileNumber = v),
          setFileApplicant: (v) => (fileApplicant = v),
          setFileType: (v) => (fileType = v),
          setFileId: (v) => (fileId = v),
          setApplicationId: (v) => (applicationId = v),
          setFileTitle: (v) => (fileTitle = v),
          setResponseUrl: (v) => (responseurl = v),
          isLateRenewal: (v) => (isLateRenewal = v),
          isRenewalEligible: (v) => (isRenewalEligible = v),
          setPenaltyFee: (v) => (lateRenewalCost = v),
          setRenewalMeta: (meta) => {
            missedYearsCount = meta.missedYearsCount ?? 0;
            lateYearsCount = meta.lateYearsCount ?? 0;
            isLateRenewal = meta.isLateRenewal ?? false;
            lateRenewalCost = meta.lateRenewalCost ?? "";
            serviceFee = meta.serviceFee ?? "";
          },
        },
      });

      freeApplication = cost === "0";

      await setHash();
    } catch (err: any) {
      renewalErrorMessage = err?.message ?? "Unable to initialize payment";
      showRenewalErrorModal = true;
    } finally {
      isLoading = false;
    }
  });

  /* ---------------- REMITA HASH (UNCHANGED) ---------------- */

  async function setHash() {
    const merchantId = "6230040240";
    const apiKey = "192753";
    const payload = merchantId + paymentId + apiKey;

    hash = await crypto.subtle
      .digest("SHA-512", new TextEncoder().encode(payload))
      .then((res) =>
        Array.from(new Uint8Array(res))
          .map((x) => ("00" + x.toString(16)).slice(-2))
          .join(""),
      );
  }

  async function freeUpdate(fileId: string, clericalId: string) {
    const result = await fetch(
      `${baseURL}/api/files/ConfirmClericalUpdate?fileId=${fileId}&clericalId=${clericalId}`,
      {
        method: "POST",
      },
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

    toast.success("Clerical Update Submitted Successfully");

    // Delay navigation to allow toast to display
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await goto("/home/dashboard");
  }
  function goBack() {
    window.history.back();
  }

  /* ---------------- AMOUNT BREAKDOWN ---------------- */

  const formatNaira = (value: number) =>
    value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  type BreakdownItem = { label: string; amount: number };

  // Build a line-item breakdown from whatever fee data the handler provided.
  let breakdownItems: BreakdownItem[] = [];
  let totalCost = 0;

  $: {
    totalCost = parseFloat((cost ?? "0").toString()) || 0;

    const penaltyAmount = isLateRenewal ? parseFloat(lateRenewalCost) || 0 : 0;
    const serviceFeeAmount = parseFloat(serviceFee) || 0;
    const baseAmount = Math.max(
      totalCost - penaltyAmount - serviceFeeAmount,
      0,
    );

    const items: BreakdownItem[] = [];

    if (baseAmount > 0) {
      const renewalTypes = ["patentRenewal", "renewal", "designRenewal"];
      items.push({
        label: type && renewalTypes.includes(type) ? "Renewal Fee" : "Base Fee",
        amount: baseAmount,
      });
    }

    if (serviceFeeAmount > 0) {
      items.push({ label: "Service Fee", amount: serviceFeeAmount });
    }

    if (penaltyAmount > 0) {
      items.push({ label: "Late Renewal Penalty", amount: penaltyAmount });
    }

    breakdownItems = items;
  }

  // Only worth showing a breakdown when there is more than a single line item.
  $: hasBreakdown = breakdownItems.length > 1;
</script>

<Toaster />
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="relative w-16 h-16 mx-auto mb-4">
          <Icon
            icon="line-md:loading-loop"
            width="4rem"
            height="4rem"
            class="text-black-600"
          />
        </div>
        <p class="text-gray-600 text-lg">Processing payment details...</p>
      </div>
    </div>
  {:else if showRenewalErrorModal}
    <!-- Only show the modal, hide the rest of the page -->
    <div
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center"
      >
        <Icon
          icon="lucide:alert-triangle"
          width="2rem"
          height="2rem"
          class="mx-auto text-yellow-500 mb-2"
        />
        <h2 class="text-lg font-semibold mb-2">
          Your file is not yet due for Renewal
        </h2>
        <p class="mb-4">
          Renewal is only available 90 days before the due date.
        </p>
        <Button
          class="outline bg-red-500 text-white"
          on:click={() => goto("/home/dashboard")}>Back</Button
        >
      </div>
    </div>
  {:else}
    <div class="max-w-2xl mx-auto">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Payment Confirmation
        </h1>
        <p class="text-gray-600">
          Review your payment details before proceeding
        </p>
      </div>

      <!-- Payment Card -->
      <div
        class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <!-- Card Header -->
        <div class="bg-gray-800 p-6 text-white">
          <h2 class="text-xl font-semibold mb-1">{title}</h2>
          <p class="text-blue-100 text-sm">Payment ID: {paymentId}</p>
        </div>

        <!-- Payment Form -->
        <form
          action="https://login.remita.net/remita/ecomm/finalize.reg"
          method="post"
          class="p-8"
        >
          <!-- Payment Details Grid -->
          <div class="space-y-6 mb-8">
            <!-- Amount Due - Highlighted with breakdown -->
            <div
              class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 overflow-hidden"
            >
              <!-- Total row -->
              <div class="flex items-center justify-between p-6">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      icon="material-symbols:attach-money"
                      width="1.5rem"
                      height="1.5rem"
                      class="text-green-600"
                    />
                  </div>
                  <span class="text-gray-700 font-medium">Amount Due</span>
                </div>
                <span class="text-2xl font-bold text-green-600">
                  {formatNaira(totalCost)}
                </span>
              </div>

              {#if hasBreakdown}
                <!-- Itemized breakdown -->
                <div class="border-t border-green-200 bg-white/60 px-6 py-4">
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3"
                  >
                    Cost Breakdown
                  </p>
                  <div class="space-y-2">
                    {#each breakdownItems as item}
                      <div
                        class="flex items-center justify-between text-sm text-gray-600"
                      >
                        <span>{item.label}</span>
                        <span class="font-medium text-gray-900">
                          {formatNaira(item.amount)}
                        </span>
                      </div>
                    {/each}
                    <div
                      class="flex items-center justify-between border-t border-gray-200 pt-2 mt-1 text-sm"
                    >
                      <span class="font-semibold text-gray-700">Total</span>
                      <span class="font-bold text-green-600">
                        {formatNaira(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            <!-- Other Payment Details -->
            <div class="grid gap-4">
              {#if type && ["oppositionCounter", "oppositionResolution", "statussearch", "availabilitysearch", "merger", "registeredusers", "changedatarecordal"].includes(type) === false}
                <div
                  class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <Icon
                      icon="material-symbols:folder-outline"
                      width="1.2rem"
                      height="1.2rem"
                      class="text-gray-500"
                    />
                    <span class="text-gray-700 font-medium">File Number</span>
                  </div>
                  <span
                    class="text-gray-900 font-mono text-sm bg-white px-3 py-1 rounded border"
                  >
                    {fileNumber}
                  </span>
                </div>
              {/if}

              {#if ["availabilitysearch"].includes(type ?? "") === true}
                <div
                  class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <Icon
                      icon="material-symbols:search"
                      width="1.2rem"
                      height="1.2rem"
                      class="text-gray-500"
                    />
                    <span class="text-gray-700 font-medium">Search Term</span>
                  </div>
                  <span class="text-gray-900 bg-white px-3 py-1 rounded border">
                    {searchParams?.query}
                  </span>
                </div>
              {/if}

              <div
                class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <Icon
                    icon="material-symbols:person-outline"
                    width="1.2rem"
                    height="1.2rem"
                    class="text-gray-500"
                  />
                  <span class="text-gray-700 font-medium">Name</span>
                </div>
                <span class="text-gray-900 bg-white px-3 py-1 rounded border">
                  {fileApplicant}
                </span>
              </div>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start gap-3">
              <Icon
                icon="material-symbols:security"
                width="1.2rem"
                height="1.2rem"
                class="text-blue-600 mt-0.5"
              />
              <div>
                <p class="text-blue-800 font-medium text-sm">Secure Payment</p>
                <p class="text-blue-700 text-xs mt-1">
                  Your payment will be processed securely through Remita's
                  encrypted payment gateway.
                </p>
              </div>
            </div>
          </div>

          <!-- Hidden Form Fields -->
          <input type="hidden" value={hash} name="hash" />
          <input type="hidden" value={"6230040240"} name="merchantId" />
          <input type="hidden" value={paymentId} name="rrr" />
          <input type="hidden" value={responseurl} name="responseurl" />

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              on:click={goBack}
              variant="outline"
              class="flex items-center justify-center gap-2 px-6 py-3 border-2 hover:bg-gray-50 transition-colors"
            >
              <Icon
                icon="material-symbols:arrow-back-rounded"
                width="1.2rem"
                height="1.2rem"
              />
              Back
            </Button>
            {#if freeApplication || cost == "0"}
              <button
                type="button"
                class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                on:click={async () => {
                  if (fileNumber && clerical) {
                    await freeUpdate(fileNumber, clerical);
                  }
                }}
              >
                <div class="flex items-center justify-center gap-2">
                  <Icon
                    icon="material-symbols:payment"
                    width="1.2rem"
                    height="1.2rem"
                  />
                  Submit
                </div>
              </button>
            {:else}
              <Button
                type="submit"
                class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <div class="flex items-center justify-center gap-2">
                  <Icon
                    icon="material-symbols:payment"
                    width="1.2rem"
                    height="1.2rem"
                  />
                  Pay with Remita
                </div>
              </Button>
            {/if}
          </div>
        </form>
      </div>

      <!-- Footer Info -->
      <div class="text-center mt-6 text-sm text-gray-500">
        <p>
          Need help? Contact our support team for assistance with your payment.
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom animations */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Custom button styles for better visual hierarchy */
  :global(.btn-primary) {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    box-shadow: 0 4px 15px 0 rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
  }

  :global(.btn-primary:hover) {
    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
    transform: translateY(-2px);
  }
</style>
