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
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Methods, Permission} from "@models/api/permission";
import {Server} from '@models/server';
import {ApiInformationService} from "@services/api-information.service";
import {PermissionsService} from "@services/permissions.service";
import {ToasterService} from "@services/toaster.service";
import {MatDialog} from "@angular/material/dialog";
import {DeletePermissionDialogComponent} from "@components/permissions-management/delete-permission-dialog/delete-permission-dialog.component";

@Component({
  selector: 'app-permission-add-edit-line',
  templateUrl: './permission-edit-line.component.html',
  styleUrls: ['./permission-edit-line.component.scss']
})
export class PermissionEditLineComponent {
  @Input() permission: Permission;
  @Input() server: Server;

  isEditable = false;
  @Output() update = new EventEmitter<void>();

  constructor(public apiInformation: ApiInformationService,
              private permissionService: PermissionsService,
              private toasterService: ToasterService,
              private dialog: MatDialog) {
  }


  onDelete() {
    this.dialog.open<DeletePermissionDialogComponent>(DeletePermissionDialogComponent,
      {width: '700px', height: '500px', data: this.permission})
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.permissionService.delete(this.server, this.permission.permission_id)
            .subscribe(() => {
              this.toasterService.success(`Permission was deleted`);
              this.update.emit();
            }, (e) => {
              this.toasterService.error(e);
              this.update.emit();
            });
        }
      });

  }

  onSave() {
    this.permissionService.update(this.server, this.permission)
      .subscribe(() => {
        this.toasterService.success(`Permission was updated`);
        this.update.emit();
      }, (e) => {
        this.toasterService.error(e);
        this.update.emit();
      });
  }

  onCancel() {
    this.update.emit();
  }


  onMethodUpdate(event: { name: Methods; enable: boolean }) {
    const set = new Set(this.permission.methods);
    event.enable ? set.add(event.name) : set.delete(event.name);
    this.permission.methods = Array.from(set);
  }
}
