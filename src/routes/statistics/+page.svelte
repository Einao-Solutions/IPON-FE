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

    const hasAccess = $loggedInUser.userRoles?.includes(UserRoles.SuperAdmin);

    if (!hasAccess) {
      // Redirect unauthorized users
      goto("/home/dashboard");
    }
  });

  function handleCardClick(registry: string) {
    if (registry === "Support") {
      goto("/statistics/support");
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

<div class="statistics-home min-h-screen rounded-lg p-4 sm:p-8">
  <div class="statistics-page mx-auto flex w-full max-w-screen-2xl flex-col">
    {#if currentView === "cards"}
      <div class="statistics-header">
        <button on:click={handleBackToDashboard} class="back-link">
          <Icon icon="mdi:arrow-left" class="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <div class="statistics-heading">
          <span class="heading-kicker">IPON · REPORTING</span>
          <h1>Statistics</h1>
          <p>Select a registry to explore reports</p>
        </div>
      </div>
    {/if}

    <!-- Main Content Area -->
    {#if currentView === "cards"}
      <!-- Cards View -->
      <StatisticsCardsView
        userRoles={$loggedInUser?.userRoles || []}
        onCardClick={handleCardClick}
      />
    {:else if currentView === "list"}
      <!-- Accordion List View -->
      <div
        class="bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-6 shadow-sm"
      >
        <StatisticsListView
          userRoles={$loggedInUser?.userRoles || []}
          {selectedRegistry}
          onBack={handleBackToCards}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .statistics-home { color: #202923; background: linear-gradient(180deg, #edf3ef 0, #fafbfa 360px); }
  .statistics-header { display: flex; align-items: center; gap: 30px; margin-bottom: 30px; padding: 10px 0 24px; border-bottom: 1px solid #d5e0d8; }
  .back-link { display: inline-flex; flex-shrink: 0; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #d1d9d4; border-radius: 6px; color: #59665e; font-size: 13px; }
  .back-link:hover { background: #f5f8f6; color: #265640; }
  .statistics-heading { min-width: 0; }
  .heading-kicker { color: #52745e; font-size: 11px; font-weight: 600; }
  .statistics-heading h1 { margin-top: 3px; color: #202923; font-size: 30px; line-height: 1.25; font-weight: 600; }
  .statistics-heading p { margin-top: 6px; color: #68766d; font-size: 14px; }
  .back-link:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  @media (max-width: 600px) {
    .statistics-header { align-items: flex-start; flex-direction: column; gap: 12px; }
    .statistics-heading h1 { font-size: 24px; }
  }
</style>
