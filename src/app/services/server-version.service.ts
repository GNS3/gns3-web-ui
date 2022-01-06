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
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ServerVersionService {

  constructor(private httpServer: HttpServer) { }


  public checkServerVersion(server: Server): Observable<any> {
    return this.httpServer.get(server, '/version');
  }
}
