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

| Line | Code | Issue | Status |
|------|------|-------|--------|
| 30 | `color: '#000000'` | Default color kept as fallback | ✅ Completed |

**Changes**:
- ✅ Removed `ThemeService` injection
- ✅ Removed dynamic color logic
- ✅ CSS now controls link color: `svg#map path.ethernet_link { stroke: var(--gns3-canvas-link-color); }`
- ✅ Links with custom colors keep their custom color, others use CSS variable

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

```scss
.project-map {
  --gns3-canvas-label-color: #000000;
  --gns3-canvas-link-color: #000000;

  &--light-bg {
    --gns3-canvas-label-color: #000000;
    --gns3-canvas-link-color: #000000;
  }

  &--dark-bg {
    --gns3-canvas-label-color: #FFFFFF;
    --gns3-canvas-link-color: #FFFFFF;
  }
}

svg#map text.label {
  fill: var(--gns3-canvas-label-color);
}

svg#map path.ethernet_link {
  stroke: var(--gns3-canvas-link-color);
}
```

**Behavior**:
- Light canvas backgrounds → Black labels and links
- Dark canvas backgrounds → White labels and links
- Auto mode → Follows global theme (light/dark)

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

**Status**: ✅ Completed (2026-03-31)

1. ✅ Fixed `ThemeService.getActualMapTheme()` - Detect light/dark presets correctly
2. ✅ Added CSS variables to `_map.scss` for canvas elements
3. ✅ Updated `ProjectMapComponent` to add light/dark bg classes
4. ✅ Updated `LabelWidget` to remove inline fill colors
5. ✅ Updated `EthernetLinkWidget` to use CSS variables
6. ✅ Fixed auto mode to use light/dark classes instead of auto class

**Result**:
- Canvas element colors now fully controlled by CSS
- No hardcoded colors in TS for labels and ethernet links
- Auto mode correctly follows global theme

**Future Cleanup**:
- Remove deprecated `getCanvasLabelColor()` and `getCanvasLinkColor()` methods
- Remove `--gns3-map-bg-auto` CSS variable (no longer used)

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
