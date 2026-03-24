<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import { statisticsApi, type UnitPerformanceData } from "$lib/utils/statisticsApi";
  import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  let chartView: "bar" | "pie" = "bar";

  // Period options
  const periodTypes = ["month", "quarter", "year"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = ["Q1: Jan-Mar", "Q2: Apr-Jun", "Q3: Jul-Sep", "Q4: Oct-Dec"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Chart colors
  const COLORS = ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  $: periodValues = selectedPeriodType === "month" ? months : 
                    selectedPeriodType === "quarter" ? quarters : 
                    years.map(y => y.toString());

  $: chartData = performanceData?.units.map(unit => ({
    name: unit.unitName,
    assigned: unit.totalAssigned,
    treated: unit.totalTreated,
    rate: unit.treatmentRate
  })) || [];

  $: pieData = performanceData?.units.map(unit => ({
    name: unit.unitName,
    value: unit.totalTreated
  })) || [];

  onMount(async () => {
    await loadPerformanceData();
  });

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

  function handleRegistryChange(value: string) {
    registryType = value;
    goto(`/statistics/performance/units?registryType=${registryType}`);
    loadPerformanceData();
  }

  function handlePeriodTypeChange(value: string) {
    selectedPeriodType = value;
    selectedPeriodValue = periodValues[0];
    loadPerformanceData();
  }

  function handlePeriodValueChange(value: string) {
    selectedPeriodValue = value;
    loadPerformanceData();
  }

  function handleYearChange(value: string) {
    selectedYear = parseInt(value);
    loadPerformanceData();
  }

  function handleClearFilters() {
    selectedPeriodType = "month";
    selectedPeriodValue = new Date().toLocaleString('default', { month: 'long' });
    selectedYear = new Date().getFullYear();
    loadPerformanceData();
  }

  function handleBack() {
    goto(`/statistics?registry=${registryType}`);
  }

  function handlePrint() {
    window.print();
  }
</script>

<div class="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen rounded-xl p-6 shadow-xl border border-slate-200/60">
  <div class="max-w-7xl mx-auto space-y-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button
          on:click={handleBack}
          class="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-gray-300 rounded-lg px-4 py-2"
        >
          <Icon icon="mdi:arrow-left" class="h-5 w-5" />
          <span>Back to Statistics</span>
        </button>
      </div>
      <Button on:click={handlePrint} variant="outline">
        <Icon icon="mdi:printer" class="mr-2 h-4 w-4" />
        Print Report
      </Button>
    </div>

    <div class="mb-6">
      <h1 class="text-3xl font-bold text-slate-800 mb-2">Unit Performance</h1>
      <p class="text-slate-600">Compare productivity across all units</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        
        <!-- Registry Type -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Registry Type</label>
          <Select.Root value={registryType} onSelectedChange={(v) => v && handleRegistryChange(v.value)}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select registry" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="Trademark">Trademark</Select.Item>
              <Select.Item value="Patent">Patent</Select.Item>
              <Select.Item value="Design">Design</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Period Type -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Period Type</label>
          <Select.Root value={selectedPeriodType} onSelectedChange={(v) => v && handlePeriodTypeChange(v.value)}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select period" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="month">Monthly</Select.Item>
              <Select.Item value="quarter">Quarterly</Select.Item>
              <Select.Item value="year">Yearly</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Period Value -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            {selectedPeriodType === "month" ? "Month" : selectedPeriodType === "quarter" ? "Quarter" : "Year"}
          </label>
          <Select.Root value={selectedPeriodValue} onSelectedChange={(v) => v && handlePeriodValueChange(v.value)}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select value" />
            </Select.Trigger>
            <Select.Content>
              {#each periodValues as value}
                <Select.Item value={value}>{value}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Year (only show if not yearly) -->
        {#if selectedPeriodType !== "year"}
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Year</label>
            <Select.Root value={selectedYear.toString()} onSelectedChange={(v) => v && handleYearChange(v.value)}>
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select year" />
              </Select.Trigger>
              <Select.Content>
                {#each years as year}
                  <Select.Item value={year.toString()}>{year}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {/if}

        <!-- Clear Button -->
        <div class:class={selectedPeriodType === "year" ? "md:col-span-2 lg:col-span-1" : ""}>
          <Button on:click={handleClearFilters} variant="outline" class="w-full">
            <Icon icon="mdi:filter-off" class="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Icon icon="mdi:loading" class="h-8 w-8 animate-spin text-purple-600" />
      </div>
    {/if}

    <!-- Error State -->
    {#if error && !loading}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-800">
          <Icon icon="mdi:alert-circle" class="h-5 w-5" />
          <p class="font-medium">Error loading data</p>
        </div>
        <p class="text-sm text-red-600 mt-1">{error}</p>
      </div>
    {/if}

    <!-- Performance Data -->
    {#if performanceData && !loading}
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-lg border-2 border-purple-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:office-building" class="h-5 w-5 text-purple-600" />
            </div>
            <p class="text-sm text-gray-600">Total Units</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalUnits}</p>
        </div>

        <div class="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg border-2 border-blue-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:file-document-multiple" class="h-5 w-5 text-blue-600" />
            </div>
            <p class="text-sm text-gray-600">Total Assigned</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalAssigned}</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 via-white to-green-50 rounded-lg border-2 border-green-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:check-circle" class="h-5 w-5 text-green-600" />
            </div>
            <p class="text-sm text-gray-600">Total Treated</p>
          </div>
          <p class="text-3xl font-bold text-slate-800">{performanceData.overview.totalTreated}</p>
        </div>

        <div class="bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-lg border-2 border-pink-200/40 p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:chart-line" class="h-5 w-5 text-pink-600" />
            </div>
            <p class="text-sm text-gray-600">Overall Rate</p>
          </div>
          <p class="text-3xl font-bold text-pink-600">{performanceData.overview.overallRate}%</p>
        </div>
      </div>

      <!-- Unit Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each performanceData.units as unit, index}
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: {COLORS[index % COLORS.length]}20">
                  <Icon icon="mdi:domain" class="h-5 w-5" style="color: {COLORS[index % COLORS.length]}" />
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
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  {unit.treatmentRate}%
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="text-sm text-gray-600">Staff Count</span>
                <span class="font-semibold text-slate-800">{unit.staffCount}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Avg per Staff</span>
                <span class="font-semibold text-purple-600">{unit.avgPerStaff}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Charts Section -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-800">Performance Visualization</h3>
            <div class="flex gap-2">
              <Button
                variant={chartView === "bar" ? "default" : "outline"}
                size="sm"
                on:click={() => chartView = "bar"}
              >
                <Icon icon="mdi:chart-bar" class="mr-2 h-4 w-4" />
                Bar Chart
              </Button>
              <Button
                variant={chartView === "pie" ? "default" : "outline"}
                size="sm"
                on:click={() => chartView = "pie"}
              >
                <Icon icon="mdi:chart-pie" class="mr-2 h-4 w-4" />
                Pie Chart
              </Button>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          {#if chartView === "bar"}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#a855f7" name="Assigned" />
                <Bar dataKey="treated" fill="#ec4899" name="Treated" />
              </BarChart>
            </ResponsiveContainer>
          {:else}
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {#each pieData as entry, index}
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  {/each}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          {/if}
        </div>
      </div>
    {/if}

  </div>
</div>