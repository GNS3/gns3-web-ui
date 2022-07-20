import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Appliance } from '../models/appliance';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class ApplianceService {
  constructor(private httpServer: HttpServer) {}

  getAppliances(controller: Server): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(controller, '/appliances') as Observable<Appliance[]>;
  }

  getAppliance(controller: Server, url): Observable<Appliance> {
    return this.httpServer.get<Appliance>(controller, url) as Observable<Appliance>;
  }

  getUploadPath(controller: Server, emulator: string, filename: string) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/images/upload/${filename}`;
  }

  updateAppliances(controller: Server): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(controller, '/appliances?update=yes') as Observable<Appliance[]>;
  }
}
