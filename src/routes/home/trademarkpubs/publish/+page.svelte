<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { baseURL, UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  let isBatching = false;
  let confirmOpen = false;
  let result: { batchNumber?: number | string; batchDate?: string } | null = null;
  let errorMessage: string | null = null;

  let pendingCount: number | null = null;
  let latestBatch: number | string | null = null;
  let isLoadingStats = true;

  $: canBatch = $loggedInUser?.userRoles?.some((r: UserRoles) =>
    [
      UserRoles.TrademarkPublication,
      UserRoles.TrademarkRegistrar,
      UserRoles.SuperAdmin,
      UserRoles.Tech,
    ].includes(r),
  );

  async function loadStats() {
    isLoadingStats = true;
    try {
      const res = await fetch(
        `${baseURL}/api/publication/GetTrademarkPublication?index=0&quantity=1`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (res.ok) {
        const data = await res.json();
        pendingCount = data.count ?? 0;
      }

      const counterRes = await fetch(
        `${baseURL}/api/publication/GetLatestBatch`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (counterRes.ok) {
        const counter = await counterRes.json();
        latestBatch = counter?.latestBatch ?? counter ?? null;
      }
    } catch (err) {
      console.error("Failed to load publication stats", err);
    } finally {
      isLoadingStats = false;
    }
  }

  async function batchJournal() {
    const userId = $loggedInUser?.id ?? $loggedInUser?.creatorId;
    if (!userId) {
      toast.error("You must be logged in to batch publications.");
      return;
    }

    isBatching = true;
    errorMessage = null;
    result = null;

    try {
      const res = await fetch(
        `${baseURL}/api/publication/BatchJournal?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      let payload: any = true;
      if (contentType.includes("application/json")) {
        payload = await res.json();
      }

      result = {
        batchNumber:
          typeof payload === "object" && payload
            ? (payload.batchNumber ?? payload.BatchNumber)
            : undefined,
        batchDate: new Date().toLocaleString("en-NG"),
      };

      toast.success("Trademark publications batched successfully.", {
        position: "top-right",
      });

      await loadStats();
    } catch (err: any) {
      errorMessage = err?.message ?? "Failed to batch trademark publications.";
      toast.error(errorMessage ?? "Batching failed", { position: "top-right" });
    } finally {
      isBatching = false;
      confirmOpen = false;
    }
  }

  onMount(() => {
    loadStats();
  });
</script>

<svelte:head>
  <title>Batch Trademark Journal</title>
</svelte:head>

<div class="w-full bg-white min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6">
    <!-- Back Button -->
    <div class="mb-6">
      <Button
        on:click={() => goto("/home/trademarkpubs")}
        variant="outline"
        class="text-green-700 border-green-700 hover:bg-green-50 font-semibold py-2 px-4 rounded-none flex items-center gap-2 transition-colors"
      >
        <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
        Back to Publications
      </Button>
    </div>

    <!-- Header -->
    <div class="border-b-4 border-green-700 pb-6 mb-8">
      <h1 class="text-3xl font-bold text-green-700 mb-2">
        Batch Trademark Journal
      </h1>
      <p class="text-gray-600 text-sm font-normal">
        Compile all pending trademark publications into the next journal volume.
      </p>
    </div>

    <!-- Permission Guard -->
    {#if !canBatch}
      <div
        class="border border-red-300 bg-red-50 border-l-4 border-l-red-600 p-6 flex items-start gap-3"
      >
        <Icon
          icon="mdi:shield-alert"
          width="1.5rem"
          height="1.5rem"
          class="text-red-600 mt-0.5 flex-shrink-0"
        />
        <div>
          <h2 class="font-bold text-red-700 mb-1">Access Denied</h2>
          <p class="text-sm text-red-700">
            You do not have permission to batch trademark publications. This
            action is reserved for the Trademark Publication unit.
          </p>
        </div>
      </div>
    {:else}
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div
          class="border border-gray-300 border-l-4 border-l-green-700 bg-white p-5"
        >
          <div class="flex items-center gap-3 mb-2">
            <Icon
              icon="mdi:file-document-multiple"
              width="1.5rem"
              height="1.5rem"
              class="text-green-700"
            />
            <span
              class="text-xs font-bold text-gray-600 uppercase tracking-wider"
              >Pending Publications</span
            >
          </div>
          <div class="text-3xl font-bold text-green-700">
            {#if isLoadingStats}
              <Icon
                icon="line-md:loading-loop"
                width="1.5rem"
                height="1.5rem"
              />
            {:else}
              {pendingCount ?? "—"}
            {/if}
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Trademarks awaiting inclusion in the next journal.
          </p>
        </div>

        <div
          class="border border-gray-300 border-l-4 border-l-green-700 bg-white p-5"
        >
          <div class="flex items-center gap-3 mb-2">
            <Icon
              icon="mdi:book-open-variant"
              width="1.5rem"
              height="1.5rem"
              class="text-green-700"
            />
            <span
              class="text-xs font-bold text-gray-600 uppercase tracking-wider"
              >Latest Batch</span
            >
          </div>
          <div class="text-3xl font-bold text-green-700">
            {#if isLoadingStats}
              <Icon
                icon="line-md:loading-loop"
                width="1.5rem"
                height="1.5rem"
              />
            {:else}
              {latestBatch ?? "—"}
            {/if}
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Most recent journal volume issued.
          </p>
        </div>
      </div>

      <!-- Warning Box -->
      <div
        class="border border-amber-300 bg-amber-50 border-l-4 border-l-amber-500 p-5 mb-8"
      >
        <div class="flex items-start gap-3">
          <Icon
            icon="mdi:alert"
            width="1.5rem"
            height="1.5rem"
            class="text-amber-600 mt-0.5 flex-shrink-0"
          />
          <div class="flex-1">
            <h2 class="font-bold text-amber-800 mb-2">Before You Batch</h2>
            <ul
              class="text-sm text-amber-900 space-y-1 list-disc list-inside marker:text-amber-600"
            >
              <li>
                All pending trademark publications will be assigned to the next
                journal volume.
              </li>
              <!-- <li>
                Their status will move from <strong>Publication</strong> to
                <strong>Published</strong>.
              </li> -->
              <li>
                A new publication batch entry will be recorded with today's
                date.
              </li>
              <li>
                This action <strong>cannot be undone</strong>. Please confirm
                all files are ready before proceeding.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Error Box -->
      {#if errorMessage}
        <div
          class="border border-red-300 bg-red-50 border-l-4 border-l-red-600 p-4 mb-6 flex items-start gap-3"
        >
          <Icon
            icon="mdi:close-circle"
            width="1.25rem"
            height="1.25rem"
            class="text-red-600 mt-0.5 flex-shrink-0"
          />
          <div>
            <p class="text-sm font-bold text-red-700">Batching failed</p>
            <p class="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      {/if}

      <!-- Success Box -->
      {#if result}
        <div
          class="border border-green-300 bg-green-50 border-l-4 border-l-green-700 p-5 mb-6"
        >
          <div class="flex items-start gap-3">
            <Icon
              icon="mdi:check-circle"
              width="1.5rem"
              height="1.5rem"
              class="text-green-700 mt-0.5 flex-shrink-0"
            />
            <div class="flex-1">
              <h2 class="font-bold text-green-800 mb-2">
                Journal Batched Successfully
              </h2>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {#if result.batchNumber !== undefined}
                  <div>
                    <dt
                      class="text-xs font-bold uppercase tracking-wider text-green-700"
                    >
                      Batch Number
                    </dt>
                    <dd class="text-gray-800 font-semibold">
                      {result.batchNumber}
                    </dd>
                  </div>
                {/if}
                <div>
                  <dt
                    class="text-xs font-bold uppercase tracking-wider text-green-700"
                  >
                    Batch Date
                  </dt>
                  <dd class="text-gray-800 font-semibold">
                    {result.batchDate}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action -->
      <div
        class="border border-gray-300 bg-gray-50 p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div>
          <h3 class="font-bold text-gray-800 mb-1">Ready to batch?</h3>
          <p class="text-sm text-gray-600">
            You are signed in as
            <strong class="text-green-700"
              >{$loggedInUser?.firstName ?? ""}
              {$loggedInUser?.lastName ?? ""}</strong
            >. This action will be recorded against your account.
          </p>
        </div>
        <Button
          on:click={() => (confirmOpen = true)}
          disabled={isBatching ||
            (pendingCount !== null && pendingCount === 0)}
          class="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-6 rounded-none flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isBatching}
            <Icon
              icon="line-md:loading-loop"
              width="1.2rem"
              height="1.2rem"
            />
            Batching...
          {:else}
            <Icon icon="mdi:book-plus" width="1.2rem" height="1.2rem" />
            Batch Journal
          {/if}
        </Button>
      </div>
    {/if}
  </div>
</div>

<!-- Confirmation Dialog -->
<AlertDialog.Root bind:open={confirmOpen}>
  <AlertDialog.Content class="rounded-none border border-gray-300">
    <AlertDialog.Header>
      <AlertDialog.Title class="text-green-700 font-bold text-xl">
        Confirm Journal Batching
      </AlertDialog.Title>
      <AlertDialog.Description class="text-gray-700 text-sm pt-2">
        You are about to batch
        <strong class="text-green-700"
          >5000</strong
        >
        trademark publication{pendingCount === 1 ? "" : "s"} into the next
        journal volume. This action cannot be reversed.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="gap-2">
      <AlertDialog.Cancel
        disabled={isBatching}
        class="rounded-none border border-gray-300 hover:bg-gray-100"
      >
        Cancel
      </AlertDialog.Cancel>
      <AlertDialog.Action
        on:click={batchJournal}
        disabled={isBatching}
        class="rounded-none bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
      >
        {#if isBatching}
          <Icon icon="line-md:loading-loop" width="1rem" height="1rem" />
          Batching...
        {:else}
          <Icon icon="mdi:check" width="1rem" height="1rem" />
          Confirm & Batch
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
