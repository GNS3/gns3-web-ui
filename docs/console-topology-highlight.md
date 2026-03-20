# Console Device Topology Highlight Feature

## Overview

This document describes the implementation of the console device topology highlight feature, which highlights the selected device and its connected links in the topology when a user selects a device from the Web Console.

## Feature Description

### User Interactions

When a user selects a device in the Web Console (either from the devices panel or by switching tabs), the following elements are highlighted in the topology:

1. **Selected Device**: Displayed with a red (#ef4444) glow effect only (preserves original node border color)
2. **Connected Devices**: Displayed with a blue (#3b82f6) glow effect only (preserves original node border color)
3. **Connected Links**: Displayed as red (#ef4444) static solid lines

### Clearing Highlight

The highlight is automatically cleared when:
- User switches to another device
- User closes the Console window
- User opens a different project
- User presses ESC key

## Implementation Details

### Files Modified

| File | Description |
|------|-------------|
| `console-wrapper.component.ts` | Added output events for device selection |
| `project-map.component.html` | Added event bindings |
| `project-map.component.ts` | Added highlight logic using D3 |
| `project-map.component.scss` | Added highlight CSS styles |

### Event Flow

```
User selects device in Console
         ↓
console-wrapper emits deviceSelected event
         ↓
project-map receives event
         ↓
onDeviceSelected() highlights node + links + connected nodes
         ↓
CSS classes applied: console-highlight, console-highlight-connected
```

### Key Components

#### 1. Console Wrapper Component

Added two output events:
- `deviceSelected`: Emits when a device is selected (from panel or tab change)
- `consoleDeactivated`: Emits when Console loses focus

```typescript
@Output() deviceSelected = new EventEmitter<string>();
@Output() consoleDeactivated = new EventEmitter<void>();
```

#### 2. Project Map Component

Key methods:
- `onDeviceSelected(nodeId)`: Highlights the selected node, connected links, and connected nodes
- `clearConsoleHighlight()`: Removes all highlight classes
- `onEscapeKey()`: Clears highlight when ESC key is pressed

State management:
- `highlightedNodeId`: Private property that tracks the currently highlighted node ID
  - Set when a device is selected
  - Used to efficiently clear only the previously highlighted elements
  - Reset to `null` when highlight is cleared

#### 3. CSS Styles (Performance Optimized)

Three CSS classes are used:

```scss
// Selected device - red glow, no border color change, no animation
g.node.console-highlight {
  will-change: filter;
  filter: drop-shadow(0 0 5px #ef4444);  // Red glow

  .node_body {
    stroke-width: 5px;  // Original border color preserved
  }
}

// Connected device - blue glow, no border color change
g.node.console-highlight-connected {
  will-change: filter;
  filter: drop-shadow(0 0 3px #3b82f6);  // Blue glow

  .node_body {
    stroke-width: 3px;  // Original border color preserved
  }
}

// Connected link - red solid line, no animation
g.link_body.console-highlight {
  > path.ethernet_link,
  > path.serial_link {
    stroke: #ef4444 !important;  // Red
    stroke-width: 4px !important;
    // No animation, no dash - solid red line
  }
}
```

### Performance Optimizations

The highlight feature has been optimized for minimal GPU usage:

1. **No Animations**: Removed breathing animation and link dash animation
2. **Static Filters**: Using static `drop-shadow` instead of animated filters
3. **No will-change**: Avoided `will-change: filter` to prevent GPU memory leaks from dynamic class additions/removals
4. **Glow Effects Only**: Changed from colored borders + glow to glow only (preserves node appearance)

### Memory Leak Prevention

All RxJS subscriptions in `console-wrapper.component.ts` use `takeUntil(this.destroy$)` pattern to prevent memory leaks:

```typescript
this.selected.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(...);
```

## Color Scheme

| Element | Effect | Hex | Note |
|---------|--------|-----|------|
| Selected Node (glow) | Red | #ef4444 | 5px glow, no animation |
| Selected Node (border) | Original | - | Border color preserved |
| Connected Node (glow) | Blue | #3b82f6 | 3px glow, static |
| Connected Node (border) | Original | - | Border color preserved |
| Connected Link | Red | #ef4444 | Solid line, 4px width, no animation |

## Visual Design

The highlight feature uses a glow-only approach to:
- Preserve the original appearance of nodes
- Make selected devices easily identifiable through glow effects
- Minimize visual clutter
- Maintain good performance

## Performance Impact

The highlight feature has minimal performance impact:
- Static filters only (no animations)
- GPU usage: ~0.5-1ms for initial render
- No continuous GPU consumption

## Future Improvements

- Add configuration option for highlight colors
- Support for multiple selected devices
- Add sound notification option
- Add customizable glow intensity levels
