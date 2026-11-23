import { Injectable, inject } from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { ProjectDistributionService } from '@services/project-distribution.service';
import { NotificationCenterService } from '@services/notification-center.service';

/** localStorage key prefix of the per-project item-lock visibility flag. */
export const ITEM_LOCK_STATUS_KEY_PREFIX = 'itemLockStatusVisibility_';

/**
 * Tears down the per-user state held by root singletons.
 *
 * Navigating to the login page in-app (logout button, session expiry
 * redirect, logging in as a different user) does not reset singletons the
 * way a full-page reload would. Every service that caches user-scoped
 * data must be invalidated here: the next user on the same browser would
 * otherwise be served the previous user's privileges, preferences mirror
 * and distribution tracking. All session boundaries go through this
 * single choke point so a new user-scoped service registers once instead
 * of per call site.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionResetService {
  private readonly permissionService = inject(PermissionService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly projectDistributions = inject(ProjectDistributionService);
  private readonly notificationCenter = inject(NotificationCenterService);

  reset(): void {
    this.permissionService.invalidate();
    this.userPreferences.invalidate();
    this.projectDistributions.invalidate();
    this.notificationCenter.invalidate();
    this.wipeItemLockStatusKeys();
  }

  /**
   * The item-lock visibility flag is keyed by project id and stored
   * raw in localStorage (not through the preferences facade), so the
   * outgoing user's flags are wiped by prefix scan here.
   */
  private wipeItemLockStatusKeys(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        if (key.startsWith(ITEM_LOCK_STATUS_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Best-effort: storage may be unavailable.
    }
  }
}
