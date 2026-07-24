<script lang="ts">
  import Icon from "@iconify/svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { onMount } from "svelte";
  import { currentMenuView, loggedInUser, loggedInToken } from "$lib/store";
  import {
    baseURL,
    decodeUser,
    type NotificationsType,
    UserRoles,
    FileTypes,
    TicketCategory,
    TicketStates,
  } from "$lib/helpers";
  import { goto } from "$app/navigation";
  import { writable } from "svelte/store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select/index.js";
  import dayjs from "dayjs";
  import quarterOfYear from "dayjs/plugin/quarterOfYear";
  import { User } from "lucide-svelte";
  dayjs.extend(quarterOfYear);

  let notifications = writable<NotificationsType | null>(null);
  let notificationsLoading = false;
  let activeMenu: string | null = null;
  let activeSubmenu: string | null = null;
  let claimRequestsCount = 0;
  let oppsCount = 0;
  let ipoSupportCount = 0;
  let showSystemNotifications = false;
  // Journal modal state
  let showJournalModal: boolean = false;
  let journalCurrentYear: number = dayjs().year();
  let journalIsFetching: boolean = false;
  let journalSelectedType: undefined | string = "Trademark";
  let journalSelectedYear: number;
  let journalSelectedQuarter: number;
  let journalAllYears: number[] = Array(journalCurrentYear + 1 - 2020)
    .fill(0)
    .map((_, i) => 2020 + i);
  let journalQuarters = [1, 2, 3, 4];
  $: freePublication =
    $loggedInUser?.userRoles?.some((role) =>
      [
        UserRoles.SuperAdmin,
        UserRoles.Tech,
        UserRoles.HeadOfUnit,
        UserRoles.TrademarkRegistrar,
      ].includes(role),
    ) ?? false;

  async function fetchJournalData() {
    if (!journalSelectedQuarter || !journalSelectedYear) {
      return;
    }
    const startDate = dayjs(journalSelectedYear.toString())
      .set("date", 1)
      .quarter(journalSelectedQuarter)
      .format()
      .split("T")[0];
    const endDate = dayjs(journalSelectedYear.toString())
      .set("date", 1)
      .quarter(journalSelectedQuarter + 1)
      .format()
      .split("T")[0];

    journalIsFetching = true;
    try {
      const queryResult = await fetch(
        `${baseURL}/api/publication/GetPublication?start=${startDate}&end=${endDate}&type=${FileTypes.Trademark}`,
      );
      if (queryResult.ok) {
        const dataBlob = await queryResult.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(dataBlob);
        link.download = "journal.pdf";
        link.click();
      } else {
        console.error(
          "Failed to fetch publication",
          queryResult.status,
          await queryResult.text(),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      journalIsFetching = false;
    }
  }

  function handleJournalYearChange(selectin: any) {
    journalSelectedYear = Number(selectin?.value);
  }
  function handleJournalQuarterChange(selectin: any) {
    journalSelectedQuarter = Number(selectin?.value);
  }
  function handleJournalTypeChange(selectin: any) {
    journalSelectedType = selectin?.value as string;
  }

  let systemNotification = {
    type: "info",
    title: "New Features",
    message: [
      "Claim File",
      "Patent Renewal",
      "Update Patent/Design Attachments",
      "File Appeal",
      "Certificate Authentication using QR code",
    ],
    priority: "feature",
    isActive: false,
  };

  type MenuItem = {
    icon: string;
    location: string;
    name?: string;
    roles?: UserRoles[]; // undefined = visible to everyone
    hiddenForRoles?: UserRoles[];
    submenus?: MenuItem[];
  };

  let menus: MenuItem[] = [
    {
      icon: "radix-icons:dashboard",
      location: "Dashboard",
      hiddenForRoles: [UserRoles.TrademarkSupport, UserRoles.PatentDesignSupport],
    },
    {
      icon: "mdi:file-document-multiple-outline",
      location: "Publications",
      name: "Publications",
      roles: [
        UserRoles.SuperAdmin,
        UserRoles.HeadOfUnit,
        UserRoles.User,
        UserRoles.Staff,
      ],
      submenus: [
        {
          icon: "mdi:book-open-page-variant",
          name: "Journal",
          location: "journal",
          roles: [
            UserRoles.HeadOfUnit,
            UserRoles.PermSec,
            UserRoles.Minister,
            UserRoles.Tech,
            UserRoles.SuperAdmin,
            UserRoles.TrademarkRegistrar,
            UserRoles.User,
          ],
        },
        {
          icon: "mdi:file-document-multiple-outline",
          name: "Publications",
          location: "trademarkpubs",
        },
      ],
    },
    {
      icon: "mdi:book-open-variant",
      location: "Resources",
      roles: [UserRoles.User, UserRoles.Tech, UserRoles.SuperAdmin],
    },
    {
      icon: "mdi:headset",
      location: "iposupport",
      name: "IPO Support",
      roles: [
        UserRoles.User,
        UserRoles.Tech,
        UserRoles.SuperAdmin,
        UserRoles.TrademarkSupport,
        UserRoles.PatentDesignSupport,
        UserRoles.TrademarkSearch,
        UserRoles.TrademarkExaminer,
        UserRoles.TrademarkOpposition,
        UserRoles.TrademarkAcceptance,
        UserRoles.TrademarkCertification,
        UserRoles.TrademarkPublication,
        UserRoles.TrademarkRegistrar,
        UserRoles.PatentSearch,
        UserRoles.PatentExaminer,
        UserRoles.PatentCertification,
        UserRoles.AppealExaminer,
        UserRoles.DesignSearch,
        UserRoles.DesignExaminer,
        UserRoles.DesignCertification,
        UserRoles.TrademarkStaff,
        UserRoles.PatentStaff,
        UserRoles.DesignStaff,
      ],
    },
    {
      icon: "mdi:gavel",
      location: "Opposition",
      roles: [
        UserRoles.SuperAdmin,
        UserRoles.TrademarkOpposition,
        UserRoles.Tech,
      ],
    },
    {
      icon: "mdi:chart-bar",
      location: "statistics",
      name: "Statistics",
      roles: [
        UserRoles.SuperAdmin,
        UserRoles.PermSec,
        UserRoles.Minister,
        UserRoles.Tech,
        UserRoles.Finance,
        UserRoles.TrademarkRegistrar,
        UserRoles.PatentDesignRegistrar,
        UserRoles.EinaoFinance,
      ],
    },
    {
      icon: "mdi:account-group-outline",
      location: "Users",
      roles: [UserRoles.Tech, UserRoles.SuperAdmin],
    },
    {
      icon: "mdi:account-circle-outline",
      name: "Profile",
      location: "profile",
    },
    {
      icon: "mdi:shield-crown-outline",
      name: "Super Admin",
      location: "admin",
      roles: [UserRoles.SuperAdmin, UserRoles.Tech],
    },
    {
      icon: "mdi:file-plus",
      name: "Claim Requests",
      location: "ClaimRequests",
      roles: [UserRoles.SuperAdmin, UserRoles.Tech],
    },
  ];

  function hasAccess(item: MenuItem, userRoles: UserRoles[]): boolean {
    const isHidden = item.hiddenForRoles?.some((r) => userRoles.includes(r)) ?? false;
    return !isHidden && (!item.roles || item.roles.some((r) => userRoles.includes(r)));
  }

  function filterMenus(items: MenuItem[], userRoles: UserRoles[]): MenuItem[] {
    return items
      .filter((m) => hasAccess(m, userRoles))
      .map((m) =>
        m.submenus ? { ...m, submenus: filterMenus(m.submenus, userRoles) } : m,
      );
  }

  onMount(async () => {
    await decodeUser();
    loadNotifications();
    loadClaimRequestsCount();
    loadOppositionsCount();
    loadIpoSupportCount();
    if ($loggedInUser) {
      menus = filterMenus(menus, $loggedInUser.userRoles);
    }

    // Set initial active menu based on current route
    const path = window.location.pathname.toLowerCase();
    let currentLocation = path.split("/").pop();

    // Handle special cases for routing
    if (
      !currentLocation ||
      currentLocation === "" ||
      currentLocation === "home"
    ) {
      currentLocation = "dashboard";
    }

    // Find matching menu item (case-insensitive)
    const menuMatch = menus.find(
      (m) => m.location.toLowerCase() === currentLocation,
    );

    if (menuMatch) {
      activeMenu = menuMatch.location;
    } else {
      // Fallback: if no match found, default to Dashboard
      activeMenu = "Dashboard";
    }
  });

  function toggleSubmenu(menuLocation: string) {
    activeMenu = activeMenu === menuLocation ? null : menuLocation;
  }

  function handleMenuClick(menu: any, submenu: any = null) {
    currentMenuView.set(submenu?.name || menu.location);
    if (submenu) {
      // Open journal modal instead of navigating
      if (submenu.location === "journal") {
        showJournalModal = true;
        return;
      }
      activeSubmenu = submenu.name;
      goto(`/home/${submenu.location.toLowerCase()}`);
    } else if (!menu.submenus) {
      activeMenu = menu.location;
      activeSubmenu = null;
      // Route Statistics to /statistics instead of /home/statistics
      if (menu.location.toLowerCase() === "statistics") {
        goto(`/statistics`);
      } else {
        goto(`/home/${menu.location.trim().toLowerCase()}`);
      }
    }
  }

  async function loadNotifications() {
    if ($loggedInUser === null) return;
    notificationsLoading = true;

    let showSupportTickets = $loggedInUser.userRoles?.some((role) =>
      [
        UserRoles.Tech,
        UserRoles.SuperAdmin,
        UserRoles.TrademarkSupport,
        UserRoles.PatentDesignSupport,
      ].includes(role),
    );
    let showAllOpposition = $loggedInUser.userRoles?.some((role) =>
      [
        UserRoles.TrademarkOpposition,
        UserRoles.Tech,
        UserRoles.SuperAdmin,
      ].includes(role),
    );

    let url = `${baseURL}/api/files/UserNotifications?userId=${$loggedInUser.creatorId}`;
    if (showSupportTickets) url += `&staffTickets=true`;
    if (showAllOpposition) url += `&showAllOpposition=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${$loggedInToken}`,
      },
    });
    if (response.ok) notifications.set(await response.json());
    notificationsLoading = false;
  }

  function toggleSystemNotifications() {
    showSystemNotifications = !showSystemNotifications;
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "update":
        return "mdi:update";
      case "warning":
        return "mdi:alert-circle";
      case "info":
        return "mdi:information";
      case "success":
        return "mdi:check-circle";
      default:
        return "mdi:bell";
    }
  }
  async function loadClaimRequestsCount() {
    try {
      const response = await fetch(
        `${baseURL}/api/migration/GetAllClaimRequests`,
        {
          headers: {
            Authorization: `Bearer ${$loggedInToken}`,
          },
        },
      );
      if (response.ok) {
        const claims = await response.json();
        claimRequestsCount = claims.length;
      }
    } catch (error) {
      console.error("Error fetching claim requests count:", error);
    }
  }
  async function loadIpoSupportCount() {
    try {
      const roles = $loggedInUser?.userRoles ?? [];
      let url: string;
      if (roles.includes(UserRoles.TrademarkSupport)) {
        url = `${baseURL}/api/tickets/GetStats?category=0`;
      } else if (roles.includes(UserRoles.PatentDesignSupport)) {
        url = `${baseURL}/api/tickets/GetStats?category=1`;
      } else if (roles.includes(UserRoles.Tech) || roles.includes(UserRoles.SuperAdmin)) {
        const response = await fetch(`${baseURL}/api/tickets/TicketSummaries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId: "null",
            category: TicketCategory.TechnicalSupport,
            status: TicketStates.awaitingStaff,
            amount: 100000,
            startIndex: 0,
          }),
        });
        if (response.ok) {
          const tickets = await response.json();
          ipoSupportCount = Array.isArray(tickets) ? tickets.length : 0;
        }
        return;
      } else {
        const userId = ($loggedInUser as any)?.creatorId;
        url = `${baseURL}/api/tickets/GetStats?userId=${userId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const isStaff = roles.includes(UserRoles.Tech) ||
          roles.includes(UserRoles.TrademarkSupport) ||
          roles.includes(UserRoles.PatentDesignSupport) ||
          roles.includes(UserRoles.SuperAdmin);
        ipoSupportCount = isStaff ? (data?.staff ?? 0) : (data?.user ?? 0);
      }
    } catch {
      ipoSupportCount = 0;
    }
  }

  async function loadOppositionsCount() {
    try {
      const response = await fetch(`${baseURL}/api/opposition/count`);
      if (response.ok) {
        const opps = await response.text();
        oppsCount = Number(opps);
      }
    } catch (error) {
      console.error("Error fetching oppositions count:", error);
    }
  }
  function getNotificationColors(priority: string) {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white border-red-600";
      case "medium":
        return "bg-orange-500 text-white border-orange-600";
      case "low":
        return "bg-blue-500 text-white border-blue-600";
      case "feature":
        return "bg-green-800 text-white border-green-800";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  }
</script>

<div
  class="w-64 h-full bg-white shadow-xl flex flex-col border-r border-slate-200/60"
>
  <!-- Menu items -->
  <div class="flex-1 overflow-y-auto pt-6 pb-2">
    {#each menus as menu}
      <div class="mb-1">
        <button
          class="w-full text-left px-2 focus:outline-none"
          on:click={() =>
            menu.submenus
              ? toggleSubmenu(menu.location)
              : handleMenuClick(menu)}
        >
          <div
            class={`flex items-center justify-between rounded-md py-2 px-3 ${activeMenu === menu.location ? "bg-green-800 text-white" : "hover:bg-gray-100"}`}
          >
            <div class="flex items-center space-x-3">
              <Icon
                icon={menu.icon}
                class={`text-xl ${activeMenu === menu.location ? "text-white" : "text-slate-500"}`}
              />
              <span
                class={`text-base ${activeMenu === menu.location ? "text-white" : "text-slate-600"}`}
                >{menu.name ?? menu.location}</span
              >
            </div>
            <div class="flex items-center">
              {#if menu.location === "Support" && !notificationsLoading}
                <span
                  class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2"
                >
                  {$notifications?.support ?? 0}
                </span>
              {/if}
              {#if menu.location === "Opposition" && !notificationsLoading}
                <span
                  class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2"
                >
                  {oppsCount}
                </span>
              {/if}
              {#if menu.location === 'ClaimRequests' && claimRequestsCount > 0}
                <span
                  class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2"
                >
                  {claimRequestsCount}
                </span>
              {/if}
              {#if menu.location === 'iposupport'}
                <span
                  class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2"
                >
                  {ipoSupportCount}
                </span>
              {/if}
              {#if menu.submenus}
                <Icon
                  icon="heroicons:chevron-down"
                  class={`transition-transform duration-200 ${activeMenu === menu.location ? "rotate-180 text-white" : "text-slate-400"}`}
                  width="16"
                />
              {/if}
            </div>
          </div>
        </button>
        {#if menu.submenus && activeMenu === menu.location}
          <div class="ml-10 mt-1 space-y-1">
            {#each menu.submenus as submenu}
              <button
                class="w-full text-left flex items-center space-x-2 py-2 px-3 rounded-md text-base {activeSubmenu ===
                submenu.name
                  ? 'font-medium text-[#287F71] bg-gray-50'
                  : 'text-slate-600 hover:bg-gray-50'}"
                on:click={() => handleMenuClick(menu, submenu)}
              >
                {#if submenu.icon}
                  <Icon icon={submenu.icon} class="text-lg text-slate-500" />
                {/if}
                <span>{submenu.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- System notification -->
  {#if systemNotification.isActive}
    <div class="p-3 mx-3 mb-4">
      <div
        class={`rounded-xl border shadow-lg ${getNotificationColors(systemNotification.priority)} backdrop-blur-sm`}
      >
        <div
          class="flex items-center justify-between p-3 border-b border-white/20"
        >
          <div class="flex items-center space-x-2">
            <div class="p-1 bg-white/20 rounded-md">
              <Icon
                icon={getNotificationIcon(systemNotification.type)}
                class="text-base flex-shrink-0"
              />
            </div>
            <span class="font-semibold text-sm">{systemNotification.title}</span
            >
          </div>
          <button
            class="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-md"
            on:click={toggleSystemNotifications}
          >
            <Icon
              icon={showSystemNotifications
                ? "heroicons:chevron-up"
                : "heroicons:chevron-down"}
              width="14"
            />
          </button>
        </div>
        {#if showSystemNotifications}
          <div class="p-3">
            <ul class="space-y-1 text-sm text-white/90 leading-relaxed">
              {#each systemNotification.message as line}
                <li class="flex items-start space-x-2">
                  <span class="text-white/60 mt-1.5">•</span>
                  <span>{line}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer logo -->
  <div class="p-4 border-t border-slate-200/60 flex justify-center bg-white">
    <div class="transition-opacity">
      <img src="/einao.png" alt="einao logo" class="h-10 w-auto" />
    </div>
  </div>
</div>

<!-- Journal Modal -->
<Dialog.Root bind:open={showJournalModal}>
  <Dialog.Content class="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
    <div class="bg-white rounded-2xl border border-gray-200 p-8">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="bg-green-100 p-3 rounded-xl">
          <Icon
            icon="mdi:book-open-page-variant"
            class="w-6 h-6 text-green-700"
            width="24"
            height="24"
          />
        </div>
        <h3 class="text-xl font-bold text-gray-800">Download Journal</h3>
      </div>

      <!-- Year -->
      <label
        for="journal-year"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Year
      </label>
      <div class="relative mb-5">
        <Select.Root onSelectedChange={handleJournalYearChange}>
          <Select.Trigger
            id="journal-year"
            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent cursor-pointer h-auto"
          >
            <Select.Value placeholder="-- Choose a year --" />
          </Select.Trigger>
          <Select.Content class="max-h-60 overflow-y-auto">
            <Select.Group>
              <Select.Label>Years</Select.Label>
              {#each journalAllYears as year}
                <Select.Item value={year} label={year.toString()}
                  >{year}</Select.Item
                >
              {/each}
            </Select.Group>
          </Select.Content>
          <Select.Input
            name="journalSelectedYear"
            bind:value={journalSelectedYear}
          />
        </Select.Root>
      </div>

      <!-- Quarter -->
      <label
        for="journal-quarter"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Quarter
      </label>
      <div class="relative mb-5">
        <Select.Root onSelectedChange={handleJournalQuarterChange}>
          <Select.Trigger
            id="journal-quarter"
            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent cursor-pointer h-auto"
          >
            <Select.Value placeholder="-- Choose a quarter --" />
          </Select.Trigger>
          <Select.Content class="max-h-60 overflow-y-auto">
            <Select.Group>
              <Select.Label>Quarters</Select.Label>
              {#each journalQuarters as quarter}
                <Select.Item value={quarter} label={`Q${quarter}`}
                  >{`Q${quarter}`}</Select.Item
                >
              {/each}
            </Select.Group>
          </Select.Content>
          <Select.Input
            name="journalSelectedQuarter"
            bind:value={journalSelectedQuarter}
          />
        </Select.Root>
      </div>

      {#if journalSelectedYear && journalSelectedQuarter}
        <div class="space-y-4">
          {#if freePublication}
            <div
              class="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4"
            >
              <Icon
                icon="mdi:book-open-page-variant"
                class="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0"
                width="20"
                height="20"
              />
              <p class="text-sm text-gray-700 leading-relaxed">
                Download the {journalSelectedType} Journal for Q{journalSelectedQuarter}
                {journalSelectedYear}.
              </p>
            </div>
            <button
              type="button"
              on:click={fetchJournalData}
              disabled={journalIsFetching}
              class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200"
            >
              {#if journalIsFetching}
                <Icon icon="line-md:loading-loop" width="18" height="18" />
              {:else}
                <Icon icon="mdi:download" width="18" height="18" />
              {/if}
              {journalIsFetching ? "Fetching..." : "Download Journal"}
            </button>
          {:else}
            <button
              type="button"
              on:click={fetchJournalData}
              disabled={true}
              class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200"
            >
              Pay
            </button>
            <div
              class="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4"
            >
              <Icon
                icon="mdi:alert"
                class="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                width="20"
                height="20"
              />
              <p class="text-sm text-yellow-800 leading-relaxed">
                This journal is not yet available for download.
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-center py-4 text-sm text-gray-400">
          Select year and quarter above to download the journal.
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
