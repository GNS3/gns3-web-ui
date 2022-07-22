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
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";
import {Controller} from "../models/controller";
import {ControllerService} from "../services/controller.service";
import {UserService} from "../services/user.service";

@Injectable({
  providedIn: 'root'
})
export class UserGroupsResolver implements Resolve<Group[]> {
  constructor(private controllerService: ControllerService,
              private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Group[]> {
    return new Observable<Group[]>((subscriber: Subscriber<Group[]>) => {

      const controllerId = route.paramMap.get('controller_id');
      const userId = route.paramMap.get('user_id');

      this.controllerService.get(+controllerId).then((controller: Controller) => {
        this.userService.getGroupsByUserId(controller, userId).subscribe((groups: Group[]) => {
          subscriber.next(groups);
          subscriber.complete();
        });
      });
    });
  }
}
