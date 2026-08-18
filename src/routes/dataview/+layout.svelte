<script lang="ts">
  import { Button } from "$lib/components/ui/button/index";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
  import type { LayoutServerData } from "../../../.svelte-kit/types/src/routes/$types";
  import { goto } from "$app/navigation";
  import {
    CanTreatApplication,
    CanUpdateApplication,
    getStatuses,
    mapStatusOptionToString,
    parseLoggedInUser,
  } from "./datahelpers";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { writable } from "svelte/store";
  import {
    type ApplicationHistoryType,
    ApplicationStatuses,
    baseURL,
    FileTypes,
    FilingType,
    getStatusColour,
    type PatentData,
    UserRoles,
    UserTypes,
  } from "$lib/helpers";
  import { page } from "$app/stores";
  import {
    appattachmentsData,
    applicationData,
    applicationMode,
    applicationScreen,
    formsData,
    listOfIds,
    loggedInUser,
    newApplicationType,
    queryBody,
    savePageData,
    validatedPages,
    validatePage,
  } from "$lib/store";
  import { type DateValue, parseDate } from "@internationalized/date";
  import Icon from "@iconify/svelte";
  import { Toaster, toast } from "svelte-sonner";
  import { mapTypeToString } from "../home/components/dashboardutils";
  import { redirect } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import dayjs from "dayjs";
  import ApplicationsHistory from "./ApplicationsHistory.svelte";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { comment } from "postcss";
  //   import { aw } from "vitest/dist/chunks/reporters.nr4dxCkA.js";
  let canUpdate: boolean = false;
  let canTreat: boolean = false;
  let fileData: any;
  let currentStatus: ApplicationStatuses;
  let treatApplicationDialog: boolean = false;
  let treatConfirmationDialog: boolean = false;
  let currentUrl = writable<URL>($page.url);
  let selectedStatus: ApplicationStatuses | null = null;
  let newStatusReason = writable<string | null>(null);
  let selectedApplication: ApplicationHistoryType | null = null;
  let isSaving: boolean = false;
  let isDataLoading: boolean = true;
  let isLoading = false;
  export const data: LayoutServerData =
    undefined as unknown as LayoutServerData;
  void data;
  function resetForm() {
    selectedStatus = null;
    newStatusReason.set(null);
  }

  function getAwaitingExaminerEntry(): { message?: string; user?: string } | null {
    const history = (selectedApplication?.statusHistory ?? []) as any[];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.afterStatus === ApplicationStatuses.AwaitingExaminer) {
        return history[i];
      }
    }
    return null;
  }

  $: validateForm = (): boolean => {
    return (
      $newStatusReason !== null &&
      $newStatusReason != "" &&
      selectedStatus != null
    );
  };

  $: renewalApplications = (
    (fileData?.applicationHistory ?? []) as ApplicationHistoryType[]
  ).filter((x) => x.applicationType === 1);
  $: applications = (fileData?.applicationHistory ??
    []) as ApplicationHistoryType[];
  function canTreatRenewal(renewal: ApplicationHistoryType): boolean {
    return CanTreatApplication(
      $loggedInUser?.userRoles ?? [],
      fileData.type,
      (renewal.currentStatus ?? 0) as ApplicationStatuses,
      [],
    );
  }

  function getDates() {
    return fileData?.applicationHistory
      ?.filter(
        (y: ApplicationHistoryType) =>
          y.applicationType == 0 || y.applicationType == 1,
      )
      .map((x: ApplicationHistoryType) => x.expiryDate);
  }
  async function saveNewStatus() {
    isSaving = true;
    const body = {
      beforeStatus: selectedApplication?.currentStatus,
      afterStatus: selectedStatus,
      message: $newStatusReason,
      user: $loggedInUser?.firstName + " " + $loggedInUser?.lastName,
      userId: $loggedInUser?.id ?? $loggedInUser?.creatorId,
      applicationType: selectedApplication?.applicationType,
      fileId: fileData?.id,
      applicationId: selectedApplication?.id,
      fieldToUpdate: selectedApplication?.fieldToChange,
      newValue: selectedApplication?.newValue,
      fileType: fileData?.type,
      fileNumber: fileData?.fileId,
      dates: getDates(),
    };
    const res = await fetch(`${baseURL}/api/files/UpdateApplicationStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const result = await res.json();
      console.log(result);
      applicationData.set(result as PatentData);
      isSaving = false;
      treatApplicationDialog = false;
      treatConfirmationDialog = false;
      toast.success("Successfully updated status", {
        position: "top-right",
      });
      newStatusReason.set(null);
      selectedStatus = null;
      const loggeduser = $loggedInUser?.id.toString() ?? "";
      const userRoles = $loggedInUser?.userRoles ?? [];
      const filingType = ($applicationData?.type ??
        FilingType.Trademark) as FilingType;
      const appStatus = $applicationData?.fileStatus as ApplicationStatuses;
      canUpdate = CanUpdateApplication(
        loggeduser,
        $applicationData?.creatorAccount ?? "",
        userRoles,
        appStatus,
      );
      canTreat = CanTreatApplication(
        userRoles,
        filingType,
        appStatus,
        fileData.applicationHistory.map(
          (x: ApplicationHistoryType) => x.currentStatus,
        ),
      );
    }
  }

  export function updateApplication() {
    newApplicationType.set(fileData.type);
    applicationMode.set(1);
    if (fileData.priorityInfo) {
      (fileData as PatentData)?.priorityInfo?.forEach((x) => {
        console.log(x.date);
        if (x.date.includes("/")) {
          x.date = dayjs(x.date, "M/D/YYYY").format("YYYY-MM-DD");
        } else {
          (x as unknown as { date: DateValue }).date = parseDate(x.date);
        }
      });
    }
    formsData.set([]);
    applicationScreen.set(0);
    appattachmentsData.set([{ name: "", data: [] }]);
    savePageData.set(null);
    validatedPages.set([]);
    validatePage.set(null);
    applicationData.set(fileData);
    goto(`/application?type=${fileData.type}`);
  }

  onMount(async () => {
    await loadData();
    getDates();
    console.log(
      fileData.applicationHistory.filter(
        (x: ApplicationHistoryType) =>
          [0, 1].includes(x.applicationType ?? -1) &&
          ![0, 1].includes(x.currentStatus ?? -1),
      ),
    );
  });

  async function loadData() {
    isDataLoading = true;
    const id = $currentUrl.searchParams.get("id");
    if (!$loggedInUser) {
      const user = parseLoggedInUser(document.cookie);
      if (!user) {
        console.log("the logged in user");
        await goto("/auth");
      } else {
        loggedInUser.set(user);
      }
    }
    const loggeduser = $loggedInUser?.id.toString() ?? "";
    const res = await fetch(`${baseURL}/api/files/${id}`);
    const file = await res.json();
    const userRoles = $loggedInUser?.userRoles ?? [];
    const filingType = file.type;
    const appStatus = file.fileStatus;
    applicationData.set(file);
    fileData = file;
    canUpdate = CanUpdateApplication(
      loggeduser,
      file.creatorAccount,
      userRoles,
      appStatus,
    );
    canTreat = CanTreatApplication(
      userRoles,
      filingType,
      appStatus,
      fileData.applicationHistory.map(
        (x: ApplicationHistoryType) => x.currentStatus,
      ),
    );
    currentStatus = appStatus;
    isDataLoading = false;
  }

  async function gotoPrevious() {
    const currentID = $currentUrl.searchParams.get("id") ?? "";
    let currentIndex: number = $listOfIds.indexOf(currentID);
    if (currentIndex != 0) {
      currentIndex -= 1;
      const nextId = $listOfIds[currentIndex];
      if (!nextId || nextId === undefined) {
        toast.info("No more files of selected type available", {
          position: "top-right",
        });
      } else {
        currentUrl.update((curr) => {
          curr.searchParams.set("id", nextId);
          return curr;
        });
        await loadData();
      }
    } else {
      toast.info("No more files of selected type available", {
        position: "top-right",
      });
    }
  }

  async function gotoNext() {
    const currentID = $currentUrl.searchParams.get("id") ?? "";
    let currentIndex: number = $listOfIds.indexOf(currentID);
    currentIndex += 1;
    // if we are close to the end of the list, at 9,load next 10,
    const lengthOfList = $listOfIds.length;
    if (currentIndex + 2 === lengthOfList) {
      // load next set of ids
      getNextIds();
    }
    const nextId = $listOfIds[currentIndex];
    if (!nextId || nextId === undefined) {
      toast.info("No more files of selected type available", {
        position: "top-right",
      });
      // goto('home/dashboard');
    } else {
      currentUrl.update((curr) => {
        curr.searchParams.set("id", nextId);
        return curr;
      });
      await loadData();
    }
  }

  function treatApplication(data: ApplicationHistoryType) {
    if (
      data.applicationType == 1 &&
      [
        ApplicationStatuses.AwaitingSearch,
        ApplicationStatuses.AwaitingExaminer,
        ApplicationStatuses.Re_conduct,
        ApplicationStatuses.Rejected,
        ApplicationStatuses.KivExaminer,
        ApplicationStatuses.KivSearch,
      ].includes(fileData.applicationHistory[0].currentStatus)
    ) {
      toast.error(
        "A Renewal Application  cannot be treated until the new application is treated",
        {
          position: "top-right",
        },
      );
      return;
    }
    currentStatus = data.currentStatus as ApplicationStatuses;
    selectedApplication = data;
    treatApplicationDialog = true;
  }
  async function getNextIds() {
    const index = $listOfIds.length;
    const _queryBody = $queryBody;
    const response = await fetch(
      `${baseURL}/api/files/GetListOfIds?index=${index}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: _queryBody,
      },
    );
    const result = await response.json();
    if (response.ok) {
      listOfIds.update((ll) => {
        ll = [...ll, ...result];
        console.log("updated is", ll);
        return ll;
      });
    }
  }
  function searchAvailability() {
    // let classNo = string
    console.log("fileData", fileData);
    const searchParams = {
      query: fileData?.titleOfTradeMark?.split(" ")[0],
      classId: fileData?.trademarkClass,
      fileType: fileData?.type,
    };
    sessionStorage.setItem("searchParams", JSON.stringify(searchParams));
    // console.log('searchParams', searchParams);

    window.open(`/availabilitysearch`, "_blank");
  }
  async function opposeFile(fileNumber: string, reason: string) {
    console.log("opposing file", fileNumber, reason);
    isSaving = true;
    const response = await fetch(`${baseURL}/api/opposition/StaffOpposition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileNumber: fileNumber,
        staffOpposition: true,
        staffId: $loggedInUser?.id,
        reason: reason,
      }),
    });
    isSaving = false;
    if (response.ok) {
      toast.success("Successfully filed opposition", {
        position: "top-right",
      });
      treatApplicationDialog = false;
      resetForm();
    } else {
      toast.error("Failed to file opposition", {
        position: "top-right",
      });
    }
  }
  async function publishFile(fileNumber: string, reason: string | null) {
    isSaving = true;
    const response = await fetch(`${baseURL}/api/publication/SavePublication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileNumber: fileNumber,
        staffId: $loggedInUser?.id,
        staffName: $loggedInUser?.firstName + " " + $loggedInUser?.lastName,
        comment: reason,
        isManualPublication: true,
      }),
    });
    isSaving = false;
    if (response.ok) {
      toast.success("Successfully published file", {
        position: "top-right",
      });
      treatApplicationDialog = false;
      resetForm();
    } else {
      toast.error("Failed to publish file", {
        position: "top-right",
      });
    }
  }
