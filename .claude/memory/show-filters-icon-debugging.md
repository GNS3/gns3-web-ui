---
name: show-filters-icon-debugging
description: Debugging show_filters_icon data flow issue in context menu
metadata:
  type: project
---

# show_filters_icon Data Flow Issue

## Problem Description

When implementing `show_filters_icon` toggle control for link filter icons:

- **Expected**: Server returns `show_filters_icon: false`, right-clicking link should show "Show filter icons"
- **Actual**: Shows "Hide filter icons" (indicating state is true)
- **When**: After loading topology, right-click on any link

## Data Flow Analysis

Complete data flow path:

```
Server JSON (show_filters_icon: false)
  ↓
HTTP Response
  ↓
LinksDataSource.set(links[])
  ↓
LinkToMapLinkConverter.convert()
  ↓
MapLink object (show_filters_icon: false) ✅ Correct
  ↓
SVG rendering (show_filters_icon: false) ✅ Correct
  ↓
User right-clicks link
  ↓
MapLinkToLinkConverter.convert() - converts back to Link
  ↓
Link object (show_filters_icon: undefined) ❌ Wrong!
  ↓
context menu (show_filters_icon: undefined) ❌
  ↓
ToggleShowFiltersIconActionComponent
```

## Root Cause

**MapLinkToLinkConverter missing field conversion**

`src/app/cartography/converters/map/map-link-to-link-converter.ts`:

```typescript
convert(mapLink: MapLink) {
  const link = new Link();
  link.link_id = mapLink.id;
  // ... other fields
  link.suspend = mapLink.suspend;
  link.wireshark = mapLink.wireshark;
  // ❌ Missing this line:
  // link.show_filters_icon = mapLink.show_filters_icon;
  return link;
}
```

When context menu opens, project-map component converts MapLink to Link via MapLinkToLinkConverter. Since the converter is missing the `show_filters_icon` field, the Link object passed to context menu has `undefined` for this field.

## Debugging Method

Verify data flow using browser Console:

```javascript
// 1. Check SVG element data
const linkElement = document.querySelector('g.link_body');
console.log('SVG show_filters_icon:', linkElement.__data__?.show_filters_icon);

// 2. Check LinksDataSource
const projectMap = document.querySelector('app-project-map');
const linksDataSource = ng.getComponent(projectMap).linksDataSource;
const link = linksDataSource.data.find(l => l.link_id === 'xxx');
console.log('LinksDataSource show_filters_icon:', link?.show_filters_icon);

// 3. Check link object in context menu
const actionComponent = ng.getComponent(document.querySelector('app-toggle-show-filters-icon-action'));
console.log('Context menu link:', actionComponent.link()?.show_filters_icon);
```

By comparing data at these three stages, identified the converter as the problem.

## Solution

### 1. Fix Converter

Add missing field conversion:

```typescript
convert(mapLink: MapLink) {
  const link = new Link();
  // ... other fields
  link.show_filters_icon = mapLink.show_filters_icon; // ✅ Added
  return link;
}
```

### 2. Remove Model Default Values

**Before** (default value overrides server data):
```typescript
// Link & MapLink models
show_filters_icon: boolean = true;
```

**After** (purely from server):
```typescript
show_filters_icon: boolean;
```

### 3. Ensure Bidirectional Conversion

- `LinkToMapLinkConverter`: ✅ Has `mapLink.show_filters_icon = link.show_filters_icon`
- `MapLinkToLinkConverter`: ✅ Now also has conversion

## Key Learnings

### Converter Completeness Check

When adding new fields to models, **must** check all related converters:

1. **Forward conversion**: Domain Model → Data Transfer Object (DTO)
2. **Reverse conversion**: DTO → Domain Model
3. **Intermediate conversions**: MapLink ↔ Link

Any omission causes data loss.

### Pure Signals in Zoneless

Following `docs/framework/angular-21/zoneless-guide.md` Pattern 4:

```typescript
// ✅ Correct: Direct signal.set()
readonly showFiltersIcon = signal<boolean>(true);

ngOnInit() {
  const link = this.link();
  if (link) {
    this.showFiltersIcon.set(link.show_filters_icon);
    // ✅ No ChangeDetectorRef.markForCheck() needed
  }
}
```

### Debugging Data Loss

When suspecting data loss, check in this order:

1. **Data source**: Original value from server/database
2. **First conversion**: DTO → Domain Model
3. **Storage layer**: Value in DataSource
4. **Second conversion**: MapLink → Link (if applicable)
5. **UI component**: Value received by component input

Add logging or use Console verification at each stage.

## Related Files

- `src/app/models/link.ts` - Link model
- `src/app/cartography/models/map/map-link.ts` - MapLink model
- `src/app/cartography/converters/map/link-to-map-link-converter.ts` - Forward conversion
- `src/app/cartography/converters/map/map-link-to-link-converter.ts` - Reverse conversion (fixed)
- `src/app/components/project-map/context-menu/actions/toggle-show-filters-icon-action/` - UI component

## Verification

After fix, verify:

1. Server returns `show_filters_icon: false`
2. Load topology
3. Right-click link → should show "Show filter icons"
4. Click to toggle → should show "Hide filter icons"
