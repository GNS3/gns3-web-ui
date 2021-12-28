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
import {HttpServer} from "./http-server.service";
import {Server} from "../models/server";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(
    private httpServer: HttpServer
  ) {
  }

  getGroups(server: Server) {
    return this.httpServer.get<Group[]>(server, '/groups');
  }

  getGroupMember(server: Server, groupId: string) {
    return this.httpServer.get<User[]>(server, `/groups/${groupId}/members`);
  }

  addGroup(server: Server, name: string): Observable<Group> {
    return this.httpServer.post<Group>(server, `/groups`, {name});
  }

  delete(server: Server, user_group_id: string) {
    return this.httpServer.delete(server, `/groups/${user_group_id}`);
  }

  get(server: Server, user_group_id: string) {
    return this.httpServer.get(server, `/groups/${user_group_id}`);
  }

  addMemberToGroup(server: Server, group: Group, user: User) {
    return this.httpServer.put(server, `/groups/${group.user_group_id}/members/${user.user_id}`, {});
  }

  removeUser(server: Server, group: Group, user: User) {
    return this.httpServer.delete(server, `/groups/${group.user_group_id}/members/${user.user_id}`);
  }

  update(server: Server, group: Group) {
    return this.httpServer.put(server, `/groups/${group.user_group_id}`, {name: group.name});
  }
}
