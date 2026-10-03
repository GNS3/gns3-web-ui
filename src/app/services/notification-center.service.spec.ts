import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenterService } from './notification-center.service';

describe('NotificationCenterService', () => {
  let service: NotificationCenterService;

  beforeEach(() => {
    localStorage.clear();
    service = new NotificationCenterService();
  });

  it('defaults to visible toasts and restores both saved preferences', () => {
    expect(service.toastsEnabled).toBe(true);
    service.setToastsEnabled(false);
    expect(new NotificationCenterService().toastsEnabled).toBe(false);
    service.setToastsEnabled(true);
    expect(new NotificationCenterService().toastsEnabled).toBe(true);
  });

  it('keeps the toast preference in memory when storage writes fail', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    try {
      expect(() => service.setToastsEnabled(false)).not.toThrow();
      expect(service.toastsEnabled).toBe(false);
      service.setToastsEnabled(true);
      expect(service.toastsEnabled).toBe(true);
    } finally {
      write.mockRestore();
    }
  });

  it('defaults to visible toasts when storage reads fail', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    try {
      expect(service.toastsEnabled).toBe(true);
    } finally {
      read.mockRestore();
    }
  });

  it('stores activity, warning, and error notifications with unread counts', () => {
    service.add('success', 'Saved');
    service.add('info', 'Connected');
    service.add('warning', 'Memory is high');
    service.add('error', 'Console failed');

    expect(service.notifications()).toHaveLength(4);
    expect(service.activityCount()).toBe(2);
    expect(service.warningCount()).toBe(1);
    expect(service.errorCount()).toBe(1);
    expect(service.unreadCount()).toBe(4);
  });

  it('marks, removes, and clears history', () => {
    const first = service.add('success', 'Saved');
    const second = service.add('error', 'Failed');

    service.markAsRead(first.id);
    expect(service.unreadCount()).toBe(1);

    service.remove(second.id);
    expect(service.notifications().map((notification) => notification.id)).toEqual([first.id]);

    service.clear();
    expect(service.notifications()).toEqual([]);
  });

  it('restores persisted notifications and caps history at 100 entries', () => {
    for (let index = 0; index < 105; index += 1) {
      service.add('info', `Activity ${index}`);
    }

    expect(service.notifications()).toHaveLength(100);
    const restored = new NotificationCenterService();
    expect(restored.notifications()).toHaveLength(100);
    expect(restored.notifications()[0].message).toBe('Activity 104');
  });

  it('creates unique IDs across service instances', () => {
    const first = service.add('info', 'First');
    const secondService = new NotificationCenterService();
    const second = secondService.add('info', 'Second');

    expect(second.id).not.toBe(first.id);
  });

  it('ignores malformed persisted history', () => {
    localStorage.setItem(
      'gns3-notification-history',
      JSON.stringify([
        { id: 'valid', kind: 'success', message: 'Saved', createdAt: 1, read: false },
        { id: 'bad-kind', kind: 'debug', message: 'Ignored', createdAt: 2, read: false },
        { id: 'bad-time', kind: 'error', message: 'Ignored', createdAt: 'yesterday', read: false },
        { id: 'out-of-range-time', kind: 'error', message: 'Ignored', createdAt: 1e300, read: false },
      ])
    );

    const restored = new NotificationCenterService();

    expect(restored.notifications().map((notification) => notification.id)).toEqual(['valid']);
  });
});
