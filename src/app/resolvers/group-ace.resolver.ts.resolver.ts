import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable,Subscriber} from 'rxjs';
import {ACE} from "../models/api/ACE";
import {ControllerService} from "../services/controller.service";
import {AclService} from "../services/acl.service";
import {Controller} from "../models/controller";
import {UserService} from "@services/user.service";
import {GroupService} from "@services/group.service";
import {RoleService} from "@services/role.service";

@Injectable({
  providedIn: 'root'
})
export class GroupAcesResolver implements Resolve<ACE[]> {

  constructor(private controllerService: ControllerService,
              private aceService: AclService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ACE[]> {
    return new Observable<ACE[]>((subscriber: Subscriber<ACE[]>) => {

      const controllerId = route.paramMap.get('controller_id');
      const groupId = route.paramMap.get('user_group_id');

      this.controllerService.get(+controllerId).then((controller: Controller) => {
        this.aceService.list(controller).subscribe((aces: ACE[]) => {
          const filter = aces.filter((ace: ACE) => ace.group_id === groupId)

          subscriber.next(filter);
          subscriber.complete()
        })
      });
    });
  }
}
