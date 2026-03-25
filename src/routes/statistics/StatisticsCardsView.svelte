<script lang="ts">
  import Icon from "@iconify/svelte";
  import { UserRoles } from "$lib/helpers";
  
  export let userRoles: number[] = [];
  export let onCardClick: (registry: string) => void;

  // Determine grid columns based on user role
  let gridCols = "md:grid-cols-3";
  
  // If user is Finance role only, show only Trademark (1 column)
  if (userRoles.includes(UserRoles.Finance) && !userRoles.includes(UserRoles.SuperAdmin)) {
    gridCols = "md:grid-cols-1 max-w-md mx-auto";
  }
</script>

<div class="grid grid-cols-1 {gridCols} gap-6 mb-4 flex-shrink-0 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm">
  
  <!-- Trademark Card -->
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
      <p class="text-sm text-slate-500">
        View performance, operational & financial statistics
      </p>
      
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

  <!-- Patent Card -->
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
      <p class="text-sm text-slate-500">
        View performance, operational & financial statistics
      </p>
      
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

  <!-- Design Card -->
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
      <p class="text-sm text-slate-500">
        View performance, operational & financial statistics
      </p>
      
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

</div>
