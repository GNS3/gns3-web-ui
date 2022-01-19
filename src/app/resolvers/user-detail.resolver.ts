import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {ServerService} from "@services/server.service";
import {UserService} from "@services/user.service";
import {User} from "@models/users/user";
import {Server} from "@models/server";

@Injectable({
  providedIn: 'root'
})
export class UserDetailResolver implements Resolve<User> {

  constructor(private serverService: ServerService,
              private userService: UserService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User> {
    return new Observable<User>((subscriber: Subscriber<User>) => {

      const serverId = route.paramMap.get('server_id');
      const userId = route.paramMap.get('user_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.userService.get(server, userId).subscribe((user: User) => {
          subscriber.next(user);
          subscriber.complete();
        });
      });
    });
  }
}
