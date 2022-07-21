import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Compute } from '../models/compute';
import { ComputeStatistics } from '../models/computeStatistics';
import{ Controller } from '../models/controller';
import { HttpServer } from './http-server.service';

@Injectable()
export class ComputeService {
  constructor(private httpServer: HttpServer) {}

  getComputes(controller:Controller ): Observable<Compute[]> {
    return this.httpServer.get<Compute[]>(controller, '/computes') as Observable<Compute[]>;
  }

  getUploadPath(controller:Controller , emulator: string, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/${emulator}/images/${filename}`;
  }

  getStatistics(controller:Controller ): Observable<ComputeStatistics[]> {
    return this.httpServer.get(controller, `/statistics`);
  }
}
