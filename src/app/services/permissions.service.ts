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
import {Permission} from "../models/api/permission";
import {Observable} from "rxjs/Rx";

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private httpController: HttpController) {
  }

  list(controller: Controller) {
    return this.httpController.get<Permission[]>(controller, '/permissions');
  }

  add(controller: Controller, permission: Permission): Observable<Permission> {
    return this.httpController.post<Permission>(controller, '/permissions', permission);
  }

  update(controller: Controller, permission: Permission): Observable<Permission> {
    return this.httpController.put<Permission>(controller, `/permissions/${permission.permission_id}`, permission);
  }

  delete(controller: Controller, permission_id: string) {
    return this.httpController.delete(controller, `/permissions/${permission_id}`);
  }
}
