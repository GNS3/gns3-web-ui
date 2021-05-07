import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Server } from 'app/models/server';
import { ServerService } from '../services/server.service';

@Injectable()
export class LoginGuard implements CanActivate {
    constructor(
      private serverService: ServerService,
      private router: Router
    ) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const server_id = next.paramMap.get('server_id');
        return this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            if (server.authToken) return true;
            this.router.navigate(['/server', server.id, 'login'], { queryParams: { returnUrl: state.url }});
        });
    }
}
