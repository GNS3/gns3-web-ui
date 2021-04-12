import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Server } from '../models/server';
import { ServerService } from '../services/server.service';

@Injectable()
export class ServerResolve implements Resolve<Server> {
  constructor(private serverService: ServerService) {}

  resolve(route: ActivatedRouteSnapshot) {
    return this.serverService.get(parseInt(route.params['server_id']));
  }
}
