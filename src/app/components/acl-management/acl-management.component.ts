/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2023 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 *
 * Author: Sylvain MATHIEU, Elise LEBEAU
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { Controller } from '@models/controller';
import { ACE, AceType } from '@models/api/ACE';
import { ActivatedRoute } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { createActionCompletion } from '@utils/action-completion.util';
import { AclService } from '@services/acl.service';
import { AddAceDialogComponent } from '@components/acl-management/add-ace-dialog/add-ace-dialog.component';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Endpoint } from '@models/api/endpoint';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';

/** ACE rules sharing one subject (a user or a group). */
interface AceGroup {
  key: string;
  subjectType: AceType;
  subjectId: string;
  name: string;
  aces: ACE[];
}

interface RulePageState {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-acl-management',
  templateUrl: './acl-management.component.html',
  styleUrl: './acl-management.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    HasPrivilegeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AclManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  public aclService = inject(AclService);
  private resourcePoolsService = inject(ResourcePoolsService);
  public dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  controller: Controller;
  selection = new SelectionModel<ACE>(true, []);
  readonly isReady = signal(false);
  readonly searchText = model('');
  readonly endpoints = signal<Endpoint[]>([]);
  readonly resourcePools = signal<ResourcePool[]>([]);
  readonly aces = signal<ACE[]>([]);

  // Grouping / expansion / pagination state
  readonly expandedGroups = signal<ReadonlySet<string>>(new Set());
  readonly rulePageSizeOptions = [10, 15, 20];
  readonly rulePageByGroup = signal<Record<string, RulePageState>>({});

