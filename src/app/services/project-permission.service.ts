import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpController } from '@services/http-controller.service';
import { Controller } from '@models/controller';
import { UserPrivilegesResponse } from '@services/permission.service';

/**
 * Privileges of the logged-in user inside the currently opened project.
 *
 * Source: GET /projects/{project_id}/me/privileges — each privilege is
 * evaluated on the project's resource path, so the result reflects ACEs
 * scoped to this project and the resource pools containing it. This is
 * the exact judgement source for everything rendered inside the project
 * view (toolbar, context menus, file manager), unlike the flattened
 * global list which can overestimate.
 *
 * The endpoint itself requires Project.Audit: a user who cannot audit a
 * project never sees it in the project list (the server filters it), so
 * a failure here degrades to "no privileges" — every write action is
 * hidden and the server remains the authority anyway.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectPermissionService {
  /**
   * Attempts per project: the initial fetch plus short retries for transient
   * failures. A single failed request must not hide every write action for
   * the lifetime of the project view.
   */
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 2000;

  private readonly httpController = inject(HttpController);

  /** Privileges evaluated on the current project's resource path (empty until loaded). */
  readonly privileges = signal<ReadonlySet<string>>(new Set());
  /**
   * True once the current project's privileges reached a terminal state:
   * fetched, or denied/failed after the retry budget.
   */
  readonly loaded = signal(false);

  private projectId: string | null = null;
  private controller: Controller | null = null;
  private loadSubscription: Subscription | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;

  has(privilege: string): boolean {
    return this.privileges().has(privilege);
  }

  hasAny(privileges: string[]): boolean {
    return privileges.some((privilege) => this.privileges().has(privilege));
  }

  /**
   * Display-layer composite: most project write actions are gated on the
   * server by either Modify or Allocate for the same resource kind.
   * (The server has no such combined concept — this is rendering only.)
   */
  canWrite(resource: string): boolean {
    return this.hasAny([`${resource}.Modify`, `${resource}.Allocate`]);
  }

  /**
   * Load the privilege list for the given project. Idempotent while the
   * same project stays open. Called when the project view resolves its
   * project.
   */
  load(controller: Controller, projectId: string): void {
    if (
      this.projectId === projectId &&
      (this.loaded() || this.loadSubscription !== null || this.retryTimer !== null)
    ) {
      return;
    }
    this.projectId = projectId;
    this.controller = controller;
    this.privileges.set(new Set());
    this.loaded.set(false);
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
    this.cancelRetry();
    this.attempt = 0;
    this.attemptLoad(projectId);
  }

  /** Forget the current project's privileges (leaving the project view). */
  clear(): void {
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
    this.cancelRetry();
    this.projectId = null;
    this.controller = null;
    this.attempt = 0;
    this.privileges.set(new Set());
    this.loaded.set(false);
  }

  private attemptLoad(projectId: string): void {
    const controller = this.controller;
    if (!controller || this.projectId !== projectId) {
      return;
    }
    this.attempt++;
    this.loadSubscription = this.httpController
      .get<UserPrivilegesResponse>(controller, `/projects/${projectId}/me/privileges`)
      .subscribe({
        next: (response) => {
          if (this.projectId !== projectId) return;
          this.privileges.set(new Set<string>(response.privileges ?? []));
          this.loaded.set(true);
        },
        error: (err: unknown) => {
          if (this.projectId !== projectId) return;
          if (this.isRetryable(err) && this.attempt < ProjectPermissionService.MAX_ATTEMPTS) {
            this.retryTimer = setTimeout(() => {
              this.retryTimer = null;
              this.attemptLoad(projectId);
            }, ProjectPermissionService.RETRY_DELAY_MS);
            return;
          }
          // No Project.Audit on this path, or the retry budget is spent:
          // zero privileges, honest rendering. The 403 toast already
          // reported a denial.
          this.privileges.set(new Set());
          this.loaded.set(true);
        },
      });
  }

  private cancelRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Only transient failures are retried. A 401/403/404 is a stable answer
   * for this path (unauthenticated, no Project.Audit, or an older server
   * without the endpoint) — repeating it would just delay the honest
   * zero-privilege rendering.
   */
  private isRetryable(err: unknown): boolean {
    const status = (err as { originalError?: { status?: number }; status?: number } | null)?.originalError?.status
      ?? (err as { status?: number } | null)?.status;
    return status === undefined || status === 0 || status >= 500;
  }
}
