import { Injectable } from '@angular/core';
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { Compute } from '../models/compute';
import { Observable } from 'rxjs';
import { ComputeStatistics } from '../models/computeStatistics';
import { Appliance } from '../models/appliance';

@Injectable()
export class ApplianceService {
    constructor(private httpServer: HttpServer) {}

    getAppliances(server: Server): Observable<Appliance[]> {
        return this.httpServer.get<Appliance[]>(server, '/appliances') as Observable<Appliance[]>;
    }
}
