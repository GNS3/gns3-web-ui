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
import {Server} from "@models/server";
import {ApiInformationService} from "@services/api-information.service";
import {Methods, Permission, PermissionActions} from "@models/api/permission";
import {PermissionsService} from "@services/permissions.service";
import {ToasterService} from "@services/toaster.service";

@Component({
  selector: 'app-add-permission-line',
  templateUrl: './add-permission-line.component.html',
  styleUrls: ['./add-permission-line.component.scss']
})
export class AddPermissionLineComponent implements OnInit {

  @Input() server: Server;
  @Output() addPermissionEvent = new EventEmitter<void>();
  permission: Permission = {
    action: PermissionActions.ALLOW,
    description: "",
    methods: [],
    path: "/"
  };
  edit = false;

  constructor(public apiInformation: ApiInformationService,
              private permissionService: PermissionsService,
              private toasterService: ToasterService) {

  }

  ngOnInit(): void {

  }


  updateMethod(data: { name: Methods; enable: boolean }) {
    const set = new Set(this.permission.methods);
    if (data.enable) {
      set.add(data.name);
    } else {
      set.delete(data.name);
    }

    this.permission.methods = Array.from(set);
  }

  reset() {
    this.permission = {
      action: PermissionActions.ALLOW,
      description: "",
      methods: [],
      path: "/",
    };

    this.edit = false;
  }

  save() {
    this.permissionService.add(this.server, this.permission)
      .subscribe(() => {
        this.toasterService.success(`permission was created`);
        this.reset();
      }, (error) => {
        this.toasterService.error(error);
      });
  }
}
