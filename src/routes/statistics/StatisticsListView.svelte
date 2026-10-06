<script lang="ts">
  import Icon from "@iconify/svelte";
  import * as Accordion from "$lib/components/ui/accordion";
  import * as Card from "$lib/components/ui/card";
  import { UserRoles } from "$lib/helpers";
  import { goto } from "$app/navigation";
  
  export let userRoles: number[] = [];
  export let selectedRegistry: string = "";
  export let onBack: () => void;

  function navigateToStaffPerformance() {
    goto(`/statistics/performance/staff?registryType=${selectedRegistry}`);
  }

  function navigateToUnitPerformance() {
    goto(`/statistics/performance/units?registryType=${selectedRegistry}`);
  }

  function navigateToFinancialStatistics() {
    goto(`/statistics/financial?registryType=${selectedRegistry}`);
  }

  function navigateToOperationalStatistics() {
    goto(`/statistics/operational?registryType=${selectedRegistry}`);
  }

  function navigateToTechFeeStatistics() {
    goto(`/statistics/techfee?registryType=${selectedRegistry}`);
  }

  function navigateToSupportStatistics() {
    const scope = selectedRegistry === 'Trademark' ? 'Trademark'
                : selectedRegistry === 'Patent' ? 'Patent'
                : 'Design';
    goto(`/statistics/support?scope=${scope}&registryType=${selectedRegistry}`);
  }

  $: isSuperAdmin = userRoles.includes(UserRoles.SuperAdmin);

  $: isSuperAdmin = userRoles.includes(UserRoles.SuperAdmin);
  $: sections = isSuperAdmin ? getSectionsForRole(false, true, false) : [];
  $: isSuperAdmin = userRoles.includes(UserRoles.SuperAdmin);
  $: sections = isSuperAdmin ? getSectionsForRole(false, true, false) : [];

  function getSectionsForRole(financeOnly: boolean, includeSupport: boolean, actingSupportOnly: boolean) {
    const sections = [];

    if (actingSupportOnly) {
      if (includeSupport) {
        sections.push({
          id: "support",
          title: "Support Statistics",
          description: "Track support ticket response rates, closure rates, and officer performance",
          icon: "mdi:headset",
          iconColor: "text-green-600",
          iconBg: "bg-green-100"
        });
      }
      return sections;
    }
    
    if (!financeOnly) {
      sections.push({
        id: "performance",
        title: "Performance Statistics",
        description: "Track staff and unit productivity metrics",
        icon: "mdi:chart-timeline-variant",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    if (!financeOnly) {
      sections.push({
        id: "operational",
        title: "Operational Statistics",
        description: "View application volumes and processing data",
        icon: "mdi:cog-outline",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    if (
      userRoles.includes(UserRoles.PermSec) ||
      userRoles.includes(UserRoles.Minister) ||
      userRoles.includes(UserRoles.Finance) ||
      userRoles.includes(UserRoles.SuperAdmin) ||
      userRoles.includes(UserRoles.EinaoFinance) 
    ) {
      sections.push({
        id: "financial",
        title: "Financial Statistics",
        description: "Revenue and payment analytics",
        icon: "mdi:cash-multiple",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }

    if (includeSupport) {
      sections.push({
        id: "support",
        title: "Support Statistics",
        description: "Track support ticket response rates, closure rates, and officer performance",
        icon: "mdi:headset",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    return sections;
  }

//  $: sections = getSectionsForRole(isFinanceOnly);
</script>

<div class="statistics-directory space-y-6">
  <div class="directory-header">
    <button on:click={onBack} class="back-link">
      <Icon icon="mdi:arrow-left" class="h-4 w-4" />
      <span>Registry Types</span>
    </button>
    <div class="registry-heading">
      <span class="registry-kicker">Statistics</span>
      <h2>{selectedRegistry}</h2>
    </div>
  </div>

  <!-- Accordion Sections -->
  <Accordion.Root class="space-y-4">
    {#each sections as section}
      <Accordion.Item value={section.id} class="section-item">
        <Accordion.Trigger class="section-trigger">
          <div class="flex items-center gap-4 w-full">
            <div class="section-icon">
              <Icon icon={section.icon} class="h-5 w-5" />
            </div>
            <div class="flex-1 text-left">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
          </div>
          
        </Accordion.Trigger>
        <Accordion.Content class="section-content">
          <div class="option-list">
            {#if section.id === "performance"}
              <div class="option-group">
                  <button
                    on:click={navigateToStaffPerformance}
                    class="option-row"
                  >
                    <span class="option-icon"><Icon icon="mdi:account-group" class="h-5 w-5" /></span>
                    <span class="option-copy">
                      <span class="option-title">Staff Performance</span>
                      <span class="option-description">Productivity by staff member</span>
                    </span>
                    <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                  </button>
                  <button on:click={navigateToUnitPerformance} class="option-row">
                    <span class="option-icon"><Icon icon="mdi:office-building" class="h-5 w-5" /></span>
                    <span class="option-copy">
                      <span class="option-title">Unit Performance</span>
                      <span class="option-description">Productivity across registry units</span>
                    </span>
                    <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                  </button>
              </div>

            {:else if section.id === "operational"}
              <!-- Operational Statistics Content -->
              <div class="option-group">
                <button
                  on:click={navigateToOperationalStatistics}
                  class="option-row"
                >
                  <span class="option-icon"><Icon icon="mdi:cog-outline" class="h-5 w-5" /></span>
                  <span class="option-copy"><span class="option-title">Filings</span><span class="option-description">Application volumes and filing breakdowns</span></span>
                  <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                </button>
              </div>

            {:else if section.id === "financial"}
              <!-- Financial Statistics Content -->
              <div class="option-group">
                <button on:click={navigateToFinancialStatistics} class="option-row">
                  <span class="option-icon"><Icon icon="mdi:cash-multiple" class="h-5 w-5" /></span>
                  <span class="option-copy"><span class="option-title">Revenue Statistics</span><span class="option-description">Government fees and payment volumes</span></span>
                  <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                </button>
                <button on:click={navigateToTechFeeStatistics} class="option-row">
                  <span class="option-icon"><Icon icon="mdi:chip" class="h-5 w-5" /></span>
                  <span class="option-copy"><span class="option-title">Tech Fee Revenue</span><span class="option-description">EINAO technology fees and payments</span></span>
                  <span class="option-meta">EINAO Finance</span>
                  <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                </button>
              </div>
              <!-- Tech Fee Revenue Statistics — STRICTLY EinaoFinance role ONLY -->
              <!-- {#if isEinaoFinance}
                <button
                  on:click={navigateToTechFeeStatistics}
                  class="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200/40 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/60 text-left w-full"
                >
                  <div class="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/40 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-4">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon icon="mdi:chip" class="text-2xl text-blue-600" />
                      </div>
                      <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">EINAO Finance</span>
                    </div>
                    <h4 class="text-lg font-semibold text-slate-800 mb-2">Tech Fee Revenue Statistics</h4>
                    <p class="text-sm text-gray-600 mb-4">
                      Compare EINAO technology fees and payment volumes across custom periods — by month, quarter, year or date range
                    </p>
                    <div class="flex items-center text-blue-600 text-sm font-medium">
                      <span>View Details</span>
                      <Icon icon="mdi:arrow-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              {/if} -->
            {:else if section.id === "support"}
              <!-- Support Statistics Content -->
              <div class="option-group">
                <button
                  on:click={navigateToSupportStatistics}
                  class="option-row"
                >
                  <span class="option-icon"><Icon icon="mdi:headset" class="h-5 w-5" /></span>
                  <span class="option-copy"><span class="option-title">Support Officer Performance</span><span class="option-description">Ticket responses, closures, and officer scores</span></span>
                  <span class="option-action" aria-hidden="true"><span>Open report</span><Icon icon="mdi:arrow-right" class="h-4 w-4" /></span>
                </button>
              </div>

            {/if}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    {/each}
  </Accordion.Root>
</div>

<style>
  .statistics-directory { --directory-green: #265640; color: #202923; }
  .directory-header { display: flex; align-items: center; gap: 24px; padding-bottom: 20px; border-bottom: 1px solid #dce4de; }
  .back-link { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; padding: 8px 12px; border: 1px solid #d1d9d4; border-radius: 6px; color: #59665e; font-size: 13px; }
  .back-link:hover { background: #f5f8f6; color: var(--directory-green); }
  .registry-heading { min-width: 0; }
  .registry-kicker { color: #63806d; font-size: 11px; font-weight: 600; }
  .registry-heading h2 { margin-top: 2px; color: #202923; font-size: 22px; line-height: 1.3; font-weight: 600; }
  :global(.section-item) { overflow: hidden; border: 1px solid #dce4de; border-radius: 6px; background: #fff; box-shadow: none; }
  :global(.section-trigger) { min-height: 74px; padding: 14px 18px; text-decoration: none !important; }
  :global(.section-trigger:hover) { background: #f8faf8; }
  .section-icon { display: flex; width: 36px; height: 36px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 6px; background: #e8f0ea; color: var(--directory-green); }
  :global(.section-trigger h3) { color: #26362d; font-size: 14px; font-weight: 600; }
  :global(.section-trigger p) { margin-top: 3px; color: #758079; font-size: 12px; }
  :global(.section-content) { border-top: 1px solid #e4e9e5; padding: 8px 18px 14px; background: #fbfcfb; }
  .option-group { display: flex; flex-direction: column; }
  .option-row { display: flex; width: 100%; min-height: 68px; align-items: center; gap: 12px; padding: 12px 10px; border-bottom: 1px solid #e8ece9; text-align: left; }
  .option-row:last-child { border-bottom: 0; }
  .option-row:hover { background: #f1f6f2; }
  .option-row:focus-visible, .back-link:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  .option-icon { display: flex; width: 34px; height: 34px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 6px; background: #e8f0ea; color: var(--directory-green); }
  .option-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
  .option-title { color: #2a3b30; font-size: 13px; font-weight: 600; }
  .option-description { color: #758079; font-size: 12px; line-height: 1.4; }
  .option-meta { flex-shrink: 0; padding: 4px 8px; border: 1px solid #dce4de; border-radius: 4px; color: #66736b; font-size: 10px; }
  .option-action { display: inline-flex; flex-shrink: 0; align-items: center; gap: 6px; color: var(--directory-green); font-size: 11px; font-weight: 600; }
  @media (max-width: 600px) {
    .directory-header { align-items: flex-start; flex-direction: column; gap: 12px; }
    .registry-heading h2 { font-size: 20px; }
    :global(.section-trigger) { gap: 10px; padding: 12px; }
    :global(.section-content) { padding: 6px 10px 10px; }
    .option-row { gap: 9px; padding: 11px 6px; }
    .option-action > span, .option-meta { display: none; }
  }
</style>