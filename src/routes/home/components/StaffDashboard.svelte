<script lang="ts">
  import {
    appattachmentsData,
    DashStats,
    loggedInUser,
    loggedInToken,
    newApplicationType,
  } from "$lib/store";
  import { DataMapper, FileStatsData, mapTypeToString } from "./dashboardutils";
  import * as Accordion from "$lib/components/ui/accordion";
  import {
    baseURL,
    type DashBoardStats,
    type FileStatsType,
    FileTypes,
    FilingType,
    type PatentData,
    UserRoles,
    type UsersType,
    UserTypes,
    FormApplicationTypes,
  } from "$lib/helpers";
  import {
    getRoleDisplayInfo,
    getUserPrimaryFileType,
  } from "./rolePermissions";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import { FetchData } from "../../application/apphelper";
  import { Input } from "$lib/components/ui/input";
  import { goto } from "$app/navigation";
  import * as Card from "$lib/components/ui/card";
  import * as Dialog from "$lib/components/ui/dialog";
  import { User } from "lucide-svelte";
  import ministry from "$lib/assets/cld.png";

  let isLoading: boolean = true;
  export let user: UsersType;
  let isStaff: boolean = true;

  onMount(async () => {
    if ($DashStats === null) {
      isLoading = true;
      await loadDashStats();
    } else {
      isLoading = false;
    }
  });

  async function loadDashStats() {
    const userId = user.creatorId;
    const showId = true;
    const id = showId ? null : userId;
    const url = `${baseURL}/api/files/FileStatistics?userId=${id}`;
    const data = await fetch(url, {
      headers: {
        Authorization: `Bearer ${$loggedInToken}`,
      },
    });
    if (data.ok) {
      const body = await data.json();
      const values = body as DashBoardStats[];
      DashStats.set(values[0]);
      isLoading = false;
    }
  }

  function isPatentRelated() {
    return user.userRoles?.some((x) =>
      [
        UserRoles.PatentSearch,
        UserRoles.PatentExaminer,
        UserRoles.PatentCertification,
        UserRoles.PatentDesignRegistrar,
        UserRoles.ActingPatentDesignRegistrar,
        UserRoles.PermSec,
        UserRoles.Minister,
        UserRoles.Tech,
        UserRoles.SuperAdmin,
        UserRoles.PatentStaff,
      ].includes(x),
    );
  }

  function isDesignRelated() {
    return user.userRoles?.some((x) =>
      [
        UserRoles.DesignSearch,
        UserRoles.DesignExaminer,
        UserRoles.DesignCertification,
        UserRoles.PatentDesignRegistrar,
        UserRoles.ActingPatentDesignRegistrar,
        UserRoles.Tech,
        UserRoles.Minister,
        UserRoles.PermSec,
        UserRoles.SuperAdmin,
        UserRoles.DesignStaff,
      ].includes(x),
    );
  }

  function isTradeMarkRelated() {
    return user.userRoles?.some((x) =>
      [
        UserRoles.TrademarkSearch,
        UserRoles.TrademarkExaminer,
        UserRoles.TrademarkOpposition,
        UserRoles.TrademarkAcceptance,
        UserRoles.AppealExaminer,
        UserRoles.TrademarkCertification,
        UserRoles.TrademarkRegistrar,
        UserRoles.ActingTrademarkRegistrar,
        UserRoles.PermSec,
        UserRoles.Minister,
        UserRoles.Tech,
        UserRoles.SuperAdmin,
        UserRoles.TrademarkStaff,
      ].includes(x),
    );
  }

  function getApplicationTypeIcon(appType: number) {
    const uniformBgColor = "from-green-100 via-green-50 to-emerald-50";
    const uniformColor = "text-green-800";
    switch (appType) {
      case 0:
        return { svg: "", color: uniformColor, bgColor: uniformBgColor };
      case 1:
        return { svg: "", color: uniformColor, bgColor: uniformBgColor };
      case 2:
        return { svg: "", color: uniformColor, bgColor: uniformBgColor };
      default:
        return { svg: "", color: uniformColor, bgColor: uniformBgColor };
    }
  }

  function getSimpleIcon(type: number): string {
    switch (type) {
      case 0:
        return "+";
      case 1:
        return "↻";
      case 2:
        return "✎";
      case 3:
        return "◐";
      case 4:
        return "□";
      case 5:
        return "↔";
      case 6:
        return "⚷";
      case 7:
        return "⚇";
      case 8:
        return "⧉";
      case 9:
        return "◈";
      case 10:
        return "⌖";
      case 11:
        return "◈";
      case 12:
        return "⚲";
      case 13:
        return "◆";
      case 14:
        return "◉";
      case 15:
        return "⊖";
      case 16:
        return "⚔";
      case 17:
        return "◎";
      case 18:
        return "✓";
      case 19:
        return "ℓ";
      case 20:
        return "♖";
      case 21:
        return "📄";
      default:
        return "◯";
    }
  }

  function getType(fileType: FileTypes) {
    const val =
      $DashStats?.detailedStats?.filter((x) => x.fileType === fileType) ?? [];
    val.sort((a, v) =>
      a.status > v.status ? 1 : a.status < v.status ? -1 : 0,
    );
    const grouped = val.reduce(
      (acc: Record<string, typeof val>, curr) => {
        const type = curr.type?.toString() || "0";
        acc[type] = (acc[type] || []).concat(curr);
        return acc;
      },
      {} as Record<string, typeof val>,
    );
    return Object.entries(grouped).map(([type, items]) => ({ type, items }));
  }

  function getRoleInfo() {
    const roles = user.userRoles || [];
    const ipRoles = [
      UserRoles.TrademarkSearch,
      UserRoles.TrademarkExaminer,
      UserRoles.TrademarkPublication,
      UserRoles.TrademarkOpposition,
      UserRoles.TrademarkAcceptance,
      UserRoles.TrademarkCertification,
      UserRoles.TrademarkRegistrar,
      UserRoles.ActingTrademarkRegistrar,
      UserRoles.PatentSearch,
      UserRoles.PatentExaminer,
      UserRoles.PatentCertification,
      UserRoles.PatentDesignRegistrar,
      UserRoles.ActingPatentDesignRegistrar,
      UserRoles.DesignSearch,
      UserRoles.DesignExaminer,
      UserRoles.DesignCertification,
      UserRoles.DesignStaff,
      UserRoles.PermSec,
      UserRoles.Minister,
      UserRoles.Finance,
      UserRoles.Tech,
      UserRoles.SuperAdmin,
    ];
    const primaryRole =
      roles.find((role) => ipRoles.includes(role)) ||
      roles[0] ||
      UserRoles.Staff;
    return getRoleDisplayInfo(primaryRole);
  }

  function getRegistryHubTitle() {
    const primaryFileType = getUserPrimaryFileType(user.userRoles || []);
    switch (primaryFileType) {
      case FileTypes.Trademark:
        return "Trademark Registry Hub";
      case FileTypes.Patent:
        return "Patent Registry Hub";
      case FileTypes.Design:
        return "Design Registry Hub";
      default:
        return "IP Registry Hub";
    }
  }
