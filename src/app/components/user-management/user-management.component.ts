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
  ViewChildren,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Controller } from '@models/controller';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { ProgressService } from '../../common/progress/progress.service';
import { User } from '@models/users/user';
import { SelectionModel } from '@angular/cdk/collections';
import { AddUserDialogComponent } from '@components/user-management/add-user-dialog/add-user-dialog.component';
import { DeleteUserDialogComponent } from '@components/user-management/delete-user-dialog/delete-user-dialog.component';
import { ToasterService } from '@services/toaster.service';
import { MatTableDataSource } from '@angular/material/table';
import { ControllerService } from '@services/controller.service';
import { UserFilterPipe } from '@filters/user-filter.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginator,
    MatSortModule,
    MatDialogModule,
    UserFilterPipe,
    MatProgressSpinnerModule,
  ],
})
export class UserManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private progressService = inject(ProgressService);
  private controllerService = inject(ControllerService);
  private dialog = inject(MatDialog);
  private toasterService = inject(ToasterService);
  private location = inject(Location);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  dataSource = new MatTableDataSource<User>();
  displayedColumns = ['select', 'username', 'full_name', 'email', 'is_active', 'last_login', 'updated_at'];
  selection = new SelectionModel<User>(true, []);
  searchText = '';

  @ViewChildren('usersPaginator') usersPaginator: QueryList<MatPaginator>;
  @ViewChildren('usersSort') usersSort: QueryList<MatSort>;
  isReady = false;

  ngOnInit() {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.refresh();
    });
  }

  ngAfterViewInit() {
    this.usersPaginator.changes.subscribe((comps: QueryList<MatPaginator>) => {
      this.dataSource.paginator = comps.first;
    });
    this.usersSort.changes.subscribe((comps: QueryList<MatSort>) => {
      this.dataSource.sort = comps.first;
    });

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'username':
        case 'full_name':
        case 'email':
          return item[property] ? item[property].toLowerCase() : '';
        default:
          return item[property];
      }
    };
  }

  refresh() {
    this.userService.list(this.controller).subscribe(
      (users: User[]) => {
        this.isReady = true;
        this.dataSource.data = users;
        this.cd.markForCheck();
      },
      (error) => {
        this.progressService.setError(error);
        this.toasterService.error(`Cannot open the user management page`);
        this.location.back();
      }
    );
  }

  addUser() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
      autoFocus: false,
      disableClose: true,
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onDelete(user: User) {
    this.dialog
      .open(DeleteUserDialogComponent, {
        width: '500px',
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { users: [user] }
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.userService.delete(this.controller, user.user_id).subscribe(
            () => {
              this.refresh();
            },
            (error) => {
              this.toasterService.error(`An error occur while trying to delete user ${user.username}`);
            }
          );
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

  deleteMultiple() {
    this.dialog
      .open(DeleteUserDialogComponent, {
        width: '500px',
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { users: this.selection.selected }
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.selection.selected.forEach((user: User) => {
            this.userService.delete(this.controller, user.user_id).subscribe(
              () => {
                this.refresh();
              },
              (error) => {
                this.toasterService.error(`An error occur while trying to delete user ${user.username}`);
              }
            );
          });
          this.selection.clear();
        }
      });
  }
}
