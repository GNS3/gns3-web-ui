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
import {HttpController} from "./http-controller.service";
import {Controller} from "../models/controller";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";
import {Observable} from "rxjs";
import {Role} from "@models/api/role";

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(
    private httpController: HttpController
  ) {
  }

  getGroups(controller: Controller) {
    return this.httpController.get<Group[]>(controller, '/groups');
  }

  getGroupMember(controller: Controller, groupId: string) {
    return this.httpController.get<User[]>(controller, `/groups/${groupId}/members`);
  }

  addGroup(controller: Controller, name: string): Observable<Group> {
    return this.httpController.post<Group>(controller, `/groups`, {name});
  }

  delete(controller: Controller, user_group_id: string) {
    return this.httpController.delete(controller, `/groups/${user_group_id}`);
  }

  get(controller: Controller, user_group_id: string) {
    return this.httpController.get(controller, `/groups/${user_group_id}`);
  }

  addMemberToGroup(controller: Controller, group: Group, user: User) {
    return this.httpController.put(controller, `/groups/${group.user_group_id}/members/${user.user_id}`, {});
  }

  removeUser(controller: Controller, group: Group, user: User) {
    return this.httpController.delete(controller, `/groups/${group.user_group_id}/members/${user.user_id}`);
  }

  update(controller: Controller, group: Group) {
    return this.httpController.put(controller, `/groups/${group.user_group_id}`, {name: group.name});
  }

  getGroupRole(controller: Controller, groupId: string) {
    return this.httpController.get<Role[]>(controller, `/groups/${groupId}/roles`);
  }

  removeRole(controller: Controller, group: Group, role: Role) {
    return this.httpController.delete(controller, `/groups/${group.user_group_id}/roles/${role.role_id}`);
  }

  addRoleToGroup(controller: Controller, group: Group, role: Role) {
    return this.httpController.put(controller, `/groups/${group.user_group_id}/roles/${role.role_id}`, {});
  }
}
