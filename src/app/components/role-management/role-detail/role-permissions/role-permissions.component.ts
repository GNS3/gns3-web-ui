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
import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ToasterService} from "@services/toaster.service";
import {RoleService} from "@services/role.service";
import {Server} from "@models/server";
import {Role} from "@models/api/role";
import {Permission} from "@models/api/permission";
import {Observable} from "rxjs/Rx";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-role-permissions',
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss']
})
export class RolePermissionsComponent implements OnInit {
  server: Server;
  role: Role;
  permissions: Permission[];

  constructor(private route: ActivatedRoute,
              private dialog: MatDialog,
              private toastService: ToasterService,
              private router: Router,
              private roleService: RoleService) {
    this.route.data.subscribe((data: { server: Server, role: Role, permissions: Permission[] }) => {
      this.server = data.server;
      this.role = data.role;
      this.permissions = data.permissions;
    });
  }

  ngOnInit(): void {
  }

  updatePermissions(toUpdate) {
    const {add, remove} = toUpdate;
    const obs: Observable<any>[] = [];
    add.forEach((permission: Permission) => {
      obs.push(this.roleService.addPermission(this.server, this.role, permission));
    });
    remove.forEach((permission: Permission) => {
      obs.push(this.roleService.removePermission(this.server, this.role, permission));
    });

    forkJoin(obs)
      .subscribe(() => {
          this.toastService.success(`permissions updated`);
          this.router.navigate(['/server', this.server.id, 'management', 'roles', this.role.role_id]);
        },
        (error) => {
          this.toastService.error(error);
        });
  }
}
