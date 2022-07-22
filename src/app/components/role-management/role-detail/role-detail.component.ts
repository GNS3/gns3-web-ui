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
import {Component, OnInit} from '@angular/core';
import {RoleService} from "@services/role.service";
import {ActivatedRoute} from "@angular/router";
import {Controller} from "@models/controller";
import {ControllerService} from "@services/controller.service";
import {Role} from "@models/api/role";
import {FormControl, FormGroup} from "@angular/forms";
import {ToasterService} from "@services/toaster.service";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-role-detail',
  templateUrl: './role-detail.component.html',
  styleUrls: ['./role-detail.component.scss']
})
export class RoleDetailComponent implements OnInit {
  controller: Controller;
  role: Role;
  editRoleForm: FormGroup;

  constructor(private roleService: RoleService,
              private controllerService: ControllerService,
              private toastService: ToasterService,
              private route: ActivatedRoute) {

    this.editRoleForm = new FormGroup({
      rolename: new FormControl(),
      description: new FormControl(),
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((d: { controller: Controller; role: Role }) => {
      this.controller = d.controller;
      this.role = d.role;
    });
  }

  onUpdate() {
    this.roleService.update(this.controller, this.role)
      .subscribe(() => {
          this.toastService.success(`role: ${this.role.name} was updated`);
        },
        (error: HttpErrorResponse) => {
          this.toastService.error(`${error.message}
        ${error.error.message}`);
        });
  }
}
