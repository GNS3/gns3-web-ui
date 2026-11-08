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
  private readonly httpController = inject(HttpController);

  /** Privileges evaluated on the current project's resource path (empty until loaded). */
  readonly privileges = signal<ReadonlySet<string>>(new Set());
  /** True once the current project's privileges have been fetched (successfully or not). */
  readonly loaded = signal(false);

  private projectId: string | null = null;
  private loadSubscription: Subscription | null = null;

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
    if (this.projectId === projectId) {
      return;
    }
    this.projectId = projectId;
    this.privileges.set(new Set());
    this.loaded.set(false);
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.httpController
      .get<UserPrivilegesResponse>(controller, `/projects/${projectId}/me/privileges`)
      .subscribe({
        next: (response) => {
          if (this.projectId !== projectId) return;
          this.privileges.set(new Set<string>(response.privileges ?? []));
          this.loaded.set(true);
        },
        error: () => {
          if (this.projectId !== projectId) return;
          // No Project.Audit on this path (or the fetch failed): zero
          // privileges, honest rendering. The 403 toast already reported it.
          this.privileges.set(new Set());
          this.loaded.set(true);
        },
      });
  }

  /** Forget the current project's privileges (leaving the project view). */
  clear(): void {
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
    this.projectId = null;
    this.privileges.set(new Set());
    this.loaded.set(false);
  }
}
