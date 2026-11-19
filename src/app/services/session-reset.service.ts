import { Injectable, inject } from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { ProjectDistributionService } from '@services/project-distribution.service';

/**
 * Tears down the per-user state held by root singletons.
 *
 * Navigating to the login page in-app (logout button, session expiry
 * redirect) does not reset singletons the way a full-page reload would.
 * Every service that caches user-scoped data must be invalidated here:
 * the next user on the same browser would otherwise be served the
 * previous user's privileges, preferences mirror and distribution
 * tracking. Both logout paths go through this single choke point so a
 * new user-scoped service registers once instead of per call site.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionResetService {
  private readonly permissionService = inject(PermissionService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly projectDistributions = inject(ProjectDistributionService);

  reset(): void {
    this.permissionService.invalidate();
    this.userPreferences.invalidate();
    this.projectDistributions.invalidate();
  }
}