  /** ACE rules grouped by subject (user/group), sorted by subject name. */
  readonly aceGroups = computed<AceGroup[]>(() => {
    const groups = new Map<string, AceGroup>();
    for (const ace of this.aces()) {
      const subjectId = (ace.ace_type === AceType.user ? ace.user_id : ace.group_id) ?? '';
      const key = `${ace.ace_type}:${subjectId}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          subjectType: ace.ace_type,
          subjectId,
          name: this.getNameByUuidFromEndpoint(subjectId),
          aces: [],
        };
        groups.set(key, group);
      }
      group.aces.push(ace);
    }
    return [...groups.values()]
      .map((group) => ({ ...group, aces: this.sortAces(group.aces) }))
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }) ||
          left.subjectType.localeCompare(right.subjectType)
      );
  });

  /** Groups narrowed to rules matching the search text (all rules when the search is empty). */
  readonly filteredGroups = computed<AceGroup[]>(() => {
    const search = this.searchText().trim().toLowerCase();
    if (!search) {
      return this.aceGroups();
    }
    return this.aceGroups()
      .map((group) => ({ ...group, aces: group.aces.filter((ace) => this.aceMatchesSearch(ace, search)) }))
      .filter((group) => group.aces.length > 0);
  });

  ngOnInit(): void {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.aclService.getEndpoints(this.controller).subscribe({
        next: (endpoints: Endpoint[]) => {
          this.endpoints.set(endpoints);
          this.refresh();
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load endpoints';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
      this.resourcePoolsService.getAll(controller).subscribe({
        next: (pools: ResourcePool[]) => {
          this.resourcePools.set(pools);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to load resource pools';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }

  // ------------------------------------------------------------------
  // Expansion
  // ------------------------------------------------------------------

  isExpanded(group: AceGroup): boolean {
    // Searching forces matched groups open so the matched rules are visible.
    return this.searchText().trim().length > 0 || this.expandedGroups().has(group.key);
  }

  toggleGroup(group: AceGroup): void {
    const expanded = new Set(this.expandedGroups());
    if (expanded.has(group.key)) {
      expanded.delete(group.key);
    } else {
      expanded.add(group.key);
    }
    this.expandedGroups.set(expanded);
  }

  // ------------------------------------------------------------------
  // Pagination (groups and per-group rules)
  // ------------------------------------------------------------------

  rulePageOf(group: AceGroup): RulePageState {
    const state = this.rulePageByGroup()[group.key] ?? { pageIndex: 0, pageSize: this.rulePageSizeOptions[0] };
    const lastPage = Math.max(Math.ceil(group.aces.length / state.pageSize) - 1, 0);
    return { pageIndex: Math.min(state.pageIndex, lastPage), pageSize: state.pageSize };
  }

  pagedAcesFor(group: AceGroup): ACE[] {
    const { pageIndex, pageSize } = this.rulePageOf(group);
    const start = pageIndex * pageSize;
    return group.aces.slice(start, start + pageSize);
  }

  onRulePageChange(group: AceGroup, event: PageEvent): void {
    this.rulePageByGroup.update((pages) => ({
      ...pages,
      [group.key]: { pageIndex: event.pageIndex, pageSize: event.pageSize },
    }));
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.rulePageByGroup.set({});
  }

  // ------------------------------------------------------------------
  // Selection (per rule; group header checkbox toggles the group's visible rules)
  // ------------------------------------------------------------------

  isGroupAllSelected(group: AceGroup): boolean {
    return group.aces.length > 0 && group.aces.every((ace) => this.selection.isSelected(ace));
  }

  isGroupPartiallySelected(group: AceGroup): boolean {
    return !this.isGroupAllSelected(group) && group.aces.some((ace) => this.selection.isSelected(ace));
  }

  toggleGroupSelection(group: AceGroup): void {
    if (this.isGroupAllSelected(group)) {
      group.aces.forEach((ace) => this.selection.deselect(ace));
    } else {
      group.aces.forEach((ace) => this.selection.select(ace));
    }
  }

  trackGroup(_index: number, group: AceGroup): string {
    return group.key;
  }

  trackAce(_index: number, ace: ACE): string {
    return ace.ace_id;
  }

  refresh() {
    this.aclService.list(this.controller).subscribe({
      next: (aces: ACE[]) => {
        this.isReady.set(true);
        this.aces.set(aces);
        this.selection.clear();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load ACL list';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  addACE() {
    const dialogRef = this.dialog.open(AddAceDialogComponent, {
      panelClass: ['base-dialog-panel', 'add-ace-dialog-panel', 'dialog-extra-large-panel'],
      autoFocus: false,
      disableClose: true,
      data: { endpoints: this.endpoints() },
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onEdit(ace: ACE) {
    const dialogRef = this.dialog.open(AddAceDialogComponent, {
      panelClass: ['base-dialog-panel', 'add-ace-dialog-panel', 'dialog-extra-large-panel'],
      autoFocus: false,
      disableClose: true,
      data: { endpoints: this.endpoints(), ace },
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onDelete(ace: ACE) {
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Delete ACE rule?',
          message: `The ACE rule for "${ace.path}" will be permanently deleted.`,
          confirmButtonText: 'Delete rule',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.aclService.delete(this.controller, ace.ace_id).subscribe({
            next: () => {
              this.toasterService.success('ACE rule deleted.');
              this.refresh();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to delete ACE';
              this.toasterService.error(message);
              this.cdr.markForCheck();
            },
          });
        }
      });
  }

  deleteMultiple() {
    const selectedAces = [...this.selection.selected];
    this.dialog
      .open(ConfirmationDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
        autoFocus: '.cancel-button',
        data: {
          title: 'Delete ACE rules?',
          message: `${selectedAces.length} selected ACE rules will be permanently deleted.`,
          details: selectedAces.map((ace) => ace.path),
          confirmButtonText: 'Delete rules',
          tone: 'danger',
        },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const completion = createActionCompletion(selectedAces.length, (count) => {
            if (count > 0) {
              this.toasterService.success(`${count} ACE ${count === 1 ? 'rule' : 'rules'} deleted.`);
              this.refresh();
            }
          });
          selectedAces.forEach((ace: ACE) => {
            this.aclService.delete(this.controller, ace.ace_id).subscribe({
              next: () => completion.succeed(),
              error: (err) => {
                completion.fail();
                const message = err.error?.message || err.message || 'Failed to delete ACE';
                this.toasterService.error(message);
                this.cdr.markForCheck();
              },
            });
          });
          this.selection.clear();
        }
      });
  }

  getNameByUuidFromEndpoint(path: string): string {
    if (!path) {
      return '';
    }

    // Check if the path is a resource pool path (/pools/{pool_id})
    const poolMatch = path.match(/^\/pools\/(.+)$/);
    if (poolMatch) {
      const poolId = poolMatch[1];
      const pool = this.resourcePools().find((p) => p.resource_pool_id === poolId);
      if (pool) {
        return `Resource pool "${pool.name}"`;
      }
      return `Resource pool (${poolId.slice(0, 8)}...)`;
    }

    // Otherwise, look up in endpoints
    if (this.endpoints()) {
      const elt = this.endpoints().filter((endpoint: Endpoint) => endpoint.endpoint.includes(path));
      if (elt.length >= 1) {
        return elt[0].name;
      }
    }

    return path;
  }

  private sortAces(aces: ACE[]): ACE[] {
    return [...aces].sort((left, right) =>
      this.getNameByUuidFromEndpoint(left.path)
        .localeCompare(this.getNameByUuidFromEndpoint(right.path), undefined, { numeric: true, sensitivity: 'base' })
    );
  }

  private aceMatchesSearch(ace: ACE, search: string): boolean {
    return [
      this.getNameByUuidFromEndpoint(ace.path),
      this.getNameByUuidFromEndpoint(ace.user_id ?? ''),
      this.getNameByUuidFromEndpoint(ace.group_id ?? ''),
      this.getNameByUuidFromEndpoint(ace.role_id),
    ].some((value) => value.toLowerCase().includes(search));
  }
}
