import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PrivilegeGuard } from './privilege-guard';

describe('PrivilegeGuard', () => {
  let guard: PrivilegeGuard;
  let mockPermissionService: any;
  let mockRouter: any;

  const createRoute = (
    data: Record<string, unknown> = {},
    params: Record<string, string> = { controller_id: '1' },
    parent?: any,
  ): ActivatedRouteSnapshot =>
    ({
      paramMap: { get: (key: string) => params[key] ?? null },
      data,
      parent,
    }) as unknown as ActivatedRouteSnapshot;

  const createState = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPermissionService = {
      ready: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    guard = new PrivilegeGuard(mockPermissionService, mockRouter);
  });

  describe('canActivate', () => {
    it('should allow when the route declares no privileges', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set());

      const result = await guard.canActivate(createRoute({}), createState('/controller/1/projects'));

      expect(result).toBe(true);
      expect(mockPermissionService.ready).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should allow when all required privileges are held', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['Server.Audit']));

      const result = await guard.canActivate(
        createRoute({ privileges: ['Server.Audit'] }),
        createState('/controller/1/systemstatus'),
      );

      expect(result).toBe(true);
    });

    it('should require every listed privilege by default (match all)', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['A.Audit']));

      const result = await guard.canActivate(
        createRoute({ privileges: ['A.Audit', 'B.Audit'] }),
        createState('/controller/1/a'),
      );

      expect(result).toBe(false);
    });

    it('should honour privilegeMatch any', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['B.Audit']));

      const result = await guard.canActivate(
        createRoute({ privileges: ['A.Audit', 'B.Audit'], privilegeMatch: 'any' }),
        createState('/controller/1/a'),
      );

      expect(result).toBe(true);
    });

    it('should allow when at least one of privilegesAny is held', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['Compute.Audit', 'Compute.Modify']));

      const result = await guard.canActivate(
        createRoute({
          privileges: ['Compute.Audit'],
          privilegesAny: ['Compute.Allocate', 'Compute.Modify'],
        }),
        createState('/controller/1/computes'),
      );

      expect(result).toBe(true);
    });

    it('should deny when none of privilegesAny is held', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['Compute.Audit']));

      const result = await guard.canActivate(
        createRoute({
          privileges: ['Compute.Audit'],
          privilegesAny: ['Compute.Allocate', 'Compute.Modify'],
        }),
        createState('/controller/1/computes'),
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'systemstatus']);
    });

    it('should deny and redirect to the system status page when a privilege is missing', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set());

      const result = await guard.canActivate(
        createRoute({ privileges: ['Server.Audit'] }),
        createState('/controller/1/server-settings'),
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'systemstatus']);
    });

    it('should deny without throwing when the privilege lookup fails', async () => {
      mockPermissionService.ready.mockRejectedValue(new Error('fetch failed'));

      const result = await guard.canActivate(
        createRoute({ privileges: ['Server.Audit'] }),
        createState('/controller/1/server-settings'),
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'systemstatus']);
    });

    describe('system status page redirect loop', () => {
      // The system status page is the default deny target AND a gated route:
      // redirecting a denied user back to it would loop forever. Those users
      // must land on the projects page instead.
      it('should redirect to the projects page when the denied route is the system status page', async () => {
        mockPermissionService.ready.mockResolvedValue(new Set());

        const result = await guard.canActivate(
          createRoute({ privileges: ['Server.Audit'] }),
          createState('/controller/1/systemstatus'),
        );

        expect(result).toBe(false);
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/controller', 1, 'systemstatus']);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'projects']);
      });

      it('should also break the loop when the navigation carries query params', async () => {
        mockPermissionService.ready.mockResolvedValue(new Set());

        const result = await guard.canActivate(
          createRoute({ privileges: ['Server.Audit'] }),
          createState('/controller/1/systemstatus?returnUrl=%2F'),
        );

        expect(result).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'projects']);
      });

      it('should deny to the projects page when the lookup fails on the system status page', async () => {
        mockPermissionService.ready.mockRejectedValue(new Error('fetch failed'));

        const result = await guard.canActivate(
          createRoute({ privileges: ['Server.Audit'] }),
          createState('/controller/1/systemstatus'),
        );

        expect(result).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/controller', 1, 'projects']);
      });
    });

    it('should find the controller id on a parent route when the leaf has none', async () => {
      mockPermissionService.ready.mockResolvedValue(new Set(['Server.Audit']));

      const parent = createRoute({}, { controller_id: '2' });
      const leaf = createRoute({ privileges: ['Server.Audit'] }, {}, parent);

      const result = await guard.canActivate(leaf, createState('/controller/2/child'));

      expect(result).toBe(true);
      expect(mockPermissionService.ready).toHaveBeenCalledWith(2);
    });

    it('should send the user back to the controller list when no controller id is in the tree', async () => {
      const result = await guard.canActivate(
        createRoute({ privileges: ['Server.Audit'] }, {}),
        createState('/somewhere'),
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/controllers']);
    });
  });
});
