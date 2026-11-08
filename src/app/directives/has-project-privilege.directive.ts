import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input } from '@angular/core';
import { ProjectPermissionService } from '@services/project-permission.service';

/**
 * Structural directive rendering project-view chrome by privilege.
 *
 * Usage:
 *   <button *appHasProjectPrivilege="'Node.Allocate'">Add node</button>
 *   <ng-template [appHasProjectPrivilege]="['Node.Modify', 'Node.Allocate']" [match]="'any'">
 *     <button>Edit</button>
 *   </ng-template>
 *
 * Use the long form whenever `match` is needed: the structural microsyntax
 * (`; match: 'any'`) binds an `appHasProjectPrivilegeMatch` input the
 * directive does not declare, which silently falls back to the default 'all'.
 *
 * Reads the privilege list evaluated on the current project's resource
 * path (ProjectPermissionService) — the exact judgement source for
 * everything inside the project view, unlike the flattened global list.
 */
@Directive({
  selector: '[appHasProjectPrivilege]',
  standalone: true,
})
export class HasProjectPrivilegeDirective {
  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly projectPermissionService = inject(ProjectPermissionService);

  /** A single privilege name, or a list combined per `match`. */
  readonly appHasProjectPrivilege = input.required<string | string[]>({
    alias: 'appHasProjectPrivilege',
  });

  /** How a privilege list is combined: 'all' (default) or 'any'. */
  readonly match = input<'all' | 'any'>('all');

  private readonly allowed = computed(() => {
    const value = this.appHasProjectPrivilege();
    const required = Array.isArray(value) ? value : [value];
    const privileges = this.projectPermissionService.privileges();
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
