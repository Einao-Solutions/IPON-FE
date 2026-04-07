<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { baseURL } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";

  type PeriodType = "month" | "quarter" | "year" | "month-range" | "year-range" | "relative";

  interface FinancePeriodRequestDto {
    Type: PeriodType;
    Value?: string;
    Year?: number;
    StartYear?: number;
    EndYear?: number;
    StartMonth?: number;
    EndMonth?: number;
    StartOffset?: number;
    EndOffset?: number;
    OffsetUnit?: "month" | "year";
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

  // interface FinanceComparisonRequestDto {
  //   RegistryType: string;
  //   Periods: FinancePeriodRequestDto[];
  // }

  interface FinanceComparisonDataDto {
    RegistryType: string;
    periods: FinancePeriodResultDto[];
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
  const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

  let registryType = "";
  let loading = false;
  let results: FinanceComparisonDataDto | null = null;
  let error: string | null = null;
  let periods: (FinancePeriodRequestDto & { _id: number })[] = [];
  let nextId = 0;

  function addPeriod() {
    if (periods.length >= 5) {
      toast.warning("Maximum 5 periods allowed for comparison");
      return;
    }
    periods = [...periods, {
      _id: nextId++,
      Type: "month",
      Year: CURRENT_YEAR,
      Value: "January",
      Label: ""
    }];
  }

  function removePeriod(id: number) {
    periods = periods.filter(p => p._id !== id);
  }

  function updatePeriod(id: number, field: string, value: any) {
    periods = periods.map(p => p._id === id ? { ...p, [field]: value } : p);
  }

  function handleTypeChange(id: number, type: PeriodType) {
    periods = periods.map(p => {
      if (p._id !== id) return p;
      return {
        _id: p._id,
        Type: type,
        Year: CURRENT_YEAR,
        Value: type === "month" ? "January" : type === "quarter" ? "Q1" : undefined,
        StartYear: type === "year-range" ? CURRENT_YEAR - 1 : undefined,
        EndYear: type === "year-range" ? CURRENT_YEAR : undefined,
        StartMonth: type === "month-range" ? 1 : undefined,
        EndMonth: type === "month-range" ? 6 : undefined,
        StartOffset: type === "relative" ? 5 : undefined,
        EndOffset: type === "relative" ? 0 : undefined,
        OffsetUnit: type === "relative" ? "year" : undefined,
        Label: ""
      };
    });
  }

  async function fetchComparison() {
    if (periods.length === 0) {
      toast.error("Please add at least one period");
      return;
    }

    loading = true;
    error = null;
    results = null;

    try {
      const dto = {
        RegistryType: registryType,
        Periods: periods.map(({ _id, ...p }) => ({
          ...p,
          Label: p.Label || undefined
        }))
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
    addPeriod();
  });
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        on:click={() => goto(`/statistics`)}
        class="flex items-center gap-2 text-slate-600 hover:text-slate-900 border border-gray-300 rounded-lg px-4 py-2 transition-colors hover:bg-slate-50"
      >
        <Icon icon="mdi:arrow-left" class="h-5 w-5" />
        <span>Back</span>
      </button>

      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:cash-multiple" class="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">
            {registryType} Financial Statistics
          </h1>
          <p class="text-sm text-slate-600">Compare revenue and payment data across periods</p>
        </div>
      </div>
    </div>

    <!-- Period Builder -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-800">Configure Comparison Periods</h2>
          <p class="text-sm text-slate-500">Add up to 5 periods to compare side by side</p>
        </div>
        <button
          on:click={addPeriod}
          class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          disabled={periods.length >= 5}
        >
          <Icon icon="mdi:plus" class="h-4 w-4" />
          Add Period
        </button>
      </div>

      <div class="space-y-4">
        {#each periods as period, index (period._id)}
          <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style="background-color: {COLORS[index % COLORS.length]}"
                >
                  {index + 1}
                </div>
                <span class="font-medium text-slate-700">Period {index + 1}</span>
              </div>
              <button
                on:click={() => removePeriod(period._id)}
                class="text-red-400 hover:text-red-600 transition-colors"
              >
                <Icon icon="mdi:close" class="h-5 w-5" />
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <!-- Period Type -->
              <div>
                <label for="" class="block text-xs font-medium text-slate-600 mb-1">Period Type</label>
                <select
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  value={period.Type}
                  on:change={(e) => handleTypeChange(period._id, e)}
                >
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                  <option value="month-range">Month Range</option>
                  <option value="year-range">Year Range</option>
                  <option value="relative">Relative</option>
                </select>
              </div>

              <!-- Month -->
              {#if period.Type === "month"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Month</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Value}
                    on:change={(e) => updatePeriod(period._id, "Value", e.currentTarget.value)}
                  >
                    {#each MONTHS as month}
                      <option value={month}>{month}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Year}
                    on:change={(e) => updatePeriod(period._id, "Year", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
              {/if}

              <!-- Quarter -->
              {#if period.Type === "quarter"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Quarter</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Value}
                    on:change={(e) => updatePeriod(period._id, "Value", e.currentTarget.value)}
                  >
                    {#each QUARTERS as q}
                      <option value={q}>{q}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Year}
                    on:change={(e) => updatePeriod(period._id, "Year", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
              {/if}

              <!-- Year -->
              {#if period.Type === "year"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Year}
                    on:change={(e) => updatePeriod(period._id, "Year", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
              {/if}

              <!-- Month Range -->
              {#if period.Type === "month-range"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Start Month</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.StartMonth}
                    on:change={(e) => updatePeriod(period._id, "StartMonth", parseInt(e.currentTarget.value))}
                  >
                    {#each MONTHS as month, i}
                      <option value={i + 1}>{month}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">End Month</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.EndMonth}
                    on:change={(e) => updatePeriod(period._id, "EndMonth", parseInt(e.currentTarget.value))}
                  >
                    {#each MONTHS as month, i}
                      <option value={i + 1}>{month}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.Year}
                    on:change={(e) => updatePeriod(period._id, "Year", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
              {/if}

              <!-- Year Range -->
              {#if period.Type === "year-range"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Start Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.StartYear}
                    on:change={(e) => updatePeriod(period._id, "StartYear", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">End Year</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.EndYear}
                    on:change={(e) => updatePeriod(period._id, "EndYear", parseInt(e.currentTarget.value))}
                  >
                    {#each YEARS as year}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </div>
              {/if}

              <!-- Relative -->
              {#if period.Type === "relative"}
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Start Offset</label>
                  <input
                    type="number"
                    min="0"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.StartOffset}
                    on:change={(e) => updatePeriod(period._id, "StartOffset", parseInt(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">End Offset</label>
                  <input
                    type="number"
                    min="0"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.EndOffset}
                    on:change={(e) => updatePeriod(period._id, "EndOffset", parseInt(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label for="" class="block text-xs font-medium text-slate-600 mb-1">Offset Unit</label>
                  <select
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                    value={period.OffsetUnit}
                    on:change={(e) => updatePeriod(period._id, "OffsetUnit", e.currentTarget.value)}
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              {/if}

              <!-- Custom Label -->
              <div>
                <label for="" class="block text-xs font-medium text-slate-600 mb-1">
                  Custom Label <span class="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id=""
                  placeholder="e.g. Q1 2025"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-200"
                  value={period.Label ?? ""}
                  on:input={(e) => updatePeriod(period._id, "Label", e.currentTarget.value)}
                />
              </div>

            </div>
          </div>
        {/each}

        {#if periods.length === 0}
          <div class="text-center py-8 text-slate-400">
            <Icon icon="mdi:plus-circle-outline" class="h-10 w-10 mx-auto mb-2" />
            <p class="text-sm">Click "Add Period" to start building your comparison</p>
          </div>
        {/if}
      </div>

      <!-- Fetch Button -->
      <div class="mt-6 flex justify-end">
        <button
          on:click={fetchComparison}
          disabled={loading || periods.length === 0}
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
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
        <Icon icon="mdi:alert-circle" class="h-5 w-5 flex-shrink-0" />
        <p class="text-sm">{error}</p>
      </div>
    {/if}

    <!-- Results -->
    {#if results && results.periods.length > 0}

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each results.periods as period, index}
          <div class="bg-white rounded-xl border-2 shadow-sm p-6" style="border-color: {COLORS[index % COLORS.length]}40">
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
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
                        <div>
                          <div class="font-semibold text-slate-800">{formatCurrency(pt.totalGovernmentFee)}</div>
                          <div class="text-xs text-slate-400">{pt.count} payments</div>
                        </div>
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