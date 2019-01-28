import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { VpcsTemplate } from '../models/templates/vpcs-template';
import { Observable } from 'rxjs';

@Injectable()
export class VpcsService {
    constructor(private httpServer: HttpServer) {}

    getTemplates(server: Server): Observable<VpcsTemplate[]> {
        return this.httpServer.get<VpcsTemplate[]>(server, '/templates') as Observable<VpcsTemplate[]>;
    }
}