</script>

{#if isLoading}
  <Icon
    class="flex items-center justify-center w-full"
    icon="eos-icons:loading"
    width="1.6rem"
    height="1.6rem"
  />
{:else}
  <!-- Professional Header -->
  <div
    class="bg-white rounded-xl p-5 mb-8 border border-green-200/40 shadow-lg hover:shadow-xl transition-all duration-300 sticky top-0 z-10"
  >
    <div class="flex items-center justify-between space-x-6">
      <div class="flex-shrink-0">
        <img
          src={ministry}
          alt="Ministry Logo"
          class="h-16 w-16 md:h-20 md:w-20 object-contain hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div class="text-center flex-1">
        <h1
          class="text-xl md:text-2xl lg:text-3xl font-bold text-green-800 mb-1 leading-tight"
        >
          Intellectual Property Office Nigeria
        </h1>
        <p
          class="text-green-800 font-semibold text-xs md:text-sm tracking-wide mb-2"
        >
          Commercial Law Department
        </p>
        <h2 class="text-lg md:text-xl font-bold text-gray-700">
          {getRoleInfo().title}
        </h2>
        <p class="text-green-800 text-xs md:text-sm">
          Manage {getRoleInfo().title} Applications
        </p>
      </div>
      <div class="flex-shrink-0">
        {#if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Trademark}
          <div
            class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105"
          >
            <Icon
              icon="mdi:scale-balance"
              class="w-12 h-12 md:w-16 md:h-16 text-green-800"
            />
          </div>
        {:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Patent}
          <div
            class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105"
          >
            <Icon
              icon="mdi:lightbulb-outline"
              class="w-12 h-12 md:w-16 md:h-16 text-green-800"
            />
          </div>
        {:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Design}
          <div
            class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105"
          >
            <Icon
              icon="mdi:palette-outline"
              class="w-12 h-12 md:w-16 md:h-16 text-green-800"
            />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- ==================== TRADEMARK REGISTRY HUB ==================== -->
  <div class={isTradeMarkRelated() ? "" : "hidden"}>
    <div class="space-y-4">
      <Accordion.Root class="space-y-3">
        {#each getType(FileTypes.Trademark) as item}
          {@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
          <Accordion.Item
            value="tm-{item.type}"
            class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60"
          >
            <Accordion.Trigger
              class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
            >
              <div class="flex items-center justify-between w-full px-3 py-2">
                <div class="flex items-center space-x-3 flex-1">
                  <div
                    class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100"
                  >
                    <div
                      class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center"
                    >
                      {getSimpleIcon(parseInt(item.type))}
                    </div>
                  </div>
                  <div class="flex-1 text-left">
                    <div class="flex items-center gap-2 mb-0.5">
                      <h4
                        class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                      >
                        {mapTypeToString(parseInt(item.type))}
                      </h4>
                      <span
                        class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                        >{item.items.length}</span
                      >
                    </div>
                    <p class="text-xs text-gray-500 font-medium">
                      {item.items.length} status{item.items.length !== 1
                        ? "es"
                        : ""} available
                    </p>
                  </div>
                </div>
                <div class="flex-shrink-0 ml-2">
                  <svg
                    class="w-5 h-5 text-green-800 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </Accordion.Trigger>
            <Accordion.Content>
              <div class="px-4 pb-3 space-y-1.5">
                {#if item.items && item.items.length > 0}
                  {#each item.items as appInfo}
                    <a
                      href="/files?fileType=2&appType={parseInt(
                        item.type,
                      )}&status={appInfo.status}&titleType=custom"
                      class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
                      style="text-decoration: none;"
                    >
                      <AppStatusTag value={appInfo.status} />
                      <span class="font-semibold text-gray-700"
                        >{appInfo.count}</span
                      >
                    </a>
                  {/each}
                {:else}
                  <p class="text-gray-500 text-sm py-2">No data available</p>
                {/if}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    </div>
  </div>

  <!-- ==================== PATENT REGISTRY HUB ==================== -->
  <div class="{isPatentRelated() ? '' : 'hidden'} mt-3">
    {#if isPatentRelated() && isDesignRelated()}
      <!-- PatentDesignRegistrar / SuperAdmin / Tech — wrap in outer accordion -->
      <Accordion.Root class="space-y-3 mb-3">
        <Accordion.Item
          value="patent-hub"
          class="border border-green-200/60 rounded-xl bg-gradient-to-r from-white via-green-50/30 to-white hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:border-green-300/60"
        >
          <Accordion.Trigger
            class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
          >
            <div class="flex items-center justify-between w-full px-3 py-2">
              <div class="flex items-center space-x-3 flex-1">
                <div
                  class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shadow-sm border border-green-200"
                >
                  <Icon
                    icon="mdi:lightbulb-outline"
                    class="w-6 h-6 text-green-800"
                  />
                </div>
                <div class="flex-1 text-left">
                  <h3
                    class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                  >
                    Patent Registry Hub
                  </h3>
                  <p class="text-xs text-gray-500">
                    Click to view patent application types and statuses
                  </p>
                </div>
              </div>
            </div>
          </Accordion.Trigger>
          <Accordion.Content>
            <div class="px-4 pb-4 space-y-3">
              <Accordion.Root class="space-y-3">
                {#each getType(FileTypes.Patent) as item}
                  {@const iconInfo = getApplicationTypeIcon(
                    parseInt(item.type),
                  )}
                  <Accordion.Item
                    value="patent-{item.type}"
                    class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60"
                  >
                    <Accordion.Trigger
                      class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
                    >
                      <div
                        class="flex items-center justify-between w-full px-3 py-2"
                      >
                        <div class="flex items-center space-x-3 flex-1">
                          <div
                            class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100"
                          >
                            <div
                              class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center"
                            >
                              {getSimpleIcon(parseInt(item.type))}
                            </div>
                          </div>
                          <div class="flex-1 text-left">
                            <div class="flex items-center gap-2 mb-0.5">
                              <h4
                                class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                              >
                                {mapTypeToString(parseInt(item.type))}
                              </h4>
                              <span
                                class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                                >{item.items.length}</span
                              >
                            </div>
                            <p class="text-xs text-gray-500 font-medium">
                              {item.items.length} status{item.items.length !== 1
                                ? "es"
                                : ""} available
                            </p>
                          </div>
                        </div>
                      </div>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div class="px-4 pb-3 space-y-1.5">
                        {#if item.items && item.items.length > 0}
                          {#each item.items as appInfo}
                            <a
                              href="/files?fileType=0&appType={parseInt(
                                item.type,
                              )}&status={appInfo.status}&titleType=custom"
                              class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
                              style="text-decoration: none;"
                            >
                              <AppStatusTag value={appInfo.status} />
                              <span class="font-semibold text-gray-700"
                                >{appInfo.count}</span
                              >
                            </a>
                          {/each}
                        {:else}
                          <p class="text-gray-500 text-sm py-2">
                            No data available
                          </p>
                        {/if}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                {/each}
              </Accordion.Root>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    {:else}
      <!-- Single patent role — show directly without outer wrapper -->
      <div class="space-y-4">
        <Accordion.Root class="space-y-3">
          {#each getType(FileTypes.Patent) as item}
            {@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
            <Accordion.Item
              value="p-{item.type}"
              class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60"
            >
              <Accordion.Trigger
                class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
              >
                <div class="flex items-center justify-between w-full px-3 py-2">
                  <div class="flex items-center space-x-3 flex-1">
                    <div
                      class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100"
                    >
                      <div
                        class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center"
                      >
                        {getSimpleIcon(parseInt(item.type))}
                      </div>
                    </div>
                    <div class="flex-1 text-left">
                      <div class="flex items-center gap-2 mb-0.5">
                        <h4
                          class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                        >
                          {mapTypeToString(parseInt(item.type))}
                        </h4>
                        <span
                          class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                          >{item.items.length}</span
                        >
                      </div>
                      <p class="text-xs text-gray-500 font-medium">
                        {item.items.length} status{item.items.length !== 1
                          ? "es"
                          : ""} available
                      </p>
                    </div>
                  </div>
                </div>
              </Accordion.Trigger>
              <Accordion.Content>
                <div class="px-4 pb-3 space-y-1.5">
                  {#if item.items && item.items.length > 0}
                    {#each item.items as appInfo}
                      <a
                        href="/files?fileType=0&appType={parseInt(
                          item.type,
                        )}&status={appInfo.status}&titleType=custom"
                        class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
                        style="text-decoration: none;"
                      >
                        <AppStatusTag value={appInfo.status} />
                        <span class="font-semibold text-gray-700"
                          >{appInfo.count}</span
                        >
                      </a>
                    {/each}
                  {:else}
                    <p class="text-gray-500 text-sm py-2">No data available</p>
                  {/if}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          {/each}
        </Accordion.Root>
      </div>
    {/if}
  </div>

  <!-- ==================== DESIGN REGISTRY HUB ==================== -->
  <div class="{isDesignRelated() ? '' : 'hidden'} mt-3">
    {#if isPatentRelated() && isDesignRelated()}
      <!-- PatentDesignRegistrar / SuperAdmin / Tech — wrap in outer accordion -->
      <Accordion.Root class="space-y-3 mb-3">
        <Accordion.Item
          value="design-hub"
          class="border border-green-200/60 rounded-xl bg-gradient-to-r from-white via-green-50/30 to-white hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:border-green-300/60"
        >
          <Accordion.Trigger
            class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
          >
            <div class="flex items-center justify-between w-full px-3 py-2">
              <div class="flex items-center space-x-3 flex-1">
                <div
                  class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shadow-sm border border-green-200"
                >
                  <Icon
                    icon="mdi:palette-outline"
                    class="w-6 h-6 text-green-800"
                  />
                </div>
                <div class="flex-1 text-left">
                  <h3
                    class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                  >
                    Design Registry Hub
                  </h3>
                  <p class="text-xs text-gray-500">
                    Click to view design application types and statuses
                  </p>
                </div>
              </div>
            </div>
          </Accordion.Trigger>
          <Accordion.Content>
            <div class="px-4 pb-4 space-y-3">
              <Accordion.Root class="space-y-3">
                {#each getType(FileTypes.Design) as item}
                  {@const iconInfo = getApplicationTypeIcon(
                    parseInt(item.type),
                  )}
                  <Accordion.Item
                    value="design-{item.type}"
                    class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60"
                  >
                    <Accordion.Trigger
                      class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
                    >
                      <div
                        class="flex items-center justify-between w-full px-3 py-2"
                      >
                        <div class="flex items-center space-x-3 flex-1">
                          <div
                            class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100"
                          >
                            <div
                              class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center"
                            >
                              {getSimpleIcon(parseInt(item.type))}
                            </div>
                          </div>
                          <div class="flex-1 text-left">
                            <div class="flex items-center gap-2 mb-0.5">
                              <h4
                                class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                              >
                                {mapTypeToString(parseInt(item.type))}
                              </h4>
                              <span
                                class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                                >{item.items.length}</span
                              >
                            </div>
                            <p class="text-xs text-gray-500 font-medium">
                              {item.items.length} status{item.items.length !== 1
                                ? "es"
                                : ""} available
                            </p>
                          </div>
                        </div>
                      </div>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div class="px-4 pb-3 space-y-1.5">
                        {#if item.items && item.items.length > 0}
                          {#each item.items as appInfo}
                            <a
                              href="/files?fileType=1&appType={parseInt(
                                item.type,
                              )}&status={appInfo.status}&titleType=custom"
                              class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
                              style="text-decoration: none;"
                            >
                              <AppStatusTag value={appInfo.status} />
                              <span class="font-semibold text-gray-700"
                                >{appInfo.count}</span
                              >
                            </a>
                          {/each}
                        {:else}
                          <p class="text-gray-500 text-sm py-2">
                            No data available
                          </p>
                        {/if}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                {/each}
              </Accordion.Root>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    {:else}
      <!-- Single design role — show directly without outer wrapper -->
      <div class="space-y-4">
        <Accordion.Root class="space-y-3">
          {#each getType(FileTypes.Design) as item}
            {@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
            <Accordion.Item
              value="d-{item.type}"
              class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60"
            >
              <Accordion.Trigger
                class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline"
              >
                <div class="flex items-center justify-between w-full px-3 py-2">
                  <div class="flex items-center space-x-3 flex-1">
                    <div
                      class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100"
                    >
                      <div
                        class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center"
                      >
                        {getSimpleIcon(parseInt(item.type))}
                      </div>
                    </div>
                    <div class="flex-1 text-left">
                      <div class="flex items-center gap-2 mb-0.5">
                        <h4
                          class="font-bold text-gray-800 text-sm uppercase tracking-wide"
                        >
                          {mapTypeToString(parseInt(item.type))}
                        </h4>
                        <span
                          class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                          >{item.items.length}</span
                        >
                      </div>
                      <p class="text-xs text-gray-500 font-medium">
                        {item.items.length} status{item.items.length !== 1
                          ? "es"
                          : ""} available
                      </p>
                    </div>
                  </div>
                </div>
              </Accordion.Trigger>
              <Accordion.Content>
                <div class="px-4 pb-3 space-y-1.5">
                  {#if item.items && item.items.length > 0}
                    {#each item.items as appInfo}
                      <a
                        href="/files?fileType=1&appType={parseInt(
                          item.type,
                        )}&status={appInfo.status}&titleType=custom"
                        class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
                        style="text-decoration: none;"
                      >
                        <AppStatusTag value={appInfo.status} />
                        <span class="font-semibold text-gray-700"
                          >{appInfo.count}</span
                        >
                      </a>
                    {/each}
                  {:else}
                    <p class="text-gray-500 text-sm py-2">No data available</p>
                  {/if}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          {/each}
        </Accordion.Root>
      </div>
    {/if}
  </div>
{/if}
