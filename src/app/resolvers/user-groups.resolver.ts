import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";
import {Server} from "../models/server";
import {ServerService} from "../services/server.service";
import {UserService} from "../services/user.service";

@Injectable({
  providedIn: 'root'
})
export class UserGroupsResolver implements Resolve<Group[]> {
  constructor(private serverService: ServerService,
              private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Group[]> {
    return new Observable<Group[]>((subscriber: Subscriber<Group[]>) => {

      const serverId = route.paramMap.get('server_id');
      const userId = route.paramMap.get('user_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.userService.getGroupsByUserId(server, userId).subscribe((groups: Group[]) => {
          subscriber.next(groups);
          subscriber.complete();
        });
      });
    });
  }
}