</script>

<Toaster />
<Dialog.Root bind:open={treatApplicationDialog} onOpenChange={resetForm}>
  <Dialog.Content
    class="w-11/12 max-w-xl p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-white"
  >
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-slate-100">
      <Dialog.Header class="space-y-1">
        <Dialog.Title
          class="text-lg font-semibold text-slate-900 tracking-tight"
        >
          Treat Application
        </Dialog.Title>
        <Dialog.Description class="text-xs text-slate-500">
          Choose a new status and provide a reason for the change.
        </Dialog.Description>
      </Dialog.Header>
    </div>

    <!-- Body -->
    <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
      {#if fileData}
        {@const fileTitle =
          fileData.type === FilingType.Patent
            ? fileData.titleOfInvention
            : fileData.type === FilingType.Design
              ? fileData.titleOfDesign
              : fileData.titleOfTradeMark}
        {@const fileClass =
          fileData.type === FilingType.Trademark
            ? fileData.trademarkClass
              ? `Class ${fileData.trademarkClass}`
              : "—"
            : fileData.type === FilingType.Patent
              ? "Patent"
              : fileData.type === FilingType.Design
                ? "Design"
                : "—"}
        {@const applicant =
          (fileData.applicants?.length ?? 0) > 1
            ? `${fileData.applicants?.[0]?.name ?? ""} et al.`
            : (fileData.applicants?.[0]?.name ?? "—")}

          {@const country =
            (fileData.applicants?.length ?? 0) > 1
              ? `${fileData.applicants?.[0]?.country ?? ""} et al.`
              : (fileData.applicants?.[0]?.country ?? "—")

          }
        <div
          class="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
        >
          <dl class="grid grid-cols-[7rem,1fr] gap-x-4 gap-y-2 text-sm">
            <dt
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              File No.
            </dt>
            <dd class="text-slate-800 font-medium truncate">
              {fileData.fileId ?? "—"}
            </dd>

            <dt
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Title
            </dt>
            <dd class="text-slate-800 font-medium break-words">
              {fileTitle ?? "—"}
            </dd>

            <dt
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Class
            </dt>
            <dd class="text-slate-800 font-medium">{fileClass}</dd>

            <dt
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Applicant
            </dt>
            <dd class="text-slate-800 font-medium break-words">{applicant}</dd>
            <dt
              class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Country
            </dt>
            <dd class="text-slate-800 font-medium break-words">{country}</dd>
          </dl>
        </div>
      {/if}

      {#if selectedApplication?.currentStatus === ApplicationStatuses.AwaitingExaminer}
        {@const searchEntry = getAwaitingExaminerEntry()}
        {#if searchEntry}
          <div
            class="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="mdi:magnify-scan"
                width="1rem"
                class="text-slate-600"
              />
              <p
                class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Report
              </p>
            </div>
            <p class="text-sm text-slate-800 whitespace-pre-wrap break-words">
              {searchEntry.message ?? "—"}
            </p>
            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon icon="mdi:account-outline" width="0.95rem" />
              <span>By</span>
              <span class="font-medium text-slate-700"
                >{searchEntry.user ?? "—"}</span
              >
            </div>
          </div>
        {/if}
      {/if}

      {#if selectedApplication?.currentStatus === ApplicationStatuses.AwaitingSearch || selectedApplication?.currentStatus === ApplicationStatuses.AwaitingExaminer}
        <Button
          on:click={searchAvailability}
          class="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
        >
          {#if isLoading}
            <Icon
              icon="line-md:loading-loop"
              width="1.1em"
              height="1.1em"
              class="mr-2 animate-spin"
            />
            Searching…
          {:else}
            <Icon icon="mdi:magnify" width="1.1em" class="mr-2" />
            Availability Search
          {/if}
        </Button>
      {/if}

      {#if selectedApplication?.currentStatus === ApplicationStatuses.Publication}
        <div class="flex flex-col sm:flex-row gap-2">
          {#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Tech, UserRoles.TrademarkOpposition, UserRoles.SuperAdmin].includes(x), )}
            <Button
              class="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              disabled={!$newStatusReason || isSaving}
              on:click={() =>
                opposeFile(fileData.fileId, $newStatusReason ?? "")}
            >
              <Icon icon="mdi:gavel" class="mr-1.5" width="1em" />
              Oppose
            </Button>
          {/if}
          {#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Tech, UserRoles.TrademarkExaminer, UserRoles.SuperAdmin].includes(x), )}
            <Button
              class="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!$newStatusReason || isSaving}
              on:click={() =>
                publishFile(fileData.fileId, $newStatusReason ?? null)}
            >
              <Icon
                icon="mdi:check-decagram-outline"
                class="mr-1.5"
                width="1em"
              />
              Publish
            </Button>
          {/if}
        </div>
      {/if}

      <!-- Status selection -->
      {#if getStatuses(currentStatus, $applicationData?.type ?? 0).length > 0}
        <div class="space-y-2">
          <p
            class="text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            New Status
          </p>
          <div class="flex flex-wrap gap-2">
            {#each getStatuses(currentStatus, $applicationData?.type ?? 0) as status}
              {@const isSelected = selectedStatus === status}
              <button
                type="button"
                on:click={() => (selectedStatus = status)}
                style={isSelected
                  ? `background-color: ${getStatusColour(status)}; border-color: ${getStatusColour(status)};`
                  : ""}
                class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  {isSelected
                  ? 'text-white shadow-sm'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300'}"
              >
                {mapStatusOptionToString(status)}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Reason -->
      <div class="space-y-2">
        <p class="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          Reason
        </p>
        <Textarea
          class="min-h-[120px] rounded-lg border-slate-200 focus-visible:ring-slate-400 text-sm"
          placeholder="Enter a brief reason for this status change…"
          bind:value={$newStatusReason}
        />
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
    >
      <Button
        variant="outline"
        class="h-10 rounded-lg border-slate-200 text-slate-700 hover:bg-white"
        on:click={() => {
          treatApplicationDialog = false;
          resetForm();
        }}
      >
        Cancel
      </Button>
      {#if selectedApplication?.currentStatus !== ApplicationStatuses.Publication}
        <Button
          disabled={!validateForm()}
          class="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
          on:click={() => (treatConfirmationDialog = true)}
        >
          Continue
          <Icon icon="mdi:arrow-right" class="ml-1.5" width="1em" />
        </Button>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={treatConfirmationDialog}>
  <Dialog.Content
    class="w-11/12 max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-white"
  >
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-slate-100">
      <Dialog.Header class="space-y-1">
        <Dialog.Title
          class="text-lg font-semibold text-slate-900 tracking-tight"
        >
          Confirm Status Change
        </Dialog.Title>
        <Dialog.Description class="text-xs text-slate-500">
          This action will update the application status.
        </Dialog.Description>
      </Dialog.Header>
    </div>

    <!-- Body -->
    <div class="px-6 py-5">
      <div
        class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
      >
        <div
          class="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0"
        >
          <Icon
            icon="mdi:swap-horizontal"
            width="1.25rem"
            class="text-slate-600"
          />
        </div>
        <div class="flex-1 min-w-0 space-y-1.5">
          <p class="text-sm text-slate-700">Update the status to:</p>
          {#if selectedStatus !== null}
            <AppStatusTag value={selectedStatus} />
          {/if}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
    >
      <Button
        variant="outline"
        class="h-10 rounded-lg border-slate-200 text-slate-700 hover:bg-white"
        on:click={() => (treatConfirmationDialog = false)}
      >
        Cancel
      </Button>
      <Button
        disabled={isSaving}
        class="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
        on:click={() => saveNewStatus()}
      >
        {#if isSaving}
          <Icon
            icon="line-md:loading-twotone-loop"
            width="1.1em"
            height="1.1em"
            class="mr-1.5"
          />
          Saving…
        {:else}
          <Icon icon="mdi:check" class="mr-1.5" width="1em" />
          Confirm
        {/if}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
<div class="flex flex-col h-screen">
  {#if isDataLoading}
    <div class="w-full h-full flex">
      <Icon
        class="mx-auto my-auto"
        icon="line-md:loading-twotone-loop"
        width="1.2rem"
        height="1.2rem"
      />
    </div>
  {:else}
    <div class="basis-11/12 overflow-y-auto">
      <slot />
    </div>
    <div class="flex justify-between p-4 basis-1/12">
      <Button on:click={() => gotoPrevious()}>Previous</Button>
      {#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Staff, UserRoles.Tech, UserRoles.SuperAdmin].includes(x), )}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button>Treat Applications</Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {#if canTreat}
              <DropdownMenu.Item
                on:click={() =>
                  treatApplication(fileData.applicationHistory[0])}
                >Treat New Application</DropdownMenu.Item
              >
            {/if}
            {#each renewalApplications as renewal, i}
              {#if canTreatRenewal(renewal)}
                <DropdownMenu.Item on:click={() => treatApplication(renewal)}
                  >Treat Renewal Application {i + 1}</DropdownMenu.Item
                >
              {/if}
            {/each}
            <!-- {#each applications as app, i}
              <DropdownMenu.Item on:click={() => treatApplication(app)}
                >Change Status</DropdownMenu.Item
              >
            {/each} -->
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}

      {#if $loggedInUser?.userRoles?.includes(UserRoles.Tech) && fileData.type === FilingType.Design}
        <Button
          class={canUpdate ? "block" : "hidden"}
          on:click={() => updateApplication()}
        >
          Update Record
        </Button>
      {/if}
      <Button on:click={() => gotoNext()}>Next</Button>
    </div>
  {/if}
</div>
