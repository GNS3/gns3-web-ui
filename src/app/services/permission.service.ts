import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpController } from '@services/http-controller.service';
import { ControllerService } from '@services/controller.service';
import { Controller } from '@models/controller';

/**
 * Response shape of GET /access/users/me/privileges and
 * GET /projects/{project_id}/me/privileges.
 *
 * The privilege list is a rendering hint only: the server remains the
 * authority for permission checks and can still deny a listed privilege
 * on a specific resource path.
 */
export interface UserPrivilegesResponse {
  is_superadmin: boolean;
  privileges: string[];
}

/**
 * Global (controller-wide) privileges of the logged-in user.
 *
 * The list is flattened across all resource paths: it is exact for pages
 * whose endpoints evaluate on a fixed path (e.g. /computes, /templates,
 * /access/users) and may overestimate for endpoints evaluated on a
 * variable path (e.g. POST /projects). The 403 toast is the correction
 * layer for those cases — never try to pre-empt the server client-side.
 *
 * State is cached per controller id because every controller has its own
 * user database. The default layout activates the current controller on
 * route changes; the privilege guard reads the per-controller data
 * without touching the active signals (deep links resolve before the
 * layout exists).
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly httpController = inject(HttpController);
  private readonly controllerService = inject(ControllerService);

  /** Privileges of the user on the active controller (empty until loaded). */
  readonly privileges = signal<ReadonlySet<string>>(new Set());
  /**
   * Superadmin flag of the user on the active controller. Gates the few
   * endpoints that check `is_superadmin` directly instead of a named
   * privilege (e.g. POST /copilot/reload/skills).
   */
  readonly isSuperadmin = signal(false);
  /** True once the active controller's privileges have been fetched (successfully or not). */
  readonly loaded = signal(false);

  private currentControllerId: number | null = null;
  private readonly privilegeCache = new Map<number, { privileges: ReadonlySet<string>; isSuperadmin: boolean }>();
  private readonly inflightRequests = new Map<number, Promise<ReadonlySet<string>>>();

  has(privilege: string): boolean {
    return this.privileges().has(privilege);
  }

  /**
   * Privileges of the given controller when already cached, null when they
   * still need to be fetched. Callers that must decide synchronously (e.g.
   * opening the global notification stream before the first route renders)
   * use this as a fast path and fall back to ready().
   */
  cachedPrivileges(controllerId: number): ReadonlySet<string> | null {
    return this.privilegeCache.get(controllerId)?.privileges ?? null;
  }

  hasAny(privileges: string[]): boolean {
    return privileges.some((privilege) => this.privileges().has(privilege));
  }

  /**
   * Make the given controller the active one and expose its privileges
   * as signals (from cache when available, fetched otherwise).
   * Called by the default layout whenever the active controller changes.
   */
  activate(controllerId: number): void {
    this.currentControllerId = controllerId;
    const cached = this.privilegeCache.get(controllerId);
    if (cached) {
      this.privileges.set(cached.privileges);
      this.isSuperadmin.set(cached.isSuperadmin);
      this.loaded.set(true);
      return;
    }
    this.privileges.set(new Set());
    this.isSuperadmin.set(false);
    this.loaded.set(false);
    void this.ready(controllerId).catch(() => {
      // Fetch failed: render as zero privileges. The server remains the
      // authority; gated chrome stays hidden instead of flashing in.
      if (this.currentControllerId === controllerId) {
        this.privileges.set(new Set());
        this.isSuperadmin.set(false);
        this.loaded.set(true);
      }
    });
  }

  /**
   * Resolve the privilege set of a controller, fetching it at most once
   * per controller (subsequent calls are served from cache). Used by the
   * privilege guard, which needs the data even before a layout exists.
   */
  async ready(controllerId: number): Promise<ReadonlySet<string>> {
    const cached = this.privilegeCache.get(controllerId);
    if (cached) {
      return cached.privileges;
    }

    const inflight = this.inflightRequests.get(controllerId);
    if (inflight) {
      return inflight;
    }

    const request = this.fetch(controllerId);
    this.inflightRequests.set(controllerId, request);
    try {
      return await request;
    } finally {
      this.inflightRequests.delete(controllerId);
    }
  }

  /** Drop all cached privilege sets (logout / user switch). */
  invalidate(): void {
    this.privilegeCache.clear();
    this.currentControllerId = null;
    this.privileges.set(new Set());
    this.isSuperadmin.set(false);
    this.loaded.set(false);
  }

  private async fetch(controllerId: number): Promise<ReadonlySet<string>> {
    const controller: Controller = await this.controllerService.get(controllerId);
    const response = await firstValueFrom(
      this.httpController.get<UserPrivilegesResponse>(controller, '/access/users/me/privileges'),
    );

    const privilegeSet = new Set<string>(response.privileges ?? []);
    const entry = { privileges: privilegeSet, isSuperadmin: response.is_superadmin ?? false };
    this.privilegeCache.set(controllerId, entry);
    if (this.currentControllerId === controllerId) {
      this.privileges.set(privilegeSet);
      this.isSuperadmin.set(entry.isSuperadmin);
      this.loaded.set(true);
    }
    return privilegeSet;
  }
}
