<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { baseURL } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";

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

  interface FinancePeriodResultDto {
    label: string;
    startDate: string;
    endDate: string;
    totalGovernmentFee: number;
    totalPayments: number;
    paymentTypes: FinancePaymentTypeResultDto[];
  }

  interface FinanceComparisonDataDto {
    periods: FinancePeriodResultDto[];
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const QUARTERS = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
  const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

  let registryType = "";
  let loading = false;
  let results: FinanceComparisonDataDto | null = null;
  let error: string | null = null;

  // Filter state — single active period config
  let selectedPeriodType: PeriodType = "month";
  let selectedYear = CURRENT_YEAR;
  let selectedMonth = new Date().toLocaleString("default", { month: "long" });
  let selectedQuarter = "Q1";
  let selectedStartMonth = 1;
  let selectedEndMonth = 6;
  let selectedStartYear = CURRENT_YEAR - 1;
  let selectedEndYear = CURRENT_YEAR;

  // Comparison periods list
  let comparisonPeriods: (FinancePeriodRequestDto & { _id: number; displayLabel: string })[] = [];
  let nextId = 0;

  const PERIOD_TYPES: PeriodType[] = ["month", "quarter", "year", "month-range", "year-range"];

  function buildCurrentPeriod(): FinancePeriodRequestDto {
    switch (selectedPeriodType) {
      case "month":
        return { Type: "month", Year: selectedYear, Value: selectedMonth };
      case "quarter":
        return { Type: "quarter", Year: selectedYear, Value: selectedQuarter };
      case "year":
        return { Type: "year", Year: selectedYear };
      case "month-range":
        return { Type: "month-range", Year: selectedYear, StartMonth: selectedStartMonth, EndMonth: selectedEndMonth };
      case "year-range":
        return { Type: "year-range", StartYear: selectedStartYear, EndYear: selectedEndYear };
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
    if (comparisonPeriods.length >= 5) {
      toast.warning("Maximum 5 periods allowed");
      return;
    }
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

  async function fetchComparison() {
    if (comparisonPeriods.length === 0) {
      toast.error("Please add at least one period to compare");
      return;
    }

    loading = true;
    error = null;
    results = null;

    try {
      const dto = {
        RegistryType: registryType,
        Periods: comparisonPeriods.map(({ _id, displayLabel, ...p }) => p)
      };

      const response = await fetch(`${baseURL}/api/statistics/finance/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch financial statistics");
      results = data.data;
    } catch (e) {
      const err = e as Error;
      error = err.message;
      toast.error(error ?? "An error occurred");
    } finally {
      loading = false;
    }
  }

  function handleClearAll() {
    comparisonPeriods = [];
    results = null;
    error = null;
    selectedPeriodType = "month";
    selectedYear = CURRENT_YEAR;
    selectedMonth = new Date().toLocaleString("default", { month: "long" });
    selectedQuarter = "Q1";
    selectedStartMonth = 1;
    selectedEndMonth = 6;
    selectedStartYear = CURRENT_YEAR - 1;
    selectedEndYear = CURRENT_YEAR;
  }

  $: maxFee = results
    ? Math.max(...results.periods.map(p => p.totalGovernmentFee), 1)
    : 1;

  $: allPaymentTypes = results
    ? [...new Set(results.periods.flatMap(p => p.paymentTypes.map(pt => pt.paymentType)))]
    : [];

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  onMount(() => {
    const user = $loggedInUser;
    if (!user) { goto("/auth"); return; }
    registryType = $page.url.searchParams.get("registryType") ?? "";
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        on:click={() => goto(`/statistics?registry=${registryType}`)}
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Back to Financial Statistics</span>
      </button>
      <h1 class="text-3xl font-bold text-gray-900 flex-1 text-center">
        Financial Statistics
      </h1>
      <div class="w-[200px]"></div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">

      <!-- Section Title -->
      <div class="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
        <div class="flex-shrink-0 w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
          <Icon icon="lucide:bar-chart-2" class="w-7 h-7 text-white" />
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">Revenue Statistics</h2>
          <p class="text-sm text-gray-600">
            {registryType} Registry — Compare government fees and payment volumes across periods
          </p>
        </div>
      </div>

      <!-- Filters Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

        <!-- LEFT: Period Type + Fields -->
        <div class="space-y-4">

          <!-- Row 1: Period Type Tabs + Year -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Period Type -->
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

            <!-- Year (shown for month, quarter, year, month-range) -->
            {#if selectedPeriodType !== "year-range"}
              <div>
                <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
                  Year
                </label>
                <div class="relative">
                  <select
                    bind:value={selectedYear}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>

          <!-- Row 2: Dynamic Fields based on Period Type -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Month -->
            {#if selectedPeriodType === "month"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Select Month</label>
                <div class="relative">
                  <select
                    bind:value={selectedMonth}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each MONTHS as month}
                      <option value={month}>{month}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            <!-- Quarter -->
            {#if selectedPeriodType === "quarter"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Select Quarter</label>
                <div class="relative">
                  <select
                    bind:value={selectedQuarter}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each QUARTERS as q}
                      <option value={q}>{q}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            <!-- Month Range -->
            {#if selectedPeriodType === "month-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Month</label>
                <div class="relative">
                  <select
                    bind:value={selectedStartMonth}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each MONTHS as month, i}
                      <option value={i + 1}>{month}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Month</label>
                <div class="relative">
                  <select
                    bind:value={selectedEndMonth}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each MONTHS as month, i}
                      <option value={i + 1}>{month}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            <!-- Year Range -->
            {#if selectedPeriodType === "year-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Year</label>
                <div class="relative">
                  <select
                    bind:value={selectedStartYear}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Year</label>
                <div class="relative">
                  <select
                    bind:value={selectedEndYear}
                    class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all"
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

          </div>
        </div>

        <!-- RIGHT: Actions + Comparison List -->
        <div class="flex flex-col justify-start">
          <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 h-full flex flex-col gap-3">

            <div class="flex items-center gap-3 mb-1">
              <Icon icon="lucide:layers" class="w-5 h-5 text-gray-500" />
              <span class="text-sm font-semibold text-gray-700">Comparison Periods</span>
            </div>

            <!-- Add Period Button -->
            <button
              on:click={addToComparison}
              disabled={comparisonPeriods.length >= 5}
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Icon icon="mdi:plus" class="w-4 h-4" />
              Add Period
            </button>

            <!-- Added Periods Tags -->
            {#if comparisonPeriods.length > 0}
              <div class="flex flex-col gap-2 mt-1">
                {#each comparisonPeriods as period, index}
                  <div
                    class="flex items-center justify-between px-3 py-2 rounded-lg text-white text-xs font-medium"
                    style="background-color: {COLORS[index % COLORS.length]}"
                  >
                    <span>{period.displayLabel}</span>
                    <button on:click={() => removePeriod(period._id)} class="ml-2 hover:opacity-70">
                      <Icon icon="mdi:close" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-xs text-gray-400 text-center mt-1">No periods added yet</p>
            {/if}

            <!-- Clear All -->
            <button
              on:click={handleClearAll}
              class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors mt-auto"
            >
              <Icon icon="lucide:x" class="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

      </div>

      <!-- Compare Button -->
      <div class="mt-6 flex justify-end">
        <button
          on:click={fetchComparison}
          disabled={loading || comparisonPeriods.length === 0}
          class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          {#if loading}
            <Icon icon="line-md:loading-loop" class="h-4 w-4 animate-spin" />
            Fetching...
          {:else}
            <Icon icon="mdi:chart-bar" class="h-4 w-4" />
            Compare Periods
          {/if}
        </button>
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

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {#each results.periods as period, index}
          <div class="bg-white rounded-lg border-2 shadow-sm p-6" style="border-color: {COLORS[index % COLORS.length]}40">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-4 h-4 rounded-full" style="background-color: {COLORS[index % COLORS.length]}"></div>
              <h3 class="font-semibold text-slate-800">{period.label}</h3>
            </div>
            <div class="space-y-3">
              <div>
                <p class="text-xs text-slate-500 mb-1">Total Government Fee</p>
                <p class="text-2xl font-bold text-slate-800">{formatCurrency(period.totalGovernmentFee)}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Total Payments</p>
                <p class="text-lg font-semibold text-slate-700">{period.totalPayments.toLocaleString()}</p>
              </div>
              <div class="pt-2 border-t border-slate-100 text-xs text-slate-400">
                {formatDate(period.startDate)} — {formatDate(period.endDate)}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Bar Chart -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:chart-bar" class="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-800">Revenue Comparison</h3>
            <p class="text-sm text-slate-500">Total government fee across all periods</p>
          </div>
        </div>
        <div class="space-y-4">
          {#each results.periods as period, index}
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-700">{period.label}</span>
                <span class="font-semibold text-slate-800">{formatCurrency(period.totalGovernmentFee)}</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                  style="width: {Math.max((period.totalGovernmentFee / maxFee) * 100, 2)}%; background-color: {COLORS[index % COLORS.length]}"
                >
                  <span class="text-xs font-semibold text-white">{period.totalPayments} payments</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Payment Type Breakdown Table -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:format-list-bulleted" class="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-800">Payment Type Breakdown</h3>
            <p class="text-sm text-slate-500">Revenue breakdown by payment type per period</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left py-3 px-4 font-semibold text-slate-700">Payment Type</th>
                {#each results.periods as period, index}
                  <th class="text-right py-3 px-4 font-semibold" style="color: {COLORS[index % COLORS.length]}">
                    {period.label}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each allPaymentTypes as paymentType}
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-4 font-medium text-slate-700">{paymentType || "Unknown"}</td>
                  {#each results.periods as period}
                    {@const pt = period.paymentTypes.find(x => x.paymentType === paymentType)}
                    <td class="py-3 px-4 text-right">
                      {#if pt}
                        <div class="font-semibold text-slate-800">{formatCurrency(pt.totalGovernmentFee)}</div>
                        <div class="text-xs text-slate-400">{pt.count} payments</div>
                      {:else}
                        <span class="text-slate-300">—</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td class="py-3 px-4 text-slate-800">Total</td>
                {#each results.periods as period, index}
                  <td class="py-3 px-4 text-right" style="color: {COLORS[index % COLORS.length]}">
                    <div>{formatCurrency(period.totalGovernmentFee)}</div>
                    <div class="text-xs font-normal text-slate-500">{period.totalPayments} payments</div>
                  </td>
                {/each}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    {/if}

  </div>
</div>