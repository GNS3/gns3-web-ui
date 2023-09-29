import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {ACE} from "@models/api/ACE";
import {Controller} from "@models/controller";
import {ControllerService} from "@services/controller.service";
import {AclService} from "@services/acl.service";

@Injectable({
  providedIn: 'root'
})
export class UserAcesResolver implements Resolve<ACE[]> {

  constructor(private controllerService: ControllerService,
              private aceService: AclService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ACE[]> {
    return new Observable<ACE[]>((subscriber: Subscriber<ACE[]>) => {

      const controllerId = route.paramMap.get('controller_id');
      const userId = route.paramMap.get('user_id');

      this.controllerService.get(+controllerId).then((controller: Controller) => {
        this.aceService.list(controller).subscribe((aces: ACE[]) => {
          const filter = aces.filter((ace: ACE) => ace.user_id === userId)

          subscriber.next(filter);
          subscriber.complete()
        })
      });
    });
  }
}
