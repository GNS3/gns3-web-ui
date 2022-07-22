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
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, Subscriber} from 'rxjs';
import {ControllerService} from "../services/controller.service";
import {GroupService} from "../services/group.service";
import {Controller} from "../models/controller";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";

@Injectable({
  providedIn: 'root'
})
export class GroupMembersResolver implements Resolve<User[]> {

  constructor(private controllerService: ControllerService,
              private groupService: GroupService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User[]> {

    return new Observable<User[]>((subscriber: Subscriber<User[]>) => {

      const controllerId = route.paramMap.get('controller_id');
      const groupId = route.paramMap.get('user_group_id');

      this.controllerService.get(+controllerId).then((controller: Controller) => {
        this.groupService.getGroupMember(controller, groupId).subscribe((users: User[]) => {
          subscriber.next(users);
          subscriber.complete();
        });
      });
    });
  }
}
