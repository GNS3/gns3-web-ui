import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Server } from '../models/server';
import { ServerService } from '../services/server.service';

@Injectable()
export class LoginGuard implements CanActivate {
    constructor(
      private serverService: ServerService,
      private loginService: LoginService,
      private router: Router
    ) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const server_id = next.paramMap.get('server_id');
        let server = await this.serverService.get(parseInt(server_id, 10));
        try {
            await this.loginService.getLoggedUser(server).toPromise();
        } catch (e) {
            if (e.status === 401) {
                server.tokenExpired = true;
                await this.serverService.update(server)
                try {
                    let response = await this.loginService.login(server, server.username, server.password).toPromise();
                    server.authToken = response.access_token;
                    server.tokenExpired = false;
                    await this.serverService.update(server)
                } catch (e) {
                    throw e;
                }
            }
        }

        return this.serverService.get(parseInt(server_id, 10)).then((server: Server) => {
            if (server.authToken) return true;
            this.router.navigate(['/server', server.id, 'login'], { queryParams: { returnUrl: state.url }});
        });
    }
}
