<script lang="ts">
  import Icon from "@iconify/svelte";
  import { UserRoles } from "$lib/helpers";
  
  export let userRoles: number[] = [];
  export let onCardClick: (registry: string) => void;

  $: isFullAccess = userRoles.includes(UserRoles.SuperAdmin);
  $: showTrademark = isFullAccess;
  $: showPatent = isFullAccess;
  $: showDesign = isFullAccess;
  $: showSupport = isFullAccess;
  $: supportBadge = "SuperAdmin";

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

<div class="registry-grid">
  {#if showTrademark}
    <button on:click={() => onCardClick('Trademark')} class="registry-option">
      <span class="registry-icon"><Icon icon="mdi:trademark" class="h-5 w-5" /></span>
      <span class="registry-copy"><span class="registry-name">Trademark</span><span class="registry-description">Trademarks, classes, and applications</span></span>
      <Icon icon="mdi:arrow-right" class="h-[17px] w-[17px] shrink-0 text-[#63806d]" />
    </button>
  {/if}

  {#if showPatent}
    <button on:click={() => onCardClick('Patent')} class="registry-option">
      <span class="registry-icon"><Icon icon="mdi:lightbulb-on" class="h-5 w-5" /></span>
      <span class="registry-copy"><span class="registry-name">Patent</span><span class="registry-description">Patents and technical inventions</span></span>
      <Icon icon="mdi:arrow-right" class="h-[17px] w-[17px] shrink-0 text-[#63806d]" />
    </button>
  {/if}

  {#if showDesign}
    <button on:click={() => onCardClick('Design')} class="registry-option">
      <span class="registry-icon"><Icon icon="mdi:palette" class="h-5 w-5" /></span>
      <span class="registry-copy"><span class="registry-name">Design</span><span class="registry-description">Industrial designs and creators</span></span>
      <Icon icon="mdi:arrow-right" class="h-[17px] w-[17px] shrink-0 text-[#63806d]" />
    </button>
  {/if}

  {#if showSupport}
    <button on:click={() => onCardClick('Support')} class="registry-option">
      <span class="registry-icon"><Icon icon="mdi:headset" class="h-5 w-5" /></span>
      <span class="registry-copy"><span class="registry-name">Support</span><span class="registry-description">Support tickets and officer performance</span></span>
      <span class="support-badge">{supportBadge}</span>
      <Icon icon="mdi:arrow-right" class="h-[17px] w-[17px] shrink-0 text-[#63806d]" />
    </button>
  {/if}
</div>

<style>
  .registry-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 0; background: transparent; }
  .registry-option { position: relative; display: flex; min-width: 0; min-height: 142px; align-items: center; gap: 18px; padding: 24px; overflow: hidden; border: 1px solid #d7e1da; border-radius: 6px; background: #fff; text-align: left; transition: background-color 150ms ease, border-color 150ms ease; }
  .registry-option::before { position: absolute; inset: 0 auto 0 0; width: 3px; background: #477b5d; content: ''; opacity: 0; transition: opacity 150ms ease; }
  .registry-option:hover { border-color: #b9cbbf; background: #fcfdfc; }
  .registry-option:hover::before { opacity: 1; }
  .registry-option:focus-visible { outline: 2px solid #477b5d; outline-offset: 2px; }
  .registry-icon { display: flex; width: 48px; height: 48px; flex-shrink: 0; align-items: center; justify-content: center; border: 1px solid #dce7df; border-radius: 6px; background: #edf3ef; color: #265640; }
  .registry-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 7px; }
  .registry-name { color: #26392d; font-size: 17px; font-weight: 600; }
  .registry-description { max-width: 34rem; color: #69776e; font-size: 13px; line-height: 1.5; }
  .support-badge { flex-shrink: 0; padding: 4px 7px; border: 1px solid #dce4de; border-radius: 4px; color: #66736b; font-size: 10px; }
  @media (max-width: 900px) {
    .registry-option { min-height: 128px; padding: 20px; gap: 14px; }
  }
  @media (max-width: 700px) {
    .registry-grid { grid-template-columns: minmax(0, 1fr); }
    .registry-option { min-height: 104px; padding: 18px; }
    .registry-icon { width: 42px; height: 42px; }
    .registry-name { font-size: 15px; }
    .registry-description { font-size: 12px; }
  }
</style>
