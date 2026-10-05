<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import ComparisonCharts from "../ComparisonCharts.svelte";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { parseDate } from "@internationalized/date";
  import { toast } from "svelte-sonner";
  import { statisticsApi, type UnitPerformanceData, type PerformanceRange } from "$lib/utils/statisticsApi";
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement } from "chart.js";

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  
  let registryType = $page.url.searchParams.get("registryType") || "Trademark";

  let selectedPeriodType = "month";
  let selectedPeriodValue = months[new Date().getMonth()]; // e.g. "July" not locale string
  let selectedYear = new Date().getFullYear();
  let selectedStartYear = new Date().getFullYear() - 1;
  let selectedEndYear = new Date().getFullYear();
  function dateInputValue(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  let selectedStartDate = dateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  let selectedEndDate = dateInputValue(new Date());
  let loadedPeriodLabel = "";
  let searchQuery = "";
  type UnitSortField = 'unitName' | 'totalAssigned' | 'totalTreated' | 'treatmentRate' | 'staffCount' | 'avgPerStaff';
  let sortField: UnitSortField = 'totalTreated';
  let sortAscending = false;
  const columns: { field: UnitSortField; label: string }[] = [
    { field: 'unitName', label: 'Unit' },
    { field: 'totalAssigned', label: 'Assigned' },
    { field: 'totalTreated', label: 'Processed' },
    { field: 'treatmentRate', label: 'Processing Rate' },
    { field: 'staffCount', label: 'Staff' },
    { field: 'avgPerStaff', label: 'Avg per Staff' }
  ];
  $: invalidYearRange = selectedPeriodType === 'year-range' && selectedStartYear > selectedEndYear;
  $: invalidDateRange = selectedPeriodType === 'date-range' && (!selectedStartDate || !selectedEndDate || selectedStartDate > selectedEndDate);
  $: invalidPeriodRange = invalidYearRange || invalidDateRange;
  $: filteredUnits = performanceData?.units.filter(unit => unit.unitName.toLowerCase().includes(searchQuery.toLowerCase())).sort((first, second) => {
    const difference = sortField === 'unitName' ? first.unitName.localeCompare(second.unitName) : first[sortField] - second[sortField];
    return sortAscending ? difference : -difference;
  }) ?? [];

  function sortUnits(field: UnitSortField) {
    sortAscending = sortField === field ? !sortAscending : field === 'unitName';
    sortField = field;
  }

  let performanceData: UnitPerformanceData | null = null;
  let loading = false;
  let error: string | null = null;
  interface ComparisonPeriod {
    id: number;
    periodType: string;
    periodValue: string;
    year: number;
    range?: PerformanceRange;
    displayLabel: string;
  }
  let compareMode = false;
  let nextPeriodId = 0;
  let comparisonPeriods: ComparisonPeriod[] = [];
  let comparisonResults: { label: string; data: UnitPerformanceData }[] = [];

  function buildCurrentSelection(): Omit<ComparisonPeriod, 'id'> {
    const range = selectedPeriodType === 'year-range' ? { startYear: selectedStartYear, endYear: selectedEndYear }
      : selectedPeriodType === 'date-range' ? { startDate: selectedStartDate, endDate: selectedEndDate } : undefined;
    const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const displayLabel = selectedPeriodType === 'year-range' ? `${selectedStartYear} - ${selectedEndYear}`
      : selectedPeriodType === 'date-range' ? `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`
      : `${selectedPeriodValue} ${selectedYear}`;
    return { periodType: selectedPeriodType, periodValue: selectedPeriodValue, year: selectedYear, range, displayLabel };
  }

  function reportLabel(data: UnitPerformanceData, selection: Omit<ComparisonPeriod, 'id'>): string {
    if (data.period.type.toLowerCase() === selection.periodType) return selection.displayLabel;
    return data.period.type.toLowerCase() === 'year' ? `${data.period.year}` : `${data.period.value} ${data.period.year}`;
  }

  function toggleCompareMode() {
    compareMode = !compareMode;
    error = null;
    if (compareMode) destroyCharts();
    else { comparisonPeriods = []; comparisonResults = []; }
  }

  function addToComparison() {
    if (invalidPeriodRange) { toast.error('Please select a valid range'); return; }
    if (comparisonPeriods.length >= 5) { toast.warning('Maximum 5 periods allowed'); return; }
    comparisonPeriods = [...comparisonPeriods, { ...buildCurrentSelection(), id: nextPeriodId++ }];
    comparisonResults = [];
  }

  function removePeriod(id: number) {
    comparisonPeriods = comparisonPeriods.filter(period => period.id !== id);
    comparisonResults = [];
  }

  async function fetchComparison() {
    if (comparisonPeriods.length < 2 || loading) return;
    const requestedPeriods = [...comparisonPeriods];
    loading = true;
    error = null;
    comparisonResults = [];
    try {
      const result = await statisticsApi.compareUnitPerformance(registryType, requestedPeriods.map(period => ({
        periodType: period.periodType,
        periodValue: period.periodValue,
        year: period.year,
        ...period.range
      })));
      comparisonResults = result.periods.map((data, index) => ({ label: reportLabel(data, requestedPeriods[index]), data }));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load comparison';
    } finally {
      loading = false;
    }
  }


  const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#ef4444'];

  $: periodValues = selectedPeriodType === "month" ? months : quarters;

  // Chart references
  let barCanvas: HTMLCanvasElement;
  let doughnutCanvas: HTMLCanvasElement;
  let barChart: Chart | null = null;
  let doughnutChart: Chart | null = null;

  async function loadPerformanceData() {
    if (invalidPeriodRange) return;
    const selection = buildCurrentSelection();
    try {
      loading = true;
      error = null;
      performanceData = null;
      performanceData = await statisticsApi.getUnitPerformance(
        registryType,
        selection.periodType,
        selection.periodValue,
        selection.year,
        selection.range
      );
      loadedPeriodLabel = reportLabel(performanceData, selection);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load performance data";
    } finally {
      loading = false;
    }
  }

  function handlePeriodTypeChange(type: string) {
    selectedPeriodType = type;
    // Use the actual array directly instead of reactive periodValues
    selectedPeriodValue = type === "month" ? months[new Date().getMonth()] : quarters[0];
    performanceData = null;
    destroyCharts();
  }

  function handlePeriodValueChange(value: string) {
    selectedPeriodValue = value;
   
  }

  function handleYearChange(year: number) {
    selectedYear = year;
   
  }

  function handleClearFilters() {
    selectedPeriodType = "month";
    selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    selectedYear = new Date().getFullYear();
    selectedStartYear = new Date().getFullYear() - 1;
    selectedEndYear = new Date().getFullYear();
    selectedStartDate = dateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    selectedEndDate = dateInputValue(new Date());
    loadedPeriodLabel = '';
    searchQuery = '';
    error = null;
    performanceData = null;
    comparisonPeriods = [];
    comparisonResults = [];
    compareMode = false;
    destroyCharts();
  }

  function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
  }

  function renderCharts() {
    if (!performanceData || !barCanvas || !doughnutCanvas) return;

    destroyCharts();

    const units = activeUnits;
    const labels = units.map(u => u.unitName);
    const assigned = units.map(u => u.totalAssigned);
    const treated = units.map(u => u.totalTreated);

    // Bar Chart — Assigned vs Processed per unit
    barChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Assigned",
            data: assigned,
            backgroundColor: "#3b82f6",
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: "Processed",
            data: treated,
            backgroundColor: "#10b981",
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
          legend: {
            position: "top",
            labels: { font: { size: 13 }, padding: 20 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: { font: { size: 12 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          }
        }
      }
    });

    // Doughnut Chart — Processing rate share per unit
    doughnutChart = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: treated,
          backgroundColor: COLORS,
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
            labels: { font: { size: 12 }, padding: 16, boxWidth: 14 }
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

  $: hasMeaningfulData = performanceData && performanceData.units.some(unit =>
    unit.totalAssigned > 0 || unit.totalTreated > 0
  );

  $: activeUnits = performanceData?.units.filter(u => u.totalAssigned > 0 || u.totalTreated > 0) || [];

  $: maxValue = Math.max(
    ...activeUnits.map(u => Math.max(u.totalAssigned, u.totalTreated)),
    1
  );

  // Render charts whenever data changes
  $: if (hasMeaningfulData && barCanvas && doughnutCanvas) {
    setTimeout(() => renderCharts(), 50);
  }
  $: if (!performanceData) destroyCharts();

  onMount(() => {
    loadPerformanceData();
    return () => destroyCharts();
  });
