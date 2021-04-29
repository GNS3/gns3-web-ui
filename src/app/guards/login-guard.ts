import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Server } from 'app/models/server';
import { ServerService } from '../services/server.service';

@Injectable()
export class LoginGuard implements CanActivate {
    constructor(
      private serverService: ServerService
    ) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const server_id = next.paramMap.get('server_id');
        return this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            if (server.authToken) return true;
            return false
        });
    }
}
