# WindowBoundaryService - Window Boundary Check Service

---

**Document Created**: 2026-03-09
**Service Type**: Utility Service
**File Location**: `src/app/services/window-boundary.service.ts`
**Dependencies**: RxJS

---

## Overview

`WindowBoundaryService` is a reusable service that provides window boundary check functionality for draggable and resizable window components in the GNS3 Web UI. It ensures windows stay within the viewport boundaries and can intelligently avoid overlapping with UI elements like the top toolbar.

---

## Features

### 1. **Boundary Constraint**
- Prevents windows from being dragged outside the viewport
- Ensures windows always remain fully visible
- Supports different positioning modes (`top`/`left`, `top`/`right`, `bottom`/`left`, `bottom`/`right`)

### 2. **Size Validation**
- Validates minimum and maximum window sizes
- Ensures resized windows don't exceed viewport boundaries

### 3. **Top Offset Support**
- Configurable top offset to keep windows below toolbar
- Automatically detects toolbar height (64px desktop, 56px mobile)
- Smart positioning to avoid UI element overlap

### 4. **Reusable Design**
- Single service instance can be shared across multiple components
- Configurable boundary parameters per component
- Observable-based configuration updates

---

## API Reference

### Interfaces

#### WindowStyle
```typescript
interface WindowStyle {
  position?: string;   // CSS position property
  top?: string;        // Distance from top
  right?: string;      // Distance from right
  bottom?: string;     // Distance from bottom
  left?: string;       // Distance from left
  width?: string;      // Window width
  height?: string;     // Window height
}
```

#### BoundaryConfig
```typescript
interface BoundaryConfig {
  minVisibleSize: number;  // Minimum visible size (pixels) - default: 100
  minWidth: number;        // Minimum window width - default: 500
  minHeight: number;       // Minimum window height - default: 400
  maxWidth?: number;       // Maximum window width (optional)
  maxHeight?: number;      // Maximum window height (optional)
  topOffset?: number;      // Top toolbar offset (optional)
}
```

### Methods

#### getConfig()
```typescript
getConfig(): Observable<BoundaryConfig>
```
Returns the current boundary configuration as an Observable.

#### getConfigValue()
```typescript
getConfigValue(): BoundaryConfig
```
Returns the current boundary configuration value synchronously.

#### setConfig()
```typescript
setConfig(config: Partial<BoundaryConfig>): void
```
Updates the boundary configuration with partial values.

**Example**:
```typescript
this.boundaryService.setConfig({ topOffset: 64 });
```

#### constrainDragPosition()
```typescript
constrainDragPosition(
  currentStyle: WindowStyle,
  movementX: number,
  movementY: number
): WindowStyle
```
Calculates and returns the constrained position during dragging to ensure the window stays within viewport boundaries.

**Parameters**:
- `currentStyle`: Current window style object
- `movementX`: Horizontal movement distance from mouse event
- `movementY`: Vertical movement distance from mouse event

**Returns**: New window style object with constrained position

#### constrainResizeSize()
```typescript
constrainResizeSize(
  width: number,
  height: number,
  left?: number,
  top?: number
): { width: number; height: number; left?: number; top?: number }
```
Validates and constrains window resize dimensions to ensure they don't exceed viewport boundaries.

**Parameters**:
- `width`: New window width
- `height`: New window height
- `left`: Left position (optional)
- `top`: Top position (optional)

**Returns**: Constrained size and position object

#### constrainWindowPosition()
```typescript
constrainWindowPosition(style: WindowStyle): WindowStyle
```
Validates and constrains window position to ensure it's completely within viewport (used when restoring window position).

**Parameters**:
- `style`: Window style object to validate

**Returns**: Constrained window style object

#### isValidSize()
```typescript
isValidSize(width: number, height: number): boolean
```
Checks if the given dimensions are valid according to the boundary configuration.

**Parameters**:
- `width`: Width to validate
- `height`: Height to validate

**Returns**: `true` if valid, `false` otherwise

---

## Usage Examples

### Basic Usage in Component

```typescript
import { Component } from '@angular/core';
import { WindowBoundaryService, WindowStyle } from '@services/window-boundary.service';

@Component({
  selector: 'app-my-window',
  templateUrl: './my-window.component.html'
})
export class MyWindowComponent {
  public style: WindowStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '80px',
    width: '700px',
    height: '600px'
  };

  constructor(private boundaryService: WindowBoundaryService) {
    // Set top offset to keep window below toolbar
    const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
    this.boundaryService.setConfig({ topOffset: toolbarHeight });
  }

  dragWidget(event: MouseEvent): void {
    // Constrain position during drag
    this.style = this.boundaryService.constrainDragPosition(
      this.style,
      event.movementX,
      event.movementY
    );
  }

  onResizeEnd(event: ResizeEvent): void {
    // Constrain size after resize
    const constrained = this.boundaryService.constrainResizeSize(
      event.rectangle.width,
      event.rectangle.height,
      event.rectangle.left,
      event.rectangle.top
    );

    this.style = {
      ...this.style,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`
    };
  }
}
```

### HTML Template

```html
<div class="my-window"
     [ngStyle]="style"
     (mousedown)="startDragging($event)">
  <div class="window-header">
    <!-- Header content -->
  </div>
  <div class="window-content">
    <!-- Window content -->
  </div>
</div>
```

### Custom Configuration

```typescript
// Set custom minimum size
this.boundaryService.setConfig({
  minWidth: 800,
  minHeight: 600
});

