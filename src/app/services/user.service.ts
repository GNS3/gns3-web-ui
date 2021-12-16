import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { User } from '../models/users/user';
import {Project} from "@models/project";
import {Group} from "@models/groups/group";

@Injectable()
export class UserService {
  constructor(
    private httpServer: HttpServer
  ) {}

  getInformationAboutLoggedUser(server: Server) {
    return this.httpServer.get<User>(server, '/users/me/');
  }

  get(server:Server, user_id: string) {
    return this.httpServer.get<User>(server, `/users/${user_id}`);
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

  update(server: Server, user: any): Observable<User> {
    return this.httpServer.put<User>(server, `/users/${user.user_id}`, user);
  }

  getGroupsByUserId(server: Server, user_id: string) {
    return this.httpServer.get<Group[]>(server, `/users/${user_id}/groups`);
  }
}
