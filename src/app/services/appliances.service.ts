import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Appliance } from '../models/appliance';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class ApplianceService {
  constructor(private httpServer: HttpServer) {}

  getAppliances(server: Server): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(server, '/appliances') as Observable<Appliance[]>;
  }

  getAppliance(server: Server, url): Observable<Appliance> {
    return this.httpServer.get<Appliance>(server, url) as Observable<Appliance>;
  }

  getUploadPath(server: Server, emulator: string, filename: string) {
    return `${server.protocol}//${server.host}:${server.port}/v2/compute/${emulator}/images/${filename}`;
  }

  updateAppliances(server: Server): Observable<Appliance[]> {
    return this.httpServer.get<Appliance[]>(server, '/appliances?update=yes') as Observable<Appliance[]>;
  }
}
