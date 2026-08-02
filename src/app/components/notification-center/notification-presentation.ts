import type { NotificationKind } from '@services/notification-center.service';

const PRESENTATION: Record<NotificationKind, { icon: string; label: string }> = {
  success: { icon: 'check_circle', label: 'Completed' },
  info: { icon: 'info', label: 'Activity' },
  warning: { icon: 'warning', label: 'Warning' },
  error: { icon: 'error', label: 'Error' },
};

export function notificationIcon(kind: NotificationKind): string {
  return PRESENTATION[kind].icon;
}

export function notificationLabel(kind: NotificationKind): string {
  return PRESENTATION[kind].label;
}
