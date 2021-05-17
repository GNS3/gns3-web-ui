import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { User } from '../models/users/user';

@Injectable()
export class UserService {
  constructor(
    private httpServer: HttpServer
  ) {}

  getInformationAboutLoggedUser(server: Server) {
    return this.httpServer.get<User>(server, '/users/me/');
  }
}
