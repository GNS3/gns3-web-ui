# WindowBoundaryService - Window Boundary Service

> Ensures windows stay within viewport boundaries and avoid UI element overlap

**Last Updated**: 2026-03-30
**Status**: ✅ Active

---

## Overview

`WindowBoundaryService` provides boundary constraint functionality for draggable and resizable window components:

```
┌──────────────────────────────────────────────────────┐
│                    Viewport                          │
│  ┌────────────────────────────────────────────────┐  │
│  │  Top Toolbar (64px)                           │  │
│  ├────────────────────────────────────────────────┤  │
│  │                                                │  │
│  │    ┌─────────────────────┐                    │  │
│  │    │   Window            │  ← constrained      │  │
│  │    │                     │    to stay within  │  │
│  │    └─────────────────────┘    viewport        │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Configuration

### BoundaryConfig

| Property | Default | Description |
|----------|---------|-------------|
| minVisibleSize | 100px | Minimum visible size |
| minWidth | 500px | Minimum window width |
| minHeight | 400px | Minimum window height |
| maxWidth | - | Maximum width (optional) |
| maxHeight | - | Maximum height (optional) |
| topOffset | - | Toolbar offset (optional) |

---

## Key Methods

### constrainDragPosition()

Constrains window position during drag to stay within boundaries.

### constrainResizeSize()

Validates and constrains resize dimensions.

### constrainWindowPosition()

Validates window position (used when restoring).

### isValidSize()

Checks if dimensions are valid.

---

## Position Modes

The service handles four positioning modes:

```
     top-left              top-right
        ┌─────────────────────────────┐
        │                             │
   left │                             │ right
        │                             │
        └─────────────────────────────┘
     bottom-left            bottom-right
```

| Mode | Constraint |
|------|------------|
| left | 0 ≤ left ≤ viewportWidth - windowWidth |
| right | 0 ≤ right ≤ viewportWidth - windowWidth |
| top | topOffset ≤ top ≤ viewportHeight - windowHeight |
| bottom | 0 ≤ bottom ≤ viewportHeight - windowHeight - topOffset |

---

## Components Using This Service

| Component | Positioning | Top Offset |
|-----------|-------------|------------|
| AI Chat | top/right | 64px |
| Console Wrapper | left/bottom | 64px (desktop), 56px (mobile) |

---

## Design Decisions

### Singleton Pattern
- Service provided at root level
- Single instance shared across all components
- Configuration changes affect all components

### Observable Configuration
- Uses RxJS `BehaviorSubject`
- Allows dynamic configuration updates

### Immutability
- Methods return new style objects
- Prevents unexpected side effects

---

**Last Updated**: 2026-03-30
