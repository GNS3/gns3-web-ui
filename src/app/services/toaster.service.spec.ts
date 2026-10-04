import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationToastComponent } from '@components/notification-center/notification-toast.component';
import { AppNotification, NotificationCenterService, NotificationKind } from './notification-center.service';
import { ToasterService } from './toaster.service';

describe('ToasterService', () => {
  let service: ToasterService;
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };
  let notificationCenter: { add: ReturnType<typeof vi.fn>; panelOpen: ReturnType<typeof vi.fn>; toastsEnabled: boolean };

  beforeEach(() => {
    snackbar = { openFromComponent: vi.fn() };
    notificationCenter = {
      toastsEnabled: true,
      panelOpen: vi.fn().mockReturnValue(false),
      add: vi.fn((kind: NotificationKind, message: string) => ({
        id: 'notification-1',
        kind,
        message,
        createdAt: 1,
        read: false,
      }) satisfies AppNotification),
    };
    service = new ToasterService(
      snackbar as any,
      notificationCenter as unknown as NotificationCenterService
    );
  });

  it.each([
    ['success', 4000],
    ['warning', 4000],
    ['error', 10000],
    ['info', 4000],
  ] as const)('records and displays a modern %s notification', (kind, duration) => {
    service[kind](`${kind} message`);

    expect(notificationCenter.add).toHaveBeenCalledWith(kind, `${kind} message`);
    expect(snackbar.openFromComponent).toHaveBeenCalledWith(
      NotificationToastComponent,
      expect.objectContaining({
        duration,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['gns3-toast-panel'],
        data: {
          notification: expect.objectContaining({ kind, message: `${kind} message` }),
        },
      })
    );
  });

  it.each(['success', 'info', 'warning', 'error'] as const)('honors the toast preference for %s and keeps history', (kind) => {
    notificationCenter.toastsEnabled = false;
    service[kind]('Hidden', { showToast: true });
    expect(notificationCenter.add).toHaveBeenCalledWith(kind, 'Hidden');
    expect(snackbar.openFromComponent).not.toHaveBeenCalled();

    notificationCenter.toastsEnabled = true;
    service[kind]('Visible');
    expect(snackbar.openFromComponent).toHaveBeenCalledOnce();
  });

  it('applies the persisted preference through the real notification center', () => {
    localStorage.removeItem('notificationsVisibility');
    const center = new NotificationCenterService();
    const toaster = new ToasterService(snackbar as any, center);
    try {
      center.setToastsEnabled(false);
      toaster.success('Hidden');
      expect(snackbar.openFromComponent).not.toHaveBeenCalled();
      expect(center.notifications()[0].message).toBe('Hidden');

      center.setToastsEnabled(true);
      toaster.success('Visible');
      expect(snackbar.openFromComponent).toHaveBeenCalledOnce();
      expect(center.notifications()[0].message).toBe('Visible');
    } finally {
      center.clear();
      localStorage.removeItem('notificationsVisibility');
    }
  });

  it('records a notification without showing a toast when requested', () => {
    service.warning('Background warning', { showToast: false });

    expect(notificationCenter.add).toHaveBeenCalledWith('warning', 'Background warning');
    expect(snackbar.openFromComponent).not.toHaveBeenCalled();
  });

  it('does not duplicate a toast while the notification panel is open', () => {
    notificationCenter.panelOpen.mockReturnValue(true);

    service.success('Saved');

    expect(notificationCenter.add).toHaveBeenCalledWith('success', 'Saved');
    expect(snackbar.openFromComponent).not.toHaveBeenCalled();
  });

  it.each(['warning', 'error'] as const)('announces %s notifications assertively', (kind) => {
    service[kind](`${kind} message`);

    expect(snackbar.openFromComponent).toHaveBeenCalledWith(
      NotificationToastComponent,
      expect.objectContaining({ politeness: 'assertive' })
    );
  });

  it('continues logging errors to the console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.error('Failed');

    expect(consoleError).toHaveBeenCalledWith('Failed');
    consoleError.mockRestore();
  });
});
