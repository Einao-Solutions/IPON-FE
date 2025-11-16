<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '@iconify/svelte';
  import type { IPService } from '$lib/services';
  import { resolveServiceRoute } from '$lib/services';
  import * as Card from '$lib/components/ui/card';

  export let services: IPService[];
  export let viewMode: 'grid' | 'list' = 'list';
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
    } else if (service.id === 'pay-certificate') {
      // Handle modal opening for pay certificate
      const event = new CustomEvent('openPayCertModal');
      window.dispatchEvent(event);
    } else if (service.id === 'verify-payment') {
      // Handle modal opening for verify payment
      const event = new CustomEvent('openVerifyPaymentModal');
      window.dispatchEvent(event);
    } else if (service.id === 'change-agent') {
      // Handle modal opening for change of agent
      const event = new CustomEvent('openChangeOfAgentModal');
      window.dispatchEvent(event);
    } else if (service.id === 'print-documents') {
      // Handle modal opening for print documents
      const event = new CustomEvent('openGetDocumentsModal');
      window.dispatchEvent(event);
    } else if (service.id === 'appeal') {
      // Handle modal opening for appeals
      const event = new CustomEvent('openFileAppealsModal');
      window.dispatchEvent(event);
    } else if (ipType === 'trademark' && [
      'change-applicant-name',
      'change-applicant-address', 
      'renewal',
      'assignment',
      'merger',
      'registered-user'
    ].includes(service.id)) {
      // NEW STREAMLINED FLOW - Handle context-aware trademark services
      const event = new CustomEvent('openStreamlinedPostRegModal', {
        detail: {
          serviceId: service.id,
          serviceName: service.name,
          ipType: ipType
        }
      });
      window.dispatchEvent(event);
    } else if (ipType === 'patent' && service.id === 'renewal') {
      // NEW STREAMLINED FLOW - Handle context-aware patent renewal
      const event = new CustomEvent('openStreamlinedPostRegModal', {
        detail: {
          serviceId: service.id,
          serviceName: service.name,
          ipType: ipType
        }
      });
      window.dispatchEvent(event);
    } else {
      // OLD IMPLEMENTATION (commented for future deletion)
      // const route = resolveServiceRoute(service, ipType);
      // goto(route);
      
      // STANDARD ROUTING - For all other services
      let route = resolveServiceRoute(service, ipType);
      
      // Add IP context to context-aware routes
      if ((service.id === 'post-registration' || service.id === 'file-withdrawal' || service.id === 'update-files' || service.id === 'clerical-update') && ipType) {
        route += `?ipType=${ipType}`;
      }
      
      goto(route);
    }
  }

  function getServiceIcon(service: IPService): string {
    // Map service IDs to specific icons to match the design
    const iconMap: Record<string, string> = {
      'pre-registration': 'mdi:file-plus-outline',
      'clerical-update': 'mdi:file-edit-outline',
      'trademark-journal': 'mdi:book-open-variant',
      'status-search': 'mdi:magnify',
      'availability-search': 'mdi:file-search-outline',
      'renewal': 'mdi:refresh',
      'assignment': 'mdi:account-switch',
      'registered-user': 'mdi:account-group',
      'merger': 'mdi:merge',
      'change-applicant-name': 'mdi:account-edit',
      'change-applicant-address': 'mdi:map-marker-radius',
      'pay-certificate': 'mdi:cash-fast',
      'verify-payment': 'mdi:cash-sync',
      'change-agent': 'mdi:account-switch',
      'print-documents': 'mdi:printer-outline',
      'update-file': 'mdi:update',
      'update-publication-status': 'mdi:newspaper-variant-outline',
      'withdrawal': 'mdi:close-circle-outline',
      'claim-files': 'mdi:file-document-multiple',
      'appeal': 'mdi:information-outline'
    };
    return iconMap[service.id] || service.icon;
  }

  function getIconColor(service: IPService): string {
    // Color mapping based on the screenshot
    const colorMap: Record<string, string> = {
      'pre-registration': 'text-green-600',
      'clerical-update': 'text-green-600',
      'trademark-journal': 'text-green-600',
      'status-search': 'text-green-600',
      'availability-search': 'text-green-600',
      'renewal': 'text-green-600',
      'assignment': 'text-green-600',
      'registered-user': 'text-green-600',
      'merger': 'text-green-600',
      'change-applicant-name': 'text-green-600',
      'change-applicant-address': 'text-green-600',
      'pay-certificate': 'text-green-600',
      'verify-payment': 'text-green-600',
      'change-agent': 'text-green-600',
      'print-documents': 'text-green-600',
      'update-file': 'text-green-600',
      'update-publication-status': 'text-green-600',
      'withdrawal': 'text-green-600',
      'claim-files': 'text-green-600',
      'appeal': 'text-green-600'
    };
    return colorMap[service.id] || 'text-green-600';
  }
</script>

{#if viewMode === 'grid'}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredServices as service (service.id)}
      <button
        on:click={() => handleServiceClick(service)}
        class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 text-left group hover:border-green-200"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <Icon 
              icon={getServiceIcon(service)} 
              width="24" 
              height="24" 
              class={getIconColor(service)} 
            />
          </div>
          {#if service.price}
            <div class="text-right">
              <div class="text-sm font-semibold text-green-600">{service.price}</div>
              <div class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Available</div>
            </div>
          {:else}
            <div class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Available</div>
          {/if}
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-900 text-sm mb-2">{service.name}</h3>
          <p class="text-xs text-gray-600 leading-relaxed">{service.description}</p>
        </div>
      </button>
    {/each}
  </div>
{:else}
  <div class="space-y-3">
    {#each filteredServices as service (service.id)}
      <button
        on:click={() => handleServiceClick(service)}
        class="w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 text-left group hover:border-green-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 flex-1">
            <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors flex-shrink-0">
              <Icon 
                icon={getServiceIcon(service)} 
                width="20" 
                height="20" 
                class={getIconColor(service)} 
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">{service.name}</h3>
              <p class="text-xs text-gray-600 mt-1">{service.description}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4 flex-shrink-0">
            {#if service.price}
              <div class="text-right">
                <div class="text-sm font-semibold text-green-600">{service.price}</div>
              </div>
            {/if}
            <div class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Available</div>
          </div>
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