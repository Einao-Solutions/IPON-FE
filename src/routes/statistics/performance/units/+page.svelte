<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { statisticsApi, type UnitPerformanceData } from "$lib/utils/statisticsApi";
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement } from "chart.js";

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

  let registryType = $page.url.searchParams.get("registryType") || "Trademark";

  let selectedPeriodType = "month";
  let selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
  let selectedYear = new Date().getFullYear();

  let performanceData: UnitPerformanceData | null = null;
  let loading = false;
  let error: string | null = null;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#ef4444'];

  $: periodValues = selectedPeriodType === "month" ? months : quarters;

  // Chart references
  let barCanvas: HTMLCanvasElement;
  let doughnutCanvas: HTMLCanvasElement;
  let barChart: Chart | null = null;
  let doughnutChart: Chart | null = null;

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
    } finally {
      loading = false;
    }
  }

  function handlePeriodTypeChange(type: string) {
    selectedPeriodType = type;
    selectedPeriodValue = periodValues[0];
    performanceData = null;
    destroyCharts();
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { font: { size: 13 }, padding: 20 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
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
            position: "right",
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

  onMount(() => {
    return () => destroyCharts();
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <button
        on:click={() => window.history.back()}
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Back to Performance Statistics</span>
      </button>
      <h1 class="text-3xl font-bold text-gray-900 flex-1 text-center">Executive Dashboard</h1>
      <div style="width: 216px;"></div>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex-shrink-0 w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
          <Icon icon="lucide:building-2" class="w-7 h-7 text-white" />
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">Unit Performance</h2>
          <p class="text-sm text-gray-600">{registryType} Registry - Compare productivity across all units</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="year" class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
              Year
            </label>
            <div class="relative">
              <select id="year"
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="periodType" class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Icon icon="lucide:calendar" class="w-5 h-5 text-gray-500" />
              Period Type
            </label>
            <div class="inline-flex w-full gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                on:click={() => handlePeriodTypeChange('month')}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              >Month</button>
              <button
                on:click={() => handlePeriodTypeChange('quarter')}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {selectedPeriodType === 'quarter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              >Quarter</button>
            </div>
          </div>
          <div>
            <label for="periodValue" class="text-sm font-semibold text-gray-700 mb-2 block">
              {selectedPeriodType === 'month' ? 'Select Month' : 'Select Quarter'}
            </label>
            <div class="relative">
              <select id="periodValue"
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
    {#if performanceData && !loading && !hasMeaningfulData}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="lucide:inbox" class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Activity Recorded</h3>
          <p class="text-sm text-gray-600 mb-1">No performance activity found for the selected period</p>
          <p class="text-xs text-gray-500 mb-1">{registryType} • {selectedPeriodValue} • {selectedYear}</p>
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

      <!-- Overview Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Registry</th>
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Period</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Units</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Active Units</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Assigned</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Processed</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Overall Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-white hover:bg-green-50/40 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span class="font-semibold text-slate-800">{registryType}</span>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-500 text-xs">
                  {selectedPeriodValue} {selectedYear}
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                    {performanceData.overview.totalUnits}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-50 text-green-700">
                    {activeUnits.length}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-blue-50 text-blue-700">
                    {performanceData.overview.totalAssigned.toLocaleString()}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-50 text-green-700">
                    {performanceData.overview.totalTreated.toLocaleString()}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold text-white bg-green-600">
                    {performanceData.overview.overallRate}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
                <span class="text-sm text-gray-600">Processed</span>
                <span class="font-semibold text-slate-800">{unit.totalTreated}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Processing Rate</span>
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

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

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
          <div class="relative h-72">
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

    <!-- No Data Selected -->
    {#if !performanceData && !loading && !error}
      <div class="bg-white rounded-lg border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <Icon icon="lucide:building-2" class="w-16 h-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Select Filters to View Unit Performance</h3>
          <p class="text-sm text-gray-600">Choose a year, period type, and period value to view unit performance data</p>
        </div>
      </div>
    {/if}

    <!-- Print Button -->
    {#if performanceData && !loading && hasMeaningfulData}
      <div class="flex justify-end mt-6 mb-2">
        <button
          on:click={() => window.print()}
          class="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Icon icon="lucide:printer" class="w-4 h-4" />
          Print Report
        </button>
      </div>
    {/if}

  </div>
</div>