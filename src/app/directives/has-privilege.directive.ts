import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input } from '@angular/core';
import { PermissionService } from '@services/permission.service';

/**
 * Structural directive rendering global chrome by privilege.
 *
 * Usage:
 *   <button *appHasPrivilege="'Compute.Allocate'">Add compute</button>
 *   <ng-template [appHasPrivilege]="['User.Audit', 'Group.Audit']" [match]="'any'">
 *     <a>Management</a>
 *   </ng-template>
 *
 * Use the long form whenever `match` is needed: the structural microsyntax
 * (`; match: 'any'`) binds an `appHasPrivilegeMatch` input the directive does
 * not declare, which silently falls back to the default 'all'.
 *
 * Reads the flattened global privilege list of the active controller
 * (PermissionService). Inside the project view use
 * HasProjectPrivilegeDirective instead — the project-scoped list is the
 * exact judgement source there.
 */
@Directive({
  selector: '[appHasPrivilege]',
  standalone: true,
})
export class HasPrivilegeDirective {
  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  /** A single privilege name, or a list combined per `match`. */
  readonly appHasPrivilege = input.required<string | string[]>({
    alias: 'appHasPrivilege',
  });

  /** How a privilege list is combined: 'all' (default) or 'any'. */
  readonly match = input<'all' | 'any'>('all');

  private readonly allowed = computed(() => {
    const value = this.appHasPrivilege();
    const required = Array.isArray(value) ? value : [value];
    const privileges = this.permissionService.privileges();
    return this.match() === 'any' ? required.some((privilege) => privileges.has(privilege)) : required.every((privilege) => privileges.has(privilege));
  });

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.allowed()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
