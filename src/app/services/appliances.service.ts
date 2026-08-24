import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appliance } from '@models/appliance';
import { Controller } from '@models/controller';
import { HttpController } from './http-controller.service';
import { normalizeAppliance } from './appliance-normalizer';

@Injectable()
export class ApplianceService {
  constructor(private httpController: HttpController) {}

  getAppliances(controller: Controller): Observable<Appliance[]> {
    return (this.httpController.get<Appliance[]>(controller, '/appliances') as Observable<Appliance[]>).pipe(
      map((appliances) => (appliances || []).map((appliance) => normalizeAppliance(appliance)))
    );
  }

  getAppliance(controller: Controller, url): Observable<Appliance> {
    return (this.httpController.get<Appliance>(controller, url) as Observable<Appliance>).pipe(
      map((appliance) => normalizeAppliance(appliance))
    );
  }

  getUploadPath(controller: Controller, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  updateAppliances(controller: Controller): Observable<Appliance[]> {
    return (this.httpController.get<Appliance[]>(controller, '/appliances?update=yes') as Observable<Appliance[]>).pipe(
      map((appliances) => (appliances || []).map((appliance) => normalizeAppliance(appliance)))
    );
  }
}
