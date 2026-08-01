import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Compute, ComputeCreate, ComputeUpdate } from '@models/compute';
import { ControllerStatistics } from '@models/computeStatistics';
import { Controller } from '@models/controller';
import type { NetworkInterface } from '../cartography/models/node';
import { HttpController } from './http-controller.service';

@Injectable()
export class ComputeService {
  constructor(private httpController: HttpController) {}

  getComputes(controller: Controller): Observable<Compute[]> {
    return this.httpController.get<Compute[]>(controller, '/computes') as Observable<Compute[]>;
  }

  getCompute(controller: Controller, computeId: string): Observable<Compute> {
    return this.httpController.get<Compute>(controller, `/computes/${computeId}`) as Observable<Compute>;
  }

  getNetworkInterfaces(controller: Controller, computeId: string): Observable<NetworkInterface[]> {
    return this.httpController.get<NetworkInterface[]>(
      controller,
      `/computes/${computeId}/network/interfaces`
    ) as Observable<NetworkInterface[]>;
  }

  createCompute(controller: Controller, compute: ComputeCreate): Observable<Compute> {
    return this.httpController.post<Compute>(controller, '/computes', compute) as Observable<Compute>;
  }

  updateCompute(controller: Controller, computeId: string, compute: ComputeUpdate): Observable<Compute> {
    return this.httpController.put<Compute>(controller, `/computes/${computeId}`, compute) as Observable<Compute>;
  }

  deleteCompute(controller: Controller, computeId: string): Observable<void> {
    return this.httpController.delete<void>(controller, `/computes/${computeId}`) as Observable<void>;
  }

  connectCompute(controller: Controller, computeId: string): Observable<void> {
    return this.httpController.post<void>(controller, `/computes/${computeId}/connect`, null) as Observable<void>;
  }

  getStatistics(controller: Controller): Observable<ControllerStatistics> {
    return this.httpController.get<ControllerStatistics>(controller, `/statistics`);
  }
}
