<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import ComparisonCharts from "../ComparisonCharts.svelte";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { parseDate } from "@internationalized/date";
  import { toast } from "svelte-sonner"; // ✅ add toast import
  import { baseURL } from "$lib/helpers"; // ✅ add baseURL import
  import { statisticsApi, type StaffPerformanceData } from "$lib/utils/statisticsApi";
  import { ApplicationUnits, getUnitsForFileType, FilingType } from "$lib/helpers";
  import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    DoughnutController,
    ArcElement
  } from "chart.js";

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

  // ✅ Types for comparison
  interface FinancePeriodRequestDto {
    periodType: string;
    periodValue?: string;
    year?: number;
    startYear?: number;
    endYear?: number;
    startDate?: string;
    endDate?: string;
  }

  interface ComparisonPeriod extends FinancePeriodRequestDto {
    _id: number;
    displayLabel: string;
  }

  interface StaffPerformanceEntryDto {
    staffId: string;
    staffName: string;
    staffEmail: string;
    totalAssigned: number;
    totalTreated: number;
    percentage: number;
    contributionToUnit: number;
  }

  interface StaffPerformanceSummaryDto {
    totalAssigned: number;
    totalTreated: number;
    treatmentRate: number;
  }

  interface StaffPerformanceDataDto {
    unitId: number;
    unitName: string;
    registryType: string;
    period: { type: string; value: string; year: number };
    summary: StaffPerformanceSummaryDto;
    staffPerformance: StaffPerformanceEntryDto[];
  }

  interface StaffPerformanceComparisonDataDto {
    registryType: string;
    unitId: number;
    unitName: string;
    periods: StaffPerformanceDataDto[];
  }

  const COLORS = [
    "#265640", "#496e5a", "#677b71", "#806f56", "#616c78"
  ];

  // Initialize with default, set properly in onMount
  let registryType = "Trademark";

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
  let selectedStartYear = new Date().getFullYear() - 1;
  let selectedEndYear = new Date().getFullYear();
  function dateInputValue(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  let selectedStartDate = dateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  let selectedEndDate = dateInputValue(new Date());
  let loadedPeriodLabel = "";
  $: invalidYearRange = selectedPeriodType === "year-range" && selectedStartYear > selectedEndYear;
  $: invalidDateRange = selectedPeriodType === "date-range" && (!selectedStartDate || !selectedEndDate || selectedStartDate > selectedEndDate);
  $: invalidPeriodRange = invalidYearRange || invalidDateRange;
  
  // Search filter
  let searchQuery = "";
  let sortField: "staffName" | "totalAssigned" | "totalTreated" | "percentage" = "percentage";
  let sortAscending = false;

  function sortStaff(field: typeof sortField) {
    sortAscending = sortField === field ? !sortAscending : field === "staffName";
    sortField = field;
  }
  
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
  ).sort((first, second) => {
    const difference = sortField === "staffName"
      ? first.staffName.localeCompare(second.staffName)
      : first[sortField] - second[sortField];
    return sortAscending ? difference : -difference;
  }) || [];

  // Display staff based on showAllStaff state
  $: displayedStaff = showAllStaff ? filteredStaff : filteredStaff.slice(0, 10);
  
  // Check if we need to show "See All" button (more than 10 staff)
  $: hasMoreStaff = filteredStaff.length > 10;

  // Get selected unit name
  $: selectedUnitName = units.find(u => u.unitId === selectedUnit)?.unitName || "";

  const CHART_COLORS = [
    "#10b981", "#3b82f6", "#a855f7", "#ec4899",
    "#f59e0b", "#ef4444", "#06b6d4", "#84cc16",
    "#f97316", "#6366f1"
  ];

  // Chart refs
  let barCanvas: HTMLCanvasElement;
  let doughnutCanvas: HTMLCanvasElement;
  let barChart: Chart | null = null;
  let doughnutChart: Chart | null = null;

  // Top 10 staff for charts
  $: top10Staff = performanceData
    ? [...performanceData.staffPerformance]
        .sort((a, b) => b.totalTreated - a.totalTreated)
        .slice(0, 10)
    : [];

  // ✅ Comparison state
  let compareMode = false;
  let comparisonPeriods: ComparisonPeriod[] = [];
  let nextId = 0;
  let comparisonResults: StaffPerformanceComparisonDataDto | null = null;
  let loadedComparisonLabels: string[] = [];

  // ✅ Build current period object
  function buildCurrentPeriod(): FinancePeriodRequestDto {
    const period = { periodType: selectedPeriodType, periodValue: selectedPeriodValue, year: selectedYear };
    if (selectedPeriodType === "date-range") {
      return { ...period, startDate: selectedStartDate, endDate: selectedEndDate };
    }
    if (selectedPeriodType === "year-range") {
      return { ...period, startYear: selectedStartYear, endYear: selectedEndYear };
    }
    return period;
  }

  // ✅ Build display label for comparison pill
  function buildDisplayLabel(period: FinancePeriodRequestDto): string {
    if (period.periodType === "date-range") {
      const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return `${formatDate(period.startDate!)} - ${formatDate(period.endDate!)}`;
    }
    if (period.periodType === "year-range") return `${period.startYear} - ${period.endYear}`;
    if (period.periodType === "year") return `${period.year}`;
    return `${period.periodValue} ${period.year}`;
  }

  function toggleCompareMode() {
    compareMode = !compareMode;
    if (compareMode) destroyCharts();
    else { comparisonPeriods = []; comparisonResults = null; }
  }

  function addToComparison() {
    if (invalidYearRange) { toast.error("Start year cannot be after end year"); return; }
    if (invalidDateRange) { toast.error("Please select both dates with the start on or before the end"); return; }
    if (comparisonPeriods.length >= 5) { toast.warning("Maximum 5 periods allowed"); return; }
    const period = buildCurrentPeriod();
    const displayLabel = buildDisplayLabel(period);
    comparisonPeriods = [...comparisonPeriods, { ...period, _id: nextId++, displayLabel }];
    toast.success(`Added: ${displayLabel}`);
  }

  function removePeriod(id: number) {
    comparisonPeriods = comparisonPeriods.filter(p => p._id !== id);
  }

  async function fetchComparison() {
    if (selectedUnit === null) { toast.error("Please select a unit"); return; }
    if (comparisonPeriods.length < 2) { toast.error("Please add at least 2 periods to compare"); return; }
    const requestedPeriods = [...comparisonPeriods];
    loading = true; error = null; comparisonResults = null;
    try {
      const dto = {
        registryType,
        unitId: selectedUnit,
        periods: requestedPeriods.map(({ _id, displayLabel, ...p }) => p)
      };
      const response = await fetch(`${baseURL}/api/statistics/performance/staff/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch comparison");
      comparisonResults = data.data;
      loadedComparisonLabels = comparisonResults!.periods.map((result, index) => result.period.type.toLowerCase() === requestedPeriods[index]?.periodType
        ? requestedPeriods[index].displayLabel
        : buildDisplayLabel({ periodType: result.period.type.toLowerCase(), periodValue: result.period.value, year: result.period.year }));
    } catch (e) {
      error = (e as Error).message;
      toast.error(error ?? "An error occurred");
    } finally { loading = false; }
  }

  function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
  }

  function renderCharts() {
    if (!performanceData || !barCanvas || !doughnutCanvas || top10Staff.length === 0) return;

    destroyCharts();

    const labels = top10Staff.map(s => s.staffName);
    const treated = top10Staff.map(s => s.totalTreated);

    // Horizontal Bar Chart — Top performers
    barChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Assigned",
            data: top10Staff.map(staff => staff.totalAssigned),
            backgroundColor: "#3b82f6",
            borderRadius: 4,
            barPercentage: 0.7,
          },
          {
            label: "Processed",
            data: treated,
            backgroundColor: "#16a34a",
            borderRadius: 6,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 16 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x.toLocaleString()} files`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });

    // Doughnut Chart — Share of total
    doughnutChart = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: treated,
          backgroundColor: CHART_COLORS,
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11 },
              padding: 12,
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const val = ctx.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return ` ${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Re-render charts when data changes
  $: if (top10Staff.length > 0 && barCanvas && doughnutCanvas) {
    setTimeout(() => renderCharts(), 50);
  }

  // Destroy charts when unit changes or filters cleared
  $: if (!performanceData) {
    destroyCharts();
  }

  onMount(() => {

    registryType = $page.url.searchParams.get("registryType") ?? "Trademark";

    // Re-derive filingType and units after registryType is set
    filingType = registryType === "Patent" ? FilingType.Patent :
                 registryType === "Design" ? FilingType.Design :
                 FilingType.Trademark;

    units = getUnitsForFileType(filingType);

    if (units.length > 0) {
      selectedUnit = units[0].unitId;
      loadPerformanceData();
    }

    return () => destroyCharts();
  });

  async function loadPerformanceData() {
    if (selectedUnit === null) return;
    if (invalidYearRange) { toast.error("Start year cannot be after end year"); return; }
    if (invalidDateRange) { toast.error("Please select both dates with the start on or before the end"); return; }
    const period = buildCurrentPeriod();

    try {
      loading = true;
      error = null;
      performanceData = null;
      
      performanceData = await statisticsApi.getStaffPerformance(
        registryType,
        selectedUnit,
        selectedPeriodType,
        selectedPeriodValue,
        selectedYear,
        period.periodType === "year-range" ? { startYear: period.startYear!, endYear: period.endYear! }
          : period.periodType === "date-range" ? { startDate: period.startDate!, endDate: period.endDate! } : undefined
      );
      loadedPeriodLabel = performanceData.period.type.toLowerCase() === period.periodType
        ? buildDisplayLabel(period)
        : buildDisplayLabel({ periodType: performanceData.period.type.toLowerCase(), periodValue: performanceData.period.value, year: performanceData.period.year });

    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load performance data";

    } finally {
      loading = false;
    }
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    if (value && value !== "") {
      selectedUnit = parseInt(value) as ApplicationUnits;

      searchQuery = "";

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

      selectedPeriodValue = selectedYear.toString();
    }

  }

  function handlePeriodValueChange(value: string) {
    selectedPeriodValue = value;

  }

  function handleYearChange(value: number) {
    selectedYear = value;
    
    if (selectedPeriodType === "year") {
      selectedPeriodValue = value.toString();
    }
  }

  function handleClearFilters() {
    // Reset to current date defaults
    selectedPeriodType = "month";
    selectedYear = new Date().getFullYear();
    selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    selectedStartYear = new Date().getFullYear() - 1;
    selectedEndYear = new Date().getFullYear();
    selectedStartDate = dateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    selectedEndDate = dateInputValue(new Date());
    selectedUnit = null;
    searchQuery = "";
    performanceData = null;
    loadedPeriodLabel = "";
    comparisonPeriods = [];
    comparisonResults = null;
    compareMode = false;
    error = null;
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

<div class="performance-workspace min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- Back Button & Page Title (Same Line) -->
    <div class="report-header flex items-center mb-6">
      <button
        on:click={handleBack}
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg px-4 py-2"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Statistics</span>
      </button>
      <div class="report-heading">
        <h1 class="text-2xl font-semibold text-gray-900">Executive Dashboard - Staff Performance</h1>
        <p class="registry-context text-sm text-gray-500"><Icon icon="lucide:building-2" class="w-3.5 h-3.5" />{registryType} Registry</p>
      </div>
      {#if (compareMode ? comparisonResults : performanceData) && !loading}
        <button on:click={() => window.print()} class="report-print flex items-center gap-2" title="Print report">
          <Icon icon="lucide:printer" class="w-4 h-4" />
          <span>Print Report</span>
        </button>
      {/if}
    </div>

    <!-- Staff Performance Header & Filters Section -->
    <div class="filter-toolbar bg-white border border-gray-200 rounded-lg p-4 mb-6">
      
      <!-- Section Title with Icon -->
      <div class="filter-heading flex items-center justify-between gap-4">
        <h2 class="filter-title text-sm font-semibold text-gray-700"><Icon icon="lucide:sliders-horizontal" class="w-4 h-4" />Reporting Period</h2>

        <!-- ✅ Compare Toggle Button -->
        <button
          on:click={toggleCompareMode}
          aria-pressed={compareMode}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex-shrink-0
            {compareMode
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-600'}"
        >
          <Icon icon="lucide:git-compare" class="w-4 h-4" />
          Compare Periods
        </button>
      </div>

      <!-- Filters Layout -->
      <div class="filter-fields" class:date-range-fields={selectedPeriodType === 'date-range'}>

        <!-- LEFT: existing filters -->
        <div class="period-fields">
          
          <!-- Row 1: Year & Clear Button -->
          <div class="year-fields">
            {#if selectedPeriodType !== 'year-range' && selectedPeriodType !== 'date-range'}
            <div class="year-picker">
              <label for="staff-year" class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
                Year
              </label>
              <div class="relative">
                <select
                  id="staff-year"
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
            {/if}
            
          </div>

          <!-- Row 2: Period Type & Period Value -->
          <div class="period-value-fields">
            <div class="period-type-picker">
              <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="lucide:calendar" class="w-5 h-5 text-gray-500" />
                Period Type
              </div>
              <div class="period-segments inline-flex w-full gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  on:click={() => handlePeriodTypeChange('month')}
                  aria-pressed={selectedPeriodType === 'month'}
                  class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                >
                  Month
                </button>
                <button
                  on:click={() => handlePeriodTypeChange('quarter')}
                  aria-pressed={selectedPeriodType === 'quarter'}
                  class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'quarter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                >
                  Quarter
                </button>
                <button
                  on:click={() => handlePeriodTypeChange('year-range')}
                  aria-pressed={selectedPeriodType === 'year-range'}
                  class="flex-1 px-2 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'year-range' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                >
                  Year Range
                </button>
                <button
                  on:click={() => handlePeriodTypeChange('date-range')}
                  aria-pressed={selectedPeriodType === 'date-range'}
                  class="flex-1 px-2 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'date-range' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                >Date Range</button>
              </div>
            </div>

            {#if selectedPeriodType === 'date-range'}
              <div class="range-picker date-calendar-picker">
                <label for="staff-start-date" class="text-sm font-semibold text-gray-700 mb-2 block">Start Date</label>
                <input id="staff-start-date" type="date" bind:value={selectedStartDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'date-range-error' : undefined} />
                <div class="mt-2 overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <Calendar
                    aria-label="Start date calendar"
                    value={selectedStartDate ? parseDate(selectedStartDate) : undefined}
                    onValueChange={(date) => (selectedStartDate = date?.toString() ?? "")}
                    preventDeselect
                    fixedWeeks
                    class="w-max mx-auto"
                  />
                </div>
              </div>
              <div class="range-picker date-calendar-picker">
                <label for="staff-end-date" class="text-sm font-semibold text-gray-700 mb-2 block">End Date</label>
                <input id="staff-end-date" type="date" bind:value={selectedEndDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'date-range-error' : undefined} />
                <div class="mt-2 overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <Calendar
                    aria-label="End date calendar"
                    value={selectedEndDate ? parseDate(selectedEndDate) : undefined}
                    onValueChange={(date) => (selectedEndDate = date?.toString() ?? "")}
                    preventDeselect
                    fixedWeeks
                    class="w-max mx-auto"
                  />
                </div>
              </div>
              {#if invalidDateRange}
                <p id="date-range-error" class="range-error" role="alert">Select both dates with the start on or before the end.</p>
              {/if}
            {:else if selectedPeriodType === 'year-range'}
              <div class="range-picker">
                <label for="staff-start-year" class="text-sm font-semibold text-gray-700 mb-2 block">Start Year</label>
                <select id="staff-start-year" bind:value={selectedStartYear} aria-invalid={invalidYearRange} aria-describedby={invalidYearRange ? 'year-range-error' : undefined}>
                  {#each years as year}<option value={year}>{year}</option>{/each}
                </select>
              </div>
              <div class="range-picker">
                <label for="staff-end-year" class="text-sm font-semibold text-gray-700 mb-2 block">End Year</label>
                <select id="staff-end-year" bind:value={selectedEndYear} aria-invalid={invalidYearRange} aria-describedby={invalidYearRange ? 'year-range-error' : undefined}>
                  {#each years as year}<option value={year}>{year}</option>{/each}
                </select>
              </div>
              {#if invalidYearRange}
                <p id="year-range-error" class="range-error" role="alert">Start year cannot be after end year.</p>
              {/if}
            {:else}
            <div class="period-value-picker">
              <label for="periodValue" class="text-sm font-semibold text-gray-700 mb-2 block">
                {selectedPeriodType === 'month' ? 'Select Month' : 'Select Quarter'}
              </label>
              <div class="relative">
                <select
                  id="periodValue"
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
            {/if}
          </div>

        </div>

        <!-- RIGHT: Unit Selection OR Comparison Panel -->
        <div class="unit-fields">
            <!-- existing unit select -->
            <div class="unit-picker">
              <div class="flex items-center gap-3 mb-3">
                <Icon icon="lucide:building-2" class="w-5 h-5 text-gray-500" />
                <label for="staff-unit" class="text-sm font-semibold text-gray-700">Unit</label>
              </div>
              <div class="relative">
                <select
                  id="staff-unit"
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
            </div>
        </div>
          {#if compareMode}
            <!-- ✅ Comparison Panel -->
            <div class="comparison-panel bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div class="flex items-center gap-3 mb-1">
                <Icon icon="lucide:layers" class="w-5 h-5 text-green-600" />
                <span class="text-sm font-semibold text-gray-700">Comparison Periods</span>
                <span class="ml-auto text-xs text-gray-400">{comparisonPeriods.length}/5</span>
              </div>

              <button
                on:click={addToComparison}
                disabled={comparisonPeriods.length >= 5 || invalidPeriodRange}
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                Add Period
              </button>

              {#if comparisonPeriods.length > 0}
                <div class="flex flex-col gap-2 mt-1">
                  {#each comparisonPeriods as period, index}
                    <div class="comparison-period flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium" style="border-left-color: {COLORS[index % COLORS.length]}">
                      <span>{period.displayLabel}</span>
                      <button on:click={() => removePeriod(period._id)} class="ml-2 hover:opacity-70" title={`Remove ${period.displayLabel}`} aria-label={`Remove ${period.displayLabel}`}>
                        <Icon icon="mdi:close" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-xs text-gray-400 text-center mt-1">No periods added yet.</p>
              {/if}

              <button
                on:click={() => { comparisonPeriods = []; comparisonResults = null; }}
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors mt-auto"
              >
                <Icon icon="lucide:x" class="w-4 h-4" />
                Clear All
              </button>
            </div>
          {/if}

      </div>

      <!-- ✅ Action Buttons — Fetch or Compare -->
      <div class="filter-actions flex justify-end">
        <button on:click={handleClearFilters} class="reset-action" title="Reset filters" aria-label="Reset filters" disabled={loading}>
          <Icon icon="lucide:rotate-ccw" class="w-4 h-4" />
        </button>
        {#if compareMode}
          <button
            on:click={fetchComparison}
            disabled={loading || selectedUnit === null || comparisonPeriods.length < 2}
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {#if loading}
              <Icon icon="line-md:loading-loop" class="h-4 w-4 animate-spin" />
              Comparing...
            {:else}
              <Icon icon="lucide:git-compare" class="h-4 w-4" />
              Compare Periods
            {/if}
          </button>
        {:else}
          <button
            on:click={loadPerformanceData}
            disabled={loading || selectedUnit === null || invalidPeriodRange}
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {#if loading}
              <Icon icon="line-md:loading-loop" class="h-4 w-4 animate-spin" />
              Fetching...
            {:else}
              <Icon icon="lucide:search" class="h-4 w-4" />
              Fetch
            {/if}
          </button>
        {/if}
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
    {#if selectedUnit !== null && performanceData && !loading && !compareMode}
      <section class="summary-band" aria-label="Performance summary">
        <div class="summary-metric metric-assigned">
          <span class="metric-label"><Icon icon="lucide:files" class="w-4 h-4" />Assigned</span>
          <strong>{performanceData.summary.totalAssigned.toLocaleString()}</strong>
        </div>
        <div class="summary-metric metric-processed">
          <span class="metric-label"><Icon icon="lucide:file-check" class="w-4 h-4" />Processed</span>
          <strong>{totalApplicationsTreated.toLocaleString()}</strong>
        </div>
        <div class="summary-metric metric-rate">
          <span class="metric-label"><Icon icon="lucide:chart-no-axes-combined" class="w-4 h-4" />Processing Rate</span>
          <strong>{performanceData.summary.treatmentRate}%</strong>
        </div>
        <div class="summary-metric metric-staff">
          <span class="metric-label"><Icon icon="lucide:users" class="w-4 h-4" />Staff Members</span>
          <strong>{totalStaff}</strong>
          <span class="metric-note">{averagePerStaff.toLocaleString()} processed per staff member</span>
        </div>
      </section>
    {/if}

    {#if compareMode && comparisonResults && !loading}
      <section class="staff-results comparison-results" aria-label="Period comparison results">
        <div class="table-heading">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{comparisonResults.unitName}</h2>
            <p class="report-period text-xs text-gray-500 mt-1"><Icon icon="lucide:git-compare" class="w-3.5 h-3.5" />Period Comparison</p>
          </div>
        </div>
        <div class="staff-table-scroll mb-6">
          <table class="staff-table">
            <thead><tr><th scope="col">Period</th><th scope="col">Assigned</th><th scope="col">Processed</th><th scope="col">Processing Rate</th></tr></thead>
            <tbody>
              {#each comparisonResults.periods as period, index}
                <tr>
                  <th scope="row"><span class="comparison-key" style={`--period-color: ${COLORS[index % COLORS.length]}`}>{loadedComparisonLabels[index]}</span></th>
                  <td>{period.summary.totalAssigned.toLocaleString()}</td>
                  <td class="processed-value">{period.summary.totalTreated.toLocaleString()}</td>
                  <td>{period.summary.treatmentRate}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <ComparisonCharts periods={comparisonResults.periods.map((period, index) => ({
          label: loadedComparisonLabels[index],
          totalAssigned: period.summary.totalAssigned,
          totalTreated: period.summary.totalTreated,
          processingRate: period.summary.treatmentRate
        }))} />
        {#each comparisonResults.periods as period, index}
          <h3 class="comparison-period-title" style={`--period-color: ${COLORS[index % COLORS.length]}`}>{loadedComparisonLabels[index]}</h3>
          <div class="staff-table-scroll mb-6">
            <table class="staff-table">
              <thead><tr><th scope="col">Staff Member</th><th scope="col">Assigned</th><th scope="col">Processed</th><th scope="col">Processing Rate</th></tr></thead>
              <tbody>
                {#each period.staffPerformance as staff}
                  <tr><th scope="row">{staff.staffName}</th><td>{staff.totalAssigned.toLocaleString()}</td><td class="processed-value">{staff.totalTreated.toLocaleString()}</td><td>{staff.percentage}%</td></tr>
                {:else}
                  <tr><td colspan="4">No staff data for this period.</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Staff Performance Metrics Section -->
    {#if selectedUnit !== null && performanceData && !loading && !compareMode}
      <section class="staff-results">
        
        <!-- Section Header -->
        <div class="table-heading">
          <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {performanceData.unitName}
          </h2>
          <p class="report-period text-xs text-gray-500 mt-1"><Icon icon="lucide:calendar-days" class="w-3.5 h-3.5" />{loadedPeriodLabel} · Staff Breakdown</p>
          </div>

        <!-- Search Bar -->
        <div class="staff-search relative">
          <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            bind:value={searchQuery}
            aria-label="Search staff by name"
            placeholder="Search staff..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        </div>

        <!-- Sort Info -->
        <div class="table-count flex items-center justify-between mb-4">
          <p class="text-xs text-gray-500">{totalStaff} staff members</p>
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
          <div class="staff-table-scroll">
            <table class="staff-table">
              <thead>
                <tr>
                  {#each [{ field: 'staffName', label: 'Staff Member' }, { field: 'totalAssigned', label: 'Assigned' }, { field: 'totalTreated', label: 'Processed' }, { field: 'percentage', label: 'Processing Rate' }] as column}
                    <th scope="col" aria-sort={sortField === column.field ? (sortAscending ? 'ascending' : 'descending') : 'none'}>
                      <button on:click={() => sortStaff(column.field === 'staffName' ? 'staffName' : column.field === 'totalAssigned' ? 'totalAssigned' : column.field === 'totalTreated' ? 'totalTreated' : 'percentage')}>
                        {column.label}
                        <Icon icon={sortField === column.field ? (sortAscending ? 'lucide:arrow-up' : 'lucide:arrow-down') : 'lucide:arrow-up-down'} class="w-3.5 h-3.5" />
                      </button>
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each displayedStaff as staff}
                  <tr>
                    <th scope="row">
                      <div class="staff-identity">
                        <span class="staff-avatar" aria-hidden="true">{staff.staffName.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase()}</span>
                        <span class="staff-name">{staff.staffName}</span>
                      </div>
                      {#if staff.staffName === topPerformer?.staffName && staff.percentage > 0}
                        <span class="leader-label"><Icon icon="lucide:award" class="w-3.5 h-3.5" />Top Rate</span>
                      {/if}
                    </th>
                    <td>{staff.totalAssigned.toLocaleString()}</td>
                    <td class="processed-value">{staff.totalTreated.toLocaleString()}</td>
                    <td>
                      <div class="rate-cell">
                        <span>{staff.percentage}%</span>
                        <div class="rate-track" aria-hidden="true"><div style={`width: ${Math.max(0, Math.min(100, staff.percentage))}%`}></div></div>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
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
      </section>

      <!-- Charts Section — Below staff list -->
      {#if top10Staff.length > 0}
        <div class="chart-section grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 mt-6">

          <!-- Horizontal Bar Chart -->
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon icon="lucide:bar-chart-horizontal" class="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">Assigned vs Processed</h3>
                <p class="text-sm text-gray-500">
                  Top {top10Staff.length} staff by files processed
                </p>
              </div>
            </div>
            <div class="relative" style="height: {Math.max(top10Staff.length * 44, 200)}px">
              <canvas bind:this={barCanvas}></canvas>
            </div>
          </div>

          <!-- Doughnut Chart -->
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon icon="lucide:pie-chart" class="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">Processing Share</h3>
                <p class="text-sm text-gray-500">
                  Share of processed files among the top {top10Staff.length} staff
                </p>
              </div>
            </div>
            <div class="relative h-80">
              <canvas bind:this={doughnutCanvas}></canvas>
            </div>
          </div>

        </div>
      {/if}

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
  .performance-workspace {
    --report-green: #265640;
    color: #202923;
    background: linear-gradient(180deg, #f0f4f1 0, #fafafa 320px);
    letter-spacing: 0;
  }
  .report-header { gap: 20px; flex-wrap: wrap; border-bottom: 1px solid #d4e2da; padding-bottom: 22px; position: relative; }
  .report-heading { flex: 1; min-width: 180px; }
  .report-heading h1 { line-height: 1.3; }
  .report-heading p { margin-top: 4px; }
  .registry-context, .report-period, .filter-title { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .registry-context { color: #4d6959; }
  .report-print { border: 1px solid #000; border-radius: 6px; padding: 9px 14px; font-size: 13px; background: #000; color: #fff; }
  .report-print:hover { background: #000; }
  .filter-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 16px; row-gap: 16px; border-color: #d7e0da; background: white; }
  .filter-heading { grid-column: 1 / -1; }
  .filter-title { color: #2d5840; }
  .filter-fields { display: grid; grid-template-columns: minmax(150px, 1.2fr) minmax(300px, 1.7fr) minmax(140px, .9fr) minmax(140px, 1fr); gap: 16px; }
  .filter-fields.date-range-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .period-fields, .year-fields, .period-value-fields, .unit-fields { display: contents; }
  .unit-picker { grid-column: 1; grid-row: 1; min-width: 0; }
  .period-type-picker { grid-column: 2; grid-row: 1; min-width: 0; }
  .year-picker { grid-column: 3; grid-row: 1; }
  .period-value-picker { grid-column: 4; grid-row: 1; }
  .unit-picker > div:first-child { gap: 8px; margin-bottom: 8px; }
  .comparison-panel { grid-column: 1 / -1; }
  .comparison-period { border-left: 3px solid; background: #edf2ee; color: var(--report-green); }
  .filter-actions { align-self: start; padding-top: 28px; gap: 8px; }
  .reset-action { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex-shrink: 0; border: 1px solid #d7e3db; color: #52705d; background: #f5f8f6; }
  .reset-action:hover { background: #e8f1eb; }
  .filter-actions button:disabled { opacity: .5; cursor: not-allowed; }
  .filter-toolbar select { border-width: 1px; border-radius: 6px; padding-top: 10px; padding-bottom: 10px; height: 42px; }
  .filter-toolbar button { border-radius: 6px; }
  .filter-toolbar button.bg-green-600 { background: var(--report-green); border-color: var(--report-green); }
  .filter-toolbar button.bg-green-600:hover { background: #1e4432; }
  .period-segments { height: 42px; align-items: stretch; }
  .period-segments button { font-size: 12px; padding: 6px 8px; white-space: nowrap; }
  .period-segments button[aria-pressed='true'] { background: var(--report-green); color: white; box-shadow: none; }
  .range-picker { min-width: 0; }
  .range-picker select, .range-picker input { width: 100%; min-width: 0; height: 42px; border-radius: 6px; padding: 8px 10px; border: 1px solid #cfdad3; background: white; font-size: 13px; }
  .range-picker select:focus, .range-picker input:focus { outline: 2px solid #16a34a; outline-offset: 1px; }
  .range-picker select[aria-invalid='true'], .range-picker input[aria-invalid='true'] { border-color: #b91c1c; }
  .date-calendar-picker input { height: 44px; padding: 10px 16px; border-width: 2px; border-color: #d1d5db; border-radius: 8px; color: #111827; font-size: 14px; font-weight: 500; }
  .date-calendar-picker input[aria-invalid='true'] { border-color: #b91c1c; }
  .date-calendar-picker label { font-size: 14px; }
  .range-error { grid-column: 1 / -1; font-size: 12px; color: #b91c1c; }
  .filter-toolbar label, .filter-toolbar .period-value-fields > div > div:first-child { font-size: 12px; }
  .summary-band { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 28px; border-top: 1px solid #dce4de; border-bottom: 1px solid #dce4de; background: #fff; }
  .summary-metric { padding: 20px 24px; border-right: 1px solid #dce4de; min-width: 0; }
  .summary-metric:last-child { border-right: 0; }
  .metric-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5c6861; }
  .summary-metric strong { display: block; color: var(--report-green); font-size: 28px; font-weight: 600; margin-top: 10px; line-height: 1.2; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .metric-note { display: block; font-size: 11px; color: #68766d; margin-top: 6px; }
  .staff-results { padding: 0; }
  .comparison-key { display: inline-flex; align-items: center; gap: 8px; }
  .comparison-key::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--period-color); flex-shrink: 0; }
  .comparison-period-title { border-left: 3px solid var(--period-color); padding-left: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
  .table-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
  .staff-search { width: 280px; max-width: 100%; }
  .table-count { margin-bottom: 12px; }
  .staff-table-scroll { overflow-x: auto; border: 1px solid #dde5df; border-radius: 6px; background: white; }
  .staff-table { width: 100%; min-width: 620px; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
  .staff-table thead { background: var(--report-green); }
  .staff-table th, .staff-table td { padding: 14px 18px; border-bottom: 1px solid #edf0ee; text-align: right; }
  .staff-table th:first-child { text-align: left; width: 40%; }
  .staff-table thead th { color: #f5f8f6; font-weight: 500; font-size: 12px; white-space: nowrap; border-bottom-color: var(--report-green); }
  .staff-table thead button { display: inline-flex; align-items: center; gap: 7px; }
  .staff-table thead button:hover { color: #d4e5da; }
  .staff-table tbody th { font-weight: 500; }
  .staff-table tbody tr:hover { background: #f5faf7; }
  .staff-table tbody tr:nth-child(even) { background: #f8faf9; }
  .staff-table tbody tr:nth-child(even):hover { background: #f0f8f3; }
  .staff-table tbody tr:last-child > * { border-bottom: 0; }
  .staff-name { display: block; color: var(--report-green); overflow-wrap: anywhere; }
  .staff-identity { display: flex; align-items: center; gap: 10px; }
  .staff-avatar { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: #e5ede7; color: var(--report-green); font-weight: 600; font-size: 11px; }
  .leader-label { display: inline-flex; align-items: center; gap: 4px; color: #68786e; font-size: 10px; margin-top: 5px; font-weight: 500; }
  .processed-value { color: var(--report-green); font-weight: 600; }
  .rate-cell { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .rate-cell span { min-width: 42px; }
  .rate-track { width: 64px; height: 4px; background: #e5ece7; border-radius: 2px; overflow: hidden; }
  .rate-track div { height: 100%; background: #477b5d; }
  .chart-section > div { box-shadow: none; padding: 20px; border-color: #dde5df; }
  .chart-section h3 { font-size: 14px; }
  .chart-section p { font-size: 12px; }
  button:focus-visible { outline: 2px solid #15803d; outline-offset: 3px; }
  @media (max-width: 1100px) {
    .filter-toolbar { grid-template-columns: minmax(0, 1fr); }
    .filter-fields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .year-picker, .period-value-picker { grid-column: auto; grid-row: auto; }
    .filter-actions { padding-top: 0; }
  }
  @media (max-width: 700px) {
    .report-header { gap: 12px; }
    .report-header > button:first-child { padding: 8px; }
    .report-heading { min-width: 140px; }
    .report-heading h1 { font-size: 20px; }
    .filter-heading { flex-wrap: wrap; }
    .filter-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px; }
    .unit-picker { grid-column: 1 / -1; }
    .period-type-picker { grid-column: 1 / -1; grid-row: 2; }
    .date-range-fields .date-calendar-picker { grid-column: 1 / -1; }
    .summary-band { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; }
    .summary-metric { padding: 18px 14px; }
    .summary-metric:nth-child(even) { border-right: 0; }
    .summary-metric strong { font-size: 26px; }
    .table-heading { align-items: stretch; flex-direction: column; }
    .staff-search { width: 100%; }
    .chart-section { gap: 16px; }
  }
  @media (max-width: 480px) {
    .period-segments { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); height: auto; }
    .period-segments button { min-height: 34px; }
  }
  @media print {
    .performance-workspace { background: white; }
    .report-header > button, .filter-toolbar, .staff-search, .staff-results > div:last-child > button { display: none; }
    .staff-table-scroll { overflow: visible; }
    .staff-table { min-width: 0; }
    .summary-band, .chart-section > div { break-inside: avoid; }
    .summary-band, .staff-results, .chart-section { animation: none; }
  }
</style>