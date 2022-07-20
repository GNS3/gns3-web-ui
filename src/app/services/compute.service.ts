import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Compute } from '../models/compute';
import { ComputeStatistics } from '../models/computeStatistics';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class ComputeService {
  constructor(private httpServer: HttpServer) {}

  getComputes(controller: Server): Observable<Compute[]> {
    return this.httpServer.get<Compute[]>(controller, '/computes') as Observable<Compute[]>;
  }

  getUploadPath(controller: Server, emulator: string, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/${emulator}/images/${filename}`;
  }

  getStatistics(controller: Server): Observable<ComputeStatistics[]> {
    return this.httpServer.get(controller, `/statistics`);
  }
}
