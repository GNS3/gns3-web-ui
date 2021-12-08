import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { User } from '../models/users/user';
import {Project} from "@models/project";

@Injectable()
export class UserService {
  constructor(
    private httpServer: HttpServer
  ) {}

  getInformationAboutLoggedUser(server: Server) {
    return this.httpServer.get<User>(server, '/users/me/');
  }

  list(server: Server) {
    return this.httpServer.get<User[]>(server, '/users');
  }

  add(server: Server, user: any): Observable<User> {
    console.log(user)
    return this.httpServer.post<User>(server, `/users`, {
      username: user.username,
      is_active: user.is_active,
      email: user.email,
      full_name: user.full_name,
      password: user.password
    });
  }

}
