import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { AuthResponse } from '../models/authResponse';

@Injectable()
export class LoginService {
  controller_id:string =''
  constructor(private httpServer: HttpServer) {}

  login(controller: Server, username: string, password: string) {
    const payload = new HttpParams()
        .set('username', username)
        .set('password', password);

    const options = {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.httpServer.post<AuthResponse>(controller, '/users/login', payload, options);
  }

  getLoggedUser(controller: Server) {
    return this.httpServer.get(controller, "/users/me").toPromise()
  }
  async getLoggedUserRefToken(controller: Server,current_user):Promise<any> {
    return await this.httpServer.post<AuthResponse>(controller, "/users/authenticate", {"username":current_user.username,"password":current_user.password}).toPromise()
  }
}
