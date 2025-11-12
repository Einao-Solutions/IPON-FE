<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '@iconify/svelte';
  import type { IPService } from '$lib/services';
  import { resolveServiceRoute } from '$lib/services';
  import * as Card from '$lib/components/ui/card';

  export let services: IPService[];
  export let viewMode: 'grid' | 'list' = 'grid';
  export let categoryFilter: string | null = null;
  export let ipType: string | undefined = undefined;

  $: filteredServices = categoryFilter 
    ? services.filter(service => service.category === categoryFilter)
    : services;

  function handleServiceClick(service: IPService) {
    if (service.id === 'availability-search') {
      // Handle modal opening for availability search
      const event = new CustomEvent('openAvailabilitySearch');
      window.dispatchEvent(event);
    } else {
      const route = resolveServiceRoute(service, ipType);
      goto(route);
    }
  }

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      filing: 'text-blue-600',
      search: 'text-green-600',
      management: 'text-orange-600',
      financial: 'text-purple-600',
      administrative: 'text-gray-600'
    };
    return colors[category] || 'text-gray-600';
  }
</script>

{#if viewMode === 'grid'}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {#each filteredServices as service (service.id)}
      <button
        on:click={() => handleServiceClick(service)}
        class="flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.02] hover:border-green-300 min-h-[140px] space-y-3"
      >
        <Icon 
          icon={service.icon} 
          width="2.5em" 
          height="2.5em" 
          class="text-green-600" 
        />
        <div class="space-y-1">
          <Card.Title class="text-sm font-semibold text-slate-800">{service.name}</Card.Title>
          <Card.Description class="text-xs text-slate-600 leading-relaxed">
            {service.description}
          </Card.Description>
        </div>
        {#if service.category}
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 {getCategoryColor(service.category)} capitalize">
            {service.category}
          </span>
        {/if}
      </button>
    {/each}
  </div>
{:else}
  <div class="space-y-2">
    {#each filteredServices as service (service.id)}
      <button
        on:click={() => handleServiceClick(service)}
        class="w-full flex items-center space-x-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 hover:border-green-300 text-left"
      >
        <div class="flex-shrink-0">
          <Icon 
            icon={service.icon} 
            width="2em" 
            height="2em" 
            class="text-green-600" 
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-slate-800 truncate">{service.name}</h3>
          <p class="text-xs text-slate-600 mt-1">{service.description}</p>
        </div>
        <div class="flex-shrink-0">
          {#if service.category}
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 {getCategoryColor(service.category)} capitalize">
              {service.category}
            </span>
          {/if}
        </div>
      </button>
    {/each}
  </div>
{/if}

{#if filteredServices.length === 0}
  <div class="text-center py-12">
    <Icon icon="mdi:file-search-outline" width="3em" height="3em" class="text-slate-300 mx-auto mb-4" />
    <p class="text-slate-500">No services found for the selected category.</p>
  </div>
{/if}