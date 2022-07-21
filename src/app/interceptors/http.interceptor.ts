import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginService } from '../services/login.service';
import { ControllerService } from '../services/controller.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private serverService: ControllerService, private loginService: LoginService) {}
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
    let controller = await this.serverService.get(parseInt(controller_id, 10));
    controller.tokenExpired = true;
    await this.serverService.update(controller);
    try {
      if (getCurrentUser && getCurrentUser.isRememberMe) {
        let response = await this.loginService.getLoggedUserRefToken(controller, getCurrentUser);
        controller.authToken = response.access_token;
        controller.tokenExpired = false;
        await this.serverService.update(controller);
        await this.loginService.getLoggedUser(controller);
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
