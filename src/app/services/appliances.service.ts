import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Appliance } from '../models/appliance';
import{ Controller } from '../models/controller';
import { HttpController } from './http-controller.service';

@Injectable()
export class ApplianceService {
  constructor(private httpServer: HttpController) {}

  getAppliances(controller:Controller ): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(controller, '/appliances') as Observable<Appliance[]>;
  }

  getAppliance(controller:Controller , url): Observable<Appliance> {
    return this.httpServer.get<Appliance>(controller, url) as Observable<Appliance>;
  }

  getUploadPath(controller:Controller , emulator: string, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  updateAppliances(controller:Controller ): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(controller, '/appliances?update=yes') as Observable<Appliance[]>;
  }
}
