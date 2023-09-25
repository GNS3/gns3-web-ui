import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {Observable, of, Subscriber} from 'rxjs';
import {ControllerService} from "@services/controller.service";
import {ResourcePoolsService} from "@services/resource-pools.service";
import {ResourcePool} from "@models/resourcePools/ResourcePool";
import {Controller} from "@models/controller";

@Injectable({
  providedIn: 'root'
})
export class ResourcePoolsResolver implements Resolve<ResourcePool> {

  constructor(private controllerService: ControllerService,
              private resourcePoolsService: ResourcePoolsService,
  ) {
  }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ResourcePool> {
    return new Observable<ResourcePool>((subscriber: Subscriber<ResourcePool>) => {

      const controllerId = route.paramMap.get('controller_id');
      const poolId = route.paramMap.get('pool_id');

      this.controllerService.get(+controllerId).then((controller: Controller) => {
        this.resourcePoolsService.get(controller, poolId).subscribe((resourcePool: ResourcePool) => {
          subscriber.next(resourcePool);
          subscriber.complete();
        });
      });
    });
  }
}
