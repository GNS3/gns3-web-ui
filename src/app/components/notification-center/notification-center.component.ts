import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationCenterService } from '@services/notification-center.service';
import type { AppNotification } from '@services/notification-center.service';
import { notificationIcon, notificationLabel } from './notification-presentation';

type NotificationFilter = 'all' | 'activity' | 'error' | 'warning';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  private readonly timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  private readonly dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  readonly notificationCenter = inject(NotificationCenterService);
  readonly icon = notificationIcon;
  readonly label = notificationLabel;
  readonly activeFilter = signal<NotificationFilter>('all');
  readonly searchQuery = signal('');
  readonly filters: ReadonlyArray<{ value: NotificationFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'activity', label: 'Activity' },
    { value: 'error', label: 'Errors' },
    { value: 'warning', label: 'Warnings' },
  ];

  readonly filteredNotifications = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery().trim().toLocaleLowerCase();

    return this.notificationCenter.notifications().filter((notification) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'activity' && (notification.kind === 'success' || notification.kind === 'info')) ||
        notification.kind === filter;
      const matchesQuery = !query || notification.message.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.notificationCenter.closePanel();
  }

  count(filter: NotificationFilter): number {
    switch (filter) {
      case 'activity':
        return this.notificationCenter.activityCount();
      case 'error':
        return this.notificationCenter.errorCount();
      case 'warning':
        return this.notificationCenter.warningCount();
      default:
        return this.notificationCenter.notifications().length;
    }
  }

  formatTime(createdAt: number): string {
    const created = new Date(createdAt);
    const today = new Date();
    const isToday =
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate();
    return isToday ? this.timeFormatter.format(created) : this.dateTimeFormatter.format(created);
  }

  dateTime(createdAt: number): string {
    return new Date(createdAt).toISOString();
  }

  markAsRead(notification: AppNotification): void {
    this.notificationCenter.markAsRead(notification.id);
  }

  remove(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.notificationCenter.remove(id);
  }
}
