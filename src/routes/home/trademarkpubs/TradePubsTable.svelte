<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { User } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let dataList: any[] = [];
  export let count: number = 0;
  export let searchTitle: string | undefined = undefined;

  let sortColumn: string = "s/n";
  let sortDirection: "asc" | "desc" = "asc";
  let currentPage = 1;
  const itemsPerPage = 10;
  let openDropdown: string | null = null;

  $: sortedData = sortData(dataList, sortColumn, sortDirection);
  $: totalPages = Math.ceil(count / itemsPerPage);
  $: paginatedData = sortedData;
  function goToPage(page: number) {
    currentPage = page;
    dispatch("pageChange", { page, index: (page - 1) * itemsPerPage });
  }
  $: oppStaff = $loggedInUser?.userRoles?.some((r: UserRoles) =>
    [UserRoles.TrademarkOpposition, UserRoles.SuperAdmin, UserRoles.Tech].includes(r),
  );
  function sortData(data: any[], column: string, direction: "asc" | "desc") {
    return [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (typeof aVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
    currentPage = 1;
  }

  function truncate(str: string, length: number = 50): string {
    return str.length > length ? str.substring(0, length) + "..." : str;
  }

  function toggleDropdown(fileId: string) {
    openDropdown = openDropdown === fileId ? null : fileId;
  }

  async function raiseOpposition(row: any) {
    console.log("Raise opposition for:", row);
    openDropdown = null;
    // TODO: Implement opposition logic
    await goto(
      `/opposition?fileId=${row.fileId}&title=${encodeURIComponent(row.title)}`,
    );
  }

  function viewFileDetails(row: any) {
    console.log("View details for:", row);
    openDropdown = null;
    // TODO: Implement view details logic
  }
</script>

<div class="w-full overflow-x-auto">
  {#if dataList.length > 0}
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-green-700 text-white">
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide w-12"
          >
            S/N
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
            >Title</th
          >
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-green-800 transition-colors"
            on:click={() => handleSort("fileId")}
          >
            File # {#if sortColumn === "fileId"}{sortDirection === "asc"
                ? "▲"
                : "▼"}{/if}
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
            >Applicant</th
          >
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
            >Class</th
          >
          <th
            class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-green-800 transition-colors"
            on:click={() => handleSort("publicationDate")}
          >
            Publication Date {#if sortColumn === "publicationDate"}{sortDirection ===
              "asc"
                ? "▲"
                : "▼"}{/if}
          </th>
          <th
            class="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide"
            >Actions</th
          >
        </tr>
      </thead>
      <tbody>
        {#each paginatedData as row (row.fileId)}
          <tr
            class="border-b border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-bold text-green-700 text-center"
              >{row["s/n"]}</td
            >
            <td class="px-4 py-3 text-gray-800">
              <div class="font-medium">
                {truncate(row.title, 60)}
                {#if row.image}
                  <img src={row.image} alt="Representation" />
                {/if}
              </div>
            </td>
            <td class="px-4 py-3 text-green-700 font-semibold text-xs"
              >{row.fileId}</td
            >
            <td class="px-4 py-3 text-gray-800 text-sm"
              >{truncate(row.applicant, 35)}</td
            >
            <td class="px-4 py-3">
              <span
                class="bg-gray-100 text-green-700 px-2 py-1 border border-gray-300 font-bold text-xs"
              >
                {row.tradeClass}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs"
              >{row.publicationDate}</td
            >
            <td class="px-4 py-3 text-center relative">
              <div class="flex items-center justify-center gap-2">
                <!-- <button
                  on:click={() => raiseOpposition(row)}
                  class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  title="Raise Opposition"
                >
                  Oppose
                </button> -->
                <div class="relative">
                  <button
                    on:click={() => toggleDropdown(row.fileId)}
                    class="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors flex items-center"
                    title="More actions"
                  >
                    <Icon icon="mdi:dots-vertical" width="1rem" height="1rem" />
                  </button>
                  {#if openDropdown === row.fileId}
                    <div
                      class="absolute right-0 mt-1 w-40 bg-white border border-gray-300 shadow-lg z-10"
                    >
                      {#if oppStaff}
                        <button
                          on:click={() =>
                            goto(`/dataview?id=${encodeURIComponent(row.id)}`)}
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-200 flex items-center gap-2"
                        >
                          <Icon
                            icon="mdi:file-document"
                            width="1rem"
                            height="1rem"
                          />
                          View File Details
                        </button>
                      {/if}
                      <!-- <button
                        on:click={() => raiseOpposition(row)}
                        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Icon
                          icon="mdi:alert-circle"
                          width="1rem"
                          height="1rem"
                        />
                        Raise Opposition
                      </button> -->
                    </div>
                  {/if}
                </div>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if totalPages > 1}
      <div
        class="flex flex-wrap justify-center items-center gap-2 p-4 border-t border-gray-300 bg-white"
      >
        <button
          disabled={currentPage === 1}
          on:click={() => goToPage(1)}
          class="px-3 py-2 border border-gray-300 bg-white text-green-700 font-medium text-sm hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← First
        </button>
        <button
          disabled={currentPage === 1}
          on:click={() => goToPage(Math.max(1, currentPage - 1))}
          class="px-3 py-2 border border-gray-300 bg-white text-green-700 font-medium text-sm hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <span class="text-sm text-gray-600 mx-2">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>
        <button
          disabled={currentPage === totalPages}
          on:click={() => goToPage(Math.min(totalPages, currentPage + 1))}
          class="px-3 py-2 border border-gray-300 bg-white text-green-700 font-medium text-sm hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
        <button
          disabled={currentPage === totalPages}
          on:click={() => goToPage(totalPages)}
          class="px-3 py-2 border border-gray-300 bg-white text-green-700 font-medium text-sm hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Last →
        </button>
      </div>
    {/if}
  {/if}
</div>
