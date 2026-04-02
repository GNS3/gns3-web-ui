import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, from, throwError, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ControllerService } from '@services/controller.service';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { ResourcePool } from '@models/resourcePools/ResourcePool';
import { Controller } from '@models/controller';

@Injectable({
  providedIn: 'root',
})
export class ResourcePoolsResolver implements Resolve<ResourcePool> {
  constructor(private controllerService: ControllerService, private resourcePoolsService: ResourcePoolsService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ResourcePool> {
    const controllerId = route.paramMap.get('controller_id');
    const poolId = route.paramMap.get('pool_id');

    // Convert Promise to Observable and handle errors
    return from(this.controllerService.get(+controllerId)).pipe(
      // Use switchMap to chain with the resource pools service call
      switchMap((controller: Controller) => {
        return this.resourcePoolsService.get(controller, poolId);
      }),
      // Handle any errors from either service
      catchError((error) => {
        // Re-throw the error so the router can handle it
        return throwError(() => error);
      })
    );
  }
}
