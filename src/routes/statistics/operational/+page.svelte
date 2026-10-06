<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { baseURL } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { parseDate } from "@internationalized/date";
  import { toast } from "svelte-sonner";
  import { GetCountryImageLink } from "$lib/helpers";

  type PeriodType = "month" | "quarter" | "year" | "date-range" | "year-range";

  interface OperationalPeriodRequestDto {
    type: PeriodType;
    value?: string;
    year?: number;
    startYear?: number;
    endYear?: number;
    startDate?: string;
    endDate?: string;
    label?: string;
  }

  interface KeyCountDto {
    key: string;
    count: number;
  }

  interface OperationalPeriodResultDto {
    label: string;
    startDate: string;
    endDate: string;
    totalFiles: number;
    applicationTypes: KeyCountDto[];
    trademarkClasses: KeyCountDto[];
    tradeMarkTypes: KeyCountDto[];
    designTypes: KeyCountDto[];
    patentTypes: KeyCountDto[];
    patentApplicationTypes: KeyCountDto[];
    fileOrigins: KeyCountDto[];
    filingCountries: KeyCountDto[];
    nationalities: KeyCountDto[];
  }

  interface OperationalComparisonDataDto {
    registryType: string;
    periods: OperationalPeriodResultDto[];
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const QUARTERS = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const PERIOD_TYPES: PeriodType[] = ["month", "quarter", "year", "date-range", "year-range"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
  const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

  let registryType = "";
  let loading = false;
  let results: OperationalComparisonDataDto | null = null;
  let error: string | null = null;
  let compareMode = false;

  // Filter state
  let selectedPeriodType: PeriodType = "month";
  let selectedYear = CURRENT_YEAR;
  let selectedMonth = MONTHS[new Date().getMonth()];
  let selectedQuarter = "Q1: Jan-Mar";
  function dateInputValue(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  let selectedStartDate = dateInputValue(new Date(CURRENT_YEAR, new Date().getMonth(), 1));
  let selectedEndDate = dateInputValue(new Date());
  let selectedStartYear = CURRENT_YEAR - 1;
  let selectedEndYear = CURRENT_YEAR;
  $: invalidDateRange = selectedPeriodType === "date-range" && (!selectedStartDate || !selectedEndDate || selectedStartDate > selectedEndDate);

  // Comparison periods list
  let comparisonPeriods: (OperationalPeriodRequestDto & { _id: number; displayLabel: string })[] = [];
  let nextId = 0;

  function buildCurrentPeriod(): OperationalPeriodRequestDto {
    switch (selectedPeriodType) {
      case "month": return { type: "month", year: selectedYear, value: selectedMonth };
      case "quarter": return { type: "quarter", year: selectedYear, value: selectedQuarter };
      case "year": return { type: "year", year: selectedYear };
      case "date-range": return { type: "date-range", startDate: selectedStartDate, endDate: selectedEndDate };
      case "year-range": return { type: "year-range", startYear: selectedStartYear, endYear: selectedEndYear };
    }
  }

  function buildDisplayLabel(period: OperationalPeriodRequestDto): string {
    switch (period.type) {
      case "month": return `${period.value} ${period.year}`;
      case "quarter": return `${period.value} ${period.year}`;
      case "year": return `${period.year}`;
      case "date-range": return `${formatDate(`${period.startDate}T00:00:00`)} - ${formatDate(`${period.endDate}T00:00:00`)}`;
      case "year-range": return `${period.startYear}–${period.endYear}`;
      default: return "Period";
    }
  }

  function validateDateRange(): boolean {
    if (selectedPeriodType !== "date-range") return true;
    if (!selectedStartDate || !selectedEndDate || selectedStartDate > selectedEndDate) {
      toast.error("Select both dates with the start on or before the end");
      return false;
    }
    return true;
  }

  function addToComparison() {
    if (!validateDateRange()) return;
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

  async function fetchSingle() {
    if (!validateDateRange()) return;
    loading = true; error = null; results = null;
    try {
      const dto = { registryType, periods: [buildCurrentPeriod()] };
      const response = await fetch(`${baseURL}/api/statistics/operational/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch");
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
      const dto = { registryType, periods: comparisonPeriods.map(({ _id, displayLabel, ...p }) => p) };
      const response = await fetch(`${baseURL}/api/statistics/operational/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch");
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
    selectedStartDate = dateInputValue(new Date(CURRENT_YEAR, new Date().getMonth(), 1));
    selectedEndDate = dateInputValue(new Date());
    selectedStartYear = CURRENT_YEAR - 1; selectedEndYear = CURRENT_YEAR;
  }

  function getAllKeys(field: string): string[] {
    if (!results) return [];
    return [...new Set(results.periods.flatMap(p => (p[field as keyof OperationalPeriodResultDto] as KeyCountDto[]).map(k => k.key)))];
  }

  function getCount(period: OperationalPeriodResultDto, field: string, key: string): number {
    const arr = period[field as keyof OperationalPeriodResultDto] as KeyCountDto[];
    return arr.find(k => k.key === key)?.count ?? 0;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatApplicationType(type: string): string {
    if (!type) return "Unknown";
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  // Collapsible state per table section
  let collapsedSections: Record<string, boolean> = {};

  function toggleSection(field: string) {
    collapsedSections[field] = !collapsedSections[field];
    collapsedSections = { ...collapsedSections }; // trigger reactivity
  }

  $: isTrademark = registryType === "TradeMark" || registryType === "Trademark";;
  $: isPatent = registryType === "Patent";
  $: isDesign = registryType === "Design";

  $: maxFiles = results ? Math.max(...results.periods.map(p => p.totalFiles), 1) : 1;

  $: donutField = isTrademark ? "tradeMarkTypes" : isPatent ? "patentTypes" : "designTypes";
  $: donutLabel = isTrademark ? "Trademark Types" : isPatent ? "Patent Types" : "Design Types";

  $: donutSlices = (() => {
    if (!results || results.periods.length === 0) return [];
    const items = results.periods[0][donutField as keyof OperationalPeriodResultDto] as KeyCountDto[];
    if (!items || items.length === 0) return [];
    const total = items.reduce((s, x) => s + x.count, 0) || 1;
    let cum = 0;
    return items.map((item, i) => {
      const pct = item.count / total;
      const start = cum * 2 * Math.PI;
      cum += pct;
      const end = cum * 2 * Math.PI;
      const x1 = 100 + 80 * Math.sin(start);
      const y1 = 100 - 80 * Math.cos(start);
      const x2 = 100 + 80 * Math.sin(end);
      const y2 = 100 - 80 * Math.cos(end);
      return {
        path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`,
        color: COLORS[i % COLORS.length],
        label: item.key || "Unknown",
        pct: Math.round(pct * 100),
        count: item.count
      };
    });
  })();

  $: donutTotal = results && results.periods.length > 0
    ? (results.periods[0][donutField as keyof OperationalPeriodResultDto] as KeyCountDto[]).reduce((s, x) => s + x.count, 0)
    : 0;

  onMount(async () => {
    const user = $loggedInUser;
    if (!user) { goto("/auth"); return; }
    registryType = $page.url.searchParams.get("registryType") ?? "";
    selectedMonth = MONTHS[new Date().getMonth()];
    await fetchSingle();
  });
</script>

<div class="operational-workspace min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

    <!-- Header -->
    <div class="report-header flex items-center mb-6">
      <button
        on:click={() => goto(`/statistics`)}
        class="report-back flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Statistics</span>
      </button>
      <div class="report-heading">
        <h1 class="text-2xl font-semibold text-gray-900">Executive Dashboard - Operational Statistics</h1>
        <p class="registry-context"><Icon icon="lucide:building-2" class="w-3.5 h-3.5" />{registryType} Registry</p>
      </div>
      {#if results && results.periods.length > 0}
        <button on:click={() => window.print()} class="report-print" title="Print report"><Icon icon="lucide:printer" class="w-4 h-4" />Print Report</button>
      {/if}
    </div>

    <!-- Filter Section -->
    <div class="filter-toolbar bg-white border border-gray-200 rounded-lg p-4 mb-6">

      <!-- Section Title -->
      <div class="filter-heading flex items-center justify-between gap-4">
        <h2 class="filter-title"><Icon icon="lucide:sliders-horizontal" class="w-4 h-4" />Reporting Period</h2>

        <!-- Compare Toggle -->
        <button
          on:click={toggleCompareMode}
          aria-pressed={compareMode}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex-shrink-0
            {compareMode
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-600'}"
        >
          <Icon icon="lucide:git-compare" class="w-4 h-4" />
          {compareMode ? "Compare Periods ON" : "Compare Periods"}
        </button>
      </div>

      <!-- Filters Grid -->
      <div class="filter-layout">

        <!-- LEFT: Period Type + Fields -->
        <div class="filter-fields" class:date-range-fields={selectedPeriodType === 'date-range'} class:year-range-fields={selectedPeriodType === 'year-range'}>

          <div class="period-top-row">
            <div class="period-type-field">
              <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Icon icon="lucide:calendar" class="w-5 h-5 text-gray-500" />
                Period Type
              </label>
              <div class="period-types inline-flex w-full gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
                {#each PERIOD_TYPES as type}
                  <button
                    on:click={() => handlePeriodTypeChange(type)}
                    aria-pressed={selectedPeriodType === type}
                    class="flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap
                      {selectedPeriodType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                  >
                    {type === "date-range" ? "Date Range" : type === "year-range" ? "Year Range" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                {/each}
              </div>
            </div>

            {#if selectedPeriodType !== "year-range" && selectedPeriodType !== "date-range"}
              <div class="year-field">
                <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Icon icon="lucide:calendar-days" class="w-5 h-5 text-gray-500" />
                  Year
                </label>
                <div class="relative">
                  <select bind:value={selectedYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>

          <div class="period-values-row">
            {#if selectedPeriodType === "month"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Select Month</label>
                <div class="relative">
                  <select bind:value={selectedMonth} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all">
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
                  <select bind:value={selectedQuarter} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all">
                    {#each QUARTERS as q}<option value={q}>{q}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}

            {#if selectedPeriodType === "date-range"}
              <div class="date-calendar-picker">
                <label for="operational-start-date" class="text-sm font-semibold text-gray-700 mb-2 block">Start Date</label>
                <input id="operational-start-date" type="date" bind:value={selectedStartDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'operational-date-error' : undefined} />
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
              <div class="date-calendar-picker">
                <label for="operational-end-date" class="text-sm font-semibold text-gray-700 mb-2 block">End Date</label>
                <input id="operational-end-date" type="date" bind:value={selectedEndDate} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? 'operational-date-error' : undefined} />
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
                <p id="operational-date-error" class="date-range-error" role="alert">Select both dates with the start on or before the end.</p>
              {/if}
            {/if}

            {#if selectedPeriodType === "year-range"}
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Start Year</label>
                <div class="relative">
                  <select bind:value={selectedStartYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700 mb-2 block">End Year</label>
                <div class="relative">
                  <select bind:value={selectedEndYear} class="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-all">
                    {#each YEARS as year}<option value={year}>{year}</option>{/each}
                  </select>
                  <Icon icon="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            {/if}
          </div>

        </div>

        <!-- RIGHT: Comparison Panel — only when compare mode ON -->
        {#if compareMode}
          <div class="comparison-side flex flex-col justify-start">
            <div class="comparison-panel bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div class="flex items-center gap-3 mb-1">
                <Icon icon="lucide:layers" class="w-5 h-5 text-green-600" />
                <span class="text-sm font-semibold text-gray-700">Comparison Periods</span>
                <span class="ml-auto text-xs text-gray-400">{comparisonPeriods.length}/5</span>
              </div>

              <button
                on:click={addToComparison}
                disabled={comparisonPeriods.length >= 5 || invalidDateRange}
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                Add Period
              </button>

              {#if comparisonPeriods.length > 0}
                <div class="flex flex-col gap-2 mt-1">
                  {#each comparisonPeriods as period, index}
                    <div class="comparison-period flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium">
                      <span>{period.displayLabel}</span>
                      <button on:click={() => removePeriod(period._id)} class="ml-2 hover:opacity-70" title={`Remove ${period.displayLabel}`} aria-label={`Remove ${period.displayLabel}`}>
                        <Icon icon="mdi:close" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-xs text-gray-400 text-center mt-1">No periods added yet. Add periods above to compare.</p>
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
      <div class="filter-actions flex justify-end gap-3">
        {#if compareMode}
          <button
            on:click={fetchComparison}
            disabled={loading || comparisonPeriods.length < 2}
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
            on:click={fetchSingle}
            disabled={loading || invalidDateRange}
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

      <!-- Summary Table -->
      <div class="report-summary bg-white border border-gray-200 overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Period</th>
                <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date Range</th>
                <th class="text-right py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">Total Files</th>
              </tr>
            </thead>
            <tbody>
              {#each results.periods as period, index}
                <tr class="border-b border-slate-100 {index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/40 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <div class="period-marker w-2 h-2 rounded-full flex-shrink-0"></div>
                      <span class="font-semibold text-slate-800">{period.label}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6 text-slate-500 text-xs">
                    {formatDate(period.startDate)} — {formatDate(period.endDate)}
                  </td>
                  <td class="py-4 px-6 text-right">
                    <span class="total-files text-sm font-semibold">
                      {period.totalFiles.toLocaleString()}
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
                    <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold text-white bg-green-600">
                      {results.periods.reduce((a, p) => a + p.totalFiles, 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            {/if}
          </table>
        </div>
      </div>

      <!-- Charts side by side -->
      <div class="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <!-- Bar Chart -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:chart-bar" class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">Total Files Overview</h3>
              <p class="text-sm text-slate-500">{compareMode ? 'Files across all periods' : 'Files for selected period'}</p>
            </div>
          </div>
          <div class="space-y-4">
            {#each results.periods as period, index}
              {@const barWidth = Math.max((period.totalFiles / maxFiles) * 100, 2)}
              <div class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-slate-700">{period.label}</span>
                  <span class="font-bold text-slate-800">{period.totalFiles.toLocaleString()} files</span>
                </div>
                <div class="volume-track w-full bg-gray-100 h-8 overflow-hidden">
                  <div
                    class="volume-bar h-full flex items-center justify-end pr-3 transition-all duration-700"
                    style="width: {barWidth}%; background-color: {COLORS[index % COLORS.length]}"
                  >
                    {#if barWidth > 15}
                      <span class="text-xs font-semibold text-white">{period.totalFiles}</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:chart-pie" class="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">{donutLabel}</h3>
              <p class="text-sm text-slate-500">{results.periods[0].label} — share breakdown</p>
            </div>
          </div>

          {#if donutSlices.length > 0}
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="flex-shrink-0">
                <svg viewBox="0 0 200 200" class="w-44 h-44">
                  {#each donutSlices as slice}
                    <path d={slice.path} fill={slice.color} stroke="white" stroke-width="2" class="hover:opacity-80 transition-opacity cursor-pointer">
                      <title>{slice.label}: {slice.count} ({slice.pct}%)</title>
                    </path>
                  {/each}
                  <circle cx="100" cy="100" r="45" fill="white" />
                  <text x="100" y="96" text-anchor="middle" font-size="10" fill="#64748b" font-weight="600">Total</text>
                  <text x="100" y="112" text-anchor="middle" font-size="9" fill="#16a34a" font-weight="700">{donutTotal} files</text>
                </svg>
              </div>
              <div class="flex-1 grid grid-cols-1 gap-1.5 w-full">
                {#each donutSlices as slice}
                  <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {slice.color}"></div>
                    <p class="text-xs font-medium text-slate-700 flex-1 truncate">{slice.label}</p>
                    <span class="text-xs text-slate-500">{slice.count}</span>
                    <span class="text-xs font-bold ml-1" style="color: {slice.color}">{slice.pct}%</span>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="flex items-center justify-center h-32 text-slate-400 text-sm">No breakdown data available</div>
          {/if}
        </div>

      </div>

      <!-- Breakdown Tables -->
      <div class="breakdown-tables space-y-4">

        <!-- TRADEMARK TABLES -->
        {#if isTrademark}
          {#each [
            { field: "tradeMarkTypes", label: "Trademark Types", icon: "lucide:tag", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "trademarkClasses", label: "Trademark Classes", icon: "lucide:list", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "applicationTypes", label: "Application Types", icon: "lucide:file-plus", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "nationalities", label: "Nationalities", icon: "lucide:globe", iconBg: "bg-green-100", iconColor: "text-green-600" }
          ] as section}
            {#if getAllKeys(section.field).length > 0}
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  on:click={() => toggleSection(section.field)}
                  class="w-full flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-colors text-left"
                >
                  <div class="w-9 h-9 {section.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon icon={section.icon} class="w-4 h-4 {section.iconColor}" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-800">{section.label}</h3>
                    <p class="text-xs text-slate-400">{getAllKeys(section.field).length} entries</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-medium">{collapsedSections[section.field] ? 'Show' : 'Hide'}</span>
                    <Icon
                      icon="lucide:chevron-down"
                      class="w-4 h-4 text-slate-400 transition-transform duration-200 {collapsedSections[section.field] ? '' : 'rotate-180'}"
                    />
                  </div>
                </button>

                {#if !collapsedSections[section.field]}
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                          <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">{section.label}</th>
                          {#each results.periods as period, index}
                            <th class="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style="color: {COLORS[index % COLORS.length]}">{period.label}</th>
                          {/each}
                        </tr>
                      </thead>
                    </table>
                    <!-- Scrollable body wrapper — only scrolls if more than 7 rows -->
                    <div class="{getAllKeys(section.field).length > 7 ? 'max-h-72 overflow-y-auto' : ''}">
                      <table class="w-full text-sm">
                        <tbody>
                          {#each getAllKeys(section.field) as key, rowIndex}
                            <tr class="border-b border-slate-100 transition-colors {rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/40">
                              <td class="py-3.5 px-6 font-medium text-slate-700">
                                <div class="flex items-center gap-2">
                                  <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                  {#if section.field === "nationalities"}
                                    <img src={GetCountryImageLink(key)} width="20" height="15" alt="@flag" class="inline-block" />
                                  {/if}
                                  {#if section.field === "filingCountries"}
                                    <img src={GetCountryImageLink(key)} width="20" height="15" alt="@flag" class="inline-block" />
                                  {/if}
                                  <!-- ✅ Format applicationTypes keys -->
                                  {section.field === "trademarkClasses" 
                                    ? `Class ${key}` 
                                    : section.field === "applicationTypes"
                                      ? formatApplicationType(key)
                                      : key || "Unknown"}
                                </div>
                              </td>
                              {#each results.periods as period, index}
                                {@const count = getCount(period, section.field, key)}
                                <td class="py-3.5 px-6 text-right">
                                  <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                                    {count.toLocaleString()}
                                  </span>
                                </td>
                              {/each}
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                    <!-- Footer always visible outside scroll -->
                    <table class="w-full text-sm">
                      <tfoot>
                        <tr class="bg-slate-100 border-t-2 border-slate-200">
                          <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide">Total</td>
                          {#each results.periods as period, index}
                            <td class="py-3.5 px-6 text-right">
                              <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-bold text-white"
                                style="background-color: {COLORS[index % COLORS.length]}">
                                {period.totalFiles.toLocaleString()}
                              </span>
                            </td>
                          {/each}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                {/if}

              </div>
            {/if}
          {/each}
        {/if}

        <!-- PATENT TABLES -->
        {#if isPatent}
          {#each [
            { field: "patentTypes", label: "Patent Types", icon: "lucide:file-text", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "patentApplicationTypes", label: "Patent Application Types", icon: "lucide:file-plus", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "applicationTypes", label: "Application Types", icon: "lucide:file-plus", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "fileOrigins", label: "File Origins", icon: "lucide:map-pin", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "filingCountries", label: "Filing Countries", icon: "lucide:globe", iconBg: "bg-green-100", iconColor: "text-green-600" },
          ] as section}
            {#if getAllKeys(section.field).length > 0}
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  on:click={() => toggleSection(section.field)}
                  class="w-full flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-colors text-left"
                >
                  <div class="w-9 h-9 {section.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon icon={section.icon} class="w-4 h-4 {section.iconColor}" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-800">{section.label}</h3>
                    <p class="text-xs text-slate-400">{getAllKeys(section.field).length} entries</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-medium">{collapsedSections[section.field] ? 'Show' : 'Hide'}</span>
                    <Icon
                      icon="lucide:chevron-down"
                      class="w-4 h-4 text-slate-400 transition-transform duration-200 {collapsedSections[section.field] ? '' : 'rotate-180'}"
                    />
                  </div>
                </button>

                {#if !collapsedSections[section.field]}
                  <!-- Fixed Header -->
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                          <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">{section.label}</th>
                          {#each results.periods as period, index}
                            <th class="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style="color: {COLORS[index % COLORS.length]}">{period.label}</th>
                          {/each}
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <!-- Scrollable Body -->
                  <div class="{getAllKeys(section.field).length > 7 ? 'max-h-72 overflow-y-auto' : ''} overflow-x-auto">
                    <table class="w-full text-sm">
                      <tbody>
                        {#each getAllKeys(section.field) as key, rowIndex}
                          <tr class="border-b border-slate-100 transition-colors {rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/40">
                            <td class="py-3.5 px-6 font-medium text-slate-700">
                              <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <!-- ✅ Flag for filingCountries -->
                                {#if section.field === "filingCountries"}
                                  <img src={GetCountryImageLink(key)} width="20" height="15" alt="@flag" class="inline-block" />
                                {/if}
                                {key || "Unknown"}
                              </div>
                            </td>
                            {#each results.periods as period, index}
                              {@const count = getCount(period, section.field, key)}
                              <td class="py-3.5 px-6 text-right">
                                <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                                  {count.toLocaleString()}
                                </span>
                              </td>
                            {/each}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                  <!-- Fixed Footer -->
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <tfoot>
                        <tr class="bg-slate-100 border-t-2 border-slate-200">
                          <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide">Total</td>
                          {#each results.periods as period, index}
                            <td class="py-3.5 px-6 text-right">
                              <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-bold text-white"
                                style="background-color: {COLORS[index % COLORS.length]}">
                                {period.totalFiles.toLocaleString()}
                              </span>
                            </td>
                          {/each}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                {/if}

              </div>
            {/if}
          {/each}
        {/if}

        <!-- DESIGN TABLES -->
        {#if isDesign}
          {#each [
            { field: "designTypes", label: "Design Types", icon: "lucide:pen-tool", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "applicationTypes", label: "Application Types", icon: "lucide:file-plus", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "fileOrigins", label: "File Origins", icon: "lucide:map-pin", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { field: "filingCountries", label: "Filing Countries", icon: "lucide:globe", iconBg: "bg-green-100", iconColor: "text-green-600" },
          ] as section}
            {#if getAllKeys(section.field).length > 0}
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  on:click={() => toggleSection(section.field)}
                  class="w-full flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-colors text-left"
                >
                  <div class="w-9 h-9 {section.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon icon={section.icon} class="w-4 h-4 {section.iconColor}" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-800">{section.label}</h3>
                    <p class="text-xs text-slate-400">{getAllKeys(section.field).length} entries</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-medium">{collapsedSections[section.field] ? 'Show' : 'Hide'}</span>
                    <Icon icon="lucide:chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200 {collapsedSections[section.field] ? '' : 'rotate-180'}" />
                  </div>
                </button>

                {#if !collapsedSections[section.field]}
                  <!-- Fixed Header -->
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                          <th class="text-left py-3 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wide">{section.label}</th>
                          {#each results.periods as period, index}
                            <th class="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style="color: {COLORS[index % COLORS.length]}">{period.label}</th>
                          {/each}
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <!-- Scrollable Body -->
                  <div class="{getAllKeys(section.field).length > 7 ? 'max-h-72 overflow-y-auto' : ''} overflow-x-auto">
                    <table class="w-full text-sm">
                      <tbody>
                        {#each getAllKeys(section.field) as key, rowIndex}
                          <tr class="border-b border-slate-100 transition-colors {rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-green-50/40">
                            <td class="py-3.5 px-6 font-medium text-slate-700">
                              <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <!-- ✅ Flag for filingCountries -->
                                {#if section.field === "filingCountries"}
                                  <img src={GetCountryImageLink(key)} width="20" height="15" alt="@flag" class="inline-block" />
                                {/if}
                                {key || "Unknown"}
                              </div>
                            </td>
                            {#each results.periods as period, index}
                              {@const count = getCount(period, section.field, key)}
                              <td class="py-3.5 px-6 text-right">
                                <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style="background-color: {COLORS[index % COLORS.length]}15; color: {COLORS[index % COLORS.length]}">
                                  {count.toLocaleString()}
                                </span>
                              </td>
                            {/each}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                  <!-- Fixed Footer -->
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <tfoot>
                        <tr class="bg-slate-100 border-t-2 border-slate-200">
                          <td class="py-3.5 px-6 font-bold text-slate-800 text-xs uppercase tracking-wide">Total</td>
                          {#each results.periods as period, index}
                            <td class="py-3.5 px-6 text-right">
                              <span class="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full text-xs font-bold text-white"
                                style="background-color: {COLORS[index % COLORS.length]}">
                                {period.totalFiles.toLocaleString()}
                              </span>
                            </td>
                          {/each}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                {/if}

              </div>
            {/if}
          {/each}
        {/if}

      </div>
      <!-- end breakdown tables -->

    {/if}

  </div>
</div>

<style>
  .operational-workspace { --report-green: #265640; color: #202923; background: linear-gradient(180deg, #f0f4f1 0, #fafafa 320px); letter-spacing: 0; }
  .report-header { gap: 20px; flex-wrap: wrap; padding-bottom: 22px; border-bottom: 1px solid #d4e2da; }
  .report-back { padding: 9px 14px; border: 1px solid #d1d9d4; border-radius: 6px; }
  .report-heading { flex: 1; min-width: 180px; }
  .report-heading h1 { line-height: 1.3; }
  .registry-context { display: flex; align-items: center; gap: 7px; margin-top: 4px; color: #4d6959; font-size: 13px; }
  .report-print { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border: 1px solid #000; border-radius: 6px; background: #000; color: #fff; font-size: 13px; }
  .report-print:hover { background: #000; }
  .filter-toolbar { border-color: #d7e0da; border-radius: 6px; }
  .filter-heading { margin-bottom: 18px; flex-wrap: wrap; }
  .filter-title { display: flex; align-items: center; gap: 7px; color: #2d5840; font-size: 13px; font-weight: 600; }
  .filter-heading > button { padding: 8px 12px; border-width: 1px; font-size: 13px; }
  .filter-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .filter-fields { display: grid; grid-template-columns: minmax(350px, 2fr) minmax(120px, .7fr) minmax(160px, 1fr); gap: 16px; }
  .filter-fields.date-range-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .date-range-fields .period-type-field { grid-column: 1 / -1; }
  .date-calendar-picker { min-width: 0; }
  .date-calendar-picker input { width: 100%; min-width: 0; height: 44px; padding: 10px 16px; border: 2px solid #d1d5db; border-radius: 8px; color: #111827; background: #fff; font-size: 14px; font-weight: 500; }
  .date-calendar-picker input:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  .date-calendar-picker input[aria-invalid='true'] { border-color: #b91c1c; }
  .filter-toolbar .date-calendar-picker label { font-size: 14px; }
  .date-range-error { grid-column: 1 / -1; color: #b91c1c; font-size: 12px; }
  .filter-fields.year-range-fields { grid-template-columns: minmax(350px, 2fr) repeat(2, minmax(120px, .7fr)); }
  .period-top-row, .period-values-row { display: contents; }
  .filter-fields > div > div { min-width: 0; }
  .period-type-field { grid-column: 1; }
  .filter-toolbar label { font-size: 12px; color: #54635a; }
  .filter-toolbar select { height: 42px; padding-top: 8px; padding-bottom: 8px; border-width: 1px; border-radius: 6px; font-size: 13px; }
  .filter-toolbar button { border-radius: 6px; }
  .filter-toolbar button.bg-green-600 { background: var(--report-green); border-color: var(--report-green); }
  .filter-toolbar button.bg-green-600:hover { background: #1e4432; }
  .period-types { min-height: 42px; align-items: stretch; }
  .period-types button { padding: 6px 8px; }
  .period-types button[aria-pressed='true'] { background: var(--report-green); color: #fff; box-shadow: none; }
  .comparison-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; border-color: #dce4de; background: #f5f8f6; }
  .comparison-panel > div:first-child { grid-column: 1; grid-row: 1; margin-bottom: 0; }
  .comparison-panel > button:first-of-type { grid-column: 2; grid-row: 1; width: auto; font-size: 12px; padding: 8px 12px; }
  .comparison-panel > button:last-of-type { grid-column: 3; grid-row: 1; width: auto; margin-top: 0; font-size: 12px; padding: 8px 12px; }
  .comparison-panel > div:nth-child(3) { display: flex; flex-direction: row; flex-wrap: wrap; grid-column: 1 / -1; gap: 8px; }
  .comparison-panel > p { grid-column: 1 / -1; }
  .comparison-period { gap: 10px; background: #e9f0eb; color: var(--report-green); border-left: 3px solid #718f7c; }
  .comparison-period span { overflow-wrap: anywhere; }
  .filter-actions { margin-top: 16px; }
  .filter-actions > button { font-size: 14px; padding: 10px 20px; }
  .report-summary { border-radius: 6px; border-color: #dde5df; }
  .report-summary table { min-width: 560px; font-variant-numeric: tabular-nums; }
  .report-summary thead tr, .breakdown-tables thead tr { background: var(--report-green); }
  .report-summary thead th, .breakdown-tables thead th { color: #f5f8f6 !important; font-size: 12px; font-weight: 500; text-transform: none; letter-spacing: 0; }
  .report-summary th, .report-summary td { padding: 14px 18px; }
  .period-marker { background: #718f7c; }
  .total-files { color: var(--report-green); font-variant-numeric: tabular-nums; }
  .report-summary tfoot tr { background: #edf2ee; border-top-width: 1px; }
  .report-summary tfoot td { text-transform: none; letter-spacing: 0; }
  .report-summary tfoot span { padding: 0; color: var(--report-green); background: transparent; border-radius: 0; }
  .charts-grid > div { min-width: 0; padding: 20px; border-radius: 6px; border-color: #dde5df; box-shadow: none; }
  .charts-grid h3 { font-size: 14px; color: var(--report-green); }
  .charts-grid p { font-size: 12px; }
  .charts-grid > div > div:first-child > div:first-child { width: 32px; height: 32px; background: #e5ede7; border-radius: 6px; }
  .volume-track, .volume-bar { border-radius: 4px; }
  .volume-track { height: 26px; }
  .breakdown-tables > div { border-radius: 6px; border-color: #dde5df; box-shadow: none; }
  .breakdown-tables > div > button { padding: 14px 18px; background: #f5f8f6; background-image: none; }
  .breakdown-tables > div > button:hover { background: #edf3ef; }
  .breakdown-tables > div > button > div:first-child { width: 32px; height: 32px; border-radius: 6px; background: #e5ede7; }
  .breakdown-tables h3 { font-size: 14px; color: var(--report-green); }
  .breakdown-tables table { table-layout: fixed; font-variant-numeric: tabular-nums; }
  .breakdown-tables th, .breakdown-tables td { padding: 12px 18px; overflow-wrap: anywhere; }
  .breakdown-tables th:first-child, .breakdown-tables td:first-child { width: 40%; }
  .breakdown-tables tbody td:first-child { color: var(--report-green); }
  .breakdown-tables tbody td > span, .breakdown-tables tfoot td > span { min-width: 0; padding: 0; border-radius: 0; background: transparent !important; color: var(--report-green) !important; font-size: 13px; }
  .breakdown-tables tfoot tr { background: #edf2ee; border-top-width: 1px; }
  .breakdown-tables tfoot td { text-transform: none; letter-spacing: 0; }
  button:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  @media (max-width: 1100px) {
    .filter-fields, .filter-fields.date-range-fields, .filter-fields.year-range-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .period-type-field { grid-column: 1 / -1; }
  }
  @media (max-width: 700px) {
    .report-header { gap: 12px; }
    .report-heading { min-width: 140px; flex-basis: 100%; order: -1; }
    .report-heading h1 { font-size: 20px; }
    .report-back { padding: 8px; }
    .report-print { margin-left: auto; }
    .charts-grid { gap: 16px; }
    .charts-grid > div { padding: 16px; }
    .date-range-fields .date-calendar-picker { grid-column: 1 / -1; }
    .comparison-panel { grid-template-columns: minmax(0, 1fr) auto; }
    .comparison-panel > div:first-child { grid-column: 1 / -1; }
    .comparison-panel > button:first-of-type { grid-column: 1; grid-row: 2; }
    .comparison-panel > button:last-of-type { grid-column: 2; grid-row: 2; }
    .breakdown-tables th, .breakdown-tables td { padding: 10px 12px; }
    .breakdown-tables > div > button { padding: 12px; }
  }
  @media (max-width: 480px) {
    .period-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .period-types button { white-space: normal; min-height: 34px; }
  }
  @media print {
    .operational-workspace { background: white; }
    .report-header > button, .filter-toolbar { display: none; }
    .report-summary, .charts-grid > div { break-inside: avoid; }
  }
</style>