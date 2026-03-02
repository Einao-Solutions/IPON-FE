<script lang="ts">
  import Icon from "@iconify/svelte";
  import * as Accordion from "$lib/components/ui/accordion";
  import * as Card from "$lib/components/ui/card";
  import { UserRoles } from "$lib/helpers";
  import StatisticsFilters from "./components/StatisticsFilters.svelte";
  import { slide } from "svelte/transition";
  
  export let userRoles: number[] = [];
  export let selectedRegistry: string = "";
  export let onBack: () => void;

  let timePeriod = "Monthly";
  let byClassOpen = false;
  let byNationalityOpen = false;

  function handlePeriodChange(period: string) {
    timePeriod = period;
    // TODO: Fetch new data based on period
  }

  // Determine which sections to show based on user role
  function getSectionsForRole(): Array<{
    id: string,
    title: string,
    description: string,
    icon: string,
    iconColor: string,
    iconBg: string
  }> {
    const sections = [];
    
    // Performance section - Everyone except Finance (but SuperAdmin sees all)
    if (!userRoles.includes(UserRoles.Finance) || userRoles.includes(UserRoles.SuperAdmin)) {
      sections.push({
        id: "performance",
        title: "Performance Statistics",
        description: `View unit performance metrics including applications processed by each unit in the ${selectedRegistry} registry`,
        icon: "mdi:trending-up",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    // Operational section - Everyone except Finance (but SuperAdmin sees all)
    if (!userRoles.includes(UserRoles.Finance) || userRoles.includes(UserRoles.SuperAdmin)) {
      sections.push({
        id: "operational",
        title: "Operational Statistics",
        description: `View file data and correspondence statistics for the ${selectedRegistry} registry`,
        icon: "mdi:file-document-outline",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    // Financial section - PermSec, Minister, Finance, and SuperAdmin
    if (
      userRoles.includes(UserRoles.PermSec) || 
      userRoles.includes(UserRoles.Minister) || 
      userRoles.includes(UserRoles.Finance) ||
      userRoles.includes(UserRoles.SuperAdmin)
    ) {
      sections.push({
        id: "financial",
        title: "Financial Statistics",
        description: userRoles.includes(UserRoles.Finance) 
          ? "View revenue breakdown by application types and classes across all registries"
          : `View revenue breakdown by application types and classes for the ${selectedRegistry} registry`,
        icon: "mdi:currency-usd",
        iconColor: "text-green-600",
        iconBg: "bg-green-100"
      });
    }
    
    return sections;
  }

  const sections = getSectionsForRole();

  // Performance data based on registry
  function getPerformanceData() {
    if (selectedRegistry === "Trademark") {
      return [
        { unit: "Search Unit", count: 0, color: "bg-blue-50", textColor: "text-blue-600" },
        { unit: "Examination Unit", count: 0, color: "bg-green-50", textColor: "text-green-600" },
        { unit: "Publication Unit", count: 0, color: "bg-purple-50", textColor: "text-purple-600" },
        { unit: "Certificate Unit", count: 0, color: "bg-yellow-50", textColor: "text-yellow-600" },
        { unit: "Acceptance Unit", count: 0, color: "bg-pink-50", textColor: "text-pink-600" }
      ];
    } else {
      return [
        { unit: "Search Unit", count: 0, color: "bg-blue-50", textColor: "text-blue-600" },
        { unit: "Examination Unit", count: 0, color: "bg-green-50", textColor: "text-green-600" }
      ];
    }
  }

  const performanceData = getPerformanceData();
</script>

<div class="space-y-6">
  <!-- Back Button -->
  <button
    on:click={onBack}
    class="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-gray-300 rounded-lg px-4 py-2"
  >
    <Icon icon="mdi:arrow-left" class="text-xl" />
    <span class="font-medium">Back</span>
  </button>

  <!-- Registry Title -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-2">
      {selectedRegistry} Statistics
    </h2>
    <p class="text-slate-600 text-sm">
      Select a category below to view detailed statistics
    </p>
  </div>

  <!-- Accordion Sections -->
  <Accordion.Root class="space-y-4">
    {#each sections as section}
      <Accordion.Item value={section.id} class="border rounded-lg bg-white shadow-sm">
        <Accordion.Trigger class="px-6 py-4 hover:bg-slate-50 hover:no-underline transition-colors">
          <div class="flex items-start w-full gap-4">
            <div class="flex items-start gap-3 flex-1">
              <span class="flex-shrink-0 mt-0.5">
                <Icon icon={section.icon} class="w-8 h-8 {section.iconColor}" />
              </span>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-slate-800 mb-1">
                  {section.title}
                </h3>
                <p class="text-sm text-gray-500 font-normal">
                  {section.description}
                </p>
              </div>
            </div>
          </div>
        </Accordion.Trigger>
        <Accordion.Content class="px-6 py-6 border-t bg-white">
          <div class="space-y-6">
            {#if section.id === "performance"}
              <!-- PERFORMANCE STATISTICS CONTENT -->
              
              <!-- Time Period Filter -->
              <StatisticsFilters 
                selectedPeriod={timePeriod} 
                onPeriodChange={handlePeriodChange}
              />

              <!-- Section Title -->
              <div class="mb-4 pb-2 border-b border-gray-200">
                <h4 class="text-sm text-gray-600">
                  Number of applications treated by each unit ({timePeriod})
                </h4>
              </div>

              <!-- Unit Cards Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {#each performanceData as item}
                  <Card.Root class="{item.color} border-0">
                    <Card.Content class="p-4">
                      <div class="space-y-2">
                        <p class="text-sm text-gray-600">{item.unit}</p>
                        <p class="{item.textColor} text-2xl font-semibold">
                          {item.count.toLocaleString()}
                        </p>
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/each}
              </div>

              <!-- Bar Chart Visualization -->
              <Card.Root class="mt-6">
                <Card.Header>
                  <Card.Title class="text-sm">Unit Performance Comparison</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div class="h-[300px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300">
                    <div class="text-center">
                      <Icon icon="mdi:chart-bar" class="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p class="text-sm text-slate-500">Bar Chart: Unit Performance Comparison</p>
                      <p class="text-xs text-slate-400 mt-1">Chart will be rendered here</p>
                    </div>
                  </div>
                </Card.Content>
              </Card.Root>

            {:else if section.id === "operational"}
              <!-- OPERATIONAL STATISTICS CONTENT -->
              
              <!-- Time Period Filter -->
              <StatisticsFilters 
                selectedPeriod={timePeriod} 
                onPeriodChange={handlePeriodChange}
              />

              <!-- File Data Section -->
              <div class="mb-4 pb-2 border-b border-gray-200">
                <h4 class="text-sm text-gray-600">File Data ({timePeriod})</h4>
              </div>

              <!-- By Class (Collapsible) -->
              <Card.Root>
                <button 
                  type="button" 
                  class="w-full"
                  on:click={() => byClassOpen = !byClassOpen}
                >
                  <Card.Header class="flex flex-row items-center justify-between py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Card.Title class="text-base font-semibold">By Class</Card.Title>
                    <Icon 
                      icon="mdi:chevron-down" 
                      class="h-5 w-5 text-gray-500 flex-shrink-0 transition-transform {byClassOpen ? 'rotate-180' : ''}" 
                    />
                  </Card.Header>
                </button>
                {#if byClassOpen}
                  <div transition:slide={{ duration: 200 }}>
                    <Card.Content class="border-t">
                      <div class="h-[250px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300 mt-4">
                        <div class="text-center">
                          <Icon icon="mdi:chart-pie" class="h-10 w-10 text-slate-400 mx-auto mb-2" />
                          <p class="text-sm text-slate-500">Class Distribution Chart</p>
                          <p class="text-xs text-slate-400 mt-1">Shows file count by class</p>
                        </div>
                      </div>
                    </Card.Content>
                  </div>
                {/if}
              </Card.Root>

              <!-- By Nationality (Collapsible) -->
              <Card.Root class="mt-4">
                <button 
                  type="button" 
                  class="w-full"
                  on:click={() => byNationalityOpen = !byNationalityOpen}
                >
                  <Card.Header class="flex flex-row items-center justify-between py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Card.Title class="text-base font-semibold">By Nationality</Card.Title>
                    <Icon 
                      icon="mdi:chevron-down" 
                      class="h-5 w-5 text-gray-500 flex-shrink-0 transition-transform {byNationalityOpen ? 'rotate-180' : ''}" 
                    />
                  </Card.Header>
                </button>
                {#if byNationalityOpen}
                  <div transition:slide={{ duration: 200 }}>
                    <Card.Content class="border-t">
                      <div class="h-[250px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300 mt-4">
                        <div class="text-center">
                          <Icon icon="mdi:earth" class="h-10 w-10 text-slate-400 mx-auto mb-2" />
                          <p class="text-sm text-slate-500">Nationality Distribution</p>
                          <p class="text-xs text-slate-400 mt-1">Local vs Foreign breakdown</p>
                        </div>
                      </div>
                    </Card.Content>
                  </div>
                {/if}
              </Card.Root>

              <!-- Correspondence Statistics -->
              <div class="mb-4 pb-2 border-b border-gray-200 mt-6">
                <h4 class="text-sm text-gray-600">Correspondence ({timePeriod})</h4>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card.Root class="bg-blue-50 border-0">
                  <Card.Content class="p-4">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <Icon icon="mdi:account" class="h-4 w-4 text-blue-600" />
                        <p class="text-sm text-gray-600">Individual</p>
                      </div>
                      <p class="text-2xl text-blue-600 font-semibold">0</p>
                    </div>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-green-50 border-0">
                  <Card.Content class="p-4">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <Icon icon="mdi:domain" class="h-4 w-4 text-green-600" />
                        <p class="text-sm text-gray-600">Company</p>
                      </div>
                      <p class="text-2xl text-green-600 font-semibold">0</p>
                    </div>
                  </Card.Content>
                </Card.Root>
              </div>

            {:else if section.id === "financial"}
              <!-- FINANCIAL STATISTICS CONTENT -->
              
              <!-- Time Period Filter -->
              <StatisticsFilters 
                selectedPeriod={timePeriod} 
                onPeriodChange={handlePeriodChange}
              />

              <!-- Revenue Breakdown Section -->
              <div class="mb-4 pb-2 border-b border-gray-200">
                <h4 class="text-sm text-gray-600">Revenue Breakdown ({timePeriod})</h4>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card.Root class="bg-blue-50 border-0">
                  <Card.Content class="p-4">
                    <div class="space-y-2">
                      <p class="text-sm text-gray-600">New Applications</p>
                      <p class="text-2xl text-blue-600 font-semibold">₦0</p>
                    </div>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-green-50 border-0">
                  <Card.Content class="p-4">
                    <div class="space-y-2">
                      <p class="text-sm text-gray-600">Renewals</p>
                      <p class="text-2xl text-green-600 font-semibold">₦0</p>
                    </div>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-purple-50 border-0">
                  <Card.Content class="p-4">
                    <div class="space-y-2">
                      <p class="text-sm text-gray-600">Others</p>
                      <p class="text-2xl text-purple-600 font-semibold">₦0</p>
                    </div>
                  </Card.Content>
                </Card.Root>
              </div>

              <!-- Revenue Distribution Pie Chart -->
              <Card.Root>
                <Card.Header>
                  <Card.Title class="text-sm">Revenue Distribution</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div class="h-[300px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300">
                    <div class="text-center">
                      <Icon icon="mdi:chart-pie" class="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p class="text-sm text-slate-500">Pie Chart: Revenue Distribution</p>
                      <p class="text-xs text-slate-400 mt-1">New Applications, Renewals, Others</p>
                    </div>
                  </div>
                </Card.Content>
              </Card.Root>

              <!-- Total Revenue by Class -->
              <div class="mb-4 pb-2 border-b border-gray-200 mt-6">
                <h4 class="text-sm text-gray-600">Total Revenue by Class ({timePeriod})</h4>
              </div>

              <Card.Root class="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
                <Card.Content class="p-6">
                  <div class="space-y-2">
                    <p class="text-sm text-gray-600">Total Revenue</p>
                    <p class="text-3xl text-green-600 font-bold">₦0</p>
                  </div>
                </Card.Content>
              </Card.Root>

              <!-- Payment Methods Distribution -->
              <div class="mb-4 pb-2 border-b border-gray-200 mt-6">
                <h4 class="text-sm text-gray-600">Payment Methods Distribution</h4>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card.Root class="bg-gray-50 border-0">
                  <Card.Content class="p-3">
                    <p class="text-xs text-gray-600 mb-1">Bank Transfer</p>
                    <p class="text-lg font-semibold">0%</p>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-gray-50 border-0">
                  <Card.Content class="p-3">
                    <p class="text-xs text-gray-600 mb-1">Card Payment</p>
                    <p class="text-lg font-semibold">0%</p>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-gray-50 border-0">
                  <Card.Content class="p-3">
                    <p class="text-xs text-gray-600 mb-1">Cash</p>
                    <p class="text-lg font-semibold">0%</p>
                  </Card.Content>
                </Card.Root>

                <Card.Root class="bg-gray-50 border-0">
                  <Card.Content class="p-3">
                    <p class="text-xs text-gray-600 mb-1">Others</p>
                    <p class="text-lg font-semibold">0%</p>
                  </Card.Content>
                </Card.Root>
              </div>

              <!-- Payment Methods Pie Chart -->
              <Card.Root>
                <Card.Header>
                  <Card.Title class="text-sm">Payment Methods Breakdown</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div class="h-[300px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-300">
                    <div class="text-center">
                      <Icon icon="mdi:chart-donut" class="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p class="text-sm text-slate-500">Pie Chart: Payment Methods</p>
                      <p class="text-xs text-slate-400 mt-1">Bank Transfer, Card, Cash, Others</p>
                    </div>
                  </div>
                </Card.Content>
              </Card.Root>

            {/if}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    {/each}
  </Accordion.Root>
</div>
