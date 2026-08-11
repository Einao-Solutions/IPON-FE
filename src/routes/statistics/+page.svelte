<script lang="ts">
  import { onMount } from "svelte";
  import { loggedInUser } from "$lib/store";
  import { UserRoles } from "$lib/helpers";
  import Icon from "@iconify/svelte";
  import { goto } from "$app/navigation";
  import StatisticsCardsView from "./StatisticsCardsView.svelte";
  import StatisticsListView from "./StatisticsListView.svelte";

  // State management
  type ViewState = "cards" | "list";
  let currentView: ViewState = "cards";
  let selectedRegistry: string = "";

  onMount(() => {
    // Verify user has access
    if (!$loggedInUser) {
      goto("/auth");
      return;
    }
    
    const hasAccess = $loggedInUser.userRoles?.some(role =>
      [
        UserRoles.Finance,
        UserRoles.PermSec,
        UserRoles.Minister,
        UserRoles.Tech,
        UserRoles.SuperAdmin,
        UserRoles.TrademarkRegistrar,
        UserRoles.PatentDesignRegistrar,
        UserRoles.EinaoFinance
      ].includes(role)
    );

    if (!hasAccess) {
      // Redirect unauthorized users
      goto("/home/dashboard");
    }
  });

  function handleCardClick(registry: string) {
    if (registry === 'Support') {
      goto('/statistics/support');
      return;
    }
    selectedRegistry = registry;
    currentView = "list";
  }

  function handleBackToCards() {
    currentView = "cards";
    selectedRegistry = "";
  }

  function handleBackToDashboard() {
    goto("/home/dashboard");
  }
</script>

<div class="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen rounded-xl p-6 shadow-xl border border-slate-200/60">
  <div class="max-w-7xl mx-auto flex flex-col">
    <!-- Header Section with Back Button -->
    <div class="mb-5 flex-shrink-0">
      <!-- Back to Dashboard Button -->
      {#if currentView === "cards"}
        <button
          on:click={handleBackToDashboard}
          class="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-gray-300 rounded-lg px-4 py-2 mb-4"
        >
          <Icon icon="mdi:arrow-left" class="text-xl" />
          <span class="font-medium">Back to Dashboard</span>
        </button>
      {/if}

      <div class="flex items-center space-x-3 mb-1">
        <div class="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
          <Icon icon="mdi:chart-bar" class="text-white text-xl" />
        </div>
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-black bg-clip-text">
            Intellectual Property Office Nigeria
          </h1>
          <p class="text-slate-600 text-sm">
            {currentView === "cards" 
              ? "Select a category to view detailed statistics"
              : `${selectedRegistry} Statistics - Select a section to view details`
            }
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    {#if currentView === "cards"}
      <!-- Cards View -->
      <StatisticsCardsView 
        userRoles={$loggedInUser?.userRoles || []}
        onCardClick={handleCardClick}
      />
    {:else if currentView === "list"}
      <!-- Accordion List View -->
      <div class="bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-6 shadow-sm">
        <StatisticsListView 
          userRoles={$loggedInUser?.userRoles || []}
          selectedRegistry={selectedRegistry}
          onBack={handleBackToCards}
        />
      </div>
    {/if}
  </div>
</div>
