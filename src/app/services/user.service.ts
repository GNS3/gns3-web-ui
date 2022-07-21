import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import{ Controller } from '../models/controller';
import { HttpServer } from './http-server.service';
import { User } from '../models/users/user';

@Injectable()
export class UserService {
  constructor(
    private httpServer: HttpServer
  ) {}

  getInformationAboutLoggedUser(controller:Controller ) {
    return this.httpServer.get<User>(controller, '/users/me/');
  }
}
