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
  QueryList,
  ViewChildren,
  inject,
  signal,
  AfterViewInit,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { SelectionModel } from '@angular/cdk/collections';
import { Controller } from '@models/controller';
import { ACE } from '@models/api/ACE';
import { ActivatedRoute } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { AclService } from '@services/acl.service';
import { AddAceDialogComponent } from '@components/acl-management/add-ace-dialog/add-ace-dialog.component';
import { DeleteAceDialogComponent } from '@components/acl-management/delete-ace-dialog/delete-ace-dialog.component';
import { Endpoint } from '@models/api/endpoint';
import { AceFilterPipe } from '@filters/ace-filter.pipe';

@Component({
  selector: 'app-acl-management',
  templateUrl: './acl-management.component.html',
  styleUrl: './acl-management.component.scss',
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
    MatCardModule,
    AceFilterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AclManagementComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private controllerService = inject(ControllerService);
  private toasterService = inject(ToasterService);
  public aclService = inject(AclService);
  public dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  @ViewChildren('acesPaginator') acesPaginator: QueryList<MatPaginator>;
  @ViewChildren('acesSort') acesSort: QueryList<MatSort>;
  controller: Controller;
  public displayedColumns = ['select', 'path', 'user/group', 'role', 'propagate', 'allowed', 'updated_at'];
  selection = new SelectionModel<ACE>(true, []);
  aces: ACE[];
  dataSource = new MatTableDataSource<ACE>();
  readonly isReady = signal(false);
  readonly searchText = model('');
  readonly endpoints = signal<Endpoint[]>([]);

  constructor() {}

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
    });
  }

  ngAfterViewInit() {
    this.acesPaginator.changes.subscribe((comps: QueryList<MatPaginator>) => {
      this.dataSource.paginator = comps.first;
    });

    this.acesSort.changes.subscribe((comps: QueryList<MatSort>) => {
      this.dataSource.sort = comps.first;
    });

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'path':
        case 'user/group':
        case 'role':
          return item[property] ? item[property].toLowerCase() : '';
        default:
          return item[property];
      }
    };
  }

  refresh() {
    this.aclService.list(this.controller).subscribe({
      next: (aces: ACE[]) => {
        this.isReady.set(true);
        this.aces = aces;
        this.dataSource.data = aces;
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
      panelClass: ['base-dialog-panel', 'add-ace-dialog-panel'],
      autoFocus: false,
      disableClose: true,
      data: { endpoints: this.endpoints() },
    });
    let instance = dialogRef.componentInstance;
    instance.controller = this.controller;
    dialogRef.afterClosed().subscribe(() => this.refresh());
  }

  onDelete(ace: ACE) {
    this.dialog
      .open(DeleteAceDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { aces: [ace] },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          this.aclService.delete(this.controller, ace.ace_id).subscribe({
            next: () => {
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
    const numSelected = this.selection.selected.length;
    const numRows = this.aces.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.aces.forEach((row) => this.selection.select(row));
  }

  deleteMultiple() {
    this.dialog
      .open(DeleteAceDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel'],
        data: { aces: this.selection.selected },
      })
      .afterClosed()
      .subscribe((isDeletedConfirm) => {
        if (isDeletedConfirm) {
          // TODO: This implementation has a race condition issue where each ACE deletion
          // is subscribed to independently. Consider using Promise.all() + forkJoin to wait
          // for all deletions to complete, or use concatMap for sequential deletion.
          // For now, we keep the existing implementation as requested.
          this.selection.selected.forEach((ace: ACE) => {
            this.aclService.delete(this.controller, ace.ace_id).subscribe({
              next: () => {
                this.refresh();
              },
              error: (err) => {
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

  getNameByUuidFromEndpoint(uuid: string): string {
    if (this.endpoints()) {
      const elt = this.endpoints().filter((endpoint: Endpoint) => endpoint.endpoint.includes(uuid));
      if (elt.length >= 1) {
        return elt[0].name;
      }
    }

    return '';
  }
}
