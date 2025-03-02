import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';

@Injectable()
export class ControllerResolve implements Resolve<Controller> {
  constructor(private controllerService: ControllerService) {}

  resolve(route: ActivatedRouteSnapshot) {
    return this.controllerService.get(parseInt(route.params['controller_id']));
  }
}
