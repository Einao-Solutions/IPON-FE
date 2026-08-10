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

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement);

  type PeriodType = "month" | "quarter" | "year" | "month-range" | "year-range";

  interface FinancePeriodRequestDto {
    Type: PeriodType;
    Value?: string;
    Year?: number;
    StartYear?: number;
    EndYear?: number;
    StartMonth?: number;
    EndMonth?: number;
  }

  interface SupportPerformanceSummaryDto {
    totalTickets: number;
    totalRespondedTickets: number;
    totalClosedTickets: number;
    responseRate: number;
    closureRate: number;
  }

  interface SupportPerformanceOfficerEntryDto {
    officerId: string;
    officerName: string;
    officerEmail: string;
    respondedTickets: number;
    closedTickets: number;
    responseRate: number;
    closureRate: number;
    performanceScore: number;
  }

  interface SupportPerformancePeriodResultDto {
    label: string;
    startDate: string;
    endDate: string;
    summary: SupportPerformanceSummaryDto;
    officers: SupportPerformanceOfficerEntryDto[];
  }

  interface SupportPerformanceComparisonDataDto {
    scope: string;
    periods: SupportPerformancePeriodResultDto[];
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const QUARTERS = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
  const PERIOD_TYPES: PeriodType[] = ["month", "quarter", "year", "month-range", "year-range"];

  const PERIOD_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];
  const CHART_COLORS = [
    "#16a34a", "#22c55e", "#4ade80", "#86efac",
    "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
    "#d97706", "#f59e0b"
  ];

  // Scope values match backend SupportScope enum (case-insensitive)
  const ALL_SCOPES = [
    { value: "Trademark", label: "Trademark", icon: "mdi:trademark" },
    { value: "Patent", label: "Patent", icon: "mdi:lightbulb-on" },
    { value: "Design", label: "Design", icon: "mdi:palette" },
    { value: "Technical", label: "Technical", icon: "mdi:cog-outline" },
    { value: "Overview", label: "Overview", icon: "mdi:view-dashboard-outline" }
  ];

  let userRolesLocal: number[] = [];
  let registryType = "";
  let selectedScope = "";
  let isScopeLocked = false;
  let availableScopes: typeof ALL_SCOPES = [];

  let selectedPeriodType: PeriodType = "month";
  let selectedYear = CURRENT_YEAR;
  let selectedMonth = MONTHS[new Date().getMonth()];
  let selectedQuarter = "Q1: Jan-Mar";
  let selectedStartMonth = 1;
  let selectedEndMonth = 6;
  let selectedStartYear = CURRENT_YEAR - 1;
  let selectedEndYear = CURRENT_YEAR;

  let compareMode = false;
  let comparisonPeriods: (FinancePeriodRequestDto & { _id: number; displayLabel: string })[] = [];
  let nextId = 0;

  let loading = false;
  let results: SupportPerformanceComparisonDataDto | null = null;
  let error: string | null = null;

  let searchQuery = "";
  let showAllOfficers = false;

  let barCanvas: HTMLCanvasElement;
  let doughnutCanvas: HTMLCanvasElement;
  let barChart: Chart | null = null;
  let doughnutChart: Chart | null = null;

  $: firstPeriod = results?.periods[0] ?? null;

  $: filteredOfficers = firstPeriod?.officers.filter(o =>
    o.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.officerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  $: displayedOfficers = showAllOfficers ? filteredOfficers : filteredOfficers.slice(0, 10);
  $: hasMoreOfficers = filteredOfficers.length > 10;

  $: top10Officers = firstPeriod
    ? [...firstPeriod.officers].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 10)
    : [];

  $: currentScopeInfo = ALL_SCOPES.find(s => s.value === selectedScope);

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
    if (!selectedScope) { toast.error("Please select a scope first"); return; }
    if (comparisonPeriods.length >= 5) { toast.warning("Maximum 5 periods allowed"); return; }
    const period = buildCurrentPeriod();
    const displayLabel = buildDisplayLabel(period);
    comparisonPeriods = [...comparisonPeriods, { ...period, _id: nextId++, displayLabel }];
    toast.success(`Added: ${displayLabel}`);
  }

  function removePeriod(id: number) {
    comparisonPeriods = comparisonPeriods.filter(p => p._id !== id);
  }

  function toggleCompareMode() {
    compareMode = !compareMode;
    if (!compareMode) { comparisonPeriods = []; results = null; }
  }

  function handlePeriodTypeChange(type: PeriodType) {
    selectedPeriodType = type;
    results = null;
  }

  async function fetchSingle() {
    if (!selectedScope) { toast.error("Please select a scope first"); return; }
    loading = true; error = null; results = null;
    try {
      const dto = { Scope: selectedScope, Periods: [buildCurrentPeriod()] };
      const response = await fetch(`${baseURL}/api/statistics/support/performance/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch support statistics");
      results = data.data;
    } catch (e) {
      error = (e as Error).message;
      toast.error(error ?? "An error occurred");
    } finally { loading = false; }
  }

  async function fetchComparison() {
    if (!selectedScope) { toast.error("Please select a scope first"); return; }
    if (comparisonPeriods.length < 2) { toast.error("Please add at least 2 periods to compare"); return; }
    loading = true; error = null; results = null;
    try {
      const dto = {
        Scope: selectedScope,
        Periods: comparisonPeriods.map(({ _id, displayLabel, ...p }) => p)
      };
      const response = await fetch(`${baseURL}/api/statistics/support/performance/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch support statistics");
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

  function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
  }

  function renderCharts() {
    if (!firstPeriod || !barCanvas || !doughnutCanvas || top10Officers.length === 0) return;
    destroyCharts();

    barChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: top10Officers.map(o => o.officerName),
        datasets: [{
          label: "Performance Score",
          data: top10Officers.map(o => o.performanceScore),
          backgroundColor: CHART_COLORS,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` Score: ${ctx.parsed.x}%` } }
        },
        scales: {
          x: { beginAtZero: true, max: 100, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, callback: (v) => `${v}%` } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });

    const { totalTickets, totalRespondedTickets, totalClosedTickets } = firstPeriod.summary;
    const unreached = Math.max(0, totalTickets - Math.max(totalRespondedTickets, totalClosedTickets));

    doughnutChart = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: {
        labels: ["Responded (Staff)", "Closed", "Pending"],
        datasets: [{
          data: [totalRespondedTickets, totalClosedTickets, unreached],
          backgroundColor: ["#2563eb", "#16a34a", "#e2e8f0"],
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 11 }, padding: 12, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const pct = totalTickets > 0 ? ((val / totalTickets) * 100).toFixed(1) : "0";
                return ` ${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  $: if (results && barCanvas && doughnutCanvas) { setTimeout(() => renderCharts(), 50); }
  $: if (!results) destroyCharts();

  function scoreClass(score: number): string {
    if (score >= 75) return "text-green-700 bg-green-100";
    if (score >= 50) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  }

  function rateBarClass(rate: number): string {
    if (rate >= 75) return "bg-green-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function goBack() {
    if (registryType) goto(`/statistics?registry=${registryType}`);
    else goto("/statistics");
  }

  onMount(() => {
    const user = $loggedInUser;
    if (!user) { goto("/auth"); return; }

    userRolesLocal = user.userRoles ?? [];
    const isSuperAdminOrTech = userRolesLocal.includes(UserRoles.SuperAdmin) || userRolesLocal.includes(UserRoles.Tech);
    const isTrademarkReg = userRolesLocal.includes(UserRoles.TrademarkRegistrar);
    const isPatentDesignReg = userRolesLocal.includes(UserRoles.PatentDesignRegistrar);

    if (!isSuperAdminOrTech && !isTrademarkReg && !isPatentDesignReg) {
      goto("/home/dashboard");
      return;
    }

    if (isSuperAdminOrTech) {
      availableScopes = ALL_SCOPES; // all five: Trademark, Patent, Design, Technical, Overview
      isScopeLocked = false;
    } else if (isTrademarkReg) {
      availableScopes = [ALL_SCOPES[0]]; // Trademark only — locked
      isScopeLocked = true;
    } else if (isPatentDesignReg) {
      availableScopes = [ALL_SCOPES[1], ALL_SCOPES[2]]; // Patent and Design — can switch
      isScopeLocked = false;
    }

    registryType = $page.url.searchParams.get("registryType") ?? "";
    const scopeParam = $page.url.searchParams.get("scope") ?? "";

    if (scopeParam && availableScopes.some(s => s.value === scopeParam)) {
      selectedScope = scopeParam;
    } else if (isScopeLocked && availableScopes.length === 1) {
      selectedScope = availableScopes[0].value;
    }

    selectedMonth = MONTHS[new Date().getMonth()];
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="flex items-center mb-6">
      <button on:click={goBack} class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">
          {registryType ? `Back to ${registryType} Statistics` : "Back to Statistics"}
        </span>
      </button>
      <h1 class="text-3xl font-bold text-gray-900 flex-1 text-center">Support Statistics</h1>
      <div class="w-[200px]"></div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">

      <div class="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex items-start gap-4 flex-1">
          <div class="flex-shrink-0 w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Icon icon="mdi:headset" class="w-7 h-7 text-white" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 mb-1">Support Officer Performance</h2>
            <p class="text-sm text-gray-600">
              {#if selectedScope}
                {currentScopeInfo?.label ?? selectedScope} Scope — Response rates, closure rates &amp; officer scores
              {:else}
                Select a scope to view support ticket statistics
              {/if}
            </p>
          </div>
        </div>
        <button
          on:click={toggleCompareMode}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex-shrink-0
            {compareMode ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-600'}"
        >
          <Icon icon="lucide:git-compare" class="w-4 h-4" />
          {compareMode ? "Compare Periods ON" : "Compare Periods"}
        </button>
      </div>

      <div class="grid grid-cols-1 {compareMode ? 'lg:grid-cols-[2fr_1fr]' : ''} gap-6">
        <div class="space-y-4">

          <!-- Scope selector — tab picker for multi-scope roles, locked badge for single-scope -->
          {#if availableScopes.length > 1}
            <div>
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="mdi:filter-outline" class="w-4 h-4 text-gray-500" />
                Scope
              </label>
              <div class="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
                {#each availableScopes as scope}
                  <button
                    on:click={() => { selectedScope = scope.value; results = null; }}
                    class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                      {selectedScope === scope.value ? 'bg-white text-green-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'}"
                  >
                    <Icon icon={scope.icon} class="w-4 h-4" />
                    {scope.label}
                  </button>
                {/each}
              </div>
            </div>
          {:else if isScopeLocked && currentScopeInfo}
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-700">Scope:</span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <Icon icon={currentScopeInfo.icon} class="w-4 h-4" />
                {currentScopeInfo.label}
              </span>
            </div>
          {/if}

          <!-- Period Type -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="lucide:calendar" class="w-4 h-4 text-gray-500" />
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
                  <Icon icon="lucide:calendar-days" class="w-4 h-4 text-gray-500" />
                  Year
                </label>
                <div class="relative">
                  <select bind:value={selectedYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>

          <!-- Period value selectors -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#if selectedPeriodType === "month"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Month</label>
                <div class="relative">
                  <select bind:value={selectedMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each MONTHS as m}<option value={m}>{m}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "quarter"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Quarter</label>
                <div class="relative">
                  <select bind:value={selectedQuarter} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each QUARTERS as q}<option value={q}>{q}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "month-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Month</label>
                <div class="relative">
                  <select bind:value={selectedStartMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each MONTHS as m, i}<option value={i + 1}>{m}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Month</label>
                <div class="relative">
                  <select bind:value={selectedEndMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each MONTHS as m, i}<option value={i + 1}>{m}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "year-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Year</label>
                <div class="relative">
                  <select bind:value={selectedStartYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Year</label>
                <div class="relative">
                  <select bind:value={selectedEndYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if compareMode}
          <div class="flex flex-col">
            <div class="bg-gray-50 border-2 border-green-300 rounded-lg p-4 h-full flex flex-col gap-3">
              <div class="flex items-center gap-3 mb-1">
                <Icon icon="lucide:layers" class="w-5 h-5 text-green-600" />
                <span class="text-sm font-semibold text-gray-700">Comparison Periods</span>
                <span class="ml-auto text-xs text-gray-400">{comparisonPeriods.length}/5</span>
              </div>
              <button
                on:click={addToComparison}
                disabled={comparisonPeriods.length >= 5}
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                Add Period
              </button>
              {#if comparisonPeriods.length > 0}
                <div class="flex flex-col gap-2 mt-1">
                  {#each comparisonPeriods as period, index}
                    <div class="flex items-center justify-between px-3 py-2 rounded-lg text-white text-xs font-medium" style="background-color: {PERIOD_COLORS[index % PERIOD_COLORS.length]}">
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
            disabled={loading || comparisonPeriods.length < 2 || !selectedScope}
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {#if loading}<Icon icon="line-md:loading-loop" class="h-4 w-4 animate-spin" />Comparing...
            {:else}<Icon icon="lucide:git-compare" class="h-4 w-4" />Compare Periods{/if}
          </button>
        {:else}
          <button
            on:click={fetchSingle}
            disabled={loading || !selectedScope}
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {#if loading}<Icon icon="line-md:loading-loop" class="h-4 w-4 animate-spin" />Fetching...
            {:else}<Icon icon="lucide:search" class="h-4 w-4" />Fetch{/if}
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
        <Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-green-600" />
      </div>
    {/if}

    <!-- Results -->
    {#if results && results.periods.length > 0}

      <!-- Summary cards per period (using IpoSupport status colors) -->
      {#each results.periods as period, periodIndex}
        {#if compareMode || periodIndex === 0}
          <div class="mb-6">
            {#if compareMode}
              <div class="flex items-center gap-2 mb-3">
                <div class="w-3 h-3 rounded-full" style="background-color: {PERIOD_COLORS[periodIndex % PERIOD_COLORS.length]}"></div>
                <h3 class="text-base font-semibold text-gray-700">{period.label}</h3>
                <span class="text-xs text-gray-400">{formatDate(period.startDate)} — {formatDate(period.endDate)}</span>
              </div>
            {/if}

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <!-- Total — slate/ash -->
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:ticket-outline" class="w-4 h-4 text-slate-600" />
                  </div>
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</span>
                </div>
                <p class="text-3xl font-bold text-slate-800">{period.summary.totalTickets.toLocaleString()}</p>
                <p class="text-xs text-slate-400 mt-1">Tickets created</p>
              </div>

              <!-- Responded (Awaiting Staff color = blue) -->
              <div class="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:reply-outline" class="w-4 h-4 text-blue-700" />
                  </div>
                  <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">Responded</span>
                </div>
                <p class="text-3xl font-bold text-blue-800">{period.summary.totalRespondedTickets.toLocaleString()}</p>
                <p class="text-xs text-blue-400 mt-1">Staff responded</p>
              </div>

              <!-- Closed — green -->
              <div class="bg-white rounded-xl border border-green-200 shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:check-circle-outline" class="w-4 h-4 text-green-700" />
                  </div>
                  <span class="text-xs font-semibold text-green-700 uppercase tracking-wide">Closed</span>
                </div>
                <p class="text-3xl font-bold text-green-800">{period.summary.totalClosedTickets.toLocaleString()}</p>
                <p class="text-xs text-green-400 mt-1">Tickets closed</p>
              </div>

              <!-- Response Rate — blue theme -->
              <div class="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:percent-outline" class="w-4 h-4 text-blue-700" />
                  </div>
                  <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">Response Rate</span>
                </div>
                <p class="text-3xl font-bold {period.summary.responseRate >= 75 ? 'text-green-700' : period.summary.responseRate >= 50 ? 'text-yellow-700' : 'text-red-700'}">
                  {period.summary.responseRate}%
                </p>
                <div class="mt-2 w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full {rateBarClass(period.summary.responseRate)}" style="width: {period.summary.responseRate}%"></div>
                </div>
              </div>

              <!-- Closure Rate — green theme -->
              <div class="bg-white rounded-xl border border-green-200 shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:lock-check-outline" class="w-4 h-4 text-green-700" />
                  </div>
                  <span class="text-xs font-semibold text-green-700 uppercase tracking-wide">Closure Rate</span>
                </div>
                <p class="text-3xl font-bold {period.summary.closureRate >= 75 ? 'text-green-700' : period.summary.closureRate >= 50 ? 'text-yellow-700' : 'text-red-700'}">
                  {period.summary.closureRate}%
                </p>
                <div class="mt-2 w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full {rateBarClass(period.summary.closureRate)}" style="width: {period.summary.closureRate}%"></div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/each}

      <!-- Charts — single period mode only -->
      {#if !compareMode && firstPeriod && top10Officers.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Icon icon="mdi:podium" class="w-4 h-4 text-green-600" />
              Top Officer Performance Scores
            </h3>
            <div style="height: {Math.min(top10Officers.length * 36 + 40, 340)}px">
              <canvas bind:this={barCanvas}></canvas>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Icon icon="mdi:chart-donut" class="w-4 h-4 text-green-600" />
              Ticket Resolution Breakdown
            </h3>
            <div style="height: 300px">
              <canvas bind:this={doughnutCanvas}></canvas>
            </div>
          </div>
        </div>
      {/if}

      <!-- Period comparison table — compare mode -->
      {#if compareMode && results.periods.length > 1}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon icon="lucide:git-compare" class="w-4 h-4 text-green-600" />
              Period Comparison Summary
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Period</th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Total</th>
                  <th class="text-right py-3 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Responded</th>
                  <th class="text-right py-3 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closed</th>
                  <th class="text-right py-3 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Response Rate</th>
                  <th class="text-right py-3 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closure Rate</th>
                </tr>
              </thead>
              <tbody>
                {#each results.periods as period, index}
                  <tr class="border-b border-slate-100 {index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/30 transition-colors">
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: {PERIOD_COLORS[index % PERIOD_COLORS.length]}"></div>
                        <div>
                          <span class="font-semibold text-slate-800">{period.label}</span>
                          <p class="text-xs text-slate-400">{formatDate(period.startDate)} — {formatDate(period.endDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 text-right font-medium text-slate-700">{period.summary.totalTickets.toLocaleString()}</td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {period.summary.totalRespondedTickets.toLocaleString()}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {period.summary.totalClosedTickets.toLocaleString()}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                        {period.summary.responseRate >= 75 ? 'bg-green-100 text-green-700' : period.summary.responseRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
                        {period.summary.responseRate}%
                      </span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                        {period.summary.closureRate >= 75 ? 'bg-green-100 text-green-700' : period.summary.closureRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
                        {period.summary.closureRate}%
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Officers Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Icon icon="mdi:account-group" class="w-4 h-4 text-green-600" />
            Officer Performance
            {#if firstPeriod}
              <span class="text-xs text-gray-400 font-normal">— {firstPeriod.officers.length} officer{firstPeriod.officers.length !== 1 ? 's' : ''}</span>
            {/if}
          </h3>
          {#if !compareMode}
            <div class="relative w-60">
              <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search officers..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          {/if}
        </div>

        {#if compareMode}
          {#each results.periods as period, periodIndex}
            <div class="border-b border-gray-100 last:border-b-0">
              <div class="px-6 py-3 flex items-center gap-2 bg-slate-50/60">
                <div class="w-3 h-3 rounded-full" style="background-color: {PERIOD_COLORS[periodIndex % PERIOD_COLORS.length]}"></div>
                <span class="text-sm font-semibold text-gray-700">{period.label}</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="text-left py-2 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wide">#</th>
                      <th class="text-left py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Officer</th>
                      <th class="text-right py-2 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Responded</th>
                      <th class="text-right py-2 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closed</th>
                      <th class="text-right py-2 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Response Rate</th>
                      <th class="text-right py-2 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closure Rate</th>
                      <th class="text-right py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each period.officers as officer, i}
                      <tr class="border-b border-slate-100 {i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-green-50/20 transition-colors">
                        <td class="py-3 px-6 text-gray-400 text-xs">{i + 1}</td>
                        <td class="py-3 px-4">
                          <p class="font-medium text-slate-800">{officer.officerName}</p>
                          <p class="text-xs text-slate-400">{officer.officerEmail}</p>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{officer.respondedTickets}</span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{officer.closedTickets}</span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <div class="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div class="h-full rounded-full {rateBarClass(officer.responseRate)}" style="width: {officer.responseRate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-slate-600 w-9 text-right">{officer.responseRate}%</span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <div class="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div class="h-full rounded-full {rateBarClass(officer.closureRate)}" style="width: {officer.closureRate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-slate-600 w-9 text-right">{officer.closureRate}%</span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold {scoreClass(officer.performanceScore)}">
                            {officer.performanceScore}%
                          </span>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/each}

        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wide">#</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Officer</th>
                  <th class="text-right py-3 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Responded</th>
                  <th class="text-right py-3 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closed</th>
                  <th class="text-right py-3 px-4 font-semibold text-blue-600 text-xs uppercase tracking-wide">Response Rate</th>
                  <th class="text-right py-3 px-4 font-semibold text-green-700 text-xs uppercase tracking-wide">Closure Rate</th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Perf. Score</th>
                </tr>
              </thead>
              <tbody>
                {#each displayedOfficers as officer, i}
                  <tr class="border-b border-slate-100 {i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/30 transition-colors">
                    <td class="py-4 px-6">
                      {#if i === 0 && !searchQuery}
                        <Icon icon="mdi:crown" class="w-4 h-4 text-yellow-500" />
                      {:else}
                        <span class="text-gray-400 text-xs">{i + 1}</span>
                      {/if}
                    </td>
                    <td class="py-4 px-4">
                      <p class="font-semibold text-slate-800">{officer.officerName}</p>
                      <p class="text-xs text-slate-400">{officer.officerEmail}</p>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">{officer.respondedTickets}</span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">{officer.closedTickets}</span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <div class="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div class="h-full rounded-full {rateBarClass(officer.responseRate)}" style="width: {officer.responseRate}%"></div>
                        </div>
                        <span class="text-sm font-medium text-slate-700 w-12 text-right">{officer.responseRate}%</span>
                      </div>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <div class="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div class="h-full rounded-full {rateBarClass(officer.closureRate)}" style="width: {officer.closureRate}%"></div>
                        </div>
                        <span class="text-sm font-medium text-slate-700 w-12 text-right">{officer.closureRate}%</span>
                      </div>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold {scoreClass(officer.performanceScore)}">
                        {officer.performanceScore}%
                      </span>
                    </td>
                  </tr>
                {/each}

                {#if displayedOfficers.length === 0}
                  <tr>
                    <td colspan="7" class="py-10 text-center text-sm text-gray-400">
                      No officers found{searchQuery ? ` matching "${searchQuery}"` : ""}.
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>

          {#if hasMoreOfficers}
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span class="text-sm text-gray-500">Showing {displayedOfficers.length} of {filteredOfficers.length} officers</span>
              <button
                on:click={() => showAllOfficers = !showAllOfficers}
                class="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
              >
                <Icon icon={showAllOfficers ? "mdi:chevron-up" : "mdi:chevron-down"} class="w-4 h-4" />
                {showAllOfficers ? "Show Less" : `See All (${filteredOfficers.length})`}
              </button>
            </div>
          {/if}
        {/if}
      </div>

    {/if}
  </div>
</div>