// Set top offset for toolbar
this.boundaryService.setConfig({
  topOffset: 80  // Custom toolbar height
});

// Set maximum size
this.boundaryService.setConfig({
  maxWidth: 1200,
  maxHeight: 900
});
```

---

## Implementation Details

### Position Calculation Logic

#### For `left` Positioning
```typescript
minLeft = 0;
maxLeft = window.innerWidth - windowWidth;
```
- Window cannot be dragged beyond left edge (minLeft = 0)
- Window cannot be dragged beyond right edge (maxLeft = viewportWidth - windowWidth)

#### For `right` Positioning
```typescript
minRight = 0;
maxRight = window.innerWidth - windowWidth;
```
- Similar logic, but calculated from right edge

#### For `top` Positioning
```typescript
minTop = topOffset || 0;  // Keep below toolbar
maxTop = window.innerHeight - windowHeight;
```
- Window cannot be dragged above toolbar (minTop = topOffset)
- Window cannot be dragged beyond bottom edge (maxTop = viewportHeight - windowHeight)

#### For `bottom` Positioning
```typescript
minBottom = 0;
maxBottom = window.innerHeight - windowHeight - (topOffset || 0);
```
- Window cannot be dragged beyond bottom edge (minBottom = 0)
- Window top cannot go above toolbar (maxBottom = viewportHeight - windowHeight - topOffset)

### Size Validation

```typescript
// Apply minimum constraints
constrainedWidth = Math.max(config.minWidth, width);
constrainedHeight = Math.max(config.minHeight, height);

// Apply maximum constraints (if configured)
if (config.maxWidth) {
  constrainedWidth = Math.min(config.maxWidth, constrainedWidth);
}

// Ensure within viewport
constrainedWidth = Math.min(constrainedWidth, window.innerWidth - left);
constrainedHeight = Math.min(constrainedHeight, window.innerHeight - top);
```

---

## Components Using This Service

1. **AI Chat Component** (`src/app/components/project-map/ai-chat/ai-chat.component.ts`)
   - Draggable and resizable AI chat window
   - Uses `top`/`right` positioning
   - Configured with 64px top offset

2. **Console Wrapper Component** (`src/app/components/project-map/console-wrapper/console-wrapper.component.ts`)
   - Web console window
   - Uses `left`/`bottom` positioning
   - Configured with responsive top offset (64px desktop, 56px mobile)

---

## Design Decisions

### 1. Singleton Pattern
- Service is provided at root level (`providedIn: 'root'`)
- Single instance shared across all components
- Configuration changes affect all components (generally desired behavior)

### 2. Observable Configuration
- Configuration is managed using RxJS `BehaviorSubject`
- Components can subscribe to configuration changes
- Allows for dynamic configuration updates

### 3. Immutability
- Methods return new style objects rather than mutating inputs
- Prevents unexpected side effects
- Aligns with Angular's change detection principles

### 4. Viewport-Based Boundaries
- Uses `window.innerWidth` and `window.innerHeight`
- Boundaries are relative to viewport, not document
- Appropriate for `position: fixed` elements

---

## Future Enhancements

### Potential Improvements

1. **Multi-Monitor Support**
   - Add support for windows spanning multiple monitors
   - Detect and handle screen boundaries

2. **Snap-to-Edge Feature**
   - Automatically snap windows to edges when dragged close
   - Magnetic edge detection within threshold distance

3. **Collision Detection**
   - Prevent multiple windows from overlapping
   - Auto-position new windows in available space

4. **Window Persistence**
   - Save and restore window positions across sessions
   - Remember user preferences

5. **Animation Support**
   - Smooth animations when boundaries are enforced
   - Visual feedback when hitting edges

---

## Testing Considerations

### Unit Tests
```typescript
describe('WindowBoundaryService', () => {
  it('should constrain left position within viewport', () => {
    const style = { left: '0px', width: '500px' };
    const result = service.constrainDragPosition(style, -100, 0);
    expect(result.left).toBe('0px'); // Should not go below 0
  });

  it('should respect top offset', () => {
    service.setConfig({ topOffset: 64 });
    const style = { top: '0px', height: '500px' };
    const result = service.constrainDragPosition(style, 0, -100);
    expect(result.top).toBe('64px'); // Should not go below toolbar
  });
});
```

### Integration Tests
- Test dragging behavior in component context
- Verify resize constraints
- Test with different viewport sizes
- Verify toolbar offset behavior

---

## Related Files

- **Service Implementation**: `src/app/services/window-boundary.service.ts`
- **AI Chat Component**: `src/app/components/project-map/ai-chat/ai-chat.component.ts`
- **Console Wrapper Component**: `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`
- **Default Layout Styles**: `src/app/layouts/default-layout/default-layout.component.scss`

---

## Changelog

### 2026-03-09
- ✅ Created WindowBoundaryService
- ✅ Implemented drag position constraint
- ✅ Implemented resize size validation
- ✅ Added top offset support for toolbar
- ✅ Integrated with AI Chat component
- ✅ Integrated with Console Wrapper component
- ✅ Improved cursor feedback (grab/grabbing)
- ✅ Added boundary check for all four edges

---

## Support

For questions or issues related to the WindowBoundaryService, please contact the development team or refer to the main code review documentation.

---

**Document Created**: 2026-03-09
**Last Updated**: 2026-03-09
**Author**: Development Team
