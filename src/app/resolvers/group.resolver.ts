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
import {ServerService} from "@services/server.service";
import {GroupService} from "@services/group.service";
import {User} from "@models/users/user";
import {Server} from "@models/server";
import {Group} from "@models/groups/group";

@Injectable({
  providedIn: 'root'
})
export class GroupResolver implements Resolve<Group> {


  constructor(private serverService: ServerService,
              private groupService: GroupService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Group> {

    return new Observable<Group>((subscriber: Subscriber<Group>) => {

      const serverId = route.paramMap.get('server_id');
      const groupId = route.paramMap.get('user_group_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.groupService.get(server, groupId).subscribe((group: Group) => {
          subscriber.next(group);
          subscriber.complete();
        });
      });
    });
  }
}
