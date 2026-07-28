import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';

@Injectable()
export class AdministratorGuard implements CanActivate {
  constructor(private controllerService: ControllerService, private userService: UserService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Promise<boolean> {
    const controllerId = this.findControllerId(route);
    const numericControllerId = Number.parseInt(controllerId ?? '', 10);

    if (!Number.isFinite(numericControllerId)) {
      await this.router.navigate(['/controllers']);
      return false;
    }

    try {
      const controller: Controller = await this.controllerService.get(numericControllerId);
      if (!controller) {
        await this.router.navigate(['/controllers']);
        return false;
      }

      const user = await firstValueFrom(this.userService.getInformationAboutLoggedUser(controller));
      if (user.is_superadmin) {
        return true;
      }

      await this.router.navigate(['/controller', numericControllerId, 'systemstatus']);
      return false;
    } catch {
      await this.router.navigate(['/controller', numericControllerId, 'systemstatus']);
      return false;
    }
  }

  private findControllerId(route: ActivatedRouteSnapshot): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      const controllerId = current.paramMap.get('controller_id');
      if (controllerId) {
        return controllerId;
      }
      current = current.parent;
    }
    return null;
  }
}
