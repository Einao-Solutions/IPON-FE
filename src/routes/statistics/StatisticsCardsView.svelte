<script lang="ts">
  import Icon from "@iconify/svelte";
  import { UserRoles } from "$lib/helpers";
  
  export let userRoles: number[] = [];
  export let onCardClick: (registry: string) => void;

  $: isFullAccess = userRoles.includes(UserRoles.PermSec) || 
                    userRoles.includes(UserRoles.Minister) || 
                    userRoles.includes(UserRoles.SuperAdmin);

  $: showTrademark = isFullAccess || 
                     userRoles.includes(UserRoles.TrademarkRegistrar) || 
                     userRoles.includes(UserRoles.ActingTrademarkRegistrar) || 
                     userRoles.includes(UserRoles.Finance) ||
                     userRoles.includes(UserRoles.EinaoFinance);

  $: showPatent = isFullAccess || 
                  userRoles.includes(UserRoles.PatentDesignRegistrar) || 
                  userRoles.includes(UserRoles.ActingPatentDesignRegistrar) || 
                  userRoles.includes(UserRoles.Finance) ||
                  userRoles.includes(UserRoles.EinaoFinance);

  $: showDesign = isFullAccess || 
                  userRoles.includes(UserRoles.PatentDesignRegistrar) || 
                  userRoles.includes(UserRoles.ActingPatentDesignRegistrar) || 
                  userRoles.includes(UserRoles.Finance) ||
                  userRoles.includes(UserRoles.EinaoFinance);

  $: showSupport = userRoles.includes(UserRoles.SuperAdmin) ||
                   userRoles.includes(UserRoles.PermSec) ||
                   userRoles.includes(UserRoles.Tech);

  $: supportBadge = userRoles.includes(UserRoles.PermSec) &&
    !userRoles.includes(UserRoles.SuperAdmin) &&
    !userRoles.includes(UserRoles.Tech)
    ? "PermSec"
    : "Admin & Tech";

  $: visibleCount = [showTrademark, showPatent, showDesign].filter(Boolean).length;
  $: gridCols = visibleCount === 1 ? "md:grid-cols-1 max-w-md mx-auto" 
              : visibleCount === 2 ? "md:grid-cols-2 max-w-2xl mx-auto" 
              : "md:grid-cols-3";
  $: cardSubtitle = (() => {
    if (userRoles.includes(UserRoles.ActingTrademarkRegistrar) || userRoles.includes(UserRoles.ActingPatentDesignRegistrar))
      return "View support statistics";
    if (userRoles.includes(UserRoles.EinaoFinance)) 
      return "View tech fee revenue statistics";
    if (userRoles.includes(UserRoles.Finance)) 
      return "View financial statistics";
    if (userRoles.includes(UserRoles.TrademarkRegistrar) || userRoles.includes(UserRoles.PatentDesignRegistrar))
      return "View operational, financial & performance statistics";
    return "View operational, financial & performance statistics";
  })();
</script>

<div class="grid grid-cols-1 {gridCols} gap-6 mb-4 flex-shrink-0 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm">
  
  <!-- Trademark Card -->
  {#if showTrademark}
  <button
    on:click={() => onCardClick('Trademark')}
    class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400/50 hover:scale-105"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div class="relative p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Icon icon="mdi:trademark" class="text-white text-3xl" />
        </div>
        <Icon icon="mdi:chevron-right" class="text-slate-400 group-hover:text-green-600 text-2xl transform group-hover:translate-x-1 transition-all duration-300" />
      </div>
      
      <h3 class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors mb-2">
        Trademark
      </h3>
      <p class="text-slate-600 text-sm leading-relaxed">{cardSubtitle}</p>
      
      <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500 group-hover:text-green-600 transition-colors">
          Click to explore
        </span>
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs text-slate-400">Active</span>
        </div>
      </div>
    </div>
  </button>
  {/if}

  <!-- Patent Card -->
  {#if showPatent}
  <button
    on:click={() => onCardClick('Patent')}
    class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400/50 hover:scale-105"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div class="relative p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Icon icon="mdi:lightbulb-on" class="text-white text-3xl" />
        </div>
        <Icon icon="mdi:chevron-right" class="text-slate-400 group-hover:text-green-600 text-2xl transform group-hover:translate-x-1 transition-all duration-300" />
      </div>
      
      <h3 class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors mb-2">
        Patent
      </h3>
      <p class="text-slate-600 text-sm leading-relaxed">{cardSubtitle}</p>
      
      <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500 group-hover:text-green-600 transition-colors">
          Click to explore
        </span>
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs text-slate-400">Active</span>
        </div>
      </div>
    </div>
  </button>
  {/if}

  <!-- Design Card -->
  {#if showDesign}
  <button
    on:click={() => onCardClick('Design')}
    class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400/50 hover:scale-105"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div class="relative p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Icon icon="mdi:palette" class="text-white text-3xl" />
        </div>
        <Icon icon="mdi:chevron-right" class="text-slate-400 group-hover:text-green-600 text-2xl transform group-hover:translate-x-1 transition-all duration-300" />
      </div>
      
      <h3 class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors mb-2">
        Design
      </h3>
      <p class="text-slate-600 text-sm leading-relaxed">{cardSubtitle}</p>
      
      <div class="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500 group-hover:text-green-600 transition-colors">
          Click to explore
        </span>
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs text-slate-400">Active</span>
        </div>
      </div>
    </div>
  </button>
  {/if}

</div>

<!-- Support Card — SuperAdmin & Tech only -->
{#if showSupport}
<div class="mt-4 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm">
  <button
    on:click={() => onCardClick('Support')}
    class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400/50 hover:scale-[1.02] w-full text-left"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

    <div class="relative p-8 flex items-center gap-8">
      <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 flex-shrink-0">
        <Icon icon="mdi:headset" class="text-white text-3xl" />
      </div>

      <div class="flex-1">
        <div class="flex items-center gap-3 mb-1">
          <h3 class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors">
            Support
          </h3>
          <span class="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">{supportBadge}</span>
        </div>
        <p class="text-slate-600 text-sm leading-relaxed">
          View support ticket performance metrics — response rates, closure rates, and officer performance scores across all scopes
        </p>
      </div>

      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs text-slate-400">Active</span>
        </div>
        <Icon icon="mdi:chevron-right" class="text-slate-400 group-hover:text-green-600 text-2xl transform group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </div>
  </button>
</div>
{/if}
