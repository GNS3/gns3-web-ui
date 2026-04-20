# Compute Selector - Implementation Guide

  > AI-assisted documentation. [See disclaimer](../../README.md). 



> **Technical Implementation Details and Architecture**

**Version**: 3.1.0-dev.1
**Last Updated**: 2026-04-18
**Component**: `ComputeSelectorComponent`
**Parent**: `TemplateComponent`

---

## License

<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

---

## Architecture Overview

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    TemplateComponent                         │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Template Panel  │  │  Project Map     │                 │
│  │  (Node List)     │  │  (Drop Target)   │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                             │
│           │    Drag & Drop      │                             │
│           ├─────────────────────┤                             │
│           │                     │                             │
│           ▼                     ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │  Selector Backdrop (full-screen overlay) │                │
│  │  ┌─────────────────────────────────┐    │                │
│  │  │  Ghost Icon (at drop position)  │    │                │
│  │  └─────────────────────────────────┘    │                │
│  │  ┌─────────────────────────────────┐    │                │
│  │  │   ComputeSelectorComponent      │    │                │
│  │  │  ┌─────────────────────────┐    │    │                │
│  │  │  │  Compute List (@for)    │    │    │                │
│  │  │  │  • Local (controller)   │    │    │                │
│  │  │  │  • Remote Compute 1     │    │    │                │
│  │  │  └─────────────────────────┘    │    │                │
│  │  │  ┌─────────────────────────┐    │    │                │
│  │  │  │  Resource Info (text)   │    │    │                │
│  │  │  │  • CPU: 35% / 4c       │    │    │                │
│  │  │  │  • MEM: 8.2/16 GB      │    │    │                │
│  │  │  │  • DISK: 45%           │    │    │                │
│  │  │  └─────────────────────────┘    │    │                │
│  │  │  ┌─────────────────────────┐    │    │                │
│  │  │  │  Smart Positioning      │    │    │                │
│  │  │  │  • Edge detection       │    │    │                │
│  │  │  │  • ResizeObserver       │    │    │                │
│  │  │  └─────────────────────────┘    │    │                │
│  │  └─────────────────────────────────┘    │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. TemplateComponent Integration

#### Drag Event Flow

```
User Action          Component           State              Visual
─────────────────    ──────────────     ──────────────     ──────────────
Drag Start      →   TemplateComponent → isDragging=true   →   Drag cursor
                        │                                   appearing
                        ├→ Capture mouse offset via window.event
                        ├→ Add document-level mousemove listener
                        └→ Track lastPageX / lastPageY

Drag Move       →   TemplateComponent → Update position   →   (No ghost icon
                        │                                   during drag)
                        └→ Update lastPageX / lastPageY
                            via document mousemove listener

Drop End       →    TemplateComponent → Check computes    →   If single:
                        │                                   create node
                        ├→ Convert screen → world coords   →   If multiple:
                        ├→ Use cached computes (or HTTP)       show selector
                        └→ processNodeCreation()
                            ├→ 1 compute: emit directly
                            └→ N computes: show backdrop + selector
                                ├→ Show ghost icon at drop position
                                ├→ Show compute selector near cursor
                                └→ Sort computes (local first)
```

#### Ghost Icon Implementation

The ghost icon appears **after the drop** when multiple computes are available, positioned inside the selector backdrop overlay.

**Positioning Strategy**:
- Icon appears at the **ghost icon screen position** derived from the drop coordinates
- Shown only when the compute selector backdrop is visible
- Displayed alongside the compute selector, not during the drag itself

**Visual Properties**:
- Shows the template's icon image (`pendingTemplate()`)
- Positioned using `ghostIconScreenPosition()` signal
- Inside a full-screen backdrop overlay (`.template__selector-backdrop`)

**Lifecycle Management**:
1. **Creation**: When `showComputeSelector` is set to `true` after a drop with multiple computes
2. **Cleanup**: Removed when `clearPendingState()` is called (on compute selection or backdrop click)

