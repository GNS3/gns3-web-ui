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
import {Role} from "@models/api/role";
import {UntypedFormControl, UntypedFormGroup} from "@angular/forms";
import {ToasterService} from "@services/toaster.service";
import {HttpErrorResponse} from "@angular/common/http";
import {Privilege} from "@models/api/Privilege";
import {PrivilegeService} from "@services/privilege.service";
import {Observable, ReplaySubject} from "rxjs";
import {IPrivilegesChange} from "@components/role-management/role-detail/privilege/IPrivilegesChange";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-role-detail',
  templateUrl: './role-detail.component.html',
  styleUrls: ['./role-detail.component.scss']
})
export class RoleDetailComponent implements OnInit {
  controller: Controller;
  $role: ReplaySubject<Role> = new ReplaySubject<Role>(1);
  editRoleForm: UntypedFormGroup;
  $ownedPrivilegesId: Observable<string[]> =  this.$role.pipe(map((role: Role) => {
    return role.privileges.map((p: Privilege) => p.privilege_id);
  }));

  privileges: Observable<Privilege[]>;
  private roleId: string;

  constructor(private roleService: RoleService,
              private toastService: ToasterService,
              private route: ActivatedRoute,
              private privilegeService: PrivilegeService,
  ) {

    this.editRoleForm = new UntypedFormGroup({
      rolename: new UntypedFormControl(),
      description: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe((d: { controller: Controller; role: Role }) => {
      this.controller = d.controller
      this.roleId = d.role.role_id;
      this.privileges = this.privilegeService.get(this.controller);
      this.roleService.getById(this.controller, this.roleId).subscribe((role: Role) => this.$role.next(role))
    });
  }
  onUpdate() {
    this.$role.subscribe((role) => {
      this.roleService.update(this.controller, role)
        .subscribe(() => {
            this.toastService.success(`role: ${role.name} was updated`);
            this.roleService.getById(this.controller, this.roleId).subscribe((role: Role) => this.$role.next(role))
          },
          (error: HttpErrorResponse) => {
            this.toastService.error(`${error.message}
        ${error.error.message}`);
          });
    })

  }

  onPrivilegesUpdate(privileges: IPrivilegesChange) {
    const tasks = [];
    for (const privilege of privileges.add) {
      tasks.push(this.roleService.setPrivileges(this.controller, this.roleId, privilege));
    }
    for (const privilege of privileges.delete) {
      tasks.push(this.roleService.removePrivileges(this.controller, this.roleId, privilege));
    }
    Observable
      .forkJoin(tasks)
      .subscribe(() => {
        this.roleService.getById(this.controller, this.roleId).subscribe((role: Role) => this.$role.next(role))
      });

  }
}
