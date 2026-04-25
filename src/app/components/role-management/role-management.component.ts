/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
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
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal,
  AfterViewInit,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Controller } from '@models/controller';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProgressService } from '../../common/progress/progress.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Role } from '@models/api/role';
import { RoleService } from '@services/role.service';
import { AddRoleDialogComponent } from '@components/role-management/add-role-dialog/add-role-dialog.component';
import { DeleteRoleDialogComponent } from '@components/role-management/delete-role-dialog/delete-role-dialog.component';
import { RoleFilterPipe } from '@components/role-management/role-filter.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    RoleFilterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleManagementComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roleService = inject(RoleService);
  private progressService = inject(ProgressService);
  private controllerService = inject(ControllerService);
  public dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  dataSource = new MatTableDataSource<Role>();
  displayedColumns = ['select', 'name', 'description'];
  selection = new SelectionModel<Role>(true, []);
  readonly searchText = model('');

  @ViewChildren('rolesPaginator') rolesPaginator: QueryList<MatPaginator>;
  @ViewChildren('rolesSort') rolesSort: QueryList<MatSort>;
  isReady = signal(false);

  constructor() {}

  ngOnInit() {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then(
      (controller: Controller) => {
        this.controller = controller;
        this.refresh();
      },
      (err) => {
        const message = err.error?.message || err.message || 'Failed to load controller';
        this.toasterService.error(message);
        this.cd.markForCheck();
      }
    );
  }

  ngAfterViewInit() {
    this.rolesPaginator.changes.subscribe((comps: QueryList<MatPaginator>) => {
      this.dataSource.paginator = comps.first;
    });
    this.rolesSort.changes.subscribe((comps: QueryList<MatSort>) => {
      this.dataSource.sort = comps.first;
    });
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item[property] ? item[property].toLowerCase() : '';
        default:
          return item[property];
      }
    };
  }

  refresh() {
    this.roleService.get(this.controller).subscribe({
      next: (roles: Role[]) => {
        this.isReady.set(true);
        this.dataSource.data = roles;
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load roles';
        this.toasterService.error(message);
        this.progressService.setError(err);
        this.cd.markForCheck();
      },
    });
  }

  addRole() {
    const dialogRef = this.dialog
      .open(AddRoleDialogComponent, {
        width: '400px',
        autoFocus: false,
        disableClose: true,
        data: { controller: this.controller },
      })
      .afterClosed()
      .subscribe((role: { name: string; description: string }) => {
        if (role) {
          this.roleService.create(this.controller, role).subscribe({
            next: () => {
              this.toasterService.success(`${role.name} role created`);
              this.refresh();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to create role';
              this.toasterService.error(message);
              this.cd.markForCheck();
            },
          });
        }
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  onDelete(rolesToDelete: Role[]) {
    this.dialog
      .open(DeleteRoleDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { roles: rolesToDelete },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          const observables = rolesToDelete.map((role: Role) => this.roleService.delete(this.controller, role.role_id));
          forkJoin(observables).subscribe({
            next: () => {
              this.refresh();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to delete roles';
              this.toasterService.error(message);
              this.cd.markForCheck();
            },
          });
        }
      });
  }
}
