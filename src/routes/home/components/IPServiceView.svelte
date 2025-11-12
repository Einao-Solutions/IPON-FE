<script lang="ts">
  import { getServicesForIPType, getServicesByCategory, type IPService } from '$lib/services';
  import ServiceGrid from './ServiceGrid.svelte';
  import Icon from '@iconify/svelte';
  import { Button } from '$lib/components/ui/button';

  export let ipType: 'trademark' | 'patent' | 'design';
  export let onBack: () => void;

  let viewMode: 'grid' | 'list' = 'grid';
  let selectedCategory: string | null = null;

  $: services = getServicesForIPType(ipType);
  $: servicesByCategory = getServicesByCategory(services);
  $: categories = Object.keys(servicesByCategory);

  function getIPIcon(type: string): string {
    const icons: Record<string, string> = {
      trademark: 'mdi:scale-balance',
      patent: 'mdi:lightbulb-outline',
      design: 'mdi:palette-outline'
    };
    return icons[type] || 'mdi:file';
  }

  function getIPTitle(type: string): string {
    const titles: Record<string, string> = {
      trademark: 'Trademark Services',
      patent: 'Patent Services', 
      design: 'Design Services'
    };
    return titles[type] || 'Services';
  }

  function getIPDescription(type: string): string {
    const descriptions: Record<string, string> = {
      trademark: 'Register and protect your brand identity',
      patent: 'Protect your inventions and innovations',
      design: 'Safeguard your creative designs'
    };
    return descriptions[type] || 'Available services';
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      filing: 'mdi:file-plus',
      search: 'mdi:magnify',
      management: 'mdi:cog',
      financial: 'mdi:cash',
      administrative: 'mdi:clipboard-text'
    };
    return icons[category] || 'mdi:folder';
  }
</script>

<div class="bg-slate-50/50 rounded-xl p-6 h-screen overflow-y-auto">
  <div class="max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex-shrink-0 mb-6">
      <!-- Back Button and View Toggle -->
      <div class="flex items-center justify-between mb-4">
        <button 
          on:click={onBack}
          class="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Icon icon="mdi:arrow-left" class="text-xl" />
          <span class="font-medium">Back to Dashboard</span>
        </button>
        
        <div class="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            on:click={() => (viewMode = 'grid')}
            class="flex items-center space-x-1"
          >
            <Icon icon="mdi:grid" class="text-sm" />
            <span>Grid</span>
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm" 
            on:click={() => (viewMode = 'list')}
            class="flex items-center space-x-1"
          >
            <Icon icon="mdi:format-list-bulleted" class="text-sm" />
            <span>List</span>
          </Button>
        </div>
      </div>

      <!-- Service Header -->
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
          <Icon icon={getIPIcon(ipType)} class="text-2xl text-green-600" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">{getIPTitle(ipType)}</h1>
          <p class="text-slate-600 text-sm">{getIPDescription(ipType)}</p>
        </div>
      </div>

      <!-- Category Filters -->
      <div class="flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          on:click={() => (selectedCategory = null)}
        >
          All Services ({services.length})
        </Button>
        {#each categories as category}
          <Button 
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            on:click={() => (selectedCategory = category)}
            class="flex items-center space-x-1 capitalize"
          >
            <Icon icon={getCategoryIcon(category)} class="text-sm" />
            <span>{category} ({servicesByCategory[category].length})</span>
          </Button>
        {/each}
      </div>
    </div>

    <!-- Services Grid/List -->
    <div class="pb-6">
      <ServiceGrid 
        {services} 
        {viewMode} 
        categoryFilter={selectedCategory} 
        {ipType}
      />
    </div>
  </div>
</div>