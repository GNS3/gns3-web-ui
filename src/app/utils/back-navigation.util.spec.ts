import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { goBackOrNavigate } from './back-navigation.util';

describe('goBackOrNavigate', () => {
  let location: Location;
  let router: Router;
  const fallback = ['/controller', 1, 'preferences'];

  beforeEach(() => {
    location = { back: vi.fn() } as unknown as Location;
    router = { navigate: vi.fn() } as unknown as Router;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubNavigationId(id: number | undefined): void {
    vi.stubGlobal('history', { state: id === undefined ? undefined : { navigationId: id } });
  }

  it('goes back when there is in-app history (navigationId > 1)', () => {
    stubNavigationId(2);

    goBackOrNavigate(location, router, fallback);

    expect(location.back).toHaveBeenCalledOnce();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the fallback on the first in-app navigation (deep link)', () => {
    stubNavigationId(1);

    goBackOrNavigate(location, router, fallback);

    expect(router.navigate).toHaveBeenCalledWith(fallback);
    expect(location.back).not.toHaveBeenCalled();
  });

  it('navigates to the fallback when history.state is missing', () => {
    stubNavigationId(undefined);

    goBackOrNavigate(location, router, fallback);

    expect(router.navigate).toHaveBeenCalledWith(fallback);
    expect(location.back).not.toHaveBeenCalled();
  });
});
