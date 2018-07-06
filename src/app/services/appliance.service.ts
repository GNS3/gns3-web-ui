import { Injectable } from '@angular/core';

import 'rxjs/add/operator/map';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";
import {Appliance} from "../models/appliance";
import {Observable} from "rxjs";

@Injectable()
export class ApplianceService {

  constructor(private httpServer: HttpServer) { }

  list(server: Server): Observable<Appliance[]> {
    return this.httpServer
                .get<Appliance[]>(server, '/appliances') as Observable<Appliance[]>;
  }

}
