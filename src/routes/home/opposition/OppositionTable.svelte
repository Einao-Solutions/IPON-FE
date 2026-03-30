<script lang="ts">
  import {
    createTable,
    Subscribe,
    Render,
    createRender,
  } from "svelte-headless-table";
  import { type Writable, writable } from "svelte/store";
  import * as Table from "$lib/components/ui/table";
  import { Input } from "$lib/components/ui/input";
  import {
    type AffectedFiles,
    arrayBufferToBase64,
    baseURL,
    type OppositionHistoryType,
    toByteArray,
    UserRoles,
    UserTypes,
  } from "$lib/helpers";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Dialog from "$lib/components/ui/dialog";
  import { goto } from "$app/navigation";
  import * as Pagination from "$lib/components/ui/pagination";
  import * as Sheet from "$lib/components/ui/sheet";
  import {
    addHiddenColumns,
    addPagination,
    addSelectedRows,
    addTableFilter,
  } from "svelte-headless-table/plugins";
  import { page } from "$app/stores";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import { ChevronsUpDown } from "lucide-svelte";
  import type { RecordSetStore } from "svelte-headless-table/dist/utils/store";
  import {
    appattachmentsData,
    listOfIds,
    loggedInUser,
    queryBody,
  } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { Label } from "$lib/components/ui/label";
  import { Toaster, toast } from "svelte-sonner";
  import { TrademarkAttachments } from "$lib/designutils";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { mapDateToString } from "../components/dashboardutils";
  import { Textarea } from "$lib/components/ui/textarea";
  export let dataList: [] | null = [];
  let tableHeaderRows, tablePageRows, _tableAttrs, _tableBodyAttrs;
  let _hasNextPage, _hasPreviousPage, _pageIndex;
  let _flatColumns;
  export let count: number = 0;
  export let currentDataPage: number = 0;
  export let showRenew: boolean = false;
  let _selectedDataIds: RecordSetStore<string>;
  let _hiddenColumnIds: Writable<string[]>;
  let hidableCols: string[] = ["date", "title", "fileId", "image", "applicant"];
  let hideForId: [] = [];
  let isLoading = false;
  let _filterValue;
  $: {
    $_hiddenColumnIds = Object.entries(hideForId)
      .filter(([, hide]) => !hide)
      .map(([id]) => id);
  }
  $: {
    $_pageIndex = currentDataPage;
  }

  const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
  $: {
    const table = createTable(writable(dataList ?? []), {
      page: addPagination({
        initialPageSize: $selectedResultList,
        serverItemCount: writable(count),
        serverSide: true,
      }),
      filter: addTableFilter({
        fn: ({ filterValue, value }) =>
          value.toLowerCase().includes(filterValue.toLowerCase()),
      }),
      hide: addHiddenColumns(),
      select: addSelectedRows(),
    });
    const columns = table.createColumns([
      table.column({
        accessor: "s/n",
        header: "S/N",
        plugins: { filter: { exclude: true } },
      }),
      table.column({
        accessor: "date",
        header: "Date",
      }),
      table.column({
        accessor: "title",
        header: "Title",
      }),
      table.column({
        accessor: "name",
        header: "Opposer Name",
      }),
      table.column({
        accessor: "currentStatus",
        header: "Status",
      }),
      table.column({
        accessor: "paymentId",
        header: "Payment ID",
      }),
      table.column({
        accessor: "fileId",
        header: "View File",
      }),
      table.column({
        accessor: "id",
        header: "View opposition",
        plugins: {
          filter: { exclude: true },
        },
      }),
    ]);
    const {
      headerRows,
      pageRows,
      tableAttrs,
      flatColumns,
      tableBodyAttrs,
      pluginStates,
    } = table.createViewModel(columns);
    tableHeaderRows = headerRows;
    _tableBodyAttrs = tableBodyAttrs;
    tablePageRows = pageRows;
    _tableAttrs = tableAttrs;
    const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
    _hasNextPage = hasNextPage;
    _hasPreviousPage = hasPreviousPage;
    _pageIndex = pageIndex;
    const { filterValue } = pluginStates.filter;
    _filterValue = filterValue;
    const { hiddenColumnIds } = pluginStates.hide;
    const { selectedDataIds } = pluginStates.select;
    _selectedDataIds = selectedDataIds;
    _hiddenColumnIds = hiddenColumnIds;
    _flatColumns = flatColumns;
    const ids = _flatColumns.map((col) => col.id);
    hideForId = Object.fromEntries(ids.map((id) => [id, true]));
  }
  let currentUrl = writable<URL>($page.url);
  export let oppositionType: number | undefined = undefined;
  let showRaiseOpposition = false;
  async function loadPage(counter: number, startIndex: number) {
    let data = [];
    isLoading = true;
    let url = `${baseURL}/api/opposition/loadSummary?quantity=${counter}&skip=${startIndex}`;
    if (oppositionType !== undefined) {
      url = url + `&type=${oppositionType}`;
    }
    if (
      $loggedInUser?.userRoles.some((role) =>
        [
          UserRoles.TrademarkCertification,
          UserRoles.TrademarkSearch,
          UserRoles.TrademarkOpposition,
          UserRoles.TrademarkExaminer,
          UserRoles.Tech,
        ].includes(role),
      ) == false
    ) {
      url = url + `?userId=${$loggedInUser.id}`;
    }
    const response = await fetch(url);
    const __data = await response.json();
    const _data = __data.data;
    for (let i = 0; i < _data.length; i++) {
      let curr = _data[i];
      data.push({
        "s/n": _data.indexOf(curr) + 1,
        id: curr.fileNumber,
        title: curr.fileTitle,
        creatorId: curr.creatorId,
        fileCreatorId: curr.fileCreatorId,
        fileId: curr.fileNumber,
        date: curr.oppositionDate,
        name: curr.name,
        currentStatus: curr.status,
      });
    }
    dataList = data;
    count = __data.count;
    isLoading = false;
  }
  let fileURL = "";
  let paymentType = "";
  async function generateRRR(type: string) {
    paymentType = type;
    currentView = -1;
    // save uploaded file
    let attachmentsLists = [];
    attachmentsLists.push({
      fileName: requiredFile.name,
      Name: "",
      contentType: requiredFile.type,
      data: arrayBufferToBase64(await toByteArray(requiredFile)),
    });
    // push and get return;
    const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attachmentsLists),
    });
    if (result.ok) {
      const res = await result.json();
      fileURL = res[0];
    }
    let description = "Counter against regarding - " + selectedTitle + "-";
    if (type === "resolution") {
      description = "Resolution statement regarding -" + selectedTitle + "-";
    }

    const response = await fetch(`${baseURL}/api/opposition/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description,
        type: type,
        oppositionID: selectedID,
        name: name,
        email: email,
        number: number,
      }),
    });
    const oppositionResult = await response.json();
    rrr = oppositionResult.rrr;
    amount = oppositionResult.amount;
    if (rrr != undefined) {
      currentView = 1;
    }
  }

  let showResultLengthList: boolean = false;
  let selectedResultList = writable<number>(10);
  let name, number, address, email, rrr, amount, oppositionId;
  let currentView = 0;
  let selectedTitle: string = "";
  let selectedID: string = "";
  let opposition : OppositionHistoryType;
  let oppositionHistory = null;
  async function raiseOppositionView(row = []) {
    currentView = -1;

    const oppositionID = row.find((x) => x.id === "id")?.value;

    if (!oppositionID) {
      toast.error("Invalid selection", {
        description: "Could not determine opposition ID.",
        duration: 4000,
      });
      return;
    }

    // const toastId = toast.loading("Fetching Opposition", {
    //   description: "Please wait...",
    //   duration: Infinity,
    // });

    try {
      showRaiseOpposition = true;

      const response = await fetch(
        `${baseURL}/api/opposition/get?id=${oppositionID}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch opposition");
      }

      const data = await response.json();

      if (!data) {
        throw new Error("No data returned");
      }

      opposition = data;
      currentView = 11;

      //   toast.success("Opposition Loaded", {
      //     description: "Details retrieved successfully.",
      //     id: toastId,
      //     duration: 3000,
      //   });
    } catch (err) {
      console.error("Error loading opposition:", err);

      showRaiseOpposition = false;
      currentView = 0;

      toast.error("Error", {
        description: err.message || "Failed to load opposition.",
      });
    }
  }

  async function UploadState(type: string, row: []) {
    selectedID = row.find((x) => x.id === "id").value;
    selectedTitle = row.find((x) => x.id === "title").value;
    if (type === "resolution") {
      currentView = 13;
    }
    if (type === "response") {
      currentView = 10;
    }
    showRaiseOpposition = true;
  }
  async function viewOppositionHistory(row: []) {
    currentView = -1;
    const oppositionID = row.find((x) => x.id === "id").value;
    showRaiseOpposition = true;
    oppositionHistory = await (
      await fetch(`${baseURL}/api/opposition/getHistory?id=${oppositionID}`)
    ).json();
    currentView = 12;
  }

  async function notifyApplicant(oppositionId: string) {
    isLoading = true;
    var res = await fetch(
      `${baseURL}/api/opposition/notify?oppId=${oppositionId}`,
      {
        method: "POST",
      },
    );

    if (res.ok) {
      let result = await res.json();
      toast.success("Notification sent successfully", {
        position: "top-right",
      });
      isLoading = false;
    }
  }
  async function viewResolve(row: []) {
    selectedID = row.find((x) => x.id === "id").value;
    selectedTitle = row.find((x) => x.id === "title").value;
    currentView = 19;
    showRaiseOpposition = true;
  }

  let resolvedText: string = "";
  let isResolving = false;
  async function resolveOpposition() {
    isResolving = true;
    var res = await fetch(`${baseURL}/api/opposition/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicationId: selectedID,
        statement: resolvedText,
        newStatus: 19,
        currentStatus: 17,
        reason: "opposition resolved",
        userName: $loggedInUser.name,
        userId: $loggedInUser.id,
      }),
    });

    if (res.ok) {
      let result = await res.json();
      toast.success("resolved successfully", { position: "top-right" });
      isResolving = false;
    }
  }

  function canResolve(row: []) {
    return (
      ($loggedInUser.userRoles.includes(UserRoles.Tech) ||
        $loggedInUser.userRoles.includes(UserRoles.TrademarkOpposition)) &&
      parseInt(row.find((x) => x.id === "currentStatus").value) === 17
    );
  }
  function canUploadResponse(row: []) {
    const status = parseInt(row.find((x) => x.id === "currentStatus").value);
    const canResond =
      $loggedInUser.id ===
        dataList.find((x) => x.id === row.find((x) => x.id === "id").value)
          .fileCreatorId || $loggedInUser.userRoles.includes(UserRoles.Tech);
    return status == 16 && canResond;
  }
  function yetToNotify(row: []) {
    const status = parseInt(row.find((x) => x.id === "currentStatus").value);
    return status == 29;
  }
  function canUploadResolution(row: []) {
    const status = parseInt(row.find((x) => x.id === "currentStatus").value);
    const isCreator =
      $loggedInUser.id ===
        dataList.find((x) => x.id === row.find((x) => x.id === "id").value)
          .creatorId || $loggedInUser.userRoles.includes(UserRoles.Tech);
    return status == 18 && isCreator;
  }

  async function fileChanged(event: Event | null) {
    const input = event?.target as HTMLInputElement;
    if (input.files) {
      if (input.files.length > 1) {
        removeAttachment();
        toast.error("maximum of 1 file", {
          position: "top-right",
        });
        return;
      }
      for (let i = 0; i < input.files.length; i++) {
        if (input.files[i].size > 5000000) {
          removeAttachment();
          toast.error("maximum file size of 5MB exceeded", {
            position: "top-right",
          });
          return;
        }
      }
      for (let i = 0; i < input.files.length; i++) {
        const fileType = input.files[i].type;
        if (fileType !== "application/pdf") {
          removeAttachment();
          toast.error("unsupported file type, only pdf supported", {
            position: "top-right",
          });
          return;
        }
        requiredFile = input.files[i] as File;
        requiredFileUrl = URL.createObjectURL(input.files[i]);
      }
    }
  }
  let requiredFile: File | null = null;
  let requiredFileUrl: string | undefined = undefined;
  function removeAttachment() {
    requiredFile = null;
    requiredFileUrl = undefined;
  }
</script>

<Toaster />
<Dialog.Root bind:open={showRaiseOpposition}>
  <Dialog.Content class="overflow-y-auto max-h-[80vh]">
    {#if currentView === 10}
      <!-- Response Form -->
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
            <Icon
              icon="lucide:file-edit"
              class="w-4 h-4 text-blue-600 dark:text-blue-400"
            />
          </div>
          Response Form
        </Dialog.Title>
      </Dialog.Header>
      <div class="p-6 space-y-5">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label
                for="name"
                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                >Full Name</Label
              >
              <Input
                id="name"
                placeholder="Enter your full name"
                bind:value={name}
              />
            </div>
            <div class="space-y-1.5">
              <Label
                for="email"
                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                >Email Address</Label
              >
              <Input
                id="email"
                placeholder="Enter your email"
                bind:value={email}
              />
            </div>
            <div class="space-y-1.5">
              <Label
                for="number"
                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                >Phone Number</Label
              >
              <Input
                id="number"
                placeholder="Enter phone number"
                bind:value={number}
              />
            </div>
            <div class="space-y-1.5 md:col-span-2">
              <Label
                for="address"
                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                >Address</Label
              >
              <Input
                id="address"
                placeholder="Enter your address"
                bind:value={address}
              />
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm"
        >
          <div class="flex items-center space-x-3 mb-3">
            <div class="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
              <Icon
                icon="lucide:paperclip"
                class="w-4 h-4 text-green-600 dark:text-green-400"
              />
            </div>
            <Label
              for="attachmentResponse"
              class="text-sm font-medium text-slate-600 dark:text-slate-300"
              >Attachment (PDF only)</Label
            >
          </div>
          <Input
            id="attachmentResponse"
            type="file"
            accept=".pdf"
            on:change={(event) => fileChanged(event)}
          />
        </div>
      </div>
      <Dialog.Footer class="gap-2 pt-2">
        <Button
          variant="outline"
          on:click={() => {
            showRaiseOpposition = false;
          }}>Cancel</Button
        >
        <Button
          on:click={async () => {
            await generateRRR("response");
          }}>Submit Response</Button
        >
      </Dialog.Footer>
    {:else if currentView === -1}
      <div class="items-center justify-center flex h-64 flex-col gap-3">
        <Icon
          icon="line-md:loading-loop"
          width="2rem"
          height="2rem"
          class="text-blue-500"
        />
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Loading, please wait...
        </p>
      </div>
    {:else if currentView === 11}
      <Dialog.Header>
        <Dialog.Title class="text-xl font-semibold">
          Opposition Details
        </Dialog.Title>
      </Dialog.Header>

      <div class="p-6 space-y-8">
        <!-- Top Summary -->
        <div class="flex justify-between items-center border-b pb-4">
          <div>
            <p class="text-sm text-gray-500">Opposition Date</p>
            <p class="text-lg font-semibold">
              {mapDateToString(opposition.OppositionDate)}
            </p>
          </div>
          <AppStatusTag value={opposition.Status} />
        </div>

        <!-- Opposer Info Table -->
        <div>
          <h3 class="text-md font-semibold mb-3 text-gray-700">
            Opposer Information
          </h3>

          <div class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b">
                  <td class="bg-gray-50 font-medium p-3 w-1/3">Full Name</td>
                  <td class="p-3">{opposition.Name}</td>
                </tr>
                <tr class="border-b">
                  <td class="bg-gray-50 font-medium p-3">Email</td>
                  <td class="p-3 break-all">{opposition.Email}</td>
                </tr>
                <tr class="border-b">
                  <td class="bg-gray-50 font-medium p-3">Phone</td>
                  <td class="p-3">{opposition.Phone}</td>
                </tr>
                <tr>
                  <td class="bg-gray-50 font-medium p-3">Address</td>
                  <td class="p-3">{opposition.Address}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attachments Table -->
        <div>
          <h3 class="text-md font-semibold mb-3 text-gray-700">Attachments</h3>

          <div class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-left">
                <tr>
                  <th class="p-3 font-medium">Document</th>
                  <th class="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {#if opposition.SupportingDocs.length > 0}
                  {#each opposition.SupportingDocs as doc}
                    <tr class="border-t hover:bg-gray-50">
                      <td class="p-3">
                        <div class="flex items-center gap-2">
                          <Icon
                            icon="lucide:file-text"
                            class="w-4 h-4 text-red-500"
                          />
                          Opposition Document
                        </div>
                      </td>
                      <td class="p-3 text-right">
                        <a
                          href={doc}
                          target="_blank"
                          class="text-blue-600 hover:underline font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {:else if currentView === 12}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <div class="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg">
            <Icon
              icon="lucide:history"
              class="w-4 h-4 text-amber-600 dark:text-amber-400"
            />
          </div>
          Opposition History
        </Dialog.Title>
      </Dialog.Header>
      <div class="p-6">
        <div class="relative space-y-6">
          <!-- Timeline line -->
          <div
            class="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-blue-300 via-slate-300 to-transparent dark:from-blue-600 dark:via-slate-600"
          ></div>
          {#each oppositionHistory as data, i}
            <div class="relative flex gap-4">
              <!-- Timeline dot -->
              <div class="relative z-10 flex-shrink-0 mt-1">
                <div
                  class="w-[31px] h-[31px] rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center {i ===
                  0
                    ? 'bg-blue-500'
                    : 'bg-slate-300 dark:bg-slate-600'}"
                >
                  <div class="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              <!-- Content card -->
              <div
                class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex justify-between items-center mb-2">
                  <p
                    class="text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    {mapDateToString(data.oppositionDate)}
                  </p>
                  <div
                    class="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full"
                  >
                    <Icon icon="lucide:user" width="0.85rem" height="0.85rem" />
                    {data.user}
                  </div>
                </div>
                {#if data.status !== null}
                  <div class="mb-2">
                    <AppStatusTag value={data.status} />
                  </div>
                {/if}
                <p class="text-sm text-slate-700 dark:text-slate-200">
                  {data.message}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if currentView === 13}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <div class="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
            <Icon
              icon="lucide:upload"
              class="w-4 h-4 text-green-600 dark:text-green-400"
            />
          </div>
          Resolution Attachment
        </Dialog.Title>
      </Dialog.Header>
      <div class="p-6">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm"
        >
          <div class="flex items-center space-x-3 mb-3">
            <div class="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
              <Icon
                icon="lucide:paperclip"
                class="w-4 h-4 text-green-600 dark:text-green-400"
              />
            </div>
            <Label
              for="attachmentResolution"
              class="text-sm font-medium text-slate-600 dark:text-slate-300"
              >Upload Resolution (PDF only)</Label
            >
          </div>
          <Input
            id="attachmentResolution"
            type="file"
            accept=".pdf"
            on:change={(event) => fileChanged(event)}
          />
        </div>
      </div>
      <Dialog.Footer class="gap-2 pt-2">
        <Button
          variant="outline"
          on:click={() => {
            showRaiseOpposition = false;
          }}>Cancel</Button
        >
        <Button
          on:click={async () => {
            await generateRRR("resolution");
          }}>Submit Resolution</Button
        >
      </Dialog.Footer>
    {:else if currentView === 1}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <div class="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg">
            <Icon
              icon="lucide:credit-card"
              class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
            />
          </div>
          Payment Details
        </Dialog.Title>
      </Dialog.Header>
      <div class="p-6">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4"
        >
          <div
            class="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div class="space-y-1">
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Amount Due
              </p>
              <p
                id="amount"
                class="text-2xl font-bold text-slate-900 dark:text-slate-100"
              >
                {amount}
              </p>
            </div>
            <div class="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
              <Icon
                icon="lucide:banknote"
                class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
          <div class="space-y-1 px-1">
            <Label
              class="text-sm font-medium text-slate-500 dark:text-slate-400"
              >Payment ID</Label
            >
            <p
              id="RRR"
              class="text-slate-900 dark:text-slate-100 font-mono font-medium text-lg"
            >
              {rrr}
            </p>
          </div>
        </div>
      </div>
      <Dialog.Footer class="gap-2 pt-2">
        <Button
          variant="outline"
          on:click={() => {
            showRaiseOpposition = false;
          }}>Cancel</Button
        >
        <Button
          on:click={() => {
            let go_url = "";
            if (paymentType === "resolution") {
              go_url =
                `/payment?type=oppositionResolution&oppositionId=${selectedID}&title=Resolution statement on opposition regarding -${selectedTitle}-` +
                `&fileUrl=${fileURL}&rrr=${rrr}&cost=${amount}`;
            }
            if (paymentType === "response") {
              go_url =
                `/payment?type=oppositionCounter&oppositionId=${selectedID}&title=Counter statement on opposition regarding -${selectedTitle}-` +
                `&name=${name}&address=${address}&number=${number}&email=${email}` +
                `&fileUrl=${fileURL}&rrr=${rrr}&cost=${amount}`;
            }
            goto(go_url);
          }}>Proceed to Payment</Button
        >
      </Dialog.Footer>
    {:else if currentView === 19}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <div class="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-lg">
            <Icon
              icon="lucide:check-circle"
              class="w-4 h-4 text-orange-600 dark:text-orange-400"
            />
          </div>
          Resolve Opposition
        </Dialog.Title>
      </Dialog.Header>
      <div class="p-6 space-y-4">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-3"
        >
          <Label class="text-sm font-medium text-slate-600 dark:text-slate-300"
            >Resolution Statement</Label
          >
          <Textarea
            placeholder="Enter your resolution statement..."
            bind:value={resolvedText}
            class="min-h-28"
          />
        </div>
        <Button
          on:click={() => resolveOpposition()}
          disabled={isResolving}
          class="w-full"
        >
          {#if isResolving}
            <div class="flex items-center justify-center gap-2">
              <Icon
                icon="line-md:loading-loop"
                width="1.2rem"
                height="1.2rem"
              />
              Processing...
            </div>
          {:else}
            Submit Resolution
          {/if}
        </Button>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
<div>
  <div class="flex items-center py-4">
    <div
      class="ml-auto {Object.keys($_selectedDataIds).length > 0
        ? ''
        : 'hidden'} text-muted-foreground flex-1 text-sm"
    >
      {Object.keys($_selectedDataIds).length} of{" "}
      {dataList?.length ?? 0} row(s) selected.
    </div>
    <div class="ml-auto mr-20">
      <DropdownMenu.Root bind:open={showResultLengthList} let:ids>
        <DropdownMenu.Trigger asChild let:builder>
          <Button builders={[builder]} variant="outline">
            Results per Page ({$selectedResultList})
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-fit p-1">
          {#each resultLength as rl}
            <DropdownMenu.Item
              on:click={() => {
                selectedResultList.set(rl);
                loadPage(rl, 0);
              }}
            >
              <span>{rl}</span>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="outline" class="ml-auto" builders={[builder]}>
          Columns <ChevronDown class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {#each _flatColumns as col}
          {#if hidableCols.includes(col.id)}
            <DropdownMenu.CheckboxItem
              bind:checked={hideForId[col.id]}
              onCheckedChange={(newv) => {
                hideForId[col.id] = newv;
              }}
            >
              {col.header}
            </DropdownMenu.CheckboxItem>
          {/if}
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
  {#if isLoading}
    <div class=" w-full h-full flex">
      <Icon
        class="mx-auto my-auto"
        icon="line-md:loading-twotone-loop"
        width="1.2rem"
        height="1.2rem"
      />
    </div>
  {:else}
    <div class="rounded-md border">
      <Table.Root {...$_tableAttrs}>
        <Table.Header>
          {#each $tableHeaderRows as headerRow}
            <Subscribe rowAttrs={headerRow.attrs()}>
              <Table.Row>
                {#each headerRow.cells as cell (cell.id)}
                  <Subscribe
                    attrs={cell.attrs()}
                    let:attrs
                    props={cell.props()}
                  >
                    <Table.Head
                      {...attrs}
                      class="[&:has([role=checkbox])]:pl-3"
                    >
                      {#if cell.id === "title"}
                        <div class="w-[20px]">
                          <Render of={cell.render()} />
                        </div>
                      {:else}
                        <Render of={cell.render()} />
                      {/if}
                    </Table.Head>
                  </Subscribe>
                {/each}
              </Table.Row>
            </Subscribe>
          {/each}
        </Table.Header>
        <Table.Body {...$_tableBodyAttrs}>
          {#each $tablePageRows as row (row.id)}
            <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
              <Table.Row
                {...rowAttrs}
                data-state={$_selectedDataIds[row.id] && "selected"}
              >
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    <Table.Cell {...attrs}>
                      {#if cell.id === "title"}
                        <div class="text-ellipsis line-clamp-2 w-56">
                          <Render of={cell.render()} />
                        </div>
                      {:else if cell.id === "id"}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild let:builder>
                            <Button builders={[builder]}>
                              Actions <ChevronDown class="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item
                              on:click={() => raiseOppositionView(row.cells)}
                              >View opposition</DropdownMenu.Item
                            >
                            <!-- {#if yetToNotify(row.cells)}
                              <DropdownMenu.Item
                                >Notify Applicant</DropdownMenu.Item
                              >
                            {/if} -->
                            <!-- {#if canUploadResponse(row.cells)}
															<DropdownMenu.Item on:click={() => UploadState('response', row.cells)}
																>Upload Counter statement</DropdownMenu.Item
															>
														{/if}
														{#if canUploadResolution(row.cells)}
															<DropdownMenu.Item
																on:click={() => UploadState('resolution', row.cells)}
																>Upload resolution</DropdownMenu.Item
															>
														{/if} -->
                            {#if canResolve(row.cells)}
                              <DropdownMenu.Item
                                on:click={() => viewResolve(row.cells)}
                              >
                                Mark as resolved
                              </DropdownMenu.Item>
                            {/if}
                            <DropdownMenu.Item
                              on:click={() => viewOppositionHistory(row.cells)}
                            >
                              View history
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      {:else if cell.id === "fileId"}
                        <Button
                          on:click={() => goto(`/dataview?id=${cell.render()}`)}
                        >
                          View trademark
                        </Button>
                      {:else if cell.id === "date"}
                        <div class="w-24">
                          <Render of={mapDateToString(cell.render())} />
                        </div>
                      {:else if cell.id === "currentStatus"}
                        <div class="w-24">
                          <AppStatusTag value={parseInt(cell.render())} />
                        </div>
                      {:else}
                        <Render of={cell.render()} />
                      {/if}
                    </Table.Cell>
                  </Subscribe>
                {/each}
              </Table.Row>
            </Subscribe>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
  <div class="flex items-center justify-end space-x-4 py-4">
    <Pagination.Root
      {count}
      perPage={$selectedResultList}
      let:pages
      let:currentPage
    >
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton
            on:click={() => {
              $_pageIndex = $_pageIndex - 1;
              loadPage($selectedResultList, $selectedResultList * $_pageIndex);
              currentDataPage = $_pageIndex;
            }}
          />
        </Pagination.Item>
        {#each pages as page (page.key)}
          {#if page.type === "ellipsis"}
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
          {:else}
            <Pagination.Item isVisible={currentPage === page.value}>
              <Pagination.Link
                {page}
                isActive={$_pageIndex + 1 === page.value}
                on:click={() => {
                  $_pageIndex = page.value - 1;
                  loadPage(
                    $selectedResultList,
                    $selectedResultList * $_pageIndex,
                  );
                  currentDataPage = $_pageIndex;
                }}
              >
                {page.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton
            on:click={() => {
              $_pageIndex += 1;
              loadPage($selectedResultList, $selectedResultList * $_pageIndex);
              currentDataPage = $_pageIndex;
            }}
          />
        </Pagination.Item>
      </Pagination.Content>
    </Pagination.Root>
  </div>
</div>
