import { Directive, Signal, inject, input } from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { PrivilegeGateDirective } from './privilege-gate.directive';

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
export class HasPrivilegeDirective extends PrivilegeGateDirective {
  private readonly permissionService = inject(PermissionService);

  /** A single privilege name, or a list combined per `match`. */
  readonly appHasPrivilege = input.required<string | string[]>({
    alias: 'appHasPrivilege',
  });

  /** How a privilege list is combined: 'all' (default) or 'any'. */
  readonly match = input<'all' | 'any'>('all');

  protected readonly requiredPrivileges: Signal<string | string[]> = this.appHasPrivilege;
  protected readonly matchMode: Signal<'all' | 'any'> = this.match;
  protected readonly privilegeSet: Signal<ReadonlySet<string>> = this.permissionService.privileges;

  constructor() {
    super();
  }
}