**Backdrop Overlay**:
- Full-screen invisible overlay (`.template__selector-backdrop`)
- Click handler calls `onComputeSelectorCancelled()` to dismiss the selector
- Contains both the ghost icon and the compute selector component

---

### 2. ComputeSelectorComponent

#### Signal-Based State Management

The component uses Angular Signals for reactive state management:

```
Input Signals (required)
    │
    ├── x (required)              → Mouse X screen coordinate
    ├── y (required)              → Mouse Y screen coordinate
    └── computes (required)       → List of available compute nodes (pre-sorted)
                                   │
                                   ▼
                            Writable Signals (internal)
                                   │
                                   ├── actualWidth (default 200)
                                   │    └── Measured panel width via ResizeObserver
                                   │
                                   └── actualHeight (default 120)
                                        └── Measured panel height via ResizeObserver
                                   │
                                   ▼
                            Computed Signals
                                   │
                                   ├── selectorX
                                   │    └── Edge-adjusted X coordinate
                                   │
                                   └── selectorY
                                        └── Edge-adjusted Y coordinate
```

**Output**:
- `computeSelected: EventEmitter<string>` — Emits the selected `compute_id`

**State Flow Diagram**:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Inputs    │ ──→ │  Computed    │ ──→ │   Render    │
│ (x, y,      │      │  (selectorX, │      │   (View)    │
│  computes)  │      │   selectorY) │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
                            ▲
                            │
                    ┌──────────────┐
                    │ ResizeObserver│
                    │  (updates    │
                    │  actualWidth/ │
                    │  actualHeight)│
                    └──────────────┘
```

#### ResizeObserver Integration

**Purpose**: Track real-time panel dimensions for accurate positioning

**Implementation Strategy**:

```
Constructor
    │
    └─→ Create ResizeObserver
         └─ Callback: update actualWidth/actualHeight → cd.markForCheck()
              │
              ▼
ngAfterViewInit
    ├─→ Measure initial dimensions (getBoundingClientRect)
    ├─→ Update actualWidth/actualHeight signals
    ├─→ Start observing panel element
    └─→ Auto-focus container (setTimeout)

ResizeObserver Callback (on content change)
    ├─→ Extract width/height from entry.contentRect
    ├─→ Update actualWidth/actualHeight signals
    └─→ cd.markForCheck()
         └─→ Triggers selectorX/selectorY recomputation

ngOnDestroy
    └─→ ResizeObserver.disconnect()
```

**Benefits**:
- **Passive Observation**: No layout thrashing or performance overhead
- **Accurate Dimensions**: Actual rendered size, not estimated
- **Automatic Updates**: Panel adapts to content changes
- **Browser Support**: Modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+)

#### Smart Positioning Algorithm

**Edge Detection Logic**:

The algorithm uses a `MARGIN` of **10px** and checks **right and bottom edges only**. For the default case, the selector is placed at `mouse + MARGIN`.

```
┌──────────────────────────────────────────────────────────┐
│           Screen Boundary Edge Detection                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Screen                                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │                                                │     │
│  │   Default: selector at (mouseX + 10, mouseY + 10)   │
│  │                                                │     │
│  │       mouse_cursor ──→ ┌──────────────┐       │     │
│  │                        │   Selector   │       │     │
│  │                        │              │       │     │
│  │                        └──────────────┘       │     │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Edge Scenarios (MARGIN = 10):                          │
│  ─────────────────────                                   │
│  1. Right Edge:  mouseX + width + MARGIN > screenWidth  │
│     → Reposition: mouseX - width - MARGIN               │
│     (selector flips to left side of cursor)              │
│                                                          │
│  2. Bottom Edge: mouseY + height + MARGIN > screenHeight│
│     → Reposition: mouseY - height - MARGIN              │
│     (selector flips above cursor)                        │
│                                                          │
│  Note: No explicit left/top edge checks.                │
│  The default position (mouseX + MARGIN) inherently      │
│  avoids left/top clipping since mouse is already        │
│  within the viewport.                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Position Calculation Flow**:

