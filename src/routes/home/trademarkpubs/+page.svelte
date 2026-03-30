<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import TradePubsTable from "./TradePubsTable.svelte";
  import { baseURL } from "$lib/helpers";

  let searchTitle: string | undefined = undefined;
  let isLoading: boolean = false;
  let dataList: any[] = [];
  let count: number = 0;

  async function carryOutSearch(index: number = 0, fullReload: boolean = true) {
    if (fullReload) {
      isLoading = true;
      dataList = [];
    }

    let url = "";
    if (searchTitle !== undefined && searchTitle !== "") {
      url = `${baseURL}/api/publication/GetTrademarkPublication?text=${searchTitle}&index=${index}&quantity=10`;
    } else {
      url = `${baseURL}/api/publication/GetTrademarkPublication?index=${index}&quantity=10`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    count = result.count;

    const newList: any[] = [];
    for (let i = 0; i < result.result.length; i++) {
      const dataListKey = result.result[i];
      newList.push({
        "s/n": index + i + 1,
        publicationDate: Intl.DateTimeFormat("en-NG", {
          year: "2-digit",
          month: "short",
          day: "numeric",
          weekday: "short",
          hour: "numeric",
          minute: "numeric",
        }).format(new Date(dataListKey.publicationDate)),
        filingDate: Intl.DateTimeFormat("en-NG", {
          year: "2-digit",
          month: "short",
          day: "numeric",
          weekday: "short",
          hour: "numeric",
          minute: "numeric",
        }).format(new Date(dataListKey.filingDate)),
        fileId: dataListKey.fileNumber,
		id: dataListKey.fileId,
        title: dataListKey.title,
        tradeClass: dataListKey.class,
        image: dataListKey.representation,
        applicant: dataListKey.applicant,
      });
    }

    dataList = newList;
    isLoading = false;
  }

  onMount(async () => {
    await carryOutSearch();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      carryOutSearch();
    }
  }
</script>

<div class="w-full bg-white">
  <div class="max-w-6xl mx-auto px-4 py-8 sm:px-6">
    <!-- Header -->
    <!-- <div class="border-b-4 border-green-700 pb-6 mb-8">
      <h1 class="text-3xl font-bold text-green-700 mb-2">Trademark Publications</h1>
      <p class="text-gray-600 text-sm font-normal">
        Search and browse trademark publications in Nigeria
      </p>
    </div> -->

    <!-- Search Section -->
    <div class="flex flex-col sm:flex-row gap-4 items-end mb-8">
      <div class="flex-1 flex flex-col gap-2">
        <label class="text-xs font-bold text-black uppercase tracking-wider">Search</label>
        <Input
          placeholder="Enter trademark title, file number, or applicant name..."
          bind:value={searchTitle}
          on:keydown={handleKeydown}
          class="border border-gray-300 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700 focus:ring-opacity-10"
        />
      </div>
      <Button
        on:click={() => carryOutSearch()}
        class="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-6 rounded-none flex items-center gap-2 transition-colors"
      >
        <Icon icon="mdi:magnify" width="1.2rem" height="1.2rem" />
        Search
      </Button>
    </div>

    <!-- Results -->
    {#if isLoading}
      <div class="flex items-center justify-center min-h-96 bg-gray-50 border border-gray-300 rounded-none">
        <div class="flex flex-col items-center gap-4">
          <Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-green-700" />
          <p class="text-gray-600 font-medium">Searching publications...</p>
        </div>
      </div>
    {:else}
      {#if dataList.length > 0}
        <div class="bg-gray-50 border-l-4 border-green-700 border border-gray-300 rounded-none p-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <span class="text-sm text-gray-800 font-medium">
            Found <strong class="text-green-700">{count}</strong> result{count !== 1 ? "s" : ""}
          </span>
          <span class="text-sm text-gray-800 font-medium">
            Showing <strong class="text-green-700">{Math.min(dataList.length, 10)}</strong> of
            <strong class="text-green-700">{count}</strong>
          </span>
        </div>
        <div class="border border-gray-300 rounded-none overflow-hidden">
          <TradePubsTable {dataList} {count} {searchTitle} on:pageChange={(e) => carryOutSearch(e.detail.index, false)} />
        </div>
      {:else}
        <div class="text-center py-12 text-gray-600">
          <div class="text-4xl mb-4 opacity-60">📋</div>
          <p class="text-base">
            {searchTitle
              ? "No publications found matching your search."
              : "Enter a search query to get started."}
          </p>
        </div>
      {/if}
    {/if}
  </div>
</div>