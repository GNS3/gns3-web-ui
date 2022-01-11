import {Injectable} from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, Subscriber} from 'rxjs';
import {ServerService} from "../services/server.service";
import {GroupService} from "../services/group.service";
import {Server} from "../models/server";
import {Group} from "../models/groups/group";
import {User} from "../models/users/user";

@Injectable({
  providedIn: 'root'
})
export class GroupMembersResolver implements Resolve<User[]> {

  constructor(private serverService: ServerService,
              private groupService: GroupService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User[]> {

    return new Observable<User[]>((subscriber: Subscriber<User[]>) => {

      const serverId = route.paramMap.get('server_id');
      const groupId = route.paramMap.get('user_group_id');

      this.serverService.get(+serverId).then((server: Server) => {
        this.groupService.getGroupMember(server, groupId).subscribe((users: User[]) => {
          subscriber.next(users);
          subscriber.complete();
        });
      });
    });
  }
}
