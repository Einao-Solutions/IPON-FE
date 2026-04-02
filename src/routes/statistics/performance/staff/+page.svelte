<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import { statisticsApi, type StaffPerformanceData } from "$lib/utils/statisticsApi";
  import { ApplicationUnits, getUnitsForFileType, FilingType } from "$lib/helpers";

  // Get registry type from URL params
  let registryType = $page.url.searchParams.get("registryType") || "Trademark";
  
  // Map registry type to FilingType
  $: filingType = registryType === "Patent" ? FilingType.Patent : 
                  registryType === "Design" ? FilingType.Design : 
                  FilingType.Trademark;
  
  // Get units based on filing type
  $: units = getUnitsForFileType(filingType);
  
  // Filter states - Set defaults to current date
  let selectedUnit: ApplicationUnits | null = null;
  let selectedPeriodType = "month"; // Default to month
  let selectedYear = new Date().getFullYear(); // Current year
  let selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' }); // Current month name
  
  // Search filter
  let searchQuery = "";
  
  // View state for "See All" functionality
  let showAllStaff = false;
  
  // Data states
  let performanceData: StaffPerformanceData | null = null;
  let loading = false;
  let error: string | null = null;

  // Period options
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic period values based on selected period type
  $: periodValues = selectedPeriodType === "month" ? months : 
                    selectedPeriodType === "quarter" ? quarters : 
                    [];

  // Calculate overview metrics
  $: totalStaff = performanceData?.staffPerformance.length || 0;
  $: totalApplicationsTreated = performanceData?.summary.totalTreated || 0;
  $: averagePerStaff = totalStaff > 0 ? Math.round(totalApplicationsTreated / totalStaff) : 0;
  $: topPerformer = performanceData?.staffPerformance.reduce((max, staff) => 
    staff.percentage > max.percentage ? staff : max, 
    performanceData?.staffPerformance[0] || { staffName: 'N/A', percentage: 0 }
  );

  // Filter staff by search query
  $: filteredStaff = performanceData?.staffPerformance.filter(staff => 
    staff.staffName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Display staff based on showAllStaff state
  $: displayedStaff = showAllStaff ? filteredStaff : filteredStaff.slice(0, 10);
  
  // Check if we need to show "See All" button (more than 10 staff)
  $: hasMoreStaff = filteredStaff.length > 10;

  // Get selected unit name
  $: selectedUnitName = units.find(u => u.unitId === selectedUnit)?.unitName || "";

  async function loadPerformanceData() {
    if (selectedUnit === null) return;

    try {
      loading = true;
      error = null;
        // console.log("Fetching performance data for:", {
        //   registryType,
        //   unit: selectedUnit,
        //   periodType: selectedPeriodType,
        //   periodValue: selectedPeriodValue,
        //   year: selectedYear
        // });
      
      performanceData = await statisticsApi.getStaffPerformance(
        registryType,
        selectedUnit,
        selectedPeriodType,
        selectedPeriodValue,
        selectedYear
      );
      // console.log("✅ Performance data loaded:", performanceData);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load performance data";
      // console.error("❌ Error loading performance data:", err);
    } finally {
      loading = false;
    }
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    if (value && value !== "") {
      selectedUnit = parseInt(value) as ApplicationUnits;
      // console.log("Unit selected:", selectedUnit, selectedUnitName);
      searchQuery = "";
      loadPerformanceData();
    }
  }

  function handlePeriodTypeChange(newPeriodType: string) {
    selectedPeriodType = newPeriodType;
    
    // Set default value based on period type
    if (newPeriodType === "month") {
      selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    } else if (newPeriodType === "quarter") {
      const currentMonth = new Date().getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);
      selectedPeriodValue = quarters[currentQuarter];
    } else {
      // For "year", no period value needed
      selectedPeriodValue = selectedYear.toString();
    }
    
    if (selectedUnit !== null) {
      loadPerformanceData();
    }
  }

  function handlePeriodValueChange(value: string) {
    selectedPeriodValue = value;
    if (selectedUnit !== null) {
      loadPerformanceData();
    }
  }

  function handleYearChange(value: number) {
    selectedYear = value;
    
    // If period type is "year", update period value to match selected year
    if (selectedPeriodType === "year") {
      selectedPeriodValue = value.toString();
    }
    
    if (selectedUnit !== null) {
      loadPerformanceData();
    }
  }

  function handleClearFilters() {
    // Reset to current date defaults
    selectedPeriodType = "month";
    selectedYear = new Date().getFullYear();
    selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    selectedUnit = null;
    searchQuery = "";
    performanceData = null;
    showAllStaff = false; // Reset view state
  }

  function handleBack() {
    // Navigate back to the statistics list view with the selected registry
    goto(`/statistics?registry=${registryType}`);
  }

  function toggleShowAll() {
    showAllStaff = !showAllStaff;
  }

  // Reset showAllStaff when search query changes or unit changes
  $: if (searchQuery || selectedUnit) {
    showAllStaff = false;
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- Back Button & Page Title (Same Line) -->
    <div class="flex items-center mb-6">
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
      <!-- Spacer to balance the back button -->
      <div class="w-[200px]"></div>
    </div>

    <!-- Staff Performance Header & Filters Section -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      
      <!-- Section Title with Icon -->
      <div class="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex-shrink-0 w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
          <Icon icon="lucide:users" class="w-7 h-7 text-white" />
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">
            Staff Performance
          </h2>
          <p class="text-sm text-gray-600">
            {registryType} Registry - Individual staff productivity metrics
          </p>
        </div>
      </div>

      <!-- Filters Layout - Responsive Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        <!-- LEFT SIDE: Filters -->
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

        <!-- RIGHT SIDE: Unit Selection -->
        <div class="flex flex-col justify-center">
          <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 h-full flex flex-col justify-center">
            <div class="flex items-center gap-3 mb-3">
              <Icon icon="lucide:building-2" class="w-5 h-5 text-gray-500" />
              <span class="text-sm font-semibold text-gray-700">Select Unit</span>
            </div>
            <div class="relative">
              <select
                value={selectedUnit ?? ""}
                on:change={handleUnitChange}
                class="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
              >
                <option value="" disabled>Choose a unit...</option>
                {#each units as unit (unit.unitId)}
                  <option value={unit.unitId}>{unit.unitName}</option>
                {/each}
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <p class="text-xs text-gray-500 mt-2">
              {units.length} unit{units.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-green-600" />
      </div>
    {/if}

    <!-- Error State -->
    {#if error && !loading}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-2 text-red-800">
          <Icon icon="mdi:alert-circle" class="h-5 w-5" />
          <p class="font-medium text-sm">Error loading data</p>
        </div>
        <p class="text-xs text-red-600 mt-1">{error}</p>
      </div>
    {/if}

    <!-- Overview Summary Section (Show when unit selected) -->
    {#if selectedUnit !== null && performanceData && !loading}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Overview Summary
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Total Staff -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Icon icon="lucide:users" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-gray-900">
                  {totalStaff}
                </div>
                <div class="text-xs font-medium text-gray-600">
                  Total Staff
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: Total Applications Processed -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Icon icon="lucide:file-check" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-gray-900">
                  {totalApplicationsTreated.toLocaleString()}
                </div>
                <div class="text-xs font-medium text-gray-600">
                  Total Applications Processed
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Average per Staff -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Icon icon="lucide:trending-up" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-gray-900">
                  {averagePerStaff}
                </div>
                <div class="text-xs font-medium text-gray-600">
                  Average per Staff
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Top Performer -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Icon icon="lucide:award" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="text-base font-bold text-gray-900 truncate">
                  {topPerformer?.staffName || 'N/A'}
                </div>
                <div class="text-sm font-semibold text-green-600">
                  {topPerformer?.percentage || 0}%
                </div>
                <div class="text-xs font-medium text-gray-600">
                  Top Performer
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    {/if}

    <!-- Staff Performance Metrics Section -->
    {#if selectedUnit !== null && performanceData && !loading}
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        
        <!-- Section Header -->
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {selectedUnitName} - Staff Members
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            Total applications processed by unit: {totalApplicationsTreated}
          </p>
        </div>

        <!-- Search Bar -->
        <div class="relative mb-4">
          <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search staff by name..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <!-- Sort Info -->
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-gray-500">
            Staff sorted by performance (highest to lowest)
          </p>
          {#if filteredStaff.length > 0}
            <p class="text-xs text-gray-600 font-medium">
              Showing {showAllStaff ? filteredStaff.length : Math.min(10, filteredStaff.length)} of {filteredStaff.length} staff
            </p>
          {/if}
        </div>

        <!-- Staff List -->
        {#if filteredStaff.length === 0}
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center py-12">
            <Icon icon="lucide:user-x" class="w-12 h-12 text-gray-400 mb-3" />
            <p class="text-sm text-gray-600">No staff members found</p>
            <p class="text-xs text-gray-500">Try adjusting your search</p>
          </div>
        {:else}
          <!-- Scrollable Container (max height for first 5 items, scrollable up to 10) -->
          <div 
            class="space-y-2 {!showAllStaff && filteredStaff.length > 5 ? 'max-h-[400px] overflow-y-auto pr-2' : ''}"
            style="scrollbar-width: thin; scrollbar-color: #10b981 #f3f4f6;"
          >
            
            {#each displayedStaff as staff, index}
              <div class="border-b border-gray-100 last:border-b-0 py-3">
                
                <!-- Line 1: Name and Numbers -->
                <div class="flex items-center justify-between gap-4 mb-1">
                  <span class="text-sm font-semibold text-gray-900">
                    {staff.staffName}
                  </span>
                  <div class="flex items-center gap-3">
                    <span class="text-base font-bold text-gray-900">
                      {staff.totalTreated}/{staff.totalAssigned}
                    </span>
                    {#if index === 0}
                      <!-- Top Performer - Orange Badge -->
                      <span class="bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {staff.percentage}%
                      </span>
                    {:else}
                      <!-- Regular - Green Text -->
                      <span class="text-green-600 text-sm font-semibold min-w-[50px] text-right">
                        {staff.percentage}%
                      </span>
                    {/if}
                  </div>
                </div>

                <!-- Line 2: Performance Badge -->
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">
                    #{index + 1} {index === 0 ? 'Top Performer' : 'Performer'}
                  </span>
                </div>

              </div>
            {/each}

          </div>

          <!-- See All / Show Less Button (only show if more than 10 staff) -->
          {#if hasMoreStaff}
            <div class="mt-6 flex justify-center">
              <button
                on:click={toggleShowAll}
                class="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              >
                {#if showAllStaff}
                  <Icon icon="lucide:chevron-up" class="w-4 h-4" />
                  <span>Show Less</span>
                {:else}
                  <Icon icon="lucide:chevron-down" class="w-4 h-4" />
                  <span>See All ({filteredStaff.length} Staff)</span>
                {/if}
              </button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- No Unit Selected State -->
    {#if selectedUnit === null && !loading}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center">
          <Icon icon="lucide:inbox" class="w-16 h-16 text-gray-300 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Unit Selected</h3>
          <p class="text-sm text-gray-600">
            Please select a unit from the dropdown above to view staff performance
          </p>
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  /* Custom scrollbar styling for webkit browsers */
  :global(.space-y-2::-webkit-scrollbar) {
    width: 8px;
  }

  :global(.space-y-2::-webkit-scrollbar-track) {
    background: #f3f4f6;
    border-radius: 4px;
  }

  :global(.space-y-2::-webkit-scrollbar-thumb) {
    background: #10b981;
    border-radius: 4px;
  }

  :global(.space-y-2::-webkit-scrollbar-thumb:hover) {
    background: #059669;
  }
</style>