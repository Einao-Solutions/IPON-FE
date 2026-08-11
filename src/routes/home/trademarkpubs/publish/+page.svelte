<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { baseURL, UserRoles } from "$lib/helpers";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  const VOLUME_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1);
  const NUMBER_OPTIONS = Array.from({ length: 52 }, (_, i) => i + 1);

  let isBatching = false;
  let detailsOpen = false;
  let confirmOpen = false;
  let releaseDate = "";
  let volume: number | null = null;
  let number: number | null = null;
  let detailsError: string | null = null;
  let result: { batchNumber?: number | string; batchDate?: string } | null =
    null;
  let errorMessage: string | null = null;

  let pendingCount: number | null = null;
  let latestBatch: number | string | null = null;
  let isLoadingStats = true;

  type JournalEntry = {
    id?: string | number;
    volume?: number | string;
    number?: number | string;
    journalReleaseDate?: string;
    batchDate?: string;
    createdAt?: string;
    batch?: string;
    count?: number;
    total?: number;
    batchedBy?: string;
    createdBy?: string;
    userFullName?: string;
    url?: string;
    documentUrl?: string;
    fileUrl?: string;
    link?: string;
  };

  const JOURNAL_PAGE_SIZE = 10;
  let journals: JournalEntry[] = [];
  let journalsIndex = 0;
  let journalsTotal: number | null = null;
  let isLoadingJournals = false;
  let journalsError: string | null = null;

  $: journalsHasNext =
    journalsTotal !== null
      ? (journalsIndex + 1) * JOURNAL_PAGE_SIZE < journalsTotal
      : journals.length === JOURNAL_PAGE_SIZE;
  $: journalsHasPrev = journalsIndex > 0;

  $: canBatch = $loggedInUser?.userRoles?.some((r: UserRoles) =>
    [
      UserRoles.TrademarkPublication,
      UserRoles.ActingTrademarkRegistrar,
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
      const res = await fetch(`${baseURL}/api/publication/BatchJournal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken ?? ""}`,
        },
        body: JSON.stringify({
          UserId: String(userId),
          Volume: volume,
          Number: number,
          ReleaseDate: new Date(releaseDate).toISOString(),
        }),
      });

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
      await loadJournals(0);
    } catch (err: any) {
      errorMessage = err?.message ?? "Failed to batch trademark publications.";
      toast.error(errorMessage ?? "Batching failed", { position: "top-right" });
    } finally {
      isBatching = false;
      confirmOpen = false;
    }
  }

  function openDetails() {
    detailsError = null;
    releaseDate = "";
    volume = null;
    number = null;
    detailsOpen = true;
  }

  function submitDetails() {
    if (!releaseDate) {
      detailsError = "Please select a release date.";
      return;
    }
    if (volume === null) {
      detailsError = "Please select the volume.";
      return;
    }
    if (number === null) {
      detailsError = "Please select the number.";
      return;
    }
    detailsError = null;
    detailsOpen = false;
    confirmOpen = true;
  }

  function onVolumeChange(s: { value: number; label?: string } | undefined) {
    volume = s ? s.value : null;
  }

  function onNumberChange(s: { value: number; label?: string } | undefined) {
    number = s ? s.value : null;
  }

  async function loadJournals(index = journalsIndex) {
    isLoadingJournals = true;
    journalsError = null;
    try {
      const res = await fetch(
        `${baseURL}/api/publication/GetJournals?index=${index}&quantity=${JOURNAL_PAGE_SIZE}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const list: JournalEntry[] = Array.isArray(data)
        ? data
        : (data?.items ?? data?.data ?? data?.results ?? []);
      journals = list;
      journalsIndex = index;
      if (typeof data?.count === "number") {
        journalsTotal = data.count;
      } else if (typeof data?.total === "number") {
        journalsTotal = data.total;
      } else {
        journalsTotal = null;
      }
    } catch (err: any) {
      journalsError = err?.message ?? "Failed to load previous journals.";
      journals = [];
    } finally {
      isLoadingJournals = false;
      latestBatch =
        journals.length > 0 ? (journals[0].batch ?? null) : latestBatch;
    }
  }

  function formatDate(value?: string) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function getJournalUrl(j: JournalEntry): string | null {
    return j.documentUrl ?? null;
  }

  onMount(() => {
    loadStats();
    loadJournals(0);
  });
</script>

<svelte:head>
  <title>Batch Trademark Journal</title>
</svelte:head>

<div class="w-full bg-white min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6">
    <!-- Back Button -->
    <!-- <div class="mb-6">
      <Button
        on:click={() => goto("/home/trademarkpubs")}
        variant="outline"
        class="text-green-700 border-green-700 hover:bg-green-50 font-semibold py-2 px-4 rounded-none flex items-center gap-2 transition-colors"
      >
        <Icon icon="mdi:arrow-left" width="1.2rem" height="1.2rem" />
        Back to Publications
      </Button>
    </div> -->

    <!-- Header -->
    <div class="border-b-4 border-green-700 pb-6 mb-8">
      <h1 class="text-3xl font-bold text-black mb-2">
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
      <!-- <div
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
                journal.
              </li>
              <li>
                Their status will move from <strong>Publication</strong> to
                <strong>Published</strong>.
              </li>
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
      </div> -->

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
          on:click={openDetails}
          disabled={isBatching || (pendingCount !== null && pendingCount === 0)}
          class="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-6 rounded-none flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isBatching}
            <Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
            Batching...
          {:else}
            <Icon icon="mdi:book-plus" width="1.2rem" height="1.2rem" />
            Batch Journal
          {/if}
        </Button>
      </div>

      <!-- Previous Journals -->
      <div class="mt-10">
        <div
          class="flex items-center justify-between border-b-2 border-green-700 pb-2 mb-4"
        >
          <div class="flex items-center gap-2">
            <Icon
              icon="mdi:history"
              width="1.25rem"
              height="1.25rem"
              class="text-green-700"
            />
            <h2 class="text-lg font-bold text-green-700">Previous Journals</h2>
          </div>
          <Button
            variant="outline"
            on:click={() => loadJournals(journalsIndex)}
            disabled={isLoadingJournals}
            class="text-green-700 border-green-700 hover:bg-green-50 rounded-none flex items-center gap-2 py-1 px-3"
          >
            <Icon
              icon={isLoadingJournals ? "line-md:loading-loop" : "mdi:refresh"}
              width="1rem"
              height="1rem"
            />
            Refresh
          </Button>
        </div>

        {#if journalsError}
          <div
            class="border border-red-300 bg-red-50 border-l-4 border-l-red-600 p-4 mb-4 flex items-start gap-3"
          >
            <Icon
              icon="mdi:close-circle"
              width="1.25rem"
              height="1.25rem"
              class="text-red-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p class="text-sm font-bold text-red-700">
                Failed to load journals
              </p>
              <p class="text-sm text-red-700">{journalsError}</p>
            </div>
          </div>
        {/if}

        <div class="border border-gray-300 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100 border-b border-gray-300">
              <tr class="text-left">
                <th
                  class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-700"
                  >Batch Number</th
                >
                <th
                  class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-700"
                  >Release Date</th
                >
                <th
                  class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-700"
                  >Batched On</th
                >
                <th
                  class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-700"
                  >Batched By</th
                >
                <th
                  class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-700"
                  >Document</th
                >
              </tr>
            </thead>
            <tbody>
              {#if isLoadingJournals && journals.length === 0}
                <tr>
                  <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                    <div class="flex items-center justify-center gap-2">
                      <Icon
                        icon="line-md:loading-loop"
                        width="1.25rem"
                        height="1.25rem"
                      />
                      Loading journals...
                    </div>
                  </td>
                </tr>
              {:else if journals.length === 0}
                <tr>
                  <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                    No previous journals found.
                  </td>
                </tr>
              {:else}
                {#each journals as j, i}
                  <tr
                    class="border-t border-gray-200 {i % 2 === 1
                      ? 'bg-gray-50'
                      : ''}"
                  >
                    <td class="px-4 py-2 text-gray-800 font-semibold">
                      {j.batch ?? "—"}
                    </td>
                    <td class="px-4 py-2 text-gray-700">
                      {formatDate(j.journalReleaseDate)}
                    </td>
                    <td class="px-4 py-2 text-gray-700">
                      {formatDate(j.batchDate ?? j.createdAt)}
                    </td>
                    <td class="px-4 py-2 text-gray-700">
                      {j.userFullName ?? j.batchedBy ?? j.createdBy ?? "—"}
                    </td>
                    <td class="px-4 py-2">
                      {#if getJournalUrl(j)}
                        <a
                          href={getJournalUrl(j)}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 text-green-700 hover:text-green-800 hover:underline font-semibold"
                        >
                          <Icon
                            icon="mdi:file-document"
                            width="1rem"
                            height="1rem"
                          />
                          View
                        </a>
                      {:else}
                        <span class="text-gray-400">—</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        {#if journals.length > 0 || journalsIndex > 0}
          <div
            class="flex items-center justify-between mt-3 text-sm text-gray-600"
          >
            <span>
              {#if journalsTotal !== null}
                Showing page {journalsIndex + 1} of {Math.max(
                  1,
                  Math.ceil(journalsTotal / JOURNAL_PAGE_SIZE),
                )}
              {:else}
                Page {journalsIndex + 1}
              {/if}
            </span>
            <div class="flex gap-2">
              <Button
                variant="outline"
                on:click={() => loadJournals(journalsIndex - 1)}
                disabled={isLoadingJournals || !journalsHasPrev}
                class="rounded-none border border-gray-300 hover:bg-gray-100 py-1 px-3 flex items-center gap-1 disabled:opacity-50"
              >
                <Icon icon="mdi:chevron-left" width="1rem" height="1rem" />
                Previous
              </Button>
              <Button
                variant="outline"
                on:click={() => loadJournals(journalsIndex + 1)}
                disabled={isLoadingJournals || !journalsHasNext}
                class="rounded-none border border-gray-300 hover:bg-gray-100 py-1 px-3 flex items-center gap-1 disabled:opacity-50"
              >
                Next
                <Icon icon="mdi:chevron-right" width="1rem" height="1rem" />
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Journal Details Dialog -->
<Dialog.Root bind:open={detailsOpen}>
  <Dialog.Content class="rounded-none border border-gray-300 sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="text-green-700 font-bold text-xl">
        Journal Details
      </Dialog.Title>
      <Dialog.Description class="text-gray-700 text-sm pt-2">
        Enter the release date, volume, and number for this journal batch.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <div class="flex flex-col gap-1">
        <label
          for="releaseDate"
          class="text-xs font-bold uppercase tracking-wider text-gray-700"
        >
          Release Date
        </label>
        <input
          id="releaseDate"
          type="date"
          bind:value={releaseDate}
          disabled={isBatching}
          class="border border-gray-300 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-green-700"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="volume"
          class="text-xs font-bold uppercase tracking-wider text-gray-700"
        >
          Volume
        </label>
        <Select.Root
          selected={volume !== null
            ? { value: volume, label: String(volume) }
            : undefined}
          onSelectedChange={onVolumeChange}
          disabled={isBatching}
        >
          <Select.Trigger
            id="volume"
            class="rounded-none border border-gray-300 focus:border-green-700"
          >
            <Select.Value placeholder="Select volume" />
          </Select.Trigger>
          <Select.Content class="max-h-60 overflow-y-auto">
            {#each VOLUME_OPTIONS as v}
              <Select.Item value={v}>{v}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="number"
          class="text-xs font-bold uppercase tracking-wider text-gray-700"
        >
          Number
        </label>
        <Select.Root
          selected={number !== null
            ? { value: number, label: String(number) }
            : undefined}
          onSelectedChange={onNumberChange}
          disabled={isBatching}
        >
          <Select.Trigger
            id="number"
            class="rounded-none border border-gray-300 focus:border-green-700"
          >
            <Select.Value placeholder="Select number" />
          </Select.Trigger>
          <Select.Content class="max-h-60 overflow-y-auto">
            {#each NUMBER_OPTIONS as n}
              <Select.Item value={n}>{n}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      {#if detailsError}
        <p class="text-sm text-red-700">{detailsError}</p>
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button
        type="button"
        variant="outline"
        on:click={() => (detailsOpen = false)}
        disabled={isBatching}
        class="rounded-none border border-gray-300 hover:bg-gray-100"
      >
        Cancel
      </Button>
      <Button
        type="button"
        on:click={submitDetails}
        disabled={isBatching}
        class="rounded-none bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
      >
        <Icon icon="mdi:arrow-right" width="1rem" height="1rem" />
        Continue
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Confirmation Dialog -->
<AlertDialog.Root bind:open={confirmOpen}>
  <AlertDialog.Content class="rounded-none border border-gray-300">
    <AlertDialog.Header>
      <AlertDialog.Title class="text-green-700 font-bold text-xl">
        Confirm Journal Batching
      </AlertDialog.Title>
      <AlertDialog.Description class="text-gray-700 text-sm pt-2">
        You are about to batch
        <strong class="text-green-700">5000</strong>
        trademark publication{pendingCount === 1 ? "" : "s"} into journal
        <strong class="text-green-700">Vol. {volume} No. {number}</strong>
        with a release date of
        <strong class="text-green-700">{releaseDate}</strong>. This action
        cannot be reversed.
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