</script>

<div class="performance-workspace min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="report-header flex items-center mb-6">
      <button
        on:click={() => goto(`/statistics?registry=${registryType}`)}
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg px-4 py-2"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Statistics</span>
      </button>
      <div class="report-heading">
        <h1 class="text-2xl font-semibold text-gray-900">Executive Dashboard - Unit Performance</h1>
        <p class="registry-context"><Icon icon="lucide:building-2" class="w-3.5 h-3.5" />{registryType} Registry</p>
      </div>
      {#if !loading && (compareMode ? comparisonResults.length > 0 : performanceData && hasMeaningfulData)}
        <button on:click={() => window.print()} class="report-print" title="Print report"><Icon icon="lucide:printer" class="w-4 h-4" />Print Report</button>
      {/if}
    </div>

    <!-- Filters -->
    <section class="filter-toolbar mb-6" aria-label="Report filters">
      <div class="filter-heading">
        <h2 class="filter-title"><Icon icon="lucide:sliders-horizontal" class="w-4 h-4" />Reporting Period</h2>
        <button on:click={toggleCompareMode} aria-pressed={compareMode} disabled={loading} class="compare-toggle"><Icon icon="lucide:git-compare" class="w-4 h-4" />Compare Periods</button>
      </div>
      <div class="filter-fields" class:date-range-fields={selectedPeriodType === 'date-range'}>
        <div class="period-type-picker">
          <span class="field-label" id="unit-period-type">Period Type</span>
          <div class="period-segments" role="group" aria-labelledby="unit-period-type">
            {#each [{ value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }, { value: 'year-range', label: 'Year Range' }, { value: 'date-range', label: 'Date Range' }] as type}
              <button on:click={() => handlePeriodTypeChange(type.value)} aria-pressed={selectedPeriodType === type.value}>{type.label}</button>
            {/each}
          </div>
        </div>
        {#if selectedPeriodType === 'year-range'}
          <div class="range-picker">
            <label for="unit-start-year">Start Year</label>
            <select id="unit-start-year" bind:value={selectedStartYear} aria-invalid={invalidYearRange} aria-describedby={invalidYearRange ? 'unit-range-error' : undefined}>{#each years as year}<option value={year}>{year}</option>{/each}</select>
          </div>
          <div class="range-picker">
            <label for="unit-end-year">End Year</label>
            <select id="unit-end-year" bind:value={selectedEndYear} aria-invalid={invalidYearRange} aria-describedby={invalidYearRange ? 'unit-range-error' : undefined}>{#each years as year}<option value={year}>{year}</option>{/each}</select>
          </div>
        {:else if selectedPeriodType === 'date-range'}
          <div class="range-picker date-calendar-picker">
            <label for="unit-start-date">Start Date</label>
            <input id="unit-start-date" type="date" bind:value={selectedStartDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'unit-range-error' : undefined} />
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
            <label for="unit-end-date">End Date</label>
            <input id="unit-end-date" type="date" bind:value={selectedEndDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'unit-range-error' : undefined} />
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
        {:else}
          <div>
            <label for="unit-year">Year</label>
            <select id="unit-year" bind:value={selectedYear} on:change={(event) => handleYearChange(Number(event.currentTarget.value))}>{#each years as year}<option value={year}>{year}</option>{/each}</select>
          </div>
          <div>
            <label for="unit-period-value">{selectedPeriodType === 'month' ? 'Month' : 'Quarter'}</label>
            <select id="unit-period-value" bind:value={selectedPeriodValue} on:change={(event) => handlePeriodValueChange(event.currentTarget.value)}>{#each periodValues as value}<option value={value}>{value}</option>{/each}</select>
          </div>
        {/if}
        {#if invalidPeriodRange}
          <p id="unit-range-error" class="range-error" role="alert">{invalidYearRange ? 'Start year cannot be after end year.' : 'Select both dates with the start on or before the end.'}</p>
        {/if}
      </div>
      <div class="filter-actions">
        <button on:click={handleClearFilters} class="reset-action" title="Reset filters" aria-label="Reset filters" disabled={loading}><Icon icon="lucide:rotate-ccw" class="w-4 h-4" /></button>
        {#if compareMode}
          <button on:click={fetchComparison} disabled={loading || comparisonPeriods.length < 2} class="fetch-action">
            {#if loading}<Icon icon="line-md:loading-loop" class="w-4 h-4 animate-spin" />Comparing...
            {:else}<Icon icon="lucide:git-compare" class="w-4 h-4" />Compare Periods{/if}
          </button>
        {:else}
          <button on:click={loadPerformanceData} disabled={loading || invalidPeriodRange} class="fetch-action">
            {#if loading}<Icon icon="line-md:loading-loop" class="w-4 h-4 animate-spin" />Fetching...
            {:else}<Icon icon="lucide:search" class="w-4 h-4" />Fetch{/if}
          </button>
        {/if}
      </div>
      {#if compareMode}
        <div class="comparison-panel">
          <div class="comparison-toolbar">
            <span class="text-sm font-semibold text-gray-700">Comparison Periods <span class="text-xs font-normal text-gray-500">{comparisonPeriods.length}/5</span></span>
            <button on:click={addToComparison} disabled={loading || invalidPeriodRange || comparisonPeriods.length >= 5} class="add-period"><Icon icon="lucide:plus" class="w-4 h-4" />Add Period</button>
            <button on:click={() => { comparisonPeriods = []; comparisonResults = []; }} disabled={loading || comparisonPeriods.length === 0} class="clear-periods" title="Clear comparison periods" aria-label="Clear comparison periods"><Icon icon="lucide:x" class="w-4 h-4" /></button>
          </div>
          <div class="comparison-periods">
            {#each comparisonPeriods as period (period.id)}
              <div class="comparison-period"><span>{period.displayLabel}</span><button on:click={() => removePeriod(period.id)} disabled={loading} title={`Remove ${period.displayLabel}`} aria-label={`Remove ${period.displayLabel}`}><Icon icon="lucide:x" class="w-3.5 h-3.5" /></button></div>
            {:else}
              <p class="text-xs text-gray-500">No periods added yet.</p>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- Loading -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Icon icon="lucide:loader-2" class="h-8 w-8 animate-spin text-green-600" />
      </div>
    {/if}

    <!-- Error -->
    {#if error && !loading}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-800">
          <Icon icon="lucide:alert-circle" class="h-5 w-5" />
          <p class="font-medium">Error loading data</p>
        </div>
        <p class="text-sm text-red-600 mt-1">{error}</p>
      </div>
    {/if}

    <!-- No meaningful data -->
    {#if performanceData && !loading && !hasMeaningfulData && !compareMode}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="lucide:inbox" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Activity Recorded</h3>
          <p class="text-sm text-gray-600 mb-1">No performance activity found for the selected period</p>
          <p class="text-xs text-gray-500 mb-1">{registryType} · {loadedPeriodLabel}</p>
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
    {#if performanceData && !loading && hasMeaningfulData && !compareMode}

      <!-- Overview Cards -->
      <!-- <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <p class="text-sm text-gray-600">Total Processed</p>
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
      </div> -->

      <section class="summary-band" aria-label="Unit performance summary">
        <div class="summary-metric"><span class="metric-label"><Icon icon="lucide:files" class="w-4 h-4" />Assigned</span><strong>{performanceData.overview.totalAssigned.toLocaleString()}</strong></div>
        <div class="summary-metric"><span class="metric-label"><Icon icon="lucide:file-check" class="w-4 h-4" />Processed</span><strong>{performanceData.overview.totalTreated.toLocaleString()}</strong></div>
        <div class="summary-metric"><span class="metric-label"><Icon icon="lucide:chart-no-axes-combined" class="w-4 h-4" />Processing Rate</span><strong>{performanceData.overview.overallRate}%</strong></div>
        <div class="summary-metric"><span class="metric-label"><Icon icon="lucide:building-2" class="w-4 h-4" />Units</span><strong>{performanceData.overview.totalUnits}</strong><span class="metric-note">{activeUnits.length} active in this period</span></div>
      </section>

      <section class="unit-results">
        <div class="table-heading">
          <div><h2 class="text-lg font-semibold text-gray-900">Unit Breakdown</h2><p class="report-period"><Icon icon="lucide:calendar-days" class="w-3.5 h-3.5" />{loadedPeriodLabel}</p></div>
          <div class="unit-search relative">
            <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="search" bind:value={searchQuery} placeholder="Search units..." aria-label="Search units by name" />
          </div>
        </div>
        <p class="table-count">{filteredUnits.length} of {performanceData.units.length} units</p>
        <div class="unit-table-scroll">
          <table class="unit-table">
            <thead><tr>
              {#each columns as column}
                <th scope="col" aria-sort={sortField === column.field ? (sortAscending ? 'ascending' : 'descending') : 'none'}><button on:click={() => sortUnits(column.field)}>{column.label}<Icon icon={sortField === column.field ? (sortAscending ? 'lucide:arrow-up' : 'lucide:arrow-down') : 'lucide:arrow-up-down'} class="w-3.5 h-3.5" /></button></th>
              {/each}
            </tr></thead>
            <tbody>
              {#each filteredUnits as unit}
                <tr>
                  <th scope="row"><div class="unit-identity"><span class="unit-symbol" aria-hidden="true"><Icon icon="lucide:building-2" class="w-4 h-4" /></span><span>{unit.unitName}</span></div></th>
                  <td>{unit.totalAssigned.toLocaleString()}</td>
                  <td class="processed-value">{unit.totalTreated.toLocaleString()}</td>
                  <td><div class="rate-cell"><span>{unit.treatmentRate}%</span><div class="rate-track" aria-hidden="true"><div style={`width: ${Math.max(0, Math.min(100, unit.treatmentRate))}%`}></div></div></div></td>
                  <td>{unit.staffCount.toLocaleString()}</td>
                  <td>{unit.avgPerStaff.toLocaleString()}</td>
                </tr>
              {:else}
                <tr><td colspan="6" class="empty-search">No units match your search.</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Charts Section -->
      <div class="chart-section grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 mt-6 mb-6">

        <!-- Bar Chart -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:bar-chart-3" class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">Assigned vs Processed</h3>
              <p class="text-sm text-gray-500">Comparison across all active units</p>
            </div>
          </div>
          <div class="relative" style={`height: ${Math.max(activeUnits.length * 60, 280)}px`}>
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
              <p class="text-sm text-gray-500">Each unit's share of total processed files</p>
            </div>
          </div>
          <div class="relative h-72">
            <canvas bind:this={doughnutCanvas}></canvas>
          </div>
        </div>

      </div>

    {/if}

    {#if compareMode && comparisonResults.length > 0 && !loading}
      <section class="comparison-results" aria-label="Unit performance comparison results">
        <div class="table-heading">
          <div><h2 class="text-lg font-semibold text-gray-900">Period Comparison</h2><p class="report-period">{registryType} Registry · {comparisonResults.length} periods</p></div>
        </div>
        <div class="unit-table-scroll mb-6">
          <table class="unit-table">
            <thead><tr><th scope="col">Period</th><th scope="col">Assigned</th><th scope="col">Processed</th><th scope="col">Processing Rate</th><th scope="col">Units</th></tr></thead>
            <tbody>
              {#each comparisonResults as result}
                <tr><th scope="row">{result.label}</th><td>{result.data.overview.totalAssigned.toLocaleString()}</td><td class="processed-value">{result.data.overview.totalTreated.toLocaleString()}</td><td>{result.data.overview.overallRate}%</td><td>{result.data.overview.totalUnits}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
        <ComparisonCharts periods={comparisonResults.map(result => ({
          label: result.label,
          totalAssigned: result.data.overview.totalAssigned,
          totalTreated: result.data.overview.totalTreated,
          processingRate: result.data.overview.overallRate
        }))} />
        {#each comparisonResults as result}
          <h3 class="comparison-period-title">{result.label}</h3>
          <div class="unit-table-scroll mb-6">
            <table class="unit-table">
              <thead><tr>{#each columns as column}<th scope="col">{column.label}</th>{/each}</tr></thead>
              <tbody>
                {#each result.data.units as unit}
                  <tr>
                    <th scope="row">{unit.unitName}</th>
                    <td>{unit.totalAssigned.toLocaleString()}</td>
                    <td class="processed-value">{unit.totalTreated.toLocaleString()}</td>
                    <td>{unit.treatmentRate}%</td>
                    <td>{unit.staffCount.toLocaleString()}</td>
                    <td>{unit.avgPerStaff.toLocaleString()}</td>
                  </tr>
                {:else}
                  <tr><td colspan="6" class="empty-search">No unit data for this period.</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/each}
      </section>
    {/if}

    <!-- No Data Selected -->
    {#if !performanceData && !loading && !error && !compareMode}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <Icon icon="lucide:building-2" class="w-16 h-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Select Filters to View Unit Performance</h3>
          <p class="text-sm text-gray-600">No report loaded.</p>
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  .performance-workspace { --report-green: #265640; color: #202923; background: linear-gradient(180deg, #f0f4f1 0, #fafafa 320px); letter-spacing: 0; }
  .report-header { gap: 20px; flex-wrap: wrap; border-bottom: 1px solid #d4e2da; padding-bottom: 22px; }
  .report-heading { flex: 1; min-width: 180px; }
  .report-heading h1 { line-height: 1.3; }
  .registry-context { display: flex; align-items: center; gap: 7px; margin-top: 4px; font-size: 13px; color: #4d6959; }
  .report-print { display: flex; align-items: center; gap: 8px; border: 1px solid #000; border-radius: 6px; padding: 9px 14px; font-size: 13px; background: #000; color: #fff; }
  .report-print:hover { background: #000; }
  .filter-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; padding: 16px; border: 1px solid #d7e0da; border-radius: 6px; background: white; }
  .filter-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; grid-column: 1 / -1; flex-wrap: wrap; }
  .compare-toggle { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #d1d9d4; border-radius: 6px; font-size: 13px; color: #59665e; }
  .compare-toggle[aria-pressed='true'] { color: white; background: var(--report-green); border-color: var(--report-green); }
  .comparison-panel { grid-column: 1 / -1; padding-top: 16px; border-top: 1px solid #e1e7e3; }
  .comparison-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .comparison-toolbar > span { flex: 1; }
  .add-period { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 6px; background: var(--report-green); color: white; font-size: 12px; }
  .clear-periods { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #d1d9d4; border-radius: 6px; color: #59665e; }
  .comparison-periods { display: flex; flex-wrap: wrap; gap: 8px; }
  .comparison-period { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; background: #edf2ee; color: var(--report-green); font-size: 12px; }
  .comparison-period span { overflow-wrap: anywhere; }
  .comparison-period button { flex-shrink: 0; }
  .comparison-period-title { margin-bottom: 12px; padding-left: 10px; border-left: 3px solid var(--report-green); font-size: 14px; font-weight: 600; }
  .filter-title { display: flex; align-items: center; gap: 7px; grid-column: 1 / -1; font-size: 13px; font-weight: 600; color: #2d5840; }
  .filter-fields { display: grid; grid-template-columns: minmax(300px, 1.7fr) repeat(2, minmax(140px, 1fr)); gap: 16px; }
  .filter-fields.date-range-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .date-range-fields .period-type-picker { grid-column: 1 / -1; }
  .filter-fields > div { min-width: 0; }
  .filter-toolbar label, .field-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #54635a; }
  .filter-toolbar select, .filter-toolbar input { width: 100%; min-width: 0; height: 42px; padding: 8px 10px; border: 1px solid #cfdad3; border-radius: 6px; background: white; font-size: 13px; }
  .filter-toolbar input[aria-invalid='true'], .filter-toolbar select[aria-invalid='true'] { border-color: #b91c1c; }
  .date-calendar-picker input { height: 44px; padding: 10px 16px; border-width: 2px; border-color: #d1d5db; border-radius: 8px; color: #111827; font-size: 14px; font-weight: 500; }
  .date-calendar-picker input[aria-invalid='true'] { border-color: #b91c1c; }
  .date-calendar-picker label { font-size: 14px; }
  .period-segments { display: flex; height: 42px; gap: 4px; padding: 4px; background: #f0f2f0; border-radius: 6px; }
  .period-segments button { flex: 1; padding: 6px 8px; border-radius: 5px; font-size: 12px; white-space: nowrap; color: #59665e; }
  .period-segments button[aria-pressed='true'] { background: var(--report-green); color: white; }
  .filter-actions { display: flex; align-self: start; gap: 8px; padding-top: 28px; }
  .reset-action { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex-shrink: 0; border: 1px solid #d7e3db; border-radius: 6px; color: #52705d; background: #f5f8f6; }
  .reset-action:hover { background: #e8f1eb; }
  .fetch-action { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--report-green); color: white; border-radius: 6px; font-size: 14px; font-weight: 500; }
  .fetch-action:hover { background: #1e4432; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  .range-error { grid-column: 1 / -1; font-size: 12px; color: #b91c1c; }
  .summary-band { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 28px; border-top: 1px solid #dce4de; border-bottom: 1px solid #dce4de; background: white; }
  .summary-metric { padding: 20px 24px; border-right: 1px solid #dce4de; min-width: 0; }
  .summary-metric:last-child { border-right: 0; }
  .metric-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5c6861; }
  .summary-metric strong { display: block; color: var(--report-green); font-size: 28px; font-weight: 600; margin-top: 10px; line-height: 1.2; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .metric-note { display: block; font-size: 11px; color: #68766d; margin-top: 6px; }
  .table-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
  .report-period { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 4px; font-size: 12px; color: #6b756f; }
  .unit-search { width: 280px; max-width: 100%; }
  .unit-search input { width: 100%; padding: 10px 14px 10px 36px; border: 1px solid #d1d9d4; border-radius: 6px; background: white; font-size: 13px; }
  .table-count { font-size: 12px; color: #6b756f; margin-bottom: 12px; }
  .unit-table-scroll { overflow-x: auto; border: 1px solid #dde5df; border-radius: 6px; background: white; }
  .unit-table { width: 100%; min-width: 820px; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
  .unit-table thead { background: var(--report-green); }
  .unit-table th, .unit-table td { padding: 14px 18px; border-bottom: 1px solid #edf0ee; text-align: right; }
  .unit-table th:first-child { text-align: left; width: 28%; }
  .unit-table thead th { color: #f5f8f6; font-weight: 500; font-size: 12px; white-space: nowrap; border-bottom-color: var(--report-green); }
  .unit-table thead button { display: inline-flex; align-items: center; gap: 7px; }
  .unit-table thead button:hover { color: #d4e5da; }
  .unit-table tbody th { font-weight: 500; color: var(--report-green); }
  .unit-table tbody tr:nth-child(even) { background: #f8faf9; }
  .unit-table tbody tr:hover { background: #f0f8f3; }
  .unit-table tbody tr:last-child > * { border-bottom: 0; }
  .unit-identity { display: flex; align-items: center; gap: 10px; overflow-wrap: anywhere; }
  .unit-symbol { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 6px; background: #e5ede7; }
  .processed-value { color: var(--report-green); font-weight: 600; }
  .rate-cell { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .rate-cell span { min-width: 42px; }
  .rate-track { width: 64px; height: 4px; background: #e5ece7; border-radius: 2px; overflow: hidden; }
  .rate-track div { height: 100%; background: #477b5d; }
  .unit-table .empty-search { text-align: center; padding: 32px; color: #6b756f; }
  .chart-section > div { box-shadow: none; padding: 20px; border-color: #dde5df; }
  .chart-section h3 { font-size: 14px; }
  .chart-section p { font-size: 12px; }
  @media (max-width: 1100px) {
    .filter-toolbar { grid-template-columns: minmax(0, 1fr); }
    .filter-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .period-type-picker { grid-column: 1 / -1; }
    .filter-actions { padding-top: 0; justify-content: flex-end; }
  }
  @media (max-width: 700px) {
    .report-header { gap: 12px; }
    .report-header > button:first-child { padding: 8px; }
    .report-heading { min-width: 140px; }
    .report-heading h1 { font-size: 20px; }
    .date-range-fields .date-calendar-picker { grid-column: 1 / -1; }
    .summary-band { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .summary-metric { padding: 18px 14px; }
    .summary-metric:nth-child(even) { border-right: 0; }
    .summary-metric strong { font-size: 26px; }
    .table-heading { align-items: stretch; flex-direction: column; }
    .unit-search { width: 100%; }
    .chart-section { gap: 16px; }
  }
  @media (max-width: 480px) {
    .period-segments { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); height: auto; }
    .period-segments button { min-height: 34px; }
  }
  @media print {
    .performance-workspace { background: white; }
    .report-header > button, .filter-toolbar, .unit-search { display: none; }
    .unit-table-scroll { overflow: visible; }
    .unit-table { min-width: 0; font-size: 11px; }
    .unit-table th, .unit-table td { padding: 10px 6px; }
    .summary-band, .chart-section > div { break-inside: avoid; }
  }
</style>