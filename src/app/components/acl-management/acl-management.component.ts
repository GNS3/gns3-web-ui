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
  effect,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { Controller } from '@models/controller';
import { ACE } from '@models/api/ACE';
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

type AceSortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-acl-management',
  templateUrl: './acl-management.component.html',
  styleUrl: './acl-management.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
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
  public displayedColumns = ['select', 'path', 'user/group', 'role', 'propagate', 'allowed', 'updated_at', 'actions'];
  selection = new SelectionModel<ACE>(true, []);
  readonly isReady = signal(false);
  readonly searchText = model('');
  readonly endpoints = signal<Endpoint[]>([]);
  readonly resourcePools = signal<ResourcePool[]>([]);
  readonly aces = signal<ACE[]>([]);

  // Sorting / pagination state (same pattern as user-management)
  readonly sortActive = signal('path');
  readonly sortDirection = signal<AceSortDirection>('asc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 20];

  /** ACEs matching the search text, sorted by the active column. */
  readonly filteredAces = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const aces = this.aces();

    const matched = search
      ? aces.filter((ace) =>
          [this.getNameByUuidFromEndpoint(ace.path), this.getNameByUuidFromEndpoint(ace.user_id ?? ''), this.getNameByUuidFromEndpoint(ace.group_id ?? ''), this.getNameByUuidFromEndpoint(ace.role_id)]
            .some((value) => value.toLowerCase().includes(search))
        )
      : aces;

    const active = this.sortActive();
    const direction = this.sortDirection();
    if (!active || !direction) {
      return matched;
    }

    return [...matched].sort(
      (left, right) =>
        this.sortValue(left, active).localeCompare(this.sortValue(right, active), undefined, { numeric: true, sensitivity: 'base' }) *
        (direction === 'asc' ? 1 : -1)
    );
  });

  readonly paginatedAces = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredAces().slice(start, start + this.pageSize());
  });

  constructor() {
    // Keep the page index valid whenever the filtered set shrinks.
    effect(() => {
      const lastPage = Math.max(Math.ceil(this.filteredAces().length / this.pageSize()) - 1, 0);
      if (this.pageIndex() > lastPage) {
        this.pageIndex.set(lastPage);
      }
    });
  }

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

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || 'path');
    this.sortDirection.set(sort.direction);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.pageIndex.set(0);
  }

  trackAce(_index: number, ace: ACE): string {
    return ace.ace_id;
  }

  private sortValue(ace: ACE, property: string): string {
    switch (property) {
      case 'path':
        return this.getNameByUuidFromEndpoint(ace.path).toLowerCase();
      case 'user/group':
        return this.getNameByUuidFromEndpoint((ace.user_id ?? ace.group_id) ?? '').toLowerCase();
      case 'role':
        return this.getNameByUuidFromEndpoint(ace.role_id).toLowerCase();
      case 'propagate':
      case 'allowed':
        return ace[property] ? '1' : '0';
      default:
        return String(ace[property as keyof ACE] ?? '').toLowerCase();
    }
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

  isAllSelected() {
    const visibleAces = this.filteredAces();
    return visibleAces.length > 0 && this.selection.selected.length === visibleAces.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.filteredAces().forEach((row) => this.selection.select(row));
    }
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
}
