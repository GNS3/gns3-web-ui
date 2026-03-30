# Map Backgrounds Guide

**Last Updated**: 2026-03-30
**Status**: ✅ Active

---

## Overview

GNS3 project map supports 9 background presets that define the visual appearance of the topology canvas.

### Available Presets

| Category | Key | Visual Style | Example Colors |
|----------|-----|--------------|----------------|
| Auto | `auto` | Follows global theme | Light: #FAFAFA, Dark: #424242 |
| Light | `light-1` | Cyan Sky radial gradient | #B2EBF2 → #E0F7FA |
| Light | `light-2` | Blue Sky radial gradient | #BBDEFB → #E3F2FD |
| Light | `light-3` | Cloud Gray radial gradient | #F5F5F5 → #FAFAFA |
| Light | `light-4` | Lavender radial gradient | #E1BEE7 → #F3E5F5 |
| Dark | `dark-1` | Deep Cyan linear gradient | #006064 → #00838F |
| Dark | `dark-2` | Deep Blue linear gradient | #1565C0 → #1976D2 |
| Dark | `dark-3` | Charcoal linear gradient | #424242 → #616161 |
| Dark | `dark-4` | Deep Purple linear gradient | #4A148C → #6A1B9A |

---

## Architecture

### Data Flow

```
┌─────────────────┐
│  User Action    │
│ (Settings Page) │
└────────┬────────┘
         │ saves to
         ▼
┌─────────────────┐
│  localStorage   │
│  key: mapTheme  │
└────────┬────────┘
         │ reads on init
         ▼
┌─────────────────┐
│  ThemeService   │
│  .savedMapTheme │
└────────┬────────┘
         │ computed signal tracks
         ▼
┌─────────────────┐
│  Component      │
│  .mapBgClass()  │
└────────┬────────┘
         │ [ngClass] binding
         ▼
┌─────────────────┐
│  DOM Element    │
│  .project-map   │
└────────┬────────┘
         │ CSS class activates
         ▼
┌─────────────────┐
│  CSS Variable   │
│  --gns3-map-bg  │
└─────────────────┘
```

### CSS Variable Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│  :root CSS Variables (_map.scss)                               │
├─────────────────────────────────────────────────────────────────┤
│  --gns3-map-bg-light-1: radial-gradient(...)                   │
│  --gns3-map-bg-dark-1: linear-gradient(...)                    │
│  ... (9 preset definitions)                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ class activates variable
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  .gns3-map-bg-light-1 {                                        │
│    --gns3-map-bg: var(--gns3-map-bg-light-1);                 │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ variable is set
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  .project-map {                                                 │
│    background: var(--gns3-map-bg, var(--mat-sys-surface));     │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setting Background

### Reactive Pattern

The map background uses a **computed signal** that automatically reacts to theme changes:

```
ThemeService.savedMapTheme changes
         │
         ▼ triggers re-computation
mapBgClass computed() runs
         │
         ▼ returns { 'gns3-map-bg-xxx': true }
[ngClass] binding updates
         │
         ▼ adds/removes CSS class
DOM element updates
         │
         ▼ CSS variable resolves
Background renders
```

### Why Computed Signal?

| Approach | Pros | Cons |
|----------|------|------|
| **Computed Signal** ✅ | Auto-reacts to changes, no manual subscriptions, minimal code | Requires understanding of signals |
| Manual ngOnInit | Simple to understand | Doesn't update when theme changes |
| Event subscription | Explicit control | More code, requires cleanup |

### Class Binding: `[ngClass]` vs `[class]`

```
[ngClass]="mapBgClass()"     ✅ Correct: Adds/removes classes without affecting existing ones
[class]="mapBgClass()"       ❌ Wrong: Replaces ALL classes, breaks .project-map styling
```

**Why it matters:**
- `[class]` replaces the entire `class` attribute
- `.project-map` class would be lost
- `background: var(--gns3-map-bg)` wouldn't apply
- Result: No background rendered

---

## Exporting Screenshots

### The Challenge

SVG elements don't inherit parent backgrounds. When exporting:

```
┌─────────────────────────────────────┐
│  .project-map                       │
│  ┌───────────────────────────────┐  │
│  │  <svg id="map">               │  │
│  │    <!-- No background here --> │  │
│  │  </svg>                       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↓ Export
         ↓ SVG has no background
         ↓ Result: Transparent/White
```

### Solution: Background Transfer Process

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Clone SVG                                                   │
│     originalSvg.cloneNode(true)                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Resolve Background from .project-map                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  Auto Mode      │    │  Named Preset   │                   │
│  │  Check:         │    │  Check:         │                   │
│  │  inline style   │    │  computed style │                   │
│  │  --gns3-map-bg  │    │  .background    │                   │
│  └─────────────────┘    └─────────────────┘                   │
│         │                        │                              │
│         ▼                        ▼                              │
│  Resolve via           getComputedStyle().background            │
│  ThemeService                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Apply to SVG Clone                                          │
│     svgClone.style.background = resolvedValue                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Process Embedded Images (Node Symbols)                      │
├─────────────────────────────────────────────────────────────────┤
│  For each <image> element in SVG:                               │
│    • Fetch blob URL or server-hosted symbol                     │
│    • Parse SVG content                                           │
│    • Inline into exported SVG                                    │
│    • Replace <image> with <svg>                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Export                                                      │
│     • PNG: save-svg-as-png library                              │
│     • SVG: XMLSerializer + Blob download                        │
└─────────────────────────────────────────────────────────────────┘
```

### Auto Mode Special Case

Auto mode uses `style.setProperty()` to set the CSS variable inline:

```
.gns3-map-bg-auto element
         │
         ▼ inline style
style="--gns3-map-bg: var(--gns3-map-bg-dark)"
         │
         ▼ getComputedStyle() can't resolve
Need ThemeService to determine current theme
         │
         ▼ returns actual color
'#424242' or '#FAFAFA'
```

**Why it matters:** `getComputedStyle()` returns `"var(--gns3-map-bg-dark)"` as a string, not the resolved color. The export logic needs to resolve this to the actual hex value.

---

## Common Pitfalls

### 1. Using `[class]` Instead of `[ngClass]`

```
❌ <div [class]="mapBgClass()">
   Result: .project-map class lost, no background

✅ <div [ngClass]="mapBgClass()">
   Result: Background works correctly
```

### 2. Direct localStorage Access

```
❌ const theme = localStorage.getItem('mapTheme');
   Problem: No reactivity, duplicates ThemeService logic

✅ const theme = this.themeService.savedMapTheme;
   Benefit: Reactive, centralized, type-safe
```

### 3. Forgetting Embedded Images in SVG Export

```
❌ Export SVG without processing <image> elements
   Result: Node icons missing in exported file

✅ Process and inline all embedded images
   Result: Complete topology export
```

### 4. Using Signal Instead of Computed

```
❌ mapBgClass = signal('')
   ngOnInit() { this.mapBgClass.set(...) }
   Problem: Doesn't update when theme changes

✅ mapBgClass = computed(() => ({ ... }))
   Benefit: Auto-updates, no manual subscriptions
```

---

## Related Documentation

- **[Material 3 Variables](./02-material3-variables.md)** - CSS variable system reference
- **[Zoneless Guide](../../framework/angular-21/zoneless-guide.md)** - Reactive patterns in Angular 21
- **[Dialog Style Isolation](../dialog-style-isolation.md)** - CSS scoping patterns

---

**Last Updated**: 2026-03-30
