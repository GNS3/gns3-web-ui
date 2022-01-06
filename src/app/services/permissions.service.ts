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
import {Permission} from "../models/api/permission";
import {Observable} from "rxjs/Rx";

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private httpServer: HttpServer) { }

  list(server: Server) {
    return this.httpServer.get<Permission[]>(server, '/permissions');
  }

  add(server: Server, permission: Permission): Observable<Permission> {
    return this.httpServer.post<Permission>(server, '/permissions', permission);
  }

  update(server: Server, permission: Permission): Observable<Permission> {
    return this.httpServer.put<Permission>(server, `/permissions/${permission.permission_id}`, permission);
  }

  delete(server: Server, permission_id: string) {
    return this.httpServer.delete(server, `/permissions/${permission_id}`);
  }
}
