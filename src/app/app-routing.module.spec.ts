import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Route, Router } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { LoginGuard } from './guards/login-guard';
import { PrivilegeGuard } from './guards/privilege-guard';

/** Depth-first lookup of a route by path in the router's normalized config. */
function findRoute(routes: Route[], path: string): Route | undefined {
  for (const route of routes) {
    if (route.path === path) return route;
    const child = route.children ? findRoute(route.children, path) : undefined;
    if (child) return child;
  }
  return undefined;
}

describe('AppRoutingModule (route guards)', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppRoutingModule] });
    router = TestBed.inject(Router);
  });

  function canActivatePaths(path: string): unknown[] {
    return (findRoute(router.config, path)?.canActivate ?? []) as unknown[];
  }

  it('runs LoginGuard before PrivilegeGuard on the image manager page', () => {
    const guards = canActivatePaths('controller/:controller_id/image-manager');

    expect(guards).toContain(LoginGuard);
    expect(guards).toContain(PrivilegeGuard);
    expect(guards.indexOf(LoginGuard)).toBeLessThan(guards.indexOf(PrivilegeGuard));
  });
});
