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
    return this.httpServer.post<User>(server, `/users`, user);
  }

  delete(server: Server, user_id: string) {
    return this.httpServer.delete(server, `/users/${user_id}`);
  }

  update(server: Server, user: User): Observable<User> {
    return this.httpServer.put<User>(server, `/users/${user.user_id}`, user);
  }
}
