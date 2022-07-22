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
import {Role} from "../models/api/role";
import {Permission} from "@models/api/permission";

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private httpServer: HttpServer) { }

  get(server: Server) {
    return this.httpServer.get<Role[]>(server, '/roles');
  }

  delete(server: Server, role_id: string) {
    return this.httpServer.delete(server, `/roles/${role_id}`);
  }

  create(server: Server, newRole: { name: string; description: string }) {
    return this.httpServer.post(server, `/roles`, newRole);
  }

  getById(server: Server, roleId: string) {
    return this.httpServer.get<Role>(server, `/roles/${roleId}`);
  }

  update(server: Server, role: Role) {
    return this.httpServer.put(server, `/roles/${role.role_id}`, {name: role.name, description: role.description});
  }

  addPermission(server: Server, role: Role, permission: Permission) {
    return this.httpServer.put(server, `/roles/${role.role_id}/permissions/${permission.permission_id}`, {});

  }

  removePermission(server: Server, role: Role, permission: Permission) {
    return this.httpServer.delete(server, `/roles/${role.role_id}/permissions/${permission.permission_id}`);
  }
}
