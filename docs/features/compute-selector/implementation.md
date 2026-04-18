# Compute Selector - Implementation Guide

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
│  │         Ghost Icon (Visual Feedback)     │                │
│  │         Positioned at drop target        │                │
│  └───────────────────┬─────────────────────┘                │
│                      │                                      │
│                      ▼                                      │
│  ┌─────────────────────────────────────────┐                │
│  │       ComputeSelectorComponent          │                │
│  │  ┌─────────────────────────────────┐    │                │
│  │  │    Compute List (Virtual)       │    │                │
│  │  │  • Local Compute (first)        │    │                │
│  │  │  • Remote Compute 1             │    │                │
│  │  │  • Remote Compute 2             │    │                │
│  │  └─────────────────────────────────┘    │                │
│  │  ┌─────────────────────────────────┐    │                │
│  │  │   Resource Usage Display        │    │                │
│  │  │   • CPU Usage (color-coded)     │    │                │
│  │  │   • Memory Usage                │    │                │
│  │  │   • Disk Usage                  │    │                │
│  │  └─────────────────────────────────┘    │                │
│  │  ┌─────────────────────────────────┐    │                │
│  │  │   Smart Positioning Logic       │    │                │
│  │  │   • Collision Detection         │    │                │
│  │  │   • ResizeObserver Tracking     │    │                │
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
Drag Start      →   TemplateComponent → draggedNode set   →   Drag cursor
                        │                                   appearing
                        ├→ Store node data
                        ├→ Set drag data transfer
                        └→ Show ghost icon
                            (at node position)

Drag Move      →   TemplateComponent → Update position   →   Ghost icon
                        │                                   follows mouse
                        └→ Calculate ghost position
                            (node-based, not mouse-based)

Drag End       →   TemplateComponent → Clear state       →   Ghost icon
                        │                                   disappears
                        ├→ Hide ghost icon
                        └→ Close compute selector
```

#### Ghost Icon Implementation

The ghost icon serves as visual feedback during drag operations. Key design decisions:

**Positioning Strategy**:
- Icon appears at the **node element's position**, not the mouse cursor
- Provides accurate visual representation of where the node will be created
- Eliminates visual disconnect between drag source and drop target

**Visual Properties**:
- Semi-transparent (50% opacity) to indicate temporary state
- Same dimensions as the actual node being dragged
- Centered on the drop target position
- Uses Material Design elevation shadows for depth

**Lifecycle Management**:
1. **Creation**: Triggered on `dragstart` event
2. **Position Update**: During `dragmove` event
3. **Cleanup**: Removed on `dragend` or drop completion

---

### 2. ComputeSelectorComponent

#### Signal-Based State Management

The component uses Angular Signals for reactive state management:

```
Input Signals
    │
    ├── position (required)     → Screen coordinates for placement
    ├── computes (required)     → List of available compute nodes (pre-sorted)
    └── isVisible               → Panel visibility state
                                   │
                                   ▼
                            Computed Signals
                                   │
                                   ├── selectorX
                                   │    └── Collision-detected X coordinate
                                   │
                                   ├── selectorY
                                   │    └── Collision-detected Y coordinate
                                   │
                                   ├── actualWidth
                                   │    └── Current rendered width
                                   │
                                   └── actualHeight
                                        └─ Current rendered height
```

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
                    │  (Dimension   │
                    │   Tracking)  │
                    └──────────────┘
```

#### ResizeObserver Integration

**Purpose**: Track real-time panel dimensions for accurate positioning

**Implementation Strategy**:

```
┌─────────────────────────────────────────────────────────┐
│                  ResizeObserver Setup                   │
├─────────────────────────────────────────────────────────┤
│  1. Create ResizeObserver instance on component init    │
│  2. Observe panel element for dimension changes         │
│  3. On resize event:                                    │
│     a. Extract new width/height from content rect       │
│     b. Update panelWidth/panelHeight signals            │
│     c. Trigger adjustedPosition recalculation           │
│     d. Mark for check (change detection)                │
│  4. Cleanup observer on component destroy               │
└─────────────────────────────────────────────────────────┘
```

**Benefits**:
- **Passive Observation**: No layout thrashing or performance overhead
- **Accurate Dimensions**: Actual rendered size, not estimated
- **Automatic Updates**: Panel adapts to content changes
- **Browser Support**: Modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+)

#### Smart Positioning Algorithm

**Collision Detection Logic**:

