<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import {
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startNotificationHub,
    stopNotificationHub,
    type AppNotification,
    NotificationPriority,
  } from "$lib/utils/notificationsApi";

  let open = false;

  function toggle() {
    open = !open;
    if (open) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".notif-bell-container")) {
      open = false;
    }
  }

  async function onItemClick(n: AppNotification) {
    if (!n.isRead) await markAsRead(n.id);
    if (n.actionUrl) {
      open = false;
      goto(n.actionUrl);
    }
  }

  function viewAll() {
    open = false;
    goto("/home/notifications");
  }

  function timeAgo(iso: string): string {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return "";
    const diff = Math.max(0, Date.now() - d);
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  function priorityColor(p: NotificationPriority): string {
    switch (p) {
      case NotificationPriority.Critical:
        return "bg-red-500";
      case NotificationPriority.High:
        return "bg-orange-500";
      case NotificationPriority.Medium:
        return "bg-green-500";
      default:
        return "bg-slate-400";
    }
  }

  onMount(() => {
    fetchUnreadCount();
    startNotificationHub();
  });

  onDestroy(() => {
    stopNotificationHub();
  });

  $: recent = $notifications.slice(0, 8);
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative notif-bell-container">
  <button
    type="button"
    on:click|stopPropagation={toggle}
    class="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors"
    aria-label="Notifications"
  >
    <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0"
      />
    </svg>
    {#if $unreadCount > 0}
      <span
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white"
      >
        {$unreadCount > 99 ? "99+" : $unreadCount}
      </span>
    {/if}
  </button>

  {#if open}
    <div
      class="absolute right-0 mt-2 w-[22rem] max-w-[95vw] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-900">Notifications</p>
          <p class="text-xs text-slate-500 mt-0.5">
            {$unreadCount} unread
          </p>
        </div>
        {#if $unreadCount > 0}
          <button
            type="button"
            on:click={markAllAsRead}
            class="text-xs font-medium text-green-700 hover:text-green-800 hover:underline"
          >
            Mark all as read
          </button>
        {/if}
      </div>

      <div class="max-h-96 overflow-y-auto">
        {#if $notificationsLoading && recent.length === 0}
          <div class="px-4 py-8 text-center text-sm text-slate-500">Loading...</div>
        {:else if recent.length === 0}
          <div class="px-4 py-8 text-center text-sm text-slate-500">
            You're all caught up.
          </div>
        {:else}
          <ul class="divide-y divide-slate-100">
            {#each recent as n (n.id)}
              <li>
                <button
                  type="button"
                  on:click={() => onItemClick(n)}
                  class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 {n.isRead
                    ? ''
                    : 'bg-green-50/40'}"
                >
                  <span
                    class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 {priorityColor(n.priority)}"
                  ></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                    <p class="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                    <p class="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {#if !n.isRead}
                    <span class="mt-2 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          on:click={viewAll}
          class="w-full px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-slate-100 transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  {/if}
</div>
