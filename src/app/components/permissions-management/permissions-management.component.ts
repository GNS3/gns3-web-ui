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
import {Server} from "@models/server";
import {PermissionsService} from "@services/permissions.service";
import {ProgressService} from "../../common/progress/progress.service";
import {Permission} from "@models/api/permission";
import {AddPermissionLineComponent} from "@components/permissions-management/add-permission-line/add-permission-line.component";
import {ServerService} from "@services/server.service";
import {PageEvent} from "@angular/material/paginator";
import {ApiInformationService, IFormatedList} from "@services/api-information.service";

@Component({
  selector: 'app-permissions-management',
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit {
  server: Server;
  permissions: Permission[];
  addPermissionLineComp = AddPermissionLineComponent;
  newPermissionEdit = false;
  searchPermissions: any;
  pageEvent: PageEvent | undefined;
  filteredOptions: IFormatedList[];
  options: string[] = [];
  typeFilter: any;
  typeValues = [
    {value: '{project_id}', view:'projects'},
    {value: '{image_path}', view:'images'},
    {value: '{template_id}', view:'templates'},
    {value: '{compute_id}', view:'computes'}]

  @ViewChild('dynamic', {
    read: ViewContainerRef
  }) viewContainerRef: ViewContainerRef;
  isReady = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private permissionService: PermissionsService,
              private progressService: ProgressService,
              private serverService: ServerService,
              private apiInformationService: ApiInformationService) { }

  ngOnInit(): void {
    const serverId = this.route.parent.snapshot.paramMap.get('server_id');
    this.serverService.get(+serverId).then((server: Server) => {
      this.server = server;
      this.refresh();
    });
  }

  refresh() {
    this.permissionService.list(this.server).subscribe(
      (permissions: Permission[]) => {
        this.permissions = permissions;
        this.isReady = true;
      },
      (error) => {
        this.progressService.setError(error);
      }
    );
  }

  changeType(typeValue: any) {
    if (typeValue.value.value.match(this.apiInformationService.bracketIdRegex)) {
      this.apiInformationService.getListByObjectId(this.server, typeValue.value.value)
        .subscribe((data) => {
          this.filteredOptions = data;
        });
    } else {
      this.filteredOptions = this.apiInformationService.getIdByObjNameFromCache('');
    }

  }

  displayFn(value): string {
    return value && value.name ? value.name : '';
  }

  changeAutocomplete(inputText) {
    this.filteredOptions = this.apiInformationService.getIdByObjNameFromCache(inputText);
  }

}
