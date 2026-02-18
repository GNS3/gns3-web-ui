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
import {Controller} from "@models/controller";
import {Observable} from "rxjs";
import {HttpController} from "@services/http-controller.service";
import {ACE} from "@models/api/ACE";
import {Endpoint} from "@models/api/endpoint";

@Injectable({
  providedIn: 'root'
})
export class AclService {

  constructor(
    private httpController: HttpController
  ) {}

  getEndpoints(controller: Controller) {
    return this.httpController.get<Endpoint[]>(controller, '/access/acl/endpoints')
  }

  list(controller: Controller) {
    return this.httpController.get<ACE[]>(controller, '/access/acl');
  }

  add(controller: Controller, ace: any): Observable<ACE> {
    return this.httpController.post<ACE>(controller, `/access/acl`, ace);
  }

  get(controller: Controller, ace_id: string) {
    return this.httpController.get<ACE>(controller, `/access/acl/${ace_id}`);
  }

  delete(controller: Controller, ace_id: string) {
    return this.httpController.delete(controller, `/access/acl/${ace_id}`);
  }

  update(controller: Controller, ace: ACE): Observable<ACE> {
    return this.httpController.put<ACE>(controller, `/access/acl/${ace.ace_id}`, ace);
  }
}
