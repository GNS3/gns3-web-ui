<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Hardcoded Colors Inventory

**Last Updated**: 2026-03-31
**Status**: 🚧 Active - Refactoring in Progress

---

## Overview

This document tracks all hardcoded colors in TypeScript files that violate the [CSS Coding Standards](../css/02-material3-variables.md). Colors should be defined in SCSS files using CSS variables, not hardcoded in TS.

**Rule**: No hardcoded colors in `.ts` files. Use CSS variables (`--mat-sys-*`, `--gns3-*`) or SCSS constants.

---

## Priority 1: Canvas Elements ✅ Completed

### 1.1 ThemeService - Canvas Colors ✅ Completed

**File**: `src/app/services/theme.service.ts`

| Method | Line | Hardcoded Colors | Status |
|--------|------|------------------|--------|
| `getActualMapTheme()` | 200-218 | Fixed to detect preset types correctly | ✅ Completed |
| `getCanvasLabelColor()` | 355 | `#FFFFFF`, `#000000` | ⚠️ Deprecated - No longer used |
| `getCanvasLinkColor()` | 364 | `#FFFFFF`, `#000000` | ⚠️ Deprecated - No longer used |

**Changes**:
- ✅ Fixed `getActualMapTheme()` to correctly identify light/dark presets from `availableMapBackgrounds`
- ✅ Methods still exist but are no longer called by widgets
- ✅ CSS variables now control colors via `_map.scss`

**Note**: Methods can be removed in future cleanup.

---

### 1.2 LabelWidget - Node Labels ✅ Completed

**File**: `src/app/cartography/widgets/label.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 69-75 | `removeInlineFillColor()` | Removes inline fill to let CSS work | ✅ Completed |

**Changes**:
- ✅ Removed `ThemeService` injection
- ✅ Changed from `applyThemeLabelColor()` (set color) to `removeInlineFillColor()` (remove color)
- ✅ CSS now controls label color: `svg#map text.label { fill: var(--gns3-canvas-label-color); }`

---

### 1.3 EthernetLinkWidget - Ethernet Links ✅ Completed

**File**: `src/app/cartography/widgets/links/ethernet-link.ts`

**Approach**:
- Check if link has custom color in `link_style.color`
- If custom color exists → Use SVG attribute with custom color
- If no custom color → Use CSS variable via SVG attribute
- Hover state always uses error color (overrides everything)

**Behavior Flow**:
```
Link Rendering
     │
     ▼
Check: link has custom color?
     │
     ├─ Yes → SVG attribute: stroke="#custom_color"
     │          Hover: stroke="var(--mat-sys-error)"
     │
     └─ No  → SVG attribute: stroke="var(--gns3-canvas-link-color)"
              Hover: stroke="var(--mat-sys-error)"
```

**Result**:
- Custom colors preserved ✅
- Default colors use CSS variables ✅
- Hover works for all links ✅

---

### 1.4 ProjectMapComponent - Auto Mode Fix ✅ Completed

**File**: `src/app/components/project-map/project-map.component.ts`

| Issue | Status |
|-------|--------|
| Auto mode always used light background | ✅ Fixed |

**Changes**:
- ✅ Auto mode now uses `.gns3-map-bg-light` or `.gns3-map-bg-dark` based on global theme
- ✅ Fixed contrast issue: dark theme + auto canvas now has dark background with white text/links

---

### 1.5 CSS Implementation ✅ Completed

**File**: `src/styles/_map.scss`

**CSS Variables**:
```
.project-map--light-bg
  └─ --gns3-canvas-label-color: #000000
  └─ --gns3-canvas-link-color: #000000

.project-map--dark-bg
  └─ --gns3-canvas-label-color: #FFFFFF
  └─ --gns3-canvas-link-color: #FFFFFF
```

**Selectors**:
- `svg#map text.label` → Uses `fill: var(--gns3-canvas-label-color)`
- `svg#map path.ethernet_link:hover` → Uses `stroke: var(--mat-sys-error)`

**Design Decision**:
- No default CSS `stroke` for ethernet links (allows SVG attributes to work)
- D3.js conditionally sets SVG attribute or CSS variable
- Hover in CSS with high priority to override all states

**Behavior Matrix**:
| Canvas | Link Custom Color | Display Color | Hover Color |
|--------|-------------------|---------------|-------------|
| Light | No | Black (CSS var) | Red |
| Light | Yes | Custom color | Red |
| Dark | No | White (CSS var) | Red |
| Dark | Yes | Custom color | Red |

---

### 1.6 Grid Colors ✅ Completed

**File**: `src/styles/_map.scss`, `src/app/cartography/components/d3-map/d3-map.component.html`

