<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { baseURL, UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
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
  import ChartDataLabels from "chartjs-plugin-datalabels";

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement, ChartDataLabels);

  type PeriodType = "month" | "quarter" | "year" | "month-range" | "year-range";

  interface FinancePeriodRequestDto {
    Type: PeriodType;
    Value?: string;
    Year?: number;
    StartYear?: number;
    EndYear?: number;
    StartMonth?: number;
    EndMonth?: number;
    Label?: string;
  }

  interface FinancePaymentTypeResultDto {
    paymentType: string;
    totalGovernmentFee: number;
    count: number;
  }

  interface MonthlyBreakdownDto {
    label: string;
    startDate: string;
    endDate: string;
    totalGovernmentFee: number;
    totalPayments: number;
  }

  interface FinancePeriodResultDto {
    label: string;
    startDate: string;
    endDate: string;
    totalGovernmentFee: number;
    totalPayments: number;
    paymentTypes: FinancePaymentTypeResultDto[];
    monthlyBreakdown?: MonthlyBreakdownDto[];
  }

  interface FinanceComparisonDataDto {
    periods: FinancePeriodResultDto[];
  }

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const QUARTERS = ["Q1: Jan-Mar","Q2: Apr-Jun","Q3: Jul-Sep","Q4: Oct-Dec"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
  const COLORS = ["#16a34a","#2563eb","#d97706","#dc2626","#7c3aed"];
  const CHART_COLORS = [
    "#10b981","#3b82f6","#a855f7","#ec4899",
    "#f59e0b","#ef4444","#06b6d4","#84cc16",
    "#f97316","#6366f1"
  ];

  let registryType = "";
  let loading = false;
  let results: FinanceComparisonDataDto | null = null;
  let error: string | null = null;
  let compareMode = false;

  let selectedPeriodType: PeriodType = "month";
  let selectedYear = CURRENT_YEAR;
  let selectedMonth = MONTHS[new Date().getMonth()];
  let selectedQuarter = "Q1: Jan-Mar";
  let selectedStartMonth = 1;
  let selectedEndMonth = 6;
  let selectedStartYear = CURRENT_YEAR - 1;
  let selectedEndYear = CURRENT_YEAR;

  let comparisonPeriods: (FinancePeriodRequestDto & { _id: number; displayLabel: string })[] = [];
  let nextId = 0;

  const PERIOD_TYPES: PeriodType[] = ["month","quarter","year","month-range","year-range"];

  // Chart refs
  let barCanvas: HTMLCanvasElement;
  let doughnutCanvas: HTMLCanvasElement;
  let barChart: Chart | null = null;
  let doughnutChart: Chart | null = null;

  function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
  }

  function renderCharts() {
    if (!results || !barCanvas || !doughnutCanvas) return;
    destroyCharts();

    const firstPeriod = results.periods[0];
    const paymentLabels = firstPeriod.paymentTypes.map(pt => pt.paymentType || "Unknown");

    barChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: paymentLabels,
        datasets: results.periods.map((period, index) => ({
          label: period.label,
          data: paymentLabels.map(label => {
            const found = period.paymentTypes.find(pt => (pt.paymentType || "Unknown") === label);
            return found?.totalGovernmentFee ?? 0;
          }),
          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
          borderRadius: 6,
          barPercentage: 0.6
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: compareMode,
            position: "bottom",
            labels: { font: { size: 11 }, padding: 10, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 30 } },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: {
              font: { size: 10 },
              callback: (val) => formatCurrency(Number(val))
            }
          }
        }
      }
    });

    const labels = firstPeriod.paymentTypes.map(pt => pt.paymentType || "Unknown");
    const data = firstPeriod.paymentTypes.map(pt => pt.totalGovernmentFee);
    const total = data.reduce((a, b) => a + b, 0);

    doughnutChart = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
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
              boxWidth: 12,
              generateLabels: (chart) => {
                const dataset = chart.data.datasets[0];
                const bgColors = dataset.backgroundColor as string[];
                return (chart.data.labels as string[]).map((label, i) => {
                  const value = (dataset.data[i] as number) ?? 0;
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                  return {
                    text: `${label}  —  ${pct}%`,
                    fillStyle: bgColors[i],
                    strokeStyle: "#fff",
                    lineWidth: 1,
                    hidden: false,
                    index: i
                  };
                });
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed ?? 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`;
              }
            }
          },
          ...({ datalabels: { display: false } } as any)
        }
      }
    });
  }

  $: if (results && barCanvas && doughnutCanvas) {
    setTimeout(() => renderCharts(), 50);
  }

  $: if (!results) destroyCharts();

  function buildCurrentPeriod(): FinancePeriodRequestDto {
    switch (selectedPeriodType) {
      case "month": return { Type: "month", Year: selectedYear, Value: selectedMonth };
      case "quarter": return { Type: "quarter", Year: selectedYear, Value: selectedQuarter };
      case "year": return { Type: "year", Year: selectedYear };
      case "month-range": return { Type: "month-range", Year: selectedYear, StartMonth: selectedStartMonth, EndMonth: selectedEndMonth };
      case "year-range": return { Type: "year-range", StartYear: selectedStartYear, EndYear: selectedEndYear };
    }
  }

  function buildDisplayLabel(period: FinancePeriodRequestDto): string {
    switch (period.Type) {
      case "month": return `${period.Value} ${period.Year}`;
      case "quarter": return `${period.Value} ${period.Year}`;
      case "year": return `${period.Year}`;
      case "month-range": return `${MONTHS[(period.StartMonth ?? 1) - 1]}–${MONTHS[(period.EndMonth ?? 6) - 1]} ${period.Year}`;
      case "year-range": return `${period.StartYear}–${period.EndYear}`;
      default: return "Period";
    }
  }

  function addToComparison() {
    if (comparisonPeriods.length >= 5) { toast.warning("Maximum 5 periods allowed"); return; }
    const period = buildCurrentPeriod();
    const displayLabel = buildDisplayLabel(period);
    comparisonPeriods = [...comparisonPeriods, { ...period, _id: nextId++, displayLabel }];
    toast.success(`Added: ${displayLabel}`);
  }

  function removePeriod(id: number) {
    comparisonPeriods = comparisonPeriods.filter(p => p._id !== id);
  }

  function handlePeriodTypeChange(type: PeriodType) {
    selectedPeriodType = type;
    results = null;
  }

  function toggleCompareMode() {
    compareMode = !compareMode;
    if (!compareMode) { comparisonPeriods = []; results = null; }
  }

  // ✅ ONLY DIFFERENCE — hits techfee endpoint
  async function fetchSingle() {
    loading = true; error = null; results = null;
    try {
      const dto = { RegistryType: registryType, Periods: [buildCurrentPeriod()] };
      const response = await fetch(`${baseURL}/api/statistics/finance/techfee/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch tech fee statistics");
      results = data.data;
    } catch (e) {
      error = (e as Error).message;
      toast.error(error ?? "An error occurred");
    } finally { loading = false; }
  }

  async function fetchComparison() {
    if (comparisonPeriods.length < 2) { toast.error("Please add at least 2 periods to compare"); return; }
    loading = true; error = null; results = null;
    try {
      const dto = {
        RegistryType: registryType,
        Periods: comparisonPeriods.map(({ _id, displayLabel, ...p }) => p)
      };
      // ✅ ONLY DIFFERENCE — hits techfee endpoint
      const response = await fetch(`${baseURL}/api/statistics/finance/techfee/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch tech fee statistics");
      results = data.data;
    } catch (e) {
      error = (e as Error).message;
      toast.error(error ?? "An error occurred");
    } finally { loading = false; }
  }

  function handleClearAll() {
    comparisonPeriods = []; results = null; error = null; compareMode = false;
    selectedPeriodType = "month"; selectedYear = CURRENT_YEAR;
    selectedMonth = MONTHS[new Date().getMonth()]; selectedQuarter = "Q1: Jan-Mar";
    selectedStartMonth = 1; selectedEndMonth = 6;
    selectedStartYear = CURRENT_YEAR - 1; selectedEndYear = CURRENT_YEAR;
  }

  $: allPaymentTypes = results
    ? [...new Set(results.periods.flatMap(p => p.paymentTypes.map(pt => pt.paymentType)))]
    : [];

  $: maxPaymentTypeFee = results
    ? Math.max(...results.periods.flatMap(p => p.paymentTypes.map(pt => pt.totalGovernmentFee)), 1)
    : 1;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency", currency: "NGN", minimumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  onMount(async () => {
    const user = $loggedInUser;
    if (!user) { goto("/auth"); return; }

    // ✅ ONLY EinaoFinance — SuperAdmin cannot access
    if (!user.userRoles?.includes(UserRoles.EinaoFinance)) {
      toast.error("Access denied — EINAO Finance role required");
      goto("/statistics");
      return;
    }

    registryType = $page.url.searchParams.get("registryType") ?? "";
    selectedMonth = MONTHS[new Date().getMonth()];
    await fetchSingle();
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        on:click={() => goto(`/statistics?registry=${registryType}`)}
        class="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-gray-300 rounded-lg px-4 py-2"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Back</span>
      </button>
      <h1 class="text-3xl font-bold text-gray-900 flex-1 text-center">Tech Fee Revenue Statistics</h1>
      <div class="w-[200px]"></div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">

      <div class="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex items-start gap-4 flex-1">
          <div class="flex-shrink-0 w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Icon icon="mdi:chip" class="w-7 h-7 text-white" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 mb-1">EINAO Tech Fee Statistics</h2>
            <p class="text-sm text-gray-600">{registryType} Registry — View tech fees and payment volumes</p>
          </div>
        </div>
        <button
          on:click={toggleCompareMode}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex-shrink-0
            {compareMode ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}"
        >
          <Icon icon="lucide:git-compare" class="w-4 h-4" />
          {compareMode ? "Compare Periods ON" : "Compare Periods"}
        </button>
      </div>

      <div class="grid grid-cols-1 {compareMode ? 'lg:grid-cols-[2fr_1fr]' : ''} gap-6">

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="lucide:calendar" class="w-5 h-5 text-gray-500" />
                Period Type
              </label>
              <div class="inline-flex w-full gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
                {#each PERIOD_TYPES as type}
                  <button
                    on:click={() => handlePeriodTypeChange(type)}
                    class="flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap
                      {selectedPeriodType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                  >
                    {type === "month-range" ? "Month Range" : type === "year-range" ? "Year Range" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                {/each}
              </div>
            </div>

            {#if selectedPeriodType !== "year-range"}
              <div>
                <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
                  Year
                </label>
                <div class="relative">
                  <select bind:value={selectedYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#if selectedPeriodType === "month"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Select Month</label>
                <div class="relative">
                  <select bind:value={selectedMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each MONTHS as month}<option value={month}>{month}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "quarter"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Select Quarter</label>
                <div class="relative">
                  <select bind:value={selectedQuarter} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each QUARTERS as q}<option value={q}>{q}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "month-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Month</label>
                <div class="relative">
                  <select bind:value={selectedStartMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each MONTHS as month, i}<option value={i + 1}>{month}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Month</label>
                <div class="relative">
                  <select bind:value={selectedEndMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each MONTHS as month, i}<option value={i + 1}>{month}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "year-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Year</label>
                <div class="relative">
                  <select bind:value={selectedStartYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Year</label>
                <div class="relative">
                  <select bind:value={selectedEndYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if compareMode}
          <div class="flex flex-col justify-start">
            <div class="bg-gray-50 border-2 border-blue-300 rounded-lg p-4 h-full flex flex-col gap-3">
              <div class="flex items-center gap-3 mb-1">
                <Icon icon="lucide:layers" class="w-5 h-5 text-blue-600" />
                <span class="text-sm font-semibold text-gray-700">Comparison Periods</span>
                <span class="ml-auto text-xs text-gray-400">{comparisonPeriods.length}/5</span>
              </div>
              <button
                on:click={addToComparison}
                disabled={comparisonPeriods.length >= 5}
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                Add Period
              </button>
              {#if comparisonPeriods.length > 0}
                <div class="flex flex-col gap-2 mt-1">
                  {#each comparisonPeriods as period, index}
                    <div class="flex items-center justify-between px-3 py-2 rounded-lg text-white text-xs font-medium" style="background-color: {COLORS[index % COLORS.length]}">
                      <span>{period.displayLabel}</span>
                      <button on:click={() => removePeriod(period._id)} class="ml-2 hover:opacity-70">
                        <Icon icon="mdi:close" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-xs text-gray-400 text-center mt-1">No periods added yet.</p>
              {/if}
              <button
                on:click={handleClearAll}
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors mt-auto"
              >
                <Icon icon="lucide:x" class="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        {/if}

      </div>

      <!-- Action Button -->
      <div class="mt-6 flex justify-end gap-3">
        {#if compareMode}
          <button
            on:click={fetchComparison}
            disabled={loading || comparisonPeriods.length < 2}
            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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
            on:click={fetchSingle}
            disabled={loading}
            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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

    <!-- Error -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700">
        <Icon icon="mdi:alert-circle" class="h-5 w-5 flex-shrink-0" />
        <p class="text-sm">{error}</p>
      </div>
    {/if}

    <!-- Loading -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-blue-600" />
      </div>
    {/if}

    <!-- Results -->
    {#if results && results.periods.length > 0}

      <!-- Summary Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Period</th>
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date Range</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Tech Fee</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Payments</th>
              </tr>
            </thead>
            <tbody>
              {#each results.periods as period, index}
                <tr class="border-b border-slate-100 {index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {COLORS[index % COLORS.length]}"></div>
                      <span class="font-semibold text-slate-800">{period.label}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6 text-slate-500 text-xs">
                    {formatDate(period.startDate)} — {formatDate(period.endDate)}
                  </td>
                  <td class="py-4 px-6 text-right">
                    <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold"
                      style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                      {formatCurrency(period.totalGovernmentFee)}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-right">
                    <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-semibold"
                      style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                      {period.totalPayments.toLocaleString()}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
            {#if results.periods.length > 1}
              <tfoot>
                <tr class="bg-slate-100 border-t-2 border-slate-200">
                  <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide" colspan="2">Total</td>
                  <td class="py-3.5 px-6 text-right">
                    <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold text-white bg-blue-600">
                      {formatCurrency(results.periods.reduce((a, p) => a + p.totalGovernmentFee, 0))}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-right">
                    <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold text-white bg-blue-600">
                      {results.periods.reduce((a, p) => a + p.totalPayments, 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            {/if}
          </table>
        </div>
      </div>

      <!-- Charts side by side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <!-- Histogram Bar Chart -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:chart-bar-stacked" class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">Tech Fee Histogram</h3>
              <p class="text-sm text-slate-500">Tech fee per payment type {compareMode ? 'across periods' : 'for selected period'}</p>
            </div>
          </div>
          <div class="relative h-64">
            <canvas bind:this={barCanvas}></canvas>
          </div>
        </div>

        <!-- Doughnut Chart -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:pie-chart" class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">Tech Fee Share by Payment Type</h3>
              <p class="text-sm text-slate-500">
                {compareMode ? `First period: ${results.periods[0].label}` : results.periods[0].label}
              </p>
            </div>
          </div>
          <div class="relative h-64">
            <canvas bind:this={doughnutCanvas}></canvas>
          </div>
        </div>

      </div>

      <!-- Quarterly Monthly Breakdown -->
      {#if selectedPeriodType === "quarter" && results.periods.some(p => p.monthlyBreakdown && p.monthlyBreakdown.length > 0)}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div class="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:calendar-days" class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">Monthly Breakdown</h3>
              <p class="text-xs text-slate-400">Tech fee per month within the selected quarter{results.periods.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          {#each results.periods as period, pIndex}
            {#if period.monthlyBreakdown && period.monthlyBreakdown.length > 0}
              <div class="{pIndex > 0 ? 'border-t border-gray-200' : ''}">
                {#if results.periods.length > 1}
                  <div class="px-6 py-3 bg-slate-50 flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: {COLORS[pIndex % COLORS.length]}"></div>
                    <span class="text-sm font-semibold text-slate-700">{period.label}</span>
                  </div>
                {/if}
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Month</th>
                        <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date Range</th>
                        <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Tech Fee</th>
                        <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Payments</th>
                        <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">% of Quarter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each period.monthlyBreakdown as month, mIndex}
                        {@const pct = period.totalGovernmentFee > 0 ? ((month.totalGovernmentFee / period.totalGovernmentFee) * 100).toFixed(1) : "0.0"}
                        <tr class="border-b border-slate-100 transition-colors {mIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40">
                          <td class="py-3.5 px-6 font-medium text-slate-700">
                            <div class="flex items-center gap-2">
                              <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                              {month.label}
                            </div>
                          </td>
                          <td class="py-3.5 px-6 text-slate-500 text-xs">
                            {formatDate(month.startDate)} — {formatDate(month.endDate)}
                          </td>
                          <td class="py-3.5 px-6 text-right">
                            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style="background-color: {COLORS[pIndex % COLORS.length]}15; color: {COLORS[pIndex % COLORS.length]}">
                              {formatCurrency(month.totalGovernmentFee)}
                            </span>
                          </td>
                          <td class="py-3.5 px-6 text-right">
                            <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style="background-color: {COLORS[pIndex % COLORS.length]}15; color: {COLORS[pIndex % COLORS.length]}">
                              {month.totalPayments.toLocaleString()}
                            </span>
                          </td>
                          <td class="py-3.5 px-6 text-right">
                            <div class="flex items-center justify-end gap-2">
                              <div class="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div class="h-full rounded-full" style="width: {pct}%; background-color: {COLORS[pIndex % COLORS.length]}"></div>
                              </div>
                              <span class="text-xs font-bold" style="color: {COLORS[pIndex % COLORS.length]}">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                    <tfoot>
                      <tr class="bg-slate-100 border-t-2 border-slate-200">
                        <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide" colspan="2">Quarter Total</td>
                        <td class="py-3.5 px-6 text-right">
                          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold text-white"
                            style="background-color: {COLORS[pIndex % COLORS.length]}">
                            {formatCurrency(period.totalGovernmentFee)}
                          </span>
                        </td>
                        <td class="py-3.5 px-6 text-right">
                          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold text-white"
                            style="background-color: {COLORS[pIndex % COLORS.length]}">
                            {period.totalPayments.toLocaleString()}
                          </span>
                        </td>
                        <td class="py-3.5 px-6 text-right">
                          <span class="text-xs font-bold text-slate-500">100%</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Payment Type Breakdown Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div class="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:format-list-bulleted" class="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-800">Payment Type Breakdown</h3>
            <p class="text-xs text-slate-400">{allPaymentTypes.length} payment types</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Payment Type</th>
                {#each results.periods as period, index}
                  <th class="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style="color: {COLORS[index % COLORS.length]}">{period.label}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each allPaymentTypes as paymentType, rowIndex}
                <tr class="border-b border-slate-100 transition-colors {rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40">
                  <td class="py-3.5 px-6 font-medium text-slate-700">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      {paymentType || "Unknown"}
                    </div>
                  </td>
                  {#each results.periods as period, index}
                    {@const pt = period.paymentTypes.find(x => x.paymentType === paymentType)}
                    <td class="py-3.5 px-6 text-right">
                      {#if pt}
                        <span class="inline-flex flex-col items-end">
                          <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                            style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                            {formatCurrency(pt.totalGovernmentFee)}
                          </span>
                          <span class="text-xs text-slate-400 mt-0.5">{pt.count} payments</span>
                        </span>
                      {:else}
                        <span class="text-slate-300">—</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="bg-slate-100 border-t-2 border-slate-200">
                <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide">Total</td>
                {#each results.periods as period, index}
                  <td class="py-3.5 px-6 text-right">
                    <span class="inline-flex flex-col items-end">
                      <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold text-white"
                        style="background-color: {COLORS[index % COLORS.length]}">
                        {formatCurrency(period.totalGovernmentFee)}
                      </span>
                      <span class="text-xs text-slate-500 mt-0.5">{period.totalPayments} payments</span>
                    </span>
                  </td>
                {/each}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Print Button -->
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