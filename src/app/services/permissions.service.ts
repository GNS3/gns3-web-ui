import { Injectable } from '@angular/core';
import {HttpServer} from "./http-server.service";
import {Server} from "../models/server";
import {Permission} from "../models/permission";
import {Observable} from "rxjs/Rx";

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private httpServer: HttpServer) { }

  list(server: Server) {
    return this.httpServer.get<Permission[]>(server, '/permissions');
  }

  add(server: Server, permission: Permission): Observable<Permission> {
    return this.httpServer.post<Permission>(server, '/permissions', permission);
  }

  update(server: Server, permission: Permission): Observable<Permission> {
    return this.httpServer.put<Permission>(server, `/permissions/${permission.permission_id}`, permission);
  }

  delete(server: Server, permission_id: string) {
    return this.httpServer.delete(server, `/permissions/${permission_id}`);
  }
}