**Problem**:
Grid line colors were hardcoded in SVG template:
- Drawing grid: `stroke="silver"` (#C0C0C0)
- Node grid: `stroke="DarkSlateGray"` (#2F4F4F)

These colors may not be visible on dark backgrounds.

**Solution**:
Added CSS variables in `.project-map`:

```scss
.project-map {
  &--light-bg {
    --gns3-grid-drawing-color: #C0C0C0;
    --gns3-grid-node-color: #2F4F4F;
  }

  &--dark-bg {
    --gns3-grid-drawing-color: #888888;
    --gns3-grid-node-color: #B0B0B0;
  }
}
```

Template now uses CSS variables:
```html
[attr.stroke]="'var(--gns3-grid-drawing-color)'"
[attr.stroke]="'var(--gns3-grid-node-color)'"
```

---

### 1.7 Screenshot Export Fix ✅ Completed

**File**: `src/app/components/project-map/project-map-menu/project-map-menu.component.ts`

**Problem**:
When exporting screenshots (PNG/SVG), CSS variables like `var(--gns3-canvas-link-color)` were not resolved because:
- SVG was cloned without parent element context
- CSS variables defined on `.project-map` don't cascade into cloned SVG
- CSS property `fill: var(--...)` in stylesheet overrides SVG attribute `fill="..."`

**Solution**:
Use `getComputedStyle` to resolve CSS custom properties, then apply as inline CSS (not SVG attribute):

```
Screenshot Export
       │
       ▼
Clone SVG element (preserves CSS rules with var(--...))
       │
       ▼
getComputedStyle(.project-map).getPropertyValue()
├─ --gns3-canvas-label-color → #FFFFFF or #000000
├─ --gns3-canvas-link-color  → #FFFFFF or #000000
└─ --gns3-map-bg            → gradient or color
       │
       ▼
Apply resolved colors as inline CSS (style.setProperty)
├─ text.label    → style.setProperty('fill', resolvedColor)
├─ path.ethernet_link → style.setProperty('stroke', resolvedColor)
└─ SVG style.background → inline style
       │
       ▼
Inline CSS overrides stylesheet rules ✅
Export PNG/SVG with correct colors ✅
```

**Key Insight**:
- SVG attribute `fill="..."` has lower priority than CSS property `fill: ...`
- Must use `element.style.setProperty('fill', value)` to override CSS rules
- D3.js uses `attr()` which sets SVG attribute, not inline style
- Custom colors: `attr('stroke', '#FF0000')` → preserved
- Default colors: `attr('stroke', 'var(--...)')` → resolved and applied
- Colors still defined via CSS variables in `_map.scss` ✅
- Screenshot code only resolves and re-applies, doesn't hardcode ✅

---

## Priority 2: Cartography Widgets (Pending)

### 2.1 NodeWidget - Layer Labels

**File**: `src/app/cartography/widgets/node.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 92 | `.attr('fill', '#ffffff')` | Layer label color hardcoded | ⏳ Pending |

---

### 2.2 DrawingWidget

**File**: `src/app/cartography/widgets/drawing.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 85 | `.attr('fill', '#ffffff')` | Drawing element color | ⏳ Pending |

---

### 2.3 DrawingLineWidget

**File**: `src/app/cartography/widgets/drawing-line.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 77 | `.attr('stroke', '#000')` | Line color hardcoded | ⏳ Pending |

---

### 2.4 InterfaceStatusWidget

**File**: `src/app/cartography/widgets/interface-status.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 21 | `LABEL_BACKGROUND_COLOR = '#E2E8FF'` | Constant color | ⏳ Pending |
| 121 | `.attr('fill', '#111111')` | Status indicator color | ⏳ Pending |
| 144 | `.attr('fill', '#2ecc71')` | Success color | ⏳ Pending |
| 181 | `.attr('fill', '#FFFF00')` | Warning color | ⏳ Pending |
| 199 | `return '#2ecc71'` | Success color return | ⏳ Pending |
| 204 | `return '#FFFF00'` | Warning color return | ⏳ Pending |
| 264 | `.attr('fill', '#111111')` | Status indicator color | ⏳ Pending |

---

### 2.5 SerialLinkWidget

**File**: `src/app/cartography/widgets/links/serial-link.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 29 | `color: '#800000'` | Default serial link color | ⏳ Pending |

**Note**: Serial links intentionally use different color (red) to distinguish from ethernet links. Should still use CSS variable.

---

## Priority 3: Element Factories (Pending)

### 3.1 TextElementFactory

**File**: `src/app/cartography/helpers/drawings-factory/text-element-factory.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 12 | `textElement.fill = '#000000'` | Default text color | ⏳ Pending |

---

### 3.2 RectangleElementFactory

**File**: `src/app/cartography/helpers/drawings-factory/rectangle-element-factory.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 10 | `rectElement.fill = '#ffffff'` | Default fill | ⏳ Pending |
| 12 | `rectElement.stroke = '#000000'` | Default stroke | ⏳ Pending |

---

### 3.3 LineElementFactory

**File**: `src/app/cartography/helpers/drawings-factory/line-element-factory.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 10 | `lineElement.stroke = '#000000'` | Default stroke | ⏳ Pending |

---

### 3.4 EllipseElementFactory

**File**: `src/app/cartography/helpers/drawings-factory/ellipse-element-factory.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 10 | `ellipseElement.fill = '#ffffff'` | Default fill | ⏳ Pending |
| 12 | `ellipseElement.stroke = '#000000'` | Default stroke | ⏳ Pending |

---

## Priority 4: UI Components (Pending)

### 4.1 TextEditorComponent

**File**: `src/app/cartography/components/text-editor/text-editor.component.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 184 | `: '#000000'` | Text color fallback | ⏳ Pending |
| 284 | `this.renderer.setStyle(..., 'color', '#000000')` | Text color set | ⏳ Pending |

---

### 4.2 ToolCallDisplayComponent (AI Chat)

**File**: `src/app/components/project-map/ai-chat/tool-call-display.component.ts`

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 44 | `border-left: 3px solid #0ea5e9` | Border color | ⏳ Pending |
| 54 | `border-color: #0ea5e9` | Border color | ⏳ Pending |
| 63 | `color: #0ea5e9` | Text color | ⏳ Pending |

---

## Acceptable Exceptions

### ThemeService Configuration Data

**File**: `src/app/services/theme.service.ts`

The following are **acceptable** as they are configuration data, not styling logic:

- `availableThemes[].primaryColor` - Theme metadata for UI display
- `availableMapBackgrounds[].background` - Gradient definitions
- `availableMapBackgrounds[].textColor` - Metadata for settings UI

**Reason**: These are data structures that define available options, not direct styling of DOM elements.

---

## Test Files

All `.spec.ts` files are excluded from this inventory as test data with hardcoded colors is acceptable.

---

## Refactoring Strategy

### ✅ Phase 1: Canvas Colors (Completed)

**Timeline**: 2026-03-31

**Workflow**:
```
┌─────────────────────────────────────────────────────────────┐
│ 1. Fix ThemeService.getActualMapTheme()                     │
│    └─ Detect preset types from availableMapBackgrounds    │
├─────────────────────────────────────────────────────────────┤
│ 2. Add CSS variables to _map.scss                          │
│    ├─ Define --gns3-canvas-label-color                    │
│    ├─ Define --gns3-canvas-link-color                      │
│    └─ Add light/dark bg classes                            │
├─────────────────────────────────────────────────────────────┤
│ 3. Update ProjectMapComponent                               │
│    ├─ Auto mode uses light/dark class (not auto class)      │
│    └─ Add project-map--light-bg/--dark-bg classes          │
├─────────────────────────────────────────────────────────────┤
│ 4. Update LabelWidget                                       │
│    └─ Remove inline fill colors (let CSS work)             │
├─────────────────────────────────────────────────────────────┤
│ 5. Update EthernetLinkWidget                                │
│    ├─ Remove ThemeService dependency                        │
│    ├─ Conditional logic: custom → SVG attr, default → CSS   │
│    └─ Fix CSS priority conflict                             │
└─────────────────────────────────────────────────────────────┘
```

**Result**:
- Canvas element colors fully controlled by CSS ✅
- No hardcoded colors in TS for labels and ethernet links ✅
- Auto mode correctly follows global theme ✅
- Custom link colors preserved ✅
- Hover state works for all elements ✅

**Future Cleanup**:
- Remove deprecated `getCanvasLabelColor()` and `getCanvasLinkColor()` methods
- Remove `--gns3-map-bg-auto` CSS variable (no longer used)

---

### 1.6 CSS Priority Issue - Fixed ✅ Completed

**The Problem**:

CSS Priority Conflict between global and component styles:

```
Global Style (_map.scss)
├─ Selector: svg#map path.ethernet_link
├─ Priority: 112 (ID + 2 elements)
└─ Rule: stroke = CSS variable

Component Style (project-map.component.scss)
├─ Selector: path.ethernet_link:hover
├─ Priority: 21 (element + class + pseudo-class)
└─ Rule: stroke = error color

Result: 112 > 21, global style overrides hover ❌
```

**The Solution**:

```
Before Fix:
├─ CSS sets stroke for all links
├─ Hover state overridden
└─ Custom colors don't work

After Fix:
├─ No default CSS stroke
├─ D3.js conditionally sets SVG attribute:
│   ├─ Custom color → SVG attr = custom
│   └─ No custom → SVG attr = CSS variable
├─ CSS hover state with high priority
└─ All states work correctly ✅
```

**Key Insight**:
Related styles should be co-located to avoid priority conflicts. Even without `::ng-deep` or `!important`, CSS priority issues can occur when styles are scattered across multiple files.

---

### Phase 2-N: Subsequent Refactors (Pending)

Each priority level will be addressed in separate PRs following the same pattern:
1. Define CSS variables/classes in SCSS
2. Update TS to use CSS instead of hardcoded values
3. Test and verify

---

## Related Documentation

- [Material 3 Variables](./02-material3-variables.md) - CSS variable reference
- [Map Backgrounds](./map-backgrounds.md) - Canvas background implementation
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards

---

**Last Updated**: 2026-03-31

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
