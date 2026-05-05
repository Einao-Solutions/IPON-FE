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

  $: isSuperAdmin = userRoles.includes(UserRoles.SuperAdmin);
  $: isEinaoFinance = userRoles.includes(UserRoles.EinaoFinance); // ✅ ONLY EinaoFinance, no SuperAdmin fallback

  $: isFullAccess = userRoles.includes(UserRoles.PermSec) || 
                    userRoles.includes(UserRoles.Minister) || 
                    userRoles.includes(UserRoles.SuperAdmin);

  $: isFinanceOnly = userRoles.includes(UserRoles.Finance) && !isFullAccess;

  // ✅ Pass isFinanceOnly as parameter so $: can track it
  $: sections = getSectionsForRole(isFinanceOnly);

  function getSectionsForRole(financeOnly: boolean) {
    const sections = [];
    
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
      userRoles.includes(UserRoles.SuperAdmin)
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
    
    return sections;
  }

//  $: sections = getSectionsForRole(isFinanceOnly);
</script>

<div class="space-y-6">
  <!-- Back Button -->
  <button
    on:click={onBack}
    class="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-gray-300 rounded-lg px-4 py-2"
  >
    <Icon icon="mdi:arrow-left" class="h-5 w-5" />
    <span>Back to Registry Types</span>
  </button>

  <!-- Registry Title -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-2">{selectedRegistry} Statistics</h2>
    <p class="text-slate-600">View comprehensive statistics for {selectedRegistry} applications</p>
  </div>

  <!-- Accordion Sections -->
  <Accordion.Root class="space-y-4">
    {#each sections as section}
      <Accordion.Item value={section.id} class="border rounded-lg bg-white shadow-sm">
        <Accordion.Trigger class="px-6 py-4 hover:bg-slate-50 hover:no-underline transition-colors">
          <div class="flex items-center gap-4 w-full">
            <div class="w-10 h-10 {section.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon={section.icon} class="h-5 w-5 {section.iconColor}" />
            </div>
            <div class="flex-1 text-left">
              <h3 class="text-lg font-semibold text-slate-800">{section.title}</h3>
              <p class="text-sm text-slate-600">{section.description}</p>
            </div>
          </div>
          
        </Accordion.Trigger>
        <Accordion.Content class="px-6 py-6 border-t bg-white">
          <div class="space-y-6">
            {#if section.id === "performance"}
              <!-- PERFORMANCE STATISTICS CONTENT -->
              
              <div class="space-y-4">
                <p class="text-sm text-gray-600 mb-4">
                  Choose a performance view to analyze {selectedRegistry} registry data:
                </p>

                <!-- Performance Navigation Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Staff Performance Card -->
                  <button
                    on:click={navigateToStaffPerformance}
                    class="group relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-200/40 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-green-300/60 text-left"
                  >
                    <div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div class="relative z-10">
                      <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon icon="mdi:account-group" class="text-2xl text-green-600" />
                      </div>
                      <h4 class="text-lg font-semibold text-slate-800 mb-2 group-hover:text-slate-900">
                        Staff Performance
                      </h4>
                      <p class="text-sm text-gray-600 mb-4">
                        View individual staff productivity metrics, assigned vs treated applications, and contribution percentages within each unit
                      </p>
                      <div class="flex items-center text-green-600 text-sm font-medium">
                        <span>View Details</span>
                        <Icon icon="mdi:arrow-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>

                  <!-- Unit Performance Card -->
                  <button
                    on:click={navigateToUnitPerformance}
                    class="group relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-200/40 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-green-300/60 text-left"
                  >
                    <div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div class="relative z-10">
                      <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon icon="mdi:office-building" class="text-2xl text-green-600" />
                      </div>
                      <h4 class="text-lg font-semibold text-slate-800 mb-2 group-hover:text-slate-900">
                        Unit Performance
                      </h4>
                      <p class="text-sm text-gray-600 mb-4">
                        Compare performance across all units, view treatment rates, staff counts, and averages with visual charts
                      </p>
                      <div class="flex items-center text-green-600 text-sm font-medium">
                        <span>View Details</span>
                        <Icon icon="mdi:arrow-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

            {:else if section.id === "operational"}
              <!-- Operational Statistics Content -->
              <div class="space-y-4">
                <p class="text-sm text-gray-600 mb-4">
                  Choose an operational view to analyze {selectedRegistry} registry data:
                </p>
                <button
                  on:click={navigateToOperationalStatistics}
                  class="group relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-200/40 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-green-300/60 text-left w-full"
                >
                  <div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative z-10">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon icon="mdi:cog-outline" class="text-2xl text-green-600" />
                    </div>
                    <h4 class="text-lg font-semibold text-slate-800 mb-2">Filings</h4>
                    <p class="text-sm text-gray-600 mb-4">
                      Compare filing volumes and operational breakdowns across custom periods — by month, quarter, year or date range
                    </p>
                    <div class="flex items-center text-green-600 text-sm font-medium">
                      <span>View Details</span>
                      <Icon icon="mdi:arrow-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>

            {:else if section.id === "financial"}
              <!-- Financial Statistics Content -->
              <div class="space-y-4">
                <p class="text-sm text-gray-600 mb-4">
                  Choose a financial view to analyze {selectedRegistry} registry data:
                </p>
                <button
                  on:click={navigateToFinancialStatistics}
                  class="group relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-200/40 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-green-300/60 text-left w-full"
                >
                  <div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative z-10">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon icon="mdi:cash-multiple" class="text-2xl text-green-600" />
                    </div>
                    <h4 class="text-lg font-semibold text-slate-800 mb-2">Revenue Statistics</h4>
                    <p class="text-sm text-gray-600 mb-4">
                      Compare government fees and payment volumes across custom periods — by month, quarter, year or date range
                    </p>
                    <div class="flex items-center text-green-600 text-sm font-medium">
                      <span>View Details</span>
                      <Icon icon="mdi:arrow-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                <!-- Tech Fee Revenue Statistics — EinaoFinance ONLY -->
                {#if isEinaoFinance}
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
                {/if}
              </div>
            {/if}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    {/each}
  </Accordion.Root>
</div>
