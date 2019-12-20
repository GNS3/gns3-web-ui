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

    getUploadPath(server: Server, emulator: string, filename: string) {
        return `http://${server.host}:${server.port}/v2/${emulator}/images/${filename}`;
    }
}
