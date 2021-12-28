import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {ServerService} from "../services/server.service";
import {GroupService} from "../services/group.service";
import {Server} from "../models/server";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";

@Injectable({
  providedIn: 'root'
})
export class GroupDetailsResolver implements Resolve<{server: Server; group: Group; users: User[]}> {

  constructor(private serverService: ServerService,
              private groupService: GroupService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{server: Server; group: Group; users: User[]}> {

    return new Observable<{server: Server; group: Group; users: User[]}>((subscriber: Subscriber<any>) => {

      const serverId = route.paramMap.get('server_id');
      const groupId = route.paramMap.get('user_group_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.groupService.get(server, groupId).subscribe((group: Group) => {
          this.groupService.getGroupMember(server, groupId).subscribe((users: User[]) => {
            subscriber.next({server, group, users});
            subscriber.complete();
          });
        });
      });
    });
  }
}
