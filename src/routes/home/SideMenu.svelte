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
  } from "$lib/helpers";
  import { goto } from "$app/navigation";
  import { writable } from "svelte/store";

  let notifications = writable<NotificationsType | null>(null);
  let notificationsLoading = false;
  let activeMenu: string | null = null;
  let activeSubmenu: string | null = null;
  let claimRequestsCount = 0;
  let oppsCount = 0;
  let showSystemNotifications = false;
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

  let menus = [
    { icon: "radix-icons:dashboard", location: "Dashboard" },
    { icon: "mdi:file-document-multiple-outline", location: "Publications" },
    { icon: "mdi:book-open-variant", location: "Resources" },
    { icon: "mdi:help-circle-outline", location: "Support" },
    // { icon: 'cil:search', location: 'Opposition' },
    { icon: "mdi:chart-line", location: "Finance" },
    { icon: "mdi:chart-box-outline", location: "Performance" },
    { icon: "mdi:account-group-outline", location: "Users" },
    {
      icon: "mdi:cog-outline",
      location: "Admin",
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
    },
    {
      icon: "mdi:file-plus",
      name: "Claim Requests",
      location: "ClaimRequests",
    },
  ];

  onMount(async () => {
    await decodeUser();
    loadNotifications();
    loadClaimRequestsCount();
    loadOppositionsCount();
    if ($loggedInUser) {
      // Filter menus based on roles
      if (
        !$loggedInUser.userRoles.includes(UserRoles.Tech) &&
        !$loggedInUser.userRoles.includes(UserRoles.SuperAdmin)
      ) {
        menus = menus.filter(
          (x) => x.location !== "Performance" && x.location !== "Users",
        );
      }

      if (
        !$loggedInUser.userRoles.includes(UserRoles.Finance) &&
        !$loggedInUser.userRoles.includes(UserRoles.SuperAdmin)
      ) {
        menus = menus.filter((x) => x.location !== "Finance");
      }

      if (
        !$loggedInUser.userRoles.some((role) =>
          [
            UserRoles.SuperAdmin,
            UserRoles.TrademarkOpposition,
            UserRoles.TrademarkRegistrar,
            UserRoles.Tech,
          ].includes(role),
        )
      ) {
        menus = menus.filter((x) => x.location !== "Opposition");
      }

      // Hide Publications only from agents (User role)
      if ($loggedInUser.userRoles.includes(UserRoles.User)) {
        menus = menus.filter((x) => x.location !== "Publications");
      }

      if (
        !$loggedInUser.userRoles.some((role) =>
          [UserRoles.SuperAdmin, UserRoles.Tech].includes(role),
        )
      ) {
        menus = menus.filter((x) => x.location !== "AdminPanel");
        menus = menus.filter((x) => x.location !== "ClaimRequests");
        menus = menus.filter((x) => x.location !== "admin"); // Hide Super Admin menu
      }

      // Show Resources only for agents (User role), tech team, and superadmin
      const canSeeResources = $loggedInUser.userRoles.some((role) =>
        [UserRoles.User, UserRoles.Tech, UserRoles.SuperAdmin].includes(role),
      );

      if (!canSeeResources) {
        menus = menus.filter((x) => x.location !== "Resources");
      }

      // For regular users, keep the Admin dropdown with Profile only
      if ($loggedInUser.userRoles.includes(UserRoles.User)) {
        const adminMenu = menus.find((m) => m.location === "Admin");
        if (adminMenu) {
          // Keep only Profile submenu for regular users
          adminMenu.submenus =
            adminMenu.submenus?.filter((s) => s.location === "profile") || [];
        }
      }
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

  function handleMenuClick(menu, submenu = null) {
    currentMenuView.set(submenu?.name || menu.location);
    if (submenu) {
      activeSubmenu = submenu.name;
      goto(`/home/${submenu.location.toLowerCase()}`);
    } else if (!menu.submenus) {
      activeMenu = menu.location;
      activeSubmenu = null;
      goto(`/home/${menu.location.trim().toLowerCase()}`);
    }
  }

  async function loadNotifications() {
    if ($loggedInUser === null) return;
    notificationsLoading = true;

    let showSupportTickets = $loggedInUser.userRoles?.includes(
      UserRoles.Tech || UserRoles.SuperAdmin,
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
  async function loadOppositionsCount() {
    try {
      const response = await fetch(`${baseURL}/api/opposition/count`);
      if (response.ok) {
        const opps = await response.json();
        oppsCount = opps;
      }
    } catch (error) {
      console.error("Error fetching claim requests count:", error);
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
        return "bg-green-600 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  }
</script>

<div
  class="w-64 h-screen bg-white shadow-xl flex flex-col border-r border-slate-200/60"
>
  <!-- Logo -->
  <div class="flex justify-center py-6 border-b border-slate-200/60">
    <div class="bg-gradient-to-br p-3 rounded-xl shadow-lg">
      <img src="/logo.png" alt="logo" class="h-12 w-12" />
    </div>
  </div>

  <!-- Menu items -->
  <div class="flex-1 overflow-y-auto py-2">
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
            class={`flex items-center justify-between rounded-md py-2 px-3 ${activeMenu === menu.location ? "bg-green-600 text-white" : "hover:bg-gray-100"}`}
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
              {#if menu.location === "ClaimRequests" && claimRequestsCount > 0}
                <span
                  class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2"
                >
                  {claimRequestsCount}
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
                class="w-full text-left block py-2 px-3 rounded-md text-base {activeSubmenu ===
                submenu.name
                  ? 'font-medium text-[#287F71] bg-gray-50'
                  : 'text-slate-600 hover:bg-gray-50'}"
                on:click={() => handleMenuClick(menu, submenu)}
              >
                {submenu.name}
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
