import { Injectable } from '@angular/core';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Compute } from '../models/compute';
import { Observable } from 'rxjs';

@Injectable()
export class ComputeService {
    constructor(private httpServer: HttpServer) {}

    getComputes(server: Server): Observable<Compute[]> {
        return this.httpServer.get<Compute[]>(server, '/computes') as Observable<Compute[]>;
    }

    postAppliance(server: Server, appliance): Observable<any>{
        // test for one appliance
        return this.httpServer.post<any>(server, `/computes/local/docker/images/chrome.gns3a`, appliance) as Observable<any>;
    }
}
