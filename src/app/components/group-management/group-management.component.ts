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
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { GroupService } from '@services/group.service';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { AddGroupDialogComponent } from '@components/group-management/add-group-dialog/add-group-dialog.component';
import { DeleteGroupDialogComponent } from '@components/group-management/delete-group-dialog/delete-group-dialog.component';
import { GroupFilterPipe } from '@filters/group-filter.pipe';
import {
  GroupDetailDialogComponent,
  GroupDetailDialogData,
} from '@components/group-management/group-detail-dialog/group-detail-dialog.component';
import {
  AiProfileDialogComponent,
  AiProfileDialogData,
} from '@components/user-management/ai-profile-dialog/ai-profile-dialog.component';
import {
  GroupAiProfileDialogComponent,
  GroupAiProfileDialogData,
} from '@components/group-management/group-detail-dialog/group-ai-profile-dialog/group-ai-profile-dialog.component';

@Component({
  selector: 'app-group-management',
  templateUrl: './group-management.component.html',
  styleUrl: './group-management.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSortModule,
    MatDialogModule,
    MatTableModule,
    MatPaginator,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    GroupFilterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupManagementComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  private cd = inject(ChangeDetectorRef);
  public groupService = inject(GroupService);
  public dialog = inject(MatDialog);

  controller: Controller;

  @ViewChildren('groupsPaginator') groupsPaginator: QueryList<MatPaginator>;
  @ViewChildren('groupsSort') groupsSort: QueryList<MatSort>;

  readonly displayedColumns = signal(['select', 'name', 'created_at', 'updated_at', 'is_builtin', 'actions']);
  selection = new SelectionModel<Group>(true, []);
  groups: Group[];
  dataSource = new MatTableDataSource<Group>();
  readonly searchText = model('');
  readonly isReady = signal(false);

  constructor() {}

  ngOnInit(): void {
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
    this.groupsPaginator.changes.subscribe((comps: QueryList<MatPaginator>) => {
      this.dataSource.paginator = comps.first;
    });
    this.groupsSort.changes.subscribe((comps: QueryList<MatSort>) => {
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.groups.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.groups.forEach((row) => this.selection.select(row));
  }

  addGroup() {
    this.dialog
      .open(AddGroupDialogComponent, {
        width: '400px',
        autoFocus: false,
        disableClose: true,
        data: { controller: this.controller },
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added) {
          this.refresh();
        }
      });
  }

  refresh() {
    this.groupService.getGroups(this.controller).subscribe({
      next: (groups: Group[]) => {
        this.isReady.set(true);
        this.groups = groups;
        this.dataSource.data = groups;
        this.selection.clear();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load groups';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  onDelete(groupsToDelete: Group[]) {
    this.dialog
      .open(DeleteGroupDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { groups: groupsToDelete },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm: boolean) => {
        if (isDeletedConfirm) {
          const observables = groupsToDelete.map((group: Group) =>
            this.groupService.delete(this.controller, group.user_group_id)
          );
          forkJoin(observables).subscribe({
            next: () => {
              this.refresh();
            },
            error: (err) => {
              const message = err.error?.message || err.message || 'Failed to delete groups';
              this.toasterService.error(message);
              this.cd.markForCheck();
            },
          });
        }
      });
  }

  openGroupDetailDialog(group: Group) {
    this.dialog.open(GroupDetailDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      data: { group, controller: this.controller } as GroupDetailDialogData,
      maxWidth: '90vw',
    });
  }

  openGroupAiProfileDialog(group: Group) {
    this.dialog.open(GroupAiProfileDialogComponent, {
      panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
      data: { group, controller: this.controller } as GroupAiProfileDialogData,
    });
  }
}
