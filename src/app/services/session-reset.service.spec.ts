import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SessionResetService } from './session-reset.service';
import { PermissionService } from './permission.service';
import { ProjectDistributionService } from './project-distribution.service';
import { NotificationCenterService } from './notification-center.service';

describe('SessionResetService', () => {
  let permissionInvalidate: ReturnType<typeof vi.fn>;
  let distributionInvalidate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    permissionInvalidate = vi.fn();
    distributionInvalidate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionService, useValue: { invalidate: permissionInvalidate } },
        { provide: ProjectDistributionService, useValue: { invalidate: distributionInvalidate } },
      ],
    });
  });

  it('clears the stored and in-memory notification history of the outgoing user', () => {
    localStorage.setItem(
      'gns3-notification-history',
      JSON.stringify([{ id: 'n1', kind: 'error', message: 'previous user secret', createdAt: 1, read: false }]),
    );
    const service = TestBed.inject(SessionResetService);
    const notificationCenter = TestBed.inject(NotificationCenterService);
    expect(notificationCenter.notifications().length).toBe(1);

    service.reset();

    expect(localStorage.getItem('gns3-notification-history')).toBeNull();
    expect(notificationCenter.notifications().length).toBe(0);
  });

  it('clears the per-project item-lock visibility keys of the outgoing user', () => {
    localStorage.setItem('itemLockStatusVisibility_project-1', 'true');
    localStorage.setItem('itemLockStatusVisibility_project-2', 'false');
    localStorage.setItem('controllerIds', 'controller-1');
    const service = TestBed.inject(SessionResetService);

    service.reset();

    expect(localStorage.getItem('itemLockStatusVisibility_project-1')).toBeNull();
    expect(localStorage.getItem('itemLockStatusVisibility_project-2')).toBeNull();
    // Keys that are not user-scoped stay untouched.
    expect(localStorage.getItem('controllerIds')).toBe('controller-1');
  });

  it('drops the cached privilege sets of the outgoing user', () => {
    const service = TestBed.inject(SessionResetService);

    service.reset();

    expect(permissionInvalidate).toHaveBeenCalledTimes(1);
    expect(distributionInvalidate).toHaveBeenCalledTimes(1);
  });
});
