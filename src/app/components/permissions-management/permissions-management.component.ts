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
import {Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Controller} from "@models/controller";
import {PermissionsService} from "@services/permissions.service";
import {ProgressService} from "../../common/progress/progress.service";
import {Permission} from "@models/api/permission";
import {AddPermissionLineComponent} from "@components/permissions-management/add-permission-line/add-permission-line.component";
import {ControllerService} from "@services/controller.service";
import {PageEvent} from "@angular/material/paginator";
import {ApiInformationService} from "@services/ApiInformation/api-information.service";
import {IGenericApiObject} from "@services/ApiInformation/IGenericApiObject";

@Component({
  selector: 'app-permissions-management',
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit {
  controller: Controller;
  permissions: Permission[];
  addPermissionLineComp = AddPermissionLineComponent;
  newPermissionEdit = false;
  searchPermissions: any;
  pageEvent: PageEvent | undefined;
  filteredOptions: IGenericApiObject[];
  options: string[] = [];

  @ViewChild('dynamic', {
    read: ViewContainerRef
  }) viewContainerRef: ViewContainerRef;
  isReady = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private permissionService: PermissionsService,
              private progressService: ProgressService,
              private controllerService: ControllerService,
              private apiInformationService: ApiInformationService) { }

  ngOnInit(): void {
    const controllerId = this.route.parent.snapshot.paramMap.get('controller_id');
    this.controllerService.get(+controllerId).then((controller: Controller) => {
      this.controller = controller;
      this.refresh();
    });
  }

  refresh() {
    this.permissionService.list(this.controller).subscribe(
      (permissions: Permission[]) => {
        this.permissions = permissions;
        this.isReady = true;
      },
      (error) => {
        this.progressService.setError(error);
      }
    );
  }

  displayFn(value): string {
    return value && value.name ? value.name : '';
  }

  changeAutocomplete(inputText) {
    this.filteredOptions = this.apiInformationService.getIdByObjNameFromCache(inputText);
  }

}
