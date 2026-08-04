import { computed, Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  createdAt: number;
  read: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'gns3-notification-history';
const NOTIFICATION_LIMIT = 100;
const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000;

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private sequence = 0;
  private readonly notificationState = signal<AppNotification[]>(this.restore());
  private readonly panelOpenState = signal(false);

  readonly notifications = this.notificationState.asReadonly();
  readonly panelOpen = this.panelOpenState.asReadonly();
  readonly unreadCount = computed(() => this.notificationState().filter((item) => !item.read).length);
  readonly errorCount = computed(() => this.notificationState().filter((item) => item.kind === 'error').length);
  readonly warningCount = computed(() => this.notificationState().filter((item) => item.kind === 'warning').length);
  readonly activityCount = computed(
    () => this.notificationState().filter((item) => item.kind === 'success' || item.kind === 'info').length
  );

  add(kind: NotificationKind, message: unknown): AppNotification {
    const notification: AppNotification = {
      id: this.createId(),
      kind,
      message: this.normalizeMessage(message),
      createdAt: Date.now(),
      read: false,
    };

    this.update([notification, ...this.notificationState()].slice(0, NOTIFICATION_LIMIT));
    return notification;
  }

  togglePanel(): void {
    this.panelOpenState.update((open) => !open);
  }

  closePanel(): void {
    this.panelOpenState.set(false);
  }

  markAsRead(id: string): void {
    if (!this.notificationState().some((item) => item.id === id && !item.read)) return;
    this.update(this.notificationState().map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;
    this.update(this.notificationState().map((item) => ({ ...item, read: true })));
  }

  remove(id: string): void {
    this.update(this.notificationState().filter((item) => item.id !== id));
  }

  clear(): void {
    this.update([]);
  }

  private createId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${this.sequence++}-${Math.random().toString(36).slice(2)}`;
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message) ?? String(message);
    } catch {
      return String(message);
    }
  }

  private update(notifications: AppNotification[]): void {
    this.notificationState.set(notifications);
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // History remains available in memory when browser storage is unavailable.
    }
  }

  private restore(): AppNotification[] {
    try {
      const stored = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || '[]');
      if (!Array.isArray(stored)) {
        return [];
      }
      return stored
        .filter(
          (item): item is AppNotification =>
            typeof item?.id === 'string' &&
            typeof item?.message === 'string' &&
            typeof item?.createdAt === 'number' &&
            Number.isFinite(item.createdAt) &&
            item.createdAt >= 0 &&
            item.createdAt <= MAX_DATE_TIMESTAMP &&
            typeof item?.read === 'boolean' &&
            ['success', 'info', 'warning', 'error'].includes(item?.kind)
        )
        .slice(0, NOTIFICATION_LIMIT);
    } catch {
      return [];
    }
  }
}