```
Input Position (mouse cursor location)
            │
            ▼
   ┌─────────────────┐
   │ Default:        │
   │ x = mouseX + 10 │
   │ y = mouseY + 10 │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Right     │──→ Overflow? ──→ x = mouseX - width - 10
   │ Edge            │                   (flip left)
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Bottom    │──→ Overflow? ──→ y = mouseY - height - 10
   │ Edge            │                   (flip up)
   └────────┬────────┘
            │
            ▼
   Final Position
```

---

## Resource Usage Display

### Text-Based Resource Info

Resources are displayed as **inline text values** with color-coded CSS classes. There are no progress bar elements. Each compute item is rendered as an Angular Material `mat-button` for consistent click handling and ripple effects. Odd-indexed rows (1, 3, 5...) receive a darker background via the `compute-selector__item--even` CSS class for zebra striping readability.

**Layout**:

```
┌──────────────────────────────────────────────────┐
│  Compute Name (host:port)         [Status Icon]  │
├──────────────────────────────────────────────────┤
│  CPU: 35% / 4c   MEM: 8.2/16 GB   DISK: 45%    │
└──────────────────────────────────────────────────┘
```

**Rendered Output Examples**:

```
┌───────────────────────────────────────────────────┐
│  Local (controller)                    ✓ (green)  │
│  CPU: 35% / 4c   MEM: 5.2/16 GB   DISK: 45%     │
├───────────────────────────────────────────────────┤
│  Remote Server (192.168.1.10:3080)    ✗ (red)    │
│  CPU: 90% / 8c   MEM: 12.5/32 GB   DISK: 88%    │
└───────────────────────────────────────────────────┘
```

### Color Coding System

**Threshold-Based CSS Classes**:

```
Resource Usage Levels
    │
    ├── Low (0-60%)      → compute-selector__usage--low
    │                    └─ CSS: var(--mat-sys-primary)
    │
    ├── Medium (60-85%)  → compute-selector__usage--medium
    │                    └─ CSS: var(--mat-sys-tertiary)
    │
    └── High (85-100%)   → compute-selector__usage--high
                         └─ CSS: var(--mat-sys-error)
```

**Implementation** (`getUsageColorClass()`):
1. Determine usage percentage from `cpu_usage_percent`, `memory_usage_percent`, or `disk_usage_percent`
2. Select CSS class:
   - Below 60%: `compute-selector__usage--low`
   - 60-85%: `compute-selector__usage--medium`
   - Above 85%: `compute-selector__usage--high`
3. Apply class to the text `<span>` element (not a progress bar)

### Resource Metrics Display

**Displayed Information**:

1. **CPU Usage** (`getCpuInfo()`)
   - Format: `{usage_percent}% / {cpu_count}c`
   - Example: `35% / 4c`
   - CPU count sourced from `capabilities.cpus` (nested field)
   - Color-coded by usage threshold

2. **Memory Usage** (`getMemoryInfo()`)
   - Format: `{used_GB}/{total_GB} GB`
   - Total memory sourced from `capabilities.memory` (bytes), converted to GB
   - Used memory calculated as `totalGB * usagePercent / 100`
   - Example: `8.2/16 GB`
   - Color-coded by `memory_usage_percent` threshold

3. **Disk Usage** (`getDiskInfo()`)
   - Format: `{usage_percent}%`
   - Only shows percentage, no total capacity
   - Example: `45%`
   - Color-coded by usage threshold

### Connection Status

Each compute item shows a connection status icon:
- **Connected**: `check_circle` icon with `--mat-sys-primary` color
- **Disconnected**: `cancel` icon with `--mat-sys-error` color

### Display Name Format

**`getComputeDisplayName()`**:
- Local compute: `{name} (controller)` — e.g., `Local (controller)`
- Remote compute: `{name} ({host}:{port})` — e.g., `Remote Server (192.168.1.10:3080)`

