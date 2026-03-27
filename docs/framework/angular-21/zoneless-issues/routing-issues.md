# Angular 21 Zoneless Mode: Routing Issues and Solutions

## Overview

This document records a critical issue encountered during the Angular 21 zoneless migration and its solution. The issue relates to how route parameters are read in zoneless mode with OnPush change detection.

## Problem Description

### Symptoms

After migrating to Angular 21 with `provideZonelessChangeDetection()` and `ChangeDetectionStrategy.OnPush`, a specific navigation flow stopped working correctly:

1. User navigates to a project page (`/controller/:controller_id/project/:project_id`)
2. User clicks the logo button and selects "Projects" from the menu
3. User returns to the projects list page (`/controller/:controller_id/projects`)
4. The top-right menu buttons become **disabled and grayed out**
5. Navigation menu items that depend on `controllerId` are all disabled

### Root Cause Analysis

The issue stemmed from how `controllerId` was being retrieved in the `DefaultLayoutComponent`:

```typescript
// BEFORE (broken)
ngOnInit() {
  this.router.events.subscribe((data) => {
    if (data instanceof NavigationEnd) {
      this.controllerId = this.route.children[0].snapshot.paramMap.get('controller_id');
      // ...
    }
  });
}
```

**Why `this.route.children[0]` fails in zoneless mode:**

1. **Snapshot Staleness**: `ActivatedRoute` snapshots can become stale. When navigating from `projectMap` back to `projects`, the `DefaultLayoutComponent` is not destroyed and recreated (it's a persistent layout). The snapshot may still point to the old route tree from the project page.

2. **Asynchronous Timing Issues**: In zoneless mode, Angular no longer automatically triggers change detection through Zone.js. If route parameters update without triggering change detection, or if you read the route at the wrong time, `children[0]` may not point to the expected route.

3. **Route Hierarchy Dependency**: Using `children[0]` is fragile and depends on the exact route structure. If a wrapper route is added in the future (e.g., for permissions), this code would break.

## Solution

### Approach 1: Initial Fix (Insufficient)

```typescript
// Improved but still fragile
const activeChild = this.route.firstChild;
this.controllerId = activeChild?.snapshot.paramMap.get('controller_id');
```

This approach still relies on a single path through the route tree and doesn't properly handle all navigation scenarios.

### Approach 2: Robust Solution (Implemented)

```typescript
import { filter, Subscription } from 'rxjs';

private getParamFromRoute(route: ActivatedRoute, paramName: string): string | null {
  let child = route;
  // Traverse the entire route tree
  while (child.firstChild) {
    child = child.firstChild;
    // Check current level params
    const param = child.snapshot.paramMap.get(paramName);
    if (param) return param;
  }
  // If no param found in tree, check root params
  return child.snapshot.paramMap.get(paramName);
}

ngOnInit() {
  // Use filter and proper subscription for NavigationEnd
  this.routeSubscription = this.router.events
    .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    .subscribe(() => {
      // Recursively traverse the route tree to find controller_id
      this.controllerId = this.getParamFromRoute(this.route, 'controller_id');
      this.getData();
      this.checkIfUserIsLoginPage();
      this.cd.markForCheck(); // Critical for zoneless OnPush
    });

  // Initial load
  this.controllerId = this.getParamFromRoute(this.route, 'controller_id');
  this.getData();
}
```

### Key Improvements

1. **Recursive Route Traversal**: Instead of just checking `children[0]`, we traverse the entire route tree to find the parameter.

2. **Proper Change Detection**: Calls `cd.markForCheck()` after updating `controllerId` to ensure the UI updates in zoneless mode.

3. **Type-safe Filtering**: Uses `filter` operator with type assertion for cleaner NavigationEnd handling.

4. **Both Initial and Navigation Updates**: Handles both the initial component load and subsequent navigations.

## Files Modified

- `src/app/layouts/default-layout/default-layout.component.ts`

## Additional RouterModule Issues Found

During the same migration, several components were found to be missing `RouterModule` or `RouterLink` imports, which prevented `routerLink` directives from working:

| Component | Fix Applied |
|-----------|-------------|
| `controllers.component.ts` | Added `RouterModule` |
| `role-management.component.ts` | Added `RouterModule` |
| `project-map.component.ts` | Added `RouterModule` |
| `resource-pools-management.component.ts` | Added `RouterModule` |
| `page-not-found.component.ts` | Added `RouterLink` |

## Best Practices for Zoneless Routing

1. **Use Signals or Observables for Route Params**: Prefer `route.params` Observable or `toSignal()` for reactive parameter handling.

2. **Call `markForCheck()` After Navigation**: In zoneless OnPush mode, explicitly call `ChangeDetectorRef.markForCheck()` after updating component state from navigation events.

3. **Traverse the Full Route Tree**: Don't assume `children[0]` or `firstChild` is the correct route - traverse the tree to find the parameter you need.

4. **Handle Both Initial Load and Navigation**: Ensure your solution works for both the initial page load and subsequent navigations.

## Related Documentation

- [Angular Zoneless Guide](https://angular.dev/guide/zoneless)
- [Angular Routing Documentation](https://angular.dev/guide/routing)
- [OnPush Change Detection](https://angular.dev/api/core/ChangeDetectionStrategy)

## Date Recorded

2026-03-22
