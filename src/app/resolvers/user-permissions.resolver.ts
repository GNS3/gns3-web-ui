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
import {ServerService} from "../services/server.service";
import {UserService} from "../services/user.service";
import {Server} from "../models/server";
import {Permission} from "../models/api/permission";

@Injectable({
  providedIn: 'root'
})
export class UserPermissionsResolver implements Resolve<Permission[]> {

  constructor(private serverService: ServerService,
              private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Permission[]> {
    return new Observable<Permission[]>((subscriber: Subscriber<Permission[]>) => {

      const serverId = route.paramMap.get('server_id');
      const userId = route.paramMap.get('user_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.userService.getPermissionsByUserId(server, userId).subscribe((permissions: Permission[]) => {
          subscriber.next(permissions);
          subscriber.complete();
        });
      });
    });
  }
}
