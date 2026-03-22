# Change Detection Issues with Dynamic Component Loading in Zoneless Mode

## Problem Description

In Angular 21 zoneless mode, when using `ViewContainerRef.createComponent` to dynamically load components, the component is successfully created but not displayed automatically. When clicking the button to toggle the topology summary panel visibility, console logs show successful component creation, but there's no visual change on the screen.

## Reproduction Steps

1. In the project-map component, click the TOC button to toggle the topology summary panel
2. Console logs show the component was created successfully
3. But the topology summary panel doesn't appear on the screen

## Root Cause

According to [Angular 21 zoneless official documentation](https://angular.dev/guide/zoneless):

> Being a host for a user component means using an API such as **ViewContainerRef.createComponent**...
> In zoneless mode, createComponent doesn't automatically trigger change detection.

There are two levels of change detection issues in zoneless mode:

### 1. Parent Component Level: Change Detection After `createComponent`

When using `ViewContainerRef.createComponent` to dynamically create a component, you need to explicitly trigger change detection:

```typescript
// ❌ In zoneless mode, this won't automatically trigger change detection
this.instance = this.topologySummaryContainer.createComponent(TopologySummaryComponent);
this.instance.instance.controller = this.controller;
this.instance.instance.project = this.project;

// ✅ Correct approach: explicitly trigger change detection
this.instance = this.topologySummaryContainer.createComponent(TopologySummaryComponent);
this.instance.instance.controller = this.controller;
this.instance.instance.project = this.project;
this.instance.changeDetectorRef.detectChanges();  // Must call this
```

### 2. Child Component Level: Change Detection After Async Data Loading

Inside the dynamically loaded component, if data is loaded via HTTP requests, you need to explicitly trigger change detection when the data arrives:

```typescript
// ❌ In zoneless mode, the view won't update when async data returns
ngOnInit() {
  this.projectService.getStatistics(this.controller, this.project.project_id).subscribe((stats) => {
    this.projectsStatistics = stats;  // Data updated, but view won't refresh
  });
}

// ✅ Correct approach: notify Angular when data arrives
ngOnInit() {
  this.projectService.getStatistics(this.controller, this.project.project_id).subscribe((stats) => {
    this.projectsStatistics = stats;
    this.cd.markForCheck();  // Must call to notify Angular to run change detection
  });
}
```

## Solution

### Fix 1: project-map.component.ts

Call `changeDetectorRef.detectChanges()` after dynamically creating the component:

```typescript
async lazyLoadTopologySummary() {
  if (this.isTopologySummaryVisible) {
    // In zoneless mode, we need to explicitly notify Angular after async operations
    const { TopologySummaryComponent } = await import('../topology-summary/topology-summary.component');
    this.instance = this.topologySummaryContainer.createComponent(TopologySummaryComponent);

    this.instance.instance.controller = this.controller;
    this.instance.instance.project = this.project;
    // In zoneless mode, createComponent doesn't automatically trigger change detection
    // We need to explicitly detect changes to ensure the component is rendered
    this.instance.changeDetectorRef.detectChanges();
  } else if (this.instance) {
    if (this.instance.instance) {
      this.instance.instance.ngOnDestroy();
      this.instance.destroy();
      this.instance = null;
    }
  }
}
```

### Fix 2: topology-summary.component.ts

1. Import and inject `ChangeDetectorRef`:

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ... } from '@angular/core';

export class TopologySummaryComponent implements OnInit, OnDestroy {
  // ... other dependency injections
  private cd = inject(ChangeDetectorRef);
}
```

2. Call `markForCheck()` in all async subscription callbacks:

```typescript
ngOnInit() {
  // Node data changes
  this.subscriptions.push(
    this.nodesDataSource.changes.subscribe((nodes: Node[]) => {
      this.nodes = nodes;
      // ... process data
      // ✅ In zoneless mode, mark for check after async updates
      this.cd.markForCheck();
    })
  );

  // Project statistics
  this.projectService.getStatistics(this.controller, this.project.project_id).subscribe((stats) => {
    this.projectsStatistics = stats;
    // ✅ In zoneless mode, trigger change detection when async data arrives
    this.cd.markForCheck();
  });

  // Compute nodes data
  this.computeService.getComputes(this.controller).subscribe((computes) => {
    this.computes = computes;
    // ✅ In zoneless mode, trigger change detection when async data arrives
    this.cd.markForCheck();
  });

  this.revertPosition();
}
```

## Key Takeaways

1. **`ViewContainerRef.createComponent` doesn't automatically trigger change detection**
   - Must call `this.instance.changeDetectorRef.detectChanges()` after creating the component

2. **Async operations don't automatically trigger change detection**
   - Must call `this.cd.markForCheck()` in `subscribe` callbacks after updating data
   - This applies to HTTP requests, Observable subscriptions, Promises, etc.

3. **OnPush components need explicit notification**
   - Components using `ChangeDetectionStrategy.OnPush` (recommended in zoneless)
   - Any async data updates require calling `markForCheck()`

4. **`markForCheck()` vs `detectChanges()`**
   - `markForCheck()`: Marks the component as needing check, Angular will run change detection at an appropriate time
   - `detectChanges()`: Immediately runs change detection for this component and its children
   - Usually `markForCheck()` is sufficient, but `detectChanges()` is needed after dynamic component creation

## Related Files

- `src/app/components/project-map/project-map.component.ts` - Dynamic component loading
- `src/app/components/topology-summary/topology-summary.component.ts` - Async data loading

## References

- [Angular 21 Zoneless Official Documentation](https://angular.dev/guide/zoneless)
- [ViewContainerRef Official Documentation](https://angular.dev/api/core/ViewContainerRef)
- [ChangeDetectorRef Official Documentation](https://angular.dev/api/core/ChangeDetectorRef)
