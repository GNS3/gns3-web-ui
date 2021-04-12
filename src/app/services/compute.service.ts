import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Compute } from '../models/compute';
import { ComputeStatistics } from '../models/computeStatistics';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class ComputeService {
  constructor(private httpServer: HttpServer) {}

  getComputes(server: Server): Observable<Compute[]> {
    return this.httpServer.get<Compute[]>(server, '/computes') as Observable<Compute[]>;
  }

  getUploadPath(server: Server, emulator: string, filename: string) {
    return `${server.protocol}//${server.host}:${server.port}/v2/${emulator}/images/${filename}`;
  }

  getStatistics(server: Server): Observable<ComputeStatistics[]> {
    return this.httpServer.get(server, `/statistics`);
  }
}