---

## Performance Optimization

### 1. Compute List Sorting

**Sorting Location**: `TemplateComponent.processNodeCreation()` (not in ComputeSelectorComponent)

**Sorting Priority**:

```
Compute List Sorting Algorithm
    │
    ├── First Priority: compute_id === 'local'?
    │     ├── Yes → Place at top (return -1)
    │     └── No  → Continue to next priority
    │
    └── Second Priority: Alphabetical
          └── Sort by name via localeCompare (A-Z)
```

**Rationale**:
- **Performance**: Local compute typically has lowest latency
- **Convenience**: Most common use case prioritized
- **Discoverability**: Users see preferred option first
- **Consistency**: Predictable ordering reduces decision time

**Example**:

```
Before Sorting:          After Sorting:
─────────────────        ─────────────────
• Remote Server 2        • Local (controller)
• Remote Server 1  →     • Cloud Compute
• Local                  • Remote Server 1
• Cloud Compute          • Remote Server 2
```

### 2. Compute Caching

**Caching Strategy**: Computes are cached in `TemplateComponent` to avoid redundant HTTP requests.

```
Compute Data Flow
    │
    ├── Primary Path (no HTTP needed):
    │     ├─ On init: notificationService.getCachedComputes()
    │     │           if notificationService.hasCachedData()
    │     │
    │     └─ On WebSocket update: notificationService.computeCacheUpdated
    │           → cachedComputes.set(computes)
    │           → cd.markForCheck()
    │
    └── Fallback Path (cache empty):
          └─ computeService.getComputes() HTTP request
          └─ On success: notificationService.setInitialComputes()
               → triggers computeCacheUpdated subscription
               → cachedComputes.set(loadedComputes)
          └─ On error: emit NodeAddedEvent with controller='local'
```

### 3. Change Detection Strategy

**OnPush Strategy Benefits**:

```
Change Detection Flow
    │
    ├── Input Changes (x, y, computes)
    │     └── Signal-based → automatic propagation
    │
    ├── Internal State Changes
    │     ├── Writable signal updates (actualWidth/actualHeight)
    │     └── Computed recalculation (selectorX/selectorY)
    │
    └── ResizeObserver Callback
          └── Explicit cd.markForCheck()
```

**Performance Characteristics**:
- **Reduced Checks**: Only checks on input/signal changes
- **Signal Efficiency**: Computed values update reactively
- **Explicit Control**: ResizeObserver requires manual `markForCheck()`
- **Zoneless Compatible**: No Zone.js overhead

### 4. Drag Event Tracking

**`window.event` Workaround**: The `dragStart()` method uses `window.event as MouseEvent` because mwlDraggable's `DragStartEvent` doesn't contain mouse position data. Document-level `mousemove`/`mouseup` listeners track position during drag.

---

## Implementation Details

### Template Integration

The selector is embedded in the TemplateComponent template within a full-screen backdrop overlay. The backdrop is conditionally rendered when `showComputeSelector()` is true. It contains a ghost icon positioned at the screen-converted world coordinates (`ghostIconScreenPosition()`), and the `app-compute-selector` component which receives the sorted compute list and cursor position as inputs.

**Template Structure**:

