# Console Device Topology Highlight Feature

## Overview

This document describes the implementation of the console device topology highlight feature, which highlights the selected device and its connected links in the topology when a user selects a device from the Web Console.

## Feature Description

### User Interactions

When a user selects a device in the Web Console (either from the devices panel or by switching tabs), the following elements are highlighted in the topology:

1. **Selected Device**: Displayed with a purple (#8b5cf6) glow and breathing animation
2. **Connected Devices**: Displayed with a blue (#3b82f6) static glow
3. **Connected Links**: Displayed with light blue (#60a5fa) animated dashed line

### Clearing Highlight

The highlight is automatically cleared when:
- User switches to another device
- User presses the ESC key
- User clicks outside the Console window

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

#### 3. CSS Styles

Three CSS classes are used:

```scss
// Selected device - purple with breathing animation
g.node.console-highlight {
  animation: nodeHighlightGlow 2s ease-in-out infinite;
}

// Connected device - blue static glow
g.node.console-highlight-connected {
  filter: drop-shadow(0 0 4px #3b82f6);
}

// Connected link - animated dashed line
g.link_body.console-highlight {
  > path.ethernet_link {
    stroke: #60a5fa;
    stroke-dasharray: 10 5;
    animation: linkDashAnimation 1s linear infinite;
  }
}
```

### Memory Leak Prevention

All RxJS subscriptions in `console-wrapper.component.ts` use `takeUntil(this.destroy$)` pattern to prevent memory leaks:

```typescript
this.selected.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(...);
```

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Selected Node (stroke) | Purple | #8b5cf6 |
| Selected Node (glow) | Purple | #8b5cf6 |
| Connected Node | Blue | #3b82f6 |
| Connected Link | Light Blue | #60a5fa |

## Future Improvements

- Add configuration option for highlight colors
- Add option to enable/disable breathing animation
- Support for multiple selected devices
- Add sound notification option
