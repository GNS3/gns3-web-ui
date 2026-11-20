import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { ProjectDistributionService } from '@services/project-distribution.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private controllerService: ControllerService,
    private loginService: LoginService,
    private userPreferences: UserPreferencesService,
    private projectDistributions: ProjectDistributionService,
    private router: Router
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const controller_id = next.paramMap.get('controller_id');
    this.loginService.controller_id = controller_id;
    let controller = await this.controllerService.get(parseInt(controller_id, 10));
    try {
      await this.loginService.getLoggedUser(controller);
    } catch (e) {}
    return this.controllerService.get(parseInt(controller_id, 10)).then((controller: Controller) => {
      // Controller is absent from local storage (e.g. after clearing site data).
      // There is nothing to authenticate against, so go back to the server list
      // instead of dereferencing a null controller.
      if (!controller) {
        this.router.navigate(['/controllers']);
        return false;
      }
      if (controller.authToken && !controller.tokenExpired) {
        // Session is authenticated: fetch and merge the user's server-side
        // preferences (no-op against controllers without the endpoint).
        this.userPreferences.sync(controller);
        // Resume tracking project distributions still running server-side
        // (references stored in the synced preferences).
        this.projectDistributions.restore(controller);
        return true;
      }
      this.router.navigate(['/controller', controller.id, 'login'], { queryParams: { returnUrl: state.url } });
      return false;
    });
  }
}