```
┌─────────────────────────────────────────────────┐
│  @if (showComputeSelector())                    │
│  ┌───────────────────────────────────────────┐  │
│  │  .template__selector-backdrop (click →    │  │
│  │    onComputeSelectorCancelled)             │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  .template__ghost-icon              │  │  │
│  │  │  └─ <img> template icon             │  │  │
│  │  │     positioned at ghostIconScreen   │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  <app-compute-selector>             │  │  │
│  │  │  [computes] ← availableComputes()   │  │  │
│  │  │  [x] ← lastPageX()                 │  │  │
│  │  │  [y] ← lastPageY()                 │  │  │
│  │  │  (computeSelected) → onComputeSelect│  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Key Signals in TemplateComponent

| Signal | Visibility | Type | Purpose |
|--------|------------|------|---------|
| `showComputeSelector` | public | `signal<boolean>` | Controls selector visibility |
| `availableComputes` | public | `signal<Compute[]>` | Sorted compute list |
| `pendingNodePosition` | public | `signal<{x,y} \| null>` | World coordinates for node |
| `pendingTemplate` | public | `signal<Template \| null>` | Template being dropped |
| `ghostIconScreenPosition` | public | `computed<{x,y}>` | Converts world → screen coordinates for ghost icon |
| `lastPageX` / `lastPageY` | private | `signal<number>` | Mouse screen position |
| `cachedComputes` | private | `signal<Compute[]>` | Cached compute data |
| `isDragging` | private | `signal<boolean>` | Active drag tracking |

### Component File Structure

```
src/app/components/template/compute-selector/
├── compute-selector.component.ts      # Component logic
├── compute-selector.component.html    # Template
└── compute-selector.component.scss    # Styles (BEM naming)
```

---

## Testing

> **Status**: No test files currently exist. The following categories are planned.

### Planned Unit Test Categories

1. **Positioning Logic**
   - Right edge detection and flip
   - Bottom edge detection and flip
   - Default position (mouseX + MARGIN)
   - Boundary conditions

2. **Compute Sorting**
   - Local compute priority
   - Alphabetical ordering
   - Empty list handling

3. **Resource Color Mapping**
   - Usage level thresholds (60%, 85%)
   - CSS class selection for cpu/mem/disk
   - Edge case handling (0%, 100%)

4. **ResizeObserver Integration**
   - Dimension tracking accuracy
   - Signal updates on resize
   - Cleanup on destroy

5. **Display Name Formatting**
   - Local compute: `{name} (controller)`
   - Remote compute: `{name} ({host}:{port})`

---

## Known Issues and Limitations

### Current Limitations

1. **No Keyboard Navigation**
   - **Issue**: No keyboard event handlers for arrow keys, Enter, or Escape
   - **Current State**: Only `tabindex="0"` and auto-focus on mount
   - **Impact**: Selector cannot be navigated via keyboard
   - **Planned Fix**: Add keydown handlers for Escape, Arrow Up/Down, Enter

2. **No ARIA Attributes**
   - **Issue**: Missing ARIA labels, roles, and descriptions
   - **Current State**: Only basic HTML structure
   - **Impact**: Screen reader accessibility is limited
   - **Planned Fix**: Add `role`, `aria-label`, `aria-describedby` attributes

3. **No Left/Top Edge Checks**
   - **Issue**: Positioning only checks right and bottom edges
   - **Current State**: Default position is always `mouse + MARGIN`
   - **Impact**: Selector may clip if mouse is near left/top edge with a flipped selector
   - **Workaround**: Rare in practice since mouse is typically within viewport

4. **Small Screen Truncation**
   - **Issue**: Selector may be truncated on screens < 320px wide
   - **Cause**: `min-width: 200px` for content readability, `max-width: 400px` to prevent excessive width
   - **Impact**: Partial content hidden on very small screens
   - **Workaround**: Responsive design handles most cases

5. **Large Compute Lists**
   - **Issue**: Performance may degrade with many compute nodes
   - **Cause**: No virtual scrolling; full list rendered via `@for`
   - **Impact**: Slower rendering with very large compute counts
   - **Planned Fix**: Virtual scrolling for lists exceeding 20 items

6. **`window.event` Dependency**
   - **Issue**: `dragStart()` relies on `window.event` for mouse position
   - **Cause**: mwlDraggable's DragStartEvent doesn't include mouse coordinates
   - **Impact**: Browser compatibility concern (deprecated in some contexts)
   - **Workaround**: Currently functional in all target browsers

## Related Documentation

- [Material Design 3 Variables](../../guides/css/02-material3-variables.md) - CSS variable reference
