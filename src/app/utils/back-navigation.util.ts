import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Goes back one history entry when the app has in-app navigation history —
 * restoring the previous URL with its query params (e.g. the templates list
 * filters) — and falls back to a plain forward navigation otherwise (deep
 * link / page refresh on the current page, where `location.back()` would
 * leave the app).
 *
 * The Router stamps every history entry with `navigationId`; `> 1` means
 * there is an earlier in-app entry to go back to.
 */
export function goBackOrNavigate(location: Location, router: Router, fallback: unknown[]): void {
  if ((history.state?.navigationId ?? 0) > 1) {
    location.back();
  } else {
    router.navigate(fallback);
  }
}
