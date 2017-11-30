import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Appliance} from "../models/appliance";

@Injectable()
export class ApplianceService {

  constructor(private httpServer: HttpServer) { }

  list(server: Server): Observable<Appliance[]> {
    return this.httpServer
                .get(server, '/appliances')
                .map(response => response.json() as Appliance[]);
  }

}