```
┌──────────────────────────────────────────────────────────┐
│           Screen Boundary Collision Detection            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Screen Canvas                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │  Padding Zone (16px from edges)                │     │
│  │  ┌──────────────────────────────────────────┐  │     │
│  │  │                                          │  │     │
│  │  │   Safe Zone                             │  │     │
│  │  │   (Selector can be positioned here)      │  │     │
│  │  │                                          │  │     │
│  │  │           ┌──────────────┐              │  │     │
│  │  │           │   Selector   │              │  │     │
│  │  │           │   (300px)    │              │  │     │
│  │  │           └──────────────┘              │  │     │
│  │  │                                          │  │     │
│  │  └──────────────────────────────────────────┘  │     │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Collision Scenarios:                                   │
│  ─────────────────────                                   │
│  1. Right Edge:  x + width > screenWidth - padding      │
│     → Reposition: x = screenWidth - width - padding     │
│                                                          │
│  2. Left Edge:   x < padding                            │
│     → Reposition: x = padding                           │
│                                                          │
│  3. Bottom Edge: y + height > screenHeight - padding    │
│     → Reposition: y = screenHeight - height - padding   │
│                                                          │
│  4. Top Edge:    y < padding                            │
│     → Reposition: y = padding                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Position Calculation Flow**:

```
Input Position (ghost icon location)
            │
            ▼
   ┌─────────────────┐
   │ Calculate       │
   │ Raw Position    │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Right     │──→ Collision? ──→ Adjust Left
   │ Edge Collision  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Left      │──→ Collision? ──→ Adjust Right
   │ Edge Collision  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Bottom    │──→ Collision? ──→ Adjust Up
   │ Edge Collision  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Check Top       │──→ Collision? ──→ Adjust Down
   │ Edge Collision  │
   └────────┬────────┘
            │
            ▼
   Final Adjusted Position
```

---

## Resource Usage Display

### Color Coding System

**Visual Hierarchy**:

```
Resource Usage Levels
    │
    ├── Low (0-60%)      → Low Usage Color  (Green/Teal)
    │                    └─ Indicates: Healthy capacity
    │
    ├── Medium (60-85%)  → Medium Usage Color (Yellow/Orange)
    │                    └─ Indicates: Moderate usage
    │
    └── High (85-100%)   → High Usage Color  (Red)
                         └─ Indicates: Near capacity
```

**Implementation Approach**:

The color coding uses a threshold-based system:

1. **Determine Usage Level**: Calculate percentage of used resources
2. **Select CSS Class**:
   - Below 60%: `compute-selector__usage--low`
   - 60-85%: `compute-selector__usage--medium`
   - Above 85%: `compute-selector__usage--high`
3. **Apply to Progress Bar**: CSS class on resource fill element
4. **Add Animation**: Smooth transitions (300ms) for visual feedback

**Visual Representation**:

```
┌─────────────────────────────────────────────────────┐
│  Resource Card: "Local Compute"                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CPU    ████░░░░░░░░░░░░░  35%  (Low)              │
│  Memory ██████░░░░░░░░░░░░  55%  (Low)              │
│  Disk   ████████████░░░░░░  75%  (Medium)           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  High Usage Example: "Remote Compute 1"    │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  CPU    ████████████████░░░  90% (High)    │   │
│  │  Memory ██████████████░░░░░  78% (Medium)  │   │
│  │  Disk   ████░░░░░░░░░░░░░░░  40% (Low)     │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Resource Metrics Display

**Displayed Information**:

1. **CPU Usage**
   - Current utilization percentage
   - Visual progress bar with color coding
   - Numeric value for precision

2. **Memory Usage**
   - RAM consumption vs total capacity
   - Same visual treatment as CPU
   - Helps identify memory-intensive computes

3. **Disk Usage**
   - Storage consumption vs total capacity
   - Important for disk-intensive operations
   - Color-coded for quick assessment

**Layout Structure**:

```
┌──────────────────────────────────┐
│  Compute Name    [Badge: Local]  │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐ │
│  │ Resource Label  Progress   % │
│  ├────────────────────────────┤ │
│  │ CPU           ████░░░░   35 │ │
│  │ Memory       ██████░░░░   55 │ │
│  │ Disk         ██████░░░░   65 │ │
│  └────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

---

## Performance Optimization

### 1. Compute List Sorting

**Sorting Location**: TemplateComponent (not in ComputeSelectorComponent)

**Sorting Priority**:

```
Compute List Sorting Algorithm
    │
    ├── First Priority: Is Local?
    │     ├── Yes → Place at top
    │     └── No  → Continue to next priority
    │
    └── Second Priority: Alphabetical
          └── Sort by name (A-Z)
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
• Remote Server 2        • Local (Local)
• Remote Server 1  →     • Remote Server 1
• Local                  • Remote Server 2
• Cloud Compute          • Cloud Compute
```

### 2. Change Detection Strategy

**OnPush Strategy Benefits**:

```
Change Detection Flow
    │
    ├── Input Changes
    │     ├── Position update ──→ Mark for check
    │     ├── Computes update  ──→ Mark for check
    │     └─ Visibility update ──→ Mark for check
    │
    ├── Internal State Changes
    │     ├── Signal updates ──→ Automatic propagation
    │     └─ Computed recalc ──→ View update
    │
    └── Async Operations
          └─ Network/data ──→ Explicit markForCheck()
