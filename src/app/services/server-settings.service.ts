import { Injectable } from "@angular/core";
import { HttpServer } from './http-server.service';
import { Server } from '../models/server';
import { ServerSettings } from '../models/serverSettings';

@Injectable()
export class ServerSettingsService {
    constructor(
        private httpServer: HttpServer
    ){}

    get(server: Server) {
        return this.httpServer.get<ServerSettings>(server, `/settings`);
    }

    update(server: Server, serverSettings: ServerSettings) {
        return this.httpServer.post<ServerSettings>(server, `/settings`, serverSettings);
    }
}
