import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { ServerService } from '../services/server.service';
import { Server } from '../models/server';

@Injectable()
export class ServerResolve implements Resolve<Server> {
    constructor(
        private serverService: ServerService
    ) {}

    resolve(route: ActivatedRouteSnapshot) {
        return this.serverService.get(parseInt(route.params['server_id']));
    }
}
