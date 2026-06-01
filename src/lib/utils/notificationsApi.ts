import { writable, get } from "svelte/store";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { baseURL } from "$lib/helpers";
import { loggedInToken, loggedInUser } from "$lib/store";

export enum NotificationAudience {
  User = 0,
  System = 1,
}

export enum NotificationCategory {
  Application,
  Payment,
  CustomerSupport,
  Security,
  System,
  Messaging,
}

export enum NotificationPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipientId?: string | null;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  fileNumber?: string | null;
  fileType?: number | null;
}

export const notifications = writable<AppNotification[]>([]);
export const unreadCount = writable<number>(0);
export const notificationsLoading = writable<boolean>(false);

function authHeaders(): HeadersInit {
  const token = get(loggedInToken);
  return {
    Authorization: `Bearer ${token ?? ""}`,
    "Content-Type": "application/json",
  };
}

function currentUserId(): string | null {
  const user = get(loggedInUser);
  return user?.email ??  null;
}

const ENDPOINT = `${baseURL}/api/notifications`;

export async function fetchNotifications(): Promise<AppNotification[]> {
  const userId = currentUserId();
  if (!userId) return [];
  notificationsLoading.set(true);
  try {
    const res = await fetch(
      `${ENDPOINT}/GetNotifications?userId=${encodeURIComponent(userId)}`,
      {
        headers: authHeaders(),
      },
    );
    if (!res.ok)
      throw new Error(`Failed to fetch notifications: ${res.status}`);
    const data: AppNotification[] = await res.json();
    notifications.set(data ?? []);
    return data ?? [];
  } catch (err) {
    console.error("fetchNotifications error", err);
    return [];
  } finally {
    notificationsLoading.set(false);
  }
}

export async function fetchUnreadCount(): Promise<number> {
  const userId = currentUserId();
  if (!userId) return 0;
  try {
    const res = await fetch(
      `${ENDPOINT}/UnreadCount?userId=${encodeURIComponent(userId)}`,
      {
        headers: authHeaders(),
      },
    );
    if (!res.ok) throw new Error(`Failed to fetch unread count: ${res.status}`);
    const data: { unreadCount: number } = await res.json();
    const count = data?.unreadCount ?? 0;
    unreadCount.set(count);
    return count;
  } catch (err) {
    console.error("fetchUnreadCount error", err);
    return 0;
  }
}

export async function markAsRead(id: string): Promise<void> {
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(id)}/read`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to mark as read: ${res.status}`);
    notifications.update((list) =>
      list.map((n) =>
        n.id === id && !n.isRead
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
    );
    unreadCount.update((c) => Math.max(0, c - 1));
  } catch (err) {
    console.error("markAsRead error", err);
  }
}

export async function markAllAsRead(): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;
  try {
    const res = await fetch(
      `${ENDPOINT}/read-all?userId=${encodeURIComponent(userId)}`,
      {
        method: "POST",
        headers: authHeaders(),
      },
    );
    if (!res.ok) throw new Error(`Failed to mark all as read: ${res.status}`);
    const now = new Date().toISOString();
    notifications.update((list) =>
      list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now })),
    );
    unreadCount.set(0);
  } catch (err) {
    console.error("markAllAsRead error", err);
  }
}

export interface CreateNotificationDto {
  audience: NotificationAudience;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipientId?: string | null;
  actionUrl?: string | null;
  expiresAt?: string | null;
  createdBy?: string | null;
  fileNumber?: string | null;
}

export async function createNotification(
  dto: CreateNotificationDto,
): Promise<AppNotification | null> {
  try {
    const user = get(loggedInUser);
    const payload: CreateNotificationDto = {
      ...dto,
      createdBy: dto.createdBy ?? user?.id ?? null,
    };
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to create notification: ${res.status} ${text}`);
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as AppNotification) : null;
  } catch (err) {
    console.error("createNotification error", err);
    throw err;
  }
}

let pollHandle: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling(intervalMs = 60_000): void {
  if (typeof window === "undefined") return;
  stopNotificationPolling();
  fetchUnreadCount();
  pollHandle = setInterval(() => {
    fetchUnreadCount();
  }, intervalMs);
}

export function stopNotificationPolling(): void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

// ---------- SignalR ----------

const HUB_URL = `${baseURL}/hubs/notifications`;
let connection: HubConnection | null = null;
let starting: Promise<void> | null = null;

export const notificationsConnected = writable<boolean>(false);

function upsertNotification(n: AppNotification) {
  notifications.update((list) => {
    const idx = list.findIndex((x) => x.id === n.id);
    if (idx === -1) return [n, ...list];
    const next = list.slice();
    next[idx] = { ...next[idx], ...n };
    return next;
  });
  if (!n.isRead) unreadCount.update((c) => c + 1);
}

export async function startNotificationHub(): Promise<void> {
  if (typeof window === "undefined") return;
  if (connection && connection.state === HubConnectionState.Connected) return;
  if (starting) return starting;

  const userId = currentUserId();
  if (!userId) return;

  connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => get(loggedInToken) ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("ReceiveNotification", (payload: AppNotification) => {
    if (!payload) return;
    upsertNotification(payload);
  });

  connection.onreconnected(() => {
    notificationsConnected.set(true);
    fetchUnreadCount();
  });
  connection.onreconnecting(() => notificationsConnected.set(false));
  connection.onclose(() => notificationsConnected.set(false));

  starting = connection
    .start()
    .then(() => {
      notificationsConnected.set(true);
    })
    .catch((err) => {
      console.error("SignalR start error", err);
      notificationsConnected.set(false);
    })
    .finally(() => {
      starting = null;
    });

  return starting;
}

export async function stopNotificationHub(): Promise<void> {
  if (!connection) return;
  try {
    await connection.stop();
  } catch (err) {
    console.error("SignalR stop error", err);
  } finally {
    notificationsConnected.set(false);
    connection = null;
  }
}
