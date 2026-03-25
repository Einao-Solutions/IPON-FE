<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import { statisticsApi, type UnitPerformanceData } from "$lib/utils/statisticsApi";

  // Get registry type from URL params
  let registryType = $page.url.searchParams.get("registryType") || "Trademark";
  
  // Filter states
  let selectedPeriodType = "month";
  let selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
  let selectedYear = new Date().getFullYear();
  
  // Data states
  let performanceData: UnitPerformanceData | null = null;
  let loading = false;
  let error: string | null = null;

  // Period options
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Chart colors
  const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#ef4444'];

  $: periodValues = selectedPeriodType === "month" ? months : quarters;

  async function loadPerformanceData() {
    try {
      loading = true;
      error = null;
      performanceData = await statisticsApi.getUnitPerformance(
        registryType,
        selectedPeriodType,
        selectedPeriodValue,
        selectedYear
      );
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load performance data";
      console.error("Error loading performance data:", err);
    } finally {
      loading = false;
    }
  }

  function handlePeriodTypeChange(type: string) {
    selectedPeriodType = type;
    selectedPeriodValue = periodValues[0];
    performanceData = null;
  }

  function handlePeriodValueChange(value: string) {
    selectedPeriodValue = value;
    loadPerformanceData();
  }

  function handleYearChange(year: number) {
    selectedYear = year;
    loadPerformanceData();
  }

  function handleClearFilters() {
    selectedPeriodType = "month";
    selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    selectedYear = new Date().getFullYear();
    performanceData = null;
  }

  function handleBack() {
    window.history.back();
  }

  // Check if we have meaningful data
  $: hasMeaningfulData = performanceData && performanceData.units.some(unit => 
    unit.totalAssigned > 0 || unit.totalTreated > 0
  );

  // Get active units
  $: activeUnits = performanceData?.units.filter(u => u.totalAssigned > 0 || u.totalTreated > 0) || [];
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- Back Button & Executive Dashboard Title -->
    <div class="flex items-center justify-between mb-6">
      <button
        on:click={handleBack}
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Back to Performance Statistics</span>
      </button>
      
      <h1 class="text-3xl font-bold text-gray-900 flex-1 text-center">
        Executive Dashboard
      </h1>
      
      <!-- Spacer to balance the layout -->
      <div style="width: 216px;"></div>
    </div>

    <!-- Unit Performance Header & Filters Section -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      
      <!-- Section Title with Icon -->
      <div class="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex-shrink-0 w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
          <Icon icon="lucide:building-2" class="w-7 h-7 text-white" />
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">
            Unit Performance
          </h2>
          <p class="text-sm text-gray-600">
            {registryType} Registry - Compare productivity across all units
          </p>
        </div>
      </div>

      <!-- Filters Layout -->
      <div class="space-y-4">
        
        <!-- Row 1: Year & Clear Button -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
              Year
            </label>
            <div class="relative">
              <select
                bind:value={selectedYear}
                on:change={(e) => handleYearChange(parseInt(e.currentTarget.value))}
                class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
              >
                {#each years as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div class="flex items-end">
            <button
              on:click={handleClearFilters}
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Icon icon="lucide:x" class="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Row 2: Period Type & Period Value -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Icon icon="lucide:calendar" class="w-5 h-5 text-gray-500" />
              Period Type
            </label>
            <div class="inline-flex w-full gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                on:click={() => handlePeriodTypeChange('month')}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              >
                Month
              </button>
              <button
                on:click={() => handlePeriodTypeChange('quarter')}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'quarter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              >
                Quarter
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700 mb-2 block">
              {selectedPeriodType === 'month' ? 'Select Month' : 'Select Quarter'}
            </label>
            <div class="relative">
              <select
                bind:value={selectedPeriodValue}
                on:change={(e) => handlePeriodValueChange(e.currentTarget.value)}
                class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
              >
                {#each periodValues as value}
                  <option value={value}>{value}</option>
                {/each}
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Icon icon="lucide:loader-2" class="h-8 w-8 animate-spin text-green-600" />
      </div>
    {/if}

    <!-- Error State -->
    {#if error && !loading}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-800">
          <Icon icon="lucide:alert-circle" class="h-5 w-5" />
          <p class="font-medium">Error loading data</p>
        </div>
        <p class="text-sm text-red-600 mt-1">{error}</p>
      </div>
    {/if}

    <!-- No Records/Meaningful Data Available State -->
    {#if performanceData && !loading && !hasMeaningfulData}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="lucide:inbox" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            No Activity Recorded
          </h3>
          <p class="text-sm text-gray-600 mb-1">
            No performance activity found for the selected period
          </p>
          <p class="text-xs text-gray-500 mb-1">
            {registryType} • {selectedPeriodValue} • {selectedYear}
          </p>
          <p class="text-xs text-gray-400">
            All units show zero assignments and treatments
          </p>
          <button
            on:click={handleClearFilters}
            class="mt-6 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
            Try Different Filters
          </button>
        </div>
      </div>
    {/if}

    <!-- Performance Data -->
    {#if performanceData && !loading && hasMeaningfulData}
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-lg border-2 border-green-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:building-2" class="h-5 w-5 text-green-600" />
            </div>
            <p class="text-sm text-gray-600">Total Units</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalUnits}</p>
          <p class="text-xs text-gray-500 mt-1">{activeUnits.length} active</p>
        </div>

        <div class="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg border-2 border-blue-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:file-text" class="h-5 w-5 text-blue-600" />
            </div>
            <p class="text-sm text-gray-600">Total Assigned</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalAssigned}</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-lg border-2 border-green-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:check-circle" class="h-5 w-5 text-green-600" />
            </div>
            <p class="text-sm text-gray-600">Total Treated</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalTreated}</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-lg border-2 border-green-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:trending-up" class="h-5 w-5 text-green-600" />
            </div>
            <p class="text-sm text-gray-600">Overall Rate</p>
          </div>
          <p class="text-3xl font-bold text-green-600">{performanceData.overview.overallRate}%</p>
        </div>
      </div>

      <!-- Unit Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {#each activeUnits as unit, index}
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: {COLORS[index % COLORS.length]}20">
                  <Icon icon="lucide:building" class="h-5 w-5" style="color: {COLORS[index % COLORS.length]}" />
                </div>
                <h3 class="font-semibold text-slate-800">{unit.unitName}</h3>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Assigned</span>
                <span class="font-semibold text-slate-800">{unit.totalAssigned}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Treated</span>
                <span class="font-semibold text-slate-800">{unit.totalTreated}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Treatment Rate</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {unit.treatmentRate}%
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="text-sm text-gray-600">Staff Count</span>
                <span class="font-semibold text-slate-800">{unit.staffCount}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Avg per Staff</span>
                <span class="font-semibold text-green-600">{unit.avgPerStaff}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- No Data Selected State -->
    {#if !performanceData && !loading && !error}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <Icon icon="lucide:building-2" class="w-16 h-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Select Filters to View Unit Performance
          </h3>
          <p class="text-sm text-gray-600">
            Choose a year, period type, and period value to view unit performance data
          </p>
        </div>
      </div>
    {/if}

  </div>
</div>