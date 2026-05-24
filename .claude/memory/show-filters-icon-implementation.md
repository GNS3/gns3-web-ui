---
name: show_filters_icon-implementation
description: Complete implementation guide for show_filters_icon feature
metadata:
  type: project
---

# show_filters_icon Implementation Guide

## Feature Overview

Toggle control for packet filter icon visibility on network links. Users can hide/show filter-related icons while maintaining capture status.

## Architecture

### Data Models

**Link & MapLink** (no default values, purely from server):
```typescript
show_filters_icon: boolean;
```

### Converters (Both Directions)

**LinkToMapLinkConverter**:
```typescript
mapLink.show_filters_icon = link.show_filters_icon;
```

**MapLinkToLinkConverter**:
```typescript
link.show_filters_icon = mapLink.show_filters_icon;
```

⚠️ **Critical**: Both converters must include the field. Missing either direction causes data loss.

---

## Icon Display Logic

### Icon Types
1. `.capture-icon` - Pure capture (no filter indicators)
2. `.filter-capture-icon` - Capture + filters merged
3. `.filter-icon` - Pure filters (not capturing)
4. `.pause-icon` - Suspended link

### Display Conditions

**`.capture-icon`**:
```typescript
l.capturing && !l.suspend && 
(l.show_filters_icon === false || !hasFilters)
```

**`.filter-capture-icon`**:
```typescript
l.show_filters_icon !== false && l.capturing && !l.suspend && hasFilters
```

**`.pause-icon`**: `l.suspend` (not affected by show_filters_icon)

### Scenario Table

| show_filters_icon | Capturing | Filters | capture-icon | filter-capture-icon |
|-------------------|-----------|---------|--------------|---------------------|
| false | ✅ | ❌ | ✅ | - |
| false | ✅ | ✅ | ✅ | ❌ |
| true | ✅ | ❌ | ✅ | - |
| true | ✅ | ✅ | ❌ | ✅ |

**Design Principle**: When `show_filters_icon=false`, hide filter indicators while showing capture status.

---

## Component Implementation

### ToggleShowFiltersIconActionComponent

**Key Pattern**: Read from data source (not component state):

```typescript
export class ToggleShowFiltersIconActionComponent {
  readonly link = input<Link>(undefined);

  // ✅ Read from LinksDataSource (source of truth)
  get showFiltersIcon(): boolean {
    const link = this.link();
    if (!link) return true;
    
    const currentLink = this.linksDataSource.get(link.link_id);
    return currentLink?.show_filters_icon ?? true;
  }

  toggleShowFiltersIcon() {
    const link = this.link();
    const newValue = !this.showFiltersIcon;

    this.linkService.updateLink(this.controller(), 
      { ...link, show_filters_icon: newValue }
    ).subscribe({
      next: (updatedLink) => {
        // Update data sources (triggers LinkWidget updates)
        this.linksDataSource.update(updatedLink);
        const mapLink = this.mapLinksDataSource.get(updatedLink.link_id);
        if (mapLink) {
          mapLink.show_filters_icon = updatedLink.show_filters_icon;
          this.mapLinksDataSource.update(mapLink);
        }
      }
    });
  }
}
```

---

## Critical Bugs Fixed

### Bug 1: Context Menu State Reuse

**Problem**: Context menu component instances are reused. Shows stale state when opening different links.

**Failed Solutions**:
- ❌ `computed()` - Only responds to signal reference changes
- ❌ `signal()` + `ngOnInit()` - Only executes once
- ❌ `effect()` - Same limitation

**Solution**: Read from `LinksDataSource` via getter. Each template evaluation fetches fresh data.

### Bug 2: Memory Leak in LinkWidget

**Problem**: Unmanaged RxJS subscription in `@Injectable()` service accumulates.

**Solution**:
```typescript
export class LinkWidget implements Widget, OnDestroy {
  private subscription: Subscription;

  constructor() {
    this.subscription = this.mapLinksDataSource.itemChanged.subscribe(...);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

---

## Key Learnings

### 1. Converter Completeness

When adding model fields, check **all** converters (forward, reverse, intermediate).

### 2. computed() Limitation

Only responds to signal **reference** changes, not object **property** changes.

**Workaround**: Read from data source instead of storing local state.

### 3. Resource Management

All subscriptions in `@Injectable()` services must be cleaned up in `ngOnDestroy()`.

### 4. Pure Signals Pattern

- ✅ Read from data sources for fresh values
- ✅ No `ChangeDetectorRef.markForCheck()`
- ❌ No local state that can go stale

---

## Related Files

- `src/app/models/link.ts` - Link model
- `src/app/cartography/models/map/map-link.ts` - MapLink model
- `src/app/cartography/converters/map/link-to-map-link-converter.ts` - Forward conversion
- `src/app/cartography/converters/map/map-link-to-link-converter.ts` - Reverse conversion
- `src/app/cartography/widgets/link.ts` - Icon display logic, subscription cleanup
- `src/app/components/project-map/context-menu/actions/toggle-show-filters-icon-action/` - UI component
- `src/app/services/link.service.ts` - API layer
