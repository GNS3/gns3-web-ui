import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { AdministratorGuard } from './administrator-guard';

describe('AdministratorGuard', () => {
  let guard: AdministratorGuard;
  let controllerService: { get: ReturnType<typeof vi.fn> };
  let userService: { getInformationAboutLoggedUser: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const route = {
    paramMap: { get: (key: string) => (key === 'controller_id' ? '7' : null) },
    parent: null,
  } as unknown as ActivatedRouteSnapshot;
  const state = { url: '/controller/7/management/users' } as RouterStateSnapshot;
  const controller = { id: 7 } as Controller;

  beforeEach(() => {
    controllerService = { get: vi.fn().mockResolvedValue(controller) };
    userService = { getInformationAboutLoggedUser: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    guard = new AdministratorGuard(
      controllerService as unknown as ControllerService,
      userService as unknown as UserService,
      router as unknown as Router
    );
  });

  it('allows server administrators', async () => {
    userService.getInformationAboutLoggedUser.mockReturnValue(of({ is_superadmin: true }));

    await expect(guard.canActivate(route, state)).resolves.toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('blocks regular users and returns them to system status', async () => {
    userService.getInformationAboutLoggedUser.mockReturnValue(of({ is_superadmin: false }));

    await expect(guard.canActivate(route, state)).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/controller', 7, 'systemstatus']);
  });

  it('fails closed when the current-user request fails', async () => {
    userService.getInformationAboutLoggedUser.mockReturnValue(throwError(() => new Error('Forbidden')));

    await expect(guard.canActivate(route, state)).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/controller', 7, 'systemstatus']);
  });
});
