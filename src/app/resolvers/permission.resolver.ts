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
import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {Permission} from "@models/api/permission";
import {PermissionsService} from "@services/permissions.service";
import {ServerService} from "@services/server.service";
import {Server} from "@models/server";

@Injectable({
  providedIn: 'root'
})
export class PermissionResolver implements Resolve<Permission[]> {

  constructor(private permissionService: PermissionsService,
              private serverService: ServerService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Permission[]> {
    return new Observable<Permission[]>((observer: Subscriber<Permission[]>) => {
      const serverId = route.paramMap.get('server_id');
      this.serverService.get(+serverId).then((server: Server) => {
        this.permissionService.list(server).subscribe((permission: Permission[]) => {
            observer.next(permission);
            observer.complete();
        });
      });
    });


  }
}