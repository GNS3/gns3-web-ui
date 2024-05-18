import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Controller } from '../models/controller';
import { HttpController } from './http-controller.service';
import { AuthResponse } from '../models/authResponse';

@Injectable()
export class LoginService {
  controller_id:string =''
  constructor(private httpController: HttpController) {}

  login(controller:Controller , username: string, password: string) {
    const payload = new HttpParams()
        .set('username', username)
        .set('password', password);

    const options = {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.httpController.post<AuthResponse>(controller, '/access/users/login', payload, options);
  }

  getLoggedUser(controller:Controller ) {
    return this.httpController.get(controller, "/access/users/me").toPromise()
  }
  async getLoggedUserRefToken(controller:Controller ,current_user):Promise<any> {
    return await this.httpController.post<AuthResponse>(controller, "/access/users/authenticate", {"username":current_user.username,"password":current_user.password}).toPromise()
  }
}
