import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServerService } from '@services/server.service';
import { LoginService } from '@services/login.service';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(
    private serverService: ServerService,
    private loginService: LoginService) { }
  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(catchError(err => {
      if (err.status === 401) {
        this.call()
      } else {
        return throwError(err)
      }
    }))
  }
  async call() {
    const server_id = this.loginService.server_id
    let server = await this.serverService.get(parseInt(server_id, 10));
    server.tokenExpired = true;
    await this.serverService.update(server)
    try {
      let response = await this.loginService.getLoggedUserRefToken(server)
      server.authToken = response.access_token;
      server.tokenExpired = false;
      await this.serverService.update(server)
      await this.loginService.getLoggedUser(server)
      this.reloadCurrentRoute()
    } catch (e) {
      throw e;
    }



  }
  reloadCurrentRoute() {
    window.location.reload()
  }

}