```

**Performance Characteristics**:
- **Reduced Checks**: Only checks on input changes
- **Signal Efficiency**: Computed values update reactively
- **Explicit Control**: Async operations require manual trigger
- **Zoneless Compatible**: No Zone.js overhead

### 3. Virtual Scrolling (Future Enhancement)

**When to Use**:
- Compute node count exceeds 20 items
- Performance degradation observed
- Memory footprint becomes significant

**Implementation Strategy**:

```
Virtual Scrolling Architecture
    │
    ├── Viewport Management
    │     └─ Only render visible items (+ buffer)
    │
    ├── Item Pool
    │     └─ Reuse DOM elements
    │
    └── Scroll Position
          └─ Calculate visible range
```

---

## Testing

### Unit Test Coverage

**Test Categories**:

1. **Positioning Logic**
   - Screen edge collision detection
   - Position adjustment calculations
   - Boundary conditions (corners, edges)

2. **Compute Sorting**
   - Local compute priority
   - Alphabetical ordering
   - Empty list handling

3. **Resource Color Mapping**
   - Usage level thresholds
   - Color variable selection
   - Edge case handling (0%, 100%)

4. **ResizeObserver Integration**
   - Dimension tracking accuracy
   - Signal updates on resize
   - Cleanup on destroy

### Integration Test Scenarios

**End-to-End Flows**:

```
Test Scenario 1: Drag and Drop with Selection
    │
    ├── 1. User drags node from template
    ├── 2. Ghost icon appears at node position
    ├── 3. Compute selector displays near ghost
    ├── 4. User hovers over compute options
    ├── 5. Resource usage displays correctly
    ├── 6. User selects compute
    └── 7. Node created on selected compute

Test Scenario 2: Screen Edge Avoidance
    │
    ├── 1. User drags node near screen edge
    ├── 2. Ghost icon positioned at edge
    ├── 3. Selector auto-adjusts to avoid clipping
    ├── 4. Entire selector remains visible
    └── 5. User can still interact with selector

Test Scenario 3: Resource Color Coding
    │
    ├── 1. Compute with low usage (< 60%)
    ├── 2. Compute with medium usage (60-85%)
    ├── 3. Compute with high usage (> 85%)
    └── 4. Colors match expected thresholds
```

---

## Accessibility Features

### Keyboard Navigation

**Supported Keyboard Actions**:

```
Key          Action                    Description
─────────    ──────────────────        ───────────────────────────
Escape       Close selector            Immediate dismissal
Arrow Down   Next compute              Move selection down
Arrow Up     Previous compute          Move selection up
Enter        Confirm selection         Create node on selected compute
Tab          Navigate forward          Move to next focusable element
Shift+Tab    Navigate backward         Move to previous focusable element
```

### ARIA Labels

**Accessibility Attributes**:

```
Element              ARIA Attributes          Purpose
─────────────────    ──────────────────        ───────────────────────────
Compute Card         role="button"            Identifies interactive element
                     tabindex="0"             Enables keyboard focus
                     aria-label               Describes compute name
                     aria-describedby         Points to resource info

Resource Display     id="compute-resources-*"  Target for aria-describedby
                     aria-label               Describes resource type

Progress Bar         role="progressbar"       Identifies progress indicator
                     aria-valuenow            Current value
                     aria-valuemin            Minimum value (0)
                     aria-valuemax            Maximum value (100)
```

---

## Known Issues and Limitations

### Current Limitations

1. **Touch Device Accuracy**
   - **Issue**: Ghost icon positioning less accurate on touch devices
   - **Cause**: Touch events provide less precise coordinates
   - **Impact**: Minor visual offset during drag operations
   - **Workaround**: None currently, acceptable for touch use case

2. **Small Screen Truncation**
   - **Issue**: Selector may be truncated on screens < 320px wide
   - **Cause**: Fixed minimum width for content readability
   - **Impact**: Partial content hidden on very small screens
   - **Workaround**: Responsive design handles most cases

3. **Large Compute Lists**
   - **Issue**: Performance degrades with > 50 compute nodes
   - **Cause**: No virtual scrolling implementation
   - **Impact**: Slower rendering and interaction
   - **Planned Fix**: Virtual scrolling for large lists

## Related Documentation

- [Material Design 3 Variables](../../guides/css/02-material3-variables.md) - CSS variable reference
- [Window Boundary Service](../../guides/window-boundary-service.md) - Screen edge detection
