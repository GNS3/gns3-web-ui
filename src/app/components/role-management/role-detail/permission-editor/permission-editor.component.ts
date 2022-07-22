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
import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Server} from "@models/server";
import {Permission} from "@models/api/permission";
import {MatDialog} from "@angular/material/dialog";
import {PermissionEditorValidateDialogComponent} from "@components/role-management/role-detail/permission-editor/permission-editor-validate-dialog/permission-editor-validate-dialog.component";
import {ApiInformationService } from "@services/ApiInformation/api-information.service";
import {PageEvent} from "@angular/material/paginator";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

@Component({
  selector: 'app-permission-editor',
  templateUrl: './permission-editor.component.html',
  styleUrls: ['./permission-editor.component.scss']
})
export class PermissionEditorComponent implements OnInit {

  owned: Set<Permission>;
  available: Set<Permission>;
  searchPermissions: any;
  filteredOptions: IGenericApiObject[];
  pageEventOwned: PageEvent | undefined;
  pageEventAvailable: PageEvent | undefined;

  @Input() server: Server;
  @Input() ownedPermissions: Permission[];
  @Input() availablePermissions: Permission[];
  @Output() updatedPermissions: EventEmitter<any> = new EventEmitter();


  constructor(private dialog: MatDialog,
              private apiInformationService: ApiInformationService) {}

  ngOnInit(): void {
    this.reset();
  }

  add(permission: Permission) {
    this.available.delete(permission);
    this.owned.add(permission);
  }

  remove(permission: Permission) {
    this.owned.delete(permission);
    this.available.add(permission);
  }

  reset() {
    const ownedPermissionId = this.ownedPermissions.map(p => p.permission_id);
    this.owned = new Set(this.ownedPermissions);
    this.available = new Set(this.availablePermissions.filter(p => !ownedPermissionId.includes(p.permission_id)));
  }

  update() {
    const {add, remove} = this.diff();
    this.dialog
      .open(PermissionEditorValidateDialogComponent,
        {width: '700px', height: '500px', data: {add, remove}})
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.updatedPermissions.emit({add, remove});
        }

      });
  }

  private diff() {
    const add: Permission[] = [];

    const currentRolePermissionId = this.ownedPermissions.map(p => p.permission_id);
    this.owned.forEach((permission: Permission) => {
      if (!currentRolePermissionId.includes(permission.permission_id)) {
        add.push(permission);
      }
    });

    const remove: Permission[] = [];
    this.ownedPermissions.forEach((permission: Permission) => {
      if (!this.owned.has(permission)) {
        remove.push(permission);
      }
    });

    return {add, remove};
  }

  displayFn(value): string {
    return value && value.name ? value.name : '';
  }

  changeAutocomplete(inputText) {
    this.filteredOptions = this.apiInformationService.getIdByObjNameFromCache(inputText);
  }

  get ownedArray() {
    return Array.from(this.owned.values());
  }

  get availableArray() {
    return Array.from(this.available.values());
  }
}
