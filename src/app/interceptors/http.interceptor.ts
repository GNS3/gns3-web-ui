import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginService } from '@services/login.service';
import { ServerService } from '@services/server.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private serverService: ServerService, private loginService: LoginService) {}
  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      catchError((err) => {
        if (err.status === 401 || err.status === 403) {
          this.call();
        } else {
          return throwError(err);
        }
      })
    );
  }

  async call() {
    let getCurrentUser = JSON.parse(localStorage.getItem(`isRememberMe`)) ?? null;
    const controller_id = this.loginService.controller_id;
    let server = await this.serverService.get(parseInt(controller_id, 10));
    server.tokenExpired = true;
    await this.serverService.update(server);
    try {
      if (getCurrentUser && getCurrentUser.isRememberMe) {
        let response = await this.loginService.getLoggedUserRefToken(server, getCurrentUser);
        server.authToken = response.access_token;
        server.tokenExpired = false;
        await this.serverService.update(server);
        await this.loginService.getLoggedUser(server);
        this.reloadCurrentRoute();
      }
    } catch (e) {
      throw e;
    }
  }
  reloadCurrentRoute() {
    location.reload();
  }
}
