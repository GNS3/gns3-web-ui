import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Compute } from '../models/compute';
import { ComputeStatistics } from '../models/computeStatistics';
import { Controller } from '../models/controller';
import { HttpController } from './http-controller.service';

@Injectable()
export class ComputeService {
  constructor(private httpController: HttpController) {}

  getComputes(controller: Controller ): Observable<Compute[]> {
    return this.httpController.get<Compute[]>(controller, '/computes') as Observable<Compute[]>;
  }

  getStatistics(controller: Controller ): Observable<ComputeStatistics[]> {
    return this.httpController.get(controller, `/statistics`);
  }
}
