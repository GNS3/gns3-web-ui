import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '@services/permission.service';

/**
 * Route-level guard rendering pages by privilege.
 *
 * Usage:
 *   {
 *     path: 'computes',
 *     canActivate: [LoginGuard, PrivilegeGuard],
 *     data: { privileges: ['Compute.Audit'] },
 *   }
 *
 * `data.privileges` lists the required privilege names; with
 * `data.privilegeMatch: 'any'` (default 'all') the route is accessible
 * when the user holds at least one of them. A denied user is redirected
 * to the system status page, mirroring the previous administrator
 * guard behaviour — unless the denied route is the system status page
 * itself, which is privilege-gated too and would deny the redirect
 * forever; those users land on the projects page instead, which every
 * logged-in user can open. LoginGuard must run first so the request is
 * authenticated.
 *
 * `data.privilegesAny` adds an optional "at least one of" group on top of
 * `data.privileges` (which are all required). It expresses management
 * pages whose content needs a read privilege but which only make sense
 * with one of several write privileges:
 *
 *   data: {
 *     privileges: ['Template.Audit'],
 *     privilegesAny: ['Template.Allocate', 'Template.Modify'],
 *   }
 */
@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(private permissionService: PermissionService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const controllerId = this.findControllerId(route);
    const numericControllerId = Number.parseInt(controllerId ?? '', 10);

    if (!Number.isFinite(numericControllerId)) {
      await this.router.navigate(['/controllers']);
      return false;
    }

    const required: string[] = route.data?.['privileges'] ?? [];
    const anyOf: string[] = route.data?.['privilegesAny'] ?? [];
    if (required.length === 0 && anyOf.length === 0) {
      return true;
    }
    const match: 'all' | 'any' = route.data?.['privilegeMatch'] ?? 'all';

    try {
      const privileges = await this.permissionService.ready(numericControllerId);
      const allowedRequired =
        match === 'any'
          ? required.some((privilege) => privileges.has(privilege))
          : required.every((privilege) => privileges.has(privilege));
      const allowedAnyOf = anyOf.length === 0 || anyOf.some((privilege) => privileges.has(privilege));
      if (allowedRequired && allowedAnyOf) {
        return true;
      }
    } catch {
      // Privilege fetch failed: deny access, the page stays unreachable.
    }

    // Default deny target: the system status page. Never redirect there when
    // that is the very page that denied the navigation — it is privilege-
    // gated as well, so the redirect would re-run this guard, deny again and
    // loop forever without any route activating (a regular user logging in
    // lands on the system status page by default). Send those users to the
    // projects page instead.
    const denyTarget = `/controller/${numericControllerId}/systemstatus`;
    if (state.url.split('?')[0] === denyTarget) {
      await this.router.navigate(['/controller', numericControllerId, 'projects']);
    } else {
      await this.router.navigate(['/controller', numericControllerId, 'systemstatus']);
    }
    return false;
  }

  private findControllerId(route: ActivatedRouteSnapshot): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      const controllerId = current.paramMap.get('controller_id');
      if (controllerId) {
        return controllerId;
      }
      current = current.parent;
    }
    return null;
  }
}
