<script lang="ts">
  import SideMenu from "./SideMenu.svelte";
  import { Input } from "$lib/components/ui/input";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import { onMount } from "svelte";
  import type { LayoutServerData } from "../../../.svelte-kit/types/src/routes/home/$types";
  import { Button } from "$lib/components/ui/button";
  import FilterFile from "./FilterFile.svelte";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { baseURL } from "$lib/helpers";
  
  $: userName = "";
  export let data: LayoutServerData;
  let filterFiles: FilterFile | null = null;
  let showFilterSheet: boolean = false;
  let searchTitle: string | null = null;
  let showUserMenu = false;
  let isMobileSidebarOpen = false;

  loggedInUser.subscribe((user) => {
    userName = user?.firstName + " " + user?.lastName;
  });

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  onMount(async () => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth")
    ) {
      return;
    }

    const cookies = document.cookie.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("auth_token="));
    const userCookie = cookies.find((c) => c.startsWith("user="));
    
    if (!tokenCookie && !userCookie) {
      toast.error("Please login", {
        position: "top-right",
      });
      goto("/auth");
    }
  });

  let filterData = {};

  function logout() {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    loggedInToken.set(null);
    loggedInUser.set(null);
    goto("/auth");
  }

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      showUserMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if showFilterSheet}
  <svelte:component this={filterFiles} {...filterData} />
{/if}

<div class="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
  <!-- Desktop Sidebar Navigation -->
  <nav class="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-sm z-30">
    <SideMenu />
  </nav>

  <!-- Mobile Sidebar Overlay -->
  {#if isMobileSidebarOpen}
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
      on:click={closeMobileSidebar}
      on:keydown={(e) => e.key === 'Escape' && closeMobileSidebar()}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- Mobile Sidebar -->
  <nav class="lg:hidden fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/60 shadow-lg z-50 transform transition-transform duration-300 {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
    <SideMenu />
  </nav>

  <!-- Main Content Area -->
  <div class="lg:ml-64 w-full min-h-screen flex flex-col">
    <!-- Modern Header - STICKY -->
    <header class="sticky top-0 z-20 flex-shrink-0 bg-white border-b border-slate-200/60 shadow-xl">
      <div class="flex items-center justify-between px-4 sm:px-8 py-4 gap-4">
        <!-- Mobile hamburger button -->
        <Button 
          variant="ghost" 
          size="sm" 
          class="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          on:click={toggleMobileSidebar}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        <!-- Search Bar with Icon -->
        <div class="relative flex-1 max-w-md group">
          <svg 
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search files, applicants, or file numbers..."
            bind:value={searchTitle}
            type="search"
            class="pl-10 pr-4 py-2.5 w-full border-slate-200 bg-slate-50/50 focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 rounded-xl transition-all duration-200"
            on:keypress={(event) => {
              if (event.key === "Enter" && searchTitle) goto(`/files?title=${searchTitle}`);
            }}
          />
        </div>

        <!-- User Menu -->
        <div class="relative user-menu-container">
          <button
            on:click|stopPropagation={toggleUserMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
            aria-label="User menu"
          >
            <span class="hidden md:inline text-sm font-medium text-slate-700 group-hover:text-slate-900">
              {userName}
            </span>
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white transition-transform duration-200 group-hover:scale-105"
            >
              {userName
                ? userName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : ""}
            </div>
            <svg 
              class="w-4 h-4 text-slate-400 transition-transform duration-200 {showUserMenu ? 'rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          {#if showUserMenu}
            <div class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div class="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p class="text-sm font-semibold text-slate-900">{userName}</p>
                <p class="text-xs text-slate-500 mt-0.5">Manage your account</p>
              </div>
              <ul class="py-2">
                <li>
                  <a
                    href="/home/profile"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </a>
                </li>
                <li class="border-t border-slate-100 mt-1 pt-1">
                  <button
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    on:click={logout}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
      <slot />
    </main>
  </div>
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-in-from-top-2 {
    from {
      transform: translateY(-8px);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-in {
    animation: fade-in 0.2s ease-out, slide-in-from-top-2 0.2s ease-out;
  }
</style>