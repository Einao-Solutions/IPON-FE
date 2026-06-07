<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    type AppNotification,
    NotificationPriority,
    NotificationCategory,
  } from "$lib/utils/notificationsApi";
  import { Button } from "$lib/components/ui/button";

  type Filter = "all" | "unread" | "read";
  let filter: Filter = "all";
  const filters: Filter[] = ["all", "unread", "read"];

  onMount(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  });

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
    return new Date(iso).toLocaleString();
  }

  function priorityBadge(p: NotificationPriority) {
    switch (p) {
      case NotificationPriority.Critical:
        return { label: "Critical", cls: "bg-red-100 text-red-700" };
      case NotificationPriority.High:
        return { label: "High", cls: "bg-orange-100 text-orange-700" };
      case NotificationPriority.Medium:
        return { label: "Normal", cls: "bg-green-100 text-green-700" };
      default:
        return { label: "Low", cls: "bg-slate-100 text-slate-600" };
    }
  }

  function categoryLabel(c: NotificationCategory): string {
    return NotificationCategory[c] ?? "General";
  }

  async function onItemClick(n: AppNotification) {
    if (!n.isRead) await markAsRead(n.id);
    if (n.actionUrl) goto(n.actionUrl);
  }

  $: filtered = $notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
  <div class="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Notifications</h1>
      <p class="text-sm text-slate-500 mt-1">
        {$unreadCount} unread of {$notifications.length} total
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        on:click={() => {
          fetchNotifications();
          fetchUnreadCount();
        }}
      >
        Refresh
      </Button>
      {#if $unreadCount > 0}
        <Button size="sm" on:click={markAllAsRead}>Mark all as read</Button>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-2 mb-4">
    {#each filters as f}
      <button
        type="button"
        on:click={() => (filter = f)}
        class="px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize {filter === f
          ? 'bg-green-600 text-white border-green-600'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}"
      >
        {f}
      </button>
    {/each}
  </div>

  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
    {#if $notificationsLoading && filtered.length === 0}
      <div class="px-6 py-16 text-center text-sm text-slate-500">Loading notifications...</div>
    {:else if filtered.length === 0}
      <div class="px-6 py-16 text-center text-sm text-slate-500">
        No notifications to show.
      </div>
    {:else}
      <ul class="divide-y divide-slate-100">
        {#each filtered as n (n.id)}
          {@const badge = priorityBadge(n.priority)}
          <li>
            <button
              type="button"
              on:click={() => onItemClick(n)}
              class="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex gap-4 {n.isRead
                ? ''
                : 'bg-green-50/30'}"
            >
              <div class="flex-shrink-0 mt-1">
                {#if !n.isRead}
                  <span class="block w-2.5 h-2.5 rounded-full bg-green-500"></span>
                {:else}
                  <span class="block w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-slate-900">{n.title}</p>
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full {badge.cls}">
                    {badge.label}
                  </span>
                  <span
                    class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                  >
                    {categoryLabel(n.category)}
                  </span>
                  {#if n.fileNumber}
                    <span class="text-[11px] text-slate-500">· {n.fileNumber}</span>
                  {/if}
                </div>
                <p class="text-sm text-slate-700 mt-1 whitespace-pre-line">{n.message}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  {#if n.actionUrl}
                    <span class="text-xs text-green-700 font-medium">Open →</span>
                  {/if}
                </div>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
