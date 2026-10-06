<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import Icon from '@iconify/svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

  export let periods: { label: string; totalAssigned: number; totalTreated: number; processingRate: number }[] = [];

  const COLORS = ['#16a34a', '#3b82f6', '#d97706', '#0d9488', '#a855f7'];
  let totalsCanvas: HTMLCanvasElement;
  let ratesCanvas: HTMLCanvasElement;
  let totalsChart: Chart | null = null;
  let ratesChart: Chart | null = null;
  let mounted = false;
  let renderVersion = 0;

  function destroyCharts() {
    totalsChart?.destroy();
    ratesChart?.destroy();
    totalsChart = null;
    ratesChart = null;
  }

  async function renderCharts(data: typeof periods, totals: HTMLCanvasElement, rates: HTMLCanvasElement) {
    const version = ++renderVersion;
    await tick();
    if (!mounted || version !== renderVersion) return;
    destroyCharts();
    if (!data.length) return;
    const labels = data.map(period => period.label);
    totalsChart = new Chart(totals, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Assigned', data: data.map(period => period.totalAssigned), backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Processed', data: data.map(period => period.totalTreated), backgroundColor: '#16a34a', borderRadius: 4 }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 16 } },
          tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.x.toLocaleString()} files` } }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
    ratesChart = new Chart(rates, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Processing Rate', data: data.map(period => period.processingRate), backgroundColor: data.map((_, index) => COLORS[index % COLORS.length]), borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: context => `Processing Rate: ${context.parsed.x}%` } }
        },
        scales: {
          x: { beginAtZero: true, suggestedMax: 100, grid: { color: '#f1f5f9' }, ticks: { callback: value => `${value}%` } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  $: if (mounted && totalsCanvas && ratesCanvas) renderCharts(periods, totalsCanvas, ratesCanvas);

  onMount(() => { mounted = true; });
  onDestroy(() => {
    mounted = false;
    renderVersion++;
    destroyCharts();
  });
</script>

<div class="comparison-charts grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
  <section class="chart-panel">
    <h3><Icon icon="lucide:bar-chart-horizontal" class="w-4 h-4" />Assigned vs Processed</h3>
    <div class="chart-canvas" style={`height: ${Math.max(periods.length * 60, 280)}px`}>
      <canvas bind:this={totalsCanvas} aria-label="Assigned and processed files by comparison period"></canvas>
    </div>
  </section>
  <section class="chart-panel">
    <h3><Icon icon="lucide:chart-no-axes-combined" class="w-4 h-4" />Processing Rate</h3>
    <div class="chart-canvas" style={`height: ${Math.max(periods.length * 60, 280)}px`}>
      <canvas bind:this={ratesCanvas} aria-label="Processing rates by comparison period"></canvas>
    </div>
  </section>
</div>

<style>
  .chart-panel { min-width: 0; padding: 20px; border: 1px solid #dde5df; border-radius: 6px; background: white; }
  h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; color: #265640; font-size: 14px; font-weight: 600; }
  .chart-canvas { position: relative; min-width: 0; }
  @media (max-width: 700px) { .comparison-charts { gap: 16px; } }
  @media print { .chart-panel { break-inside: avoid; } }
</style>