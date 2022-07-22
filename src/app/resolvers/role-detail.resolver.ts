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
import {Injectable} from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {Server} from "../models/server";
import {Role} from "../models/api/role";
import {ServerService} from "../services/server.service";
import {RoleService} from "../services/role.service";

@Injectable({
  providedIn: 'root'
})
export class RoleDetailResolver implements Resolve<Role> {

  constructor(private serverService: ServerService,
              private roleService: RoleService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Role> {
    return new Observable<Role>((observer: Subscriber<Role>) => {
      const serverId = route.paramMap.get('server_id');
      const roleId = route.paramMap.get('role_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.roleService.getById(server, roleId).subscribe((role: Role) => {
          observer.next( role);
          observer.complete();
        });
      });
    });

  }
}
