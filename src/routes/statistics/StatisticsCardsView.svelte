<script lang="ts">
  import Icon from "@iconify/svelte";
  import { UserRoles } from "$lib/helpers";
  
  export let userRoles: number[] = [];
  export let onCardClick: (registry: string) => void;

  // Determine which cards to show based on user role
  function getCardsForRole(): Array<{title: string, description: string, icon: string, registry: string}> {
    // Permanent Secretary, Minister, or SuperAdmin - Show all 3 registries
    if (userRoles.includes(UserRoles.PermSec) || userRoles.includes(UserRoles.Minister) || userRoles.includes(UserRoles.SuperAdmin)) {
      return [
        {
          title: "Trademark Statistics",
          description: "View comprehensive performance, operational, and financial statistics for the Trademark registry. Access unit performance metrics, file data by class and nationality, correspondence statistics, and revenue breakdown.",
          icon: "mdi:scale-balance",
          registry: "Trademark"
        },
        {
          title: "Patent Statistics",
          description: "View comprehensive performance, operational, and financial statistics for the Patent registry. Track search and examination unit performance, file data analysis, and revenue generation.",
          icon: "mdi:file-document-outline",
          registry: "Patent"
        },
        {
          title: "Design Statistics",
          description: "View comprehensive performance, operational, and financial statistics for the Design registry. Monitor unit performance, application trends, and financial metrics.",
          icon: "mdi:palette-outline",
          registry: "Design"
        }
      ];
    }
    
    // Trademark Registrar - Only Trademark
    if (userRoles.includes(UserRoles.TrademarkRegistrar)) {
      return [
        {
          title: "Trademark Statistics",
          description: "Access detailed performance and operational statistics for the Trademark registry. View unit-wise application processing, file data categorized by class and nationality, correspondence statistics from individuals and companies, and comprehensive application status tracking.",
          icon: "mdi:scale-balance",
          registry: "Trademark"
        }
      ];
    }
    
    // Patent & Design Registrar - Combined
    if (userRoles.includes(UserRoles.PatentDesignRegistrar)) {
      return [
        {
          title: "Patent & Design Statistics",
          description: "Access detailed performance and operational statistics for Patent and Design registries. Monitor search and examination unit performance, track file data by classification, analyze correspondence patterns, and view application status distribution across both registries.",
          icon: "mdi:file-chart-outline",
          registry: "PatentDesign"
        }
      ];
    }
    
    // Finance Officer - Financial only across all registries
    if (userRoles.includes(UserRoles.Finance)) {
      return [
        {
          title: "Financial Statistics",
          description: "View comprehensive financial statistics across all registries. Access revenue breakdown by application types (new applications, renewals, other services), revenue distribution by class, payment method analytics, and total revenue tracking with time-based filtering options.",
          icon: "mdi:currency-usd",
          registry: "Financial"
        }
      ];
    }
    
    return [];
  }

  const cards = getCardsForRole();
  const gridCols = cards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-1 max-w-2xl mx-auto";
</script>

<div class="grid grid-cols-1 {gridCols} gap-6 mb-4 flex-shrink-0 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm">
  {#each cards as card}
    <button
      class="text-left w-full group relative overflow-hidden"
      on:click={() => onCardClick(card.registry)}
    >
      <div
        class="relative bg-gradient-to-br from-green-50 via-white to-green-50 border border-green-200/40 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1 h-full"
      >
        <!-- Subtle background pattern -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/40 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        ></div>

        <div class="relative z-10 flex flex-col h-full">
          <div class="mb-4">
            <div
              class="w-14 h-14 bg-gradient-to-br from-green-100 via-white to-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl border border-green-200/30"
            >
              <Icon
                icon={card.icon}
                class="text-2xl text-green-600 group-hover:text-green-700"
              />
            </div>
            <h3
              class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900"
            >
              {card.title}
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              {card.description}
            </p>
          </div>
          <div class="flex items-center justify-end mt-auto">
            <div
              class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300 shadow-md"
            >
              <Icon
                icon="heroicons:arrow-right"
                class="text-green-600 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  {/each}
</div>
