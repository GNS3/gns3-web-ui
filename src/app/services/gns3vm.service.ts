import { Injectable } from '@angular/core';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Observable } from 'rxjs';
import { Gns3vm } from '../models/gns3vm/gns3vm';
import { Gns3vmEngine } from '../models/gns3vm/gns3vmEngine';
import { VM } from '../models/gns3vm/vm';

@Injectable()
export class Gns3vmService {
    constructor(private httpServer: HttpServer) {}

    getGns3vm(server: Server): Observable<Gns3vm> {
        return this.httpServer.get<Gns3vm>(server, '/gns3vm') as Observable<Gns3vm>;
    }

    updateGns3vm(server: Server, gns3vm: Gns3vm): Observable<Gns3vm> {
        return this.httpServer.put<Gns3vm>(server, `/gns3vm`, gns3vm) as Observable<Gns3vm>;
    }

    getGns3vmEngines(server: Server): Observable<Gns3vmEngine[]> {
        return this.httpServer.get<Gns3vmEngine[]>(server, '/gns3vm/engines') as Observable<Gns3vmEngine[]>;
    }

    getVms(server: Server, engine: Gns3vmEngine): Observable<VM[]> {
        return this.httpServer.get<VM[]>(server, `/gns3vm/engines/${engine.engine_id}/vms`)
    }
}
