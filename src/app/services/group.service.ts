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
import {HttpServer} from "./http-server.service";
import {Server} from "../models/server";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(
    private httpServer: HttpServer
  ) { }

  getGroups(server: Server) {
    return this.httpServer.get<Group[]>(server, '/groups');
  }

  getGroupMember(server: Server, groupId: string) {
    return this.httpServer.get<User[]>(server, `/groups/${groupId}/members`);
  }
}
