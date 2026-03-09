# Window Boundary Service & UI Improvements - 2026-03-09

---

**Date**: 2026-03-09
**Type**: Feature Enhancement
**Components**: WindowBoundaryService, AI Chat, Console Wrapper
**Impact**: Improved user experience for draggable windows

---

## Summary

Added a new reusable `WindowBoundaryService` to provide window boundary constraint functionality for all draggable and resizable window components. This ensures windows stay within the viewport and intelligently avoid overlapping with UI elements like the top toolbar.

---

## New Features

### 1. WindowBoundaryService
**File**: `src/app/services/window-boundary.service.ts`

A new singleton service that provides:
- **Drag Position Constraint**: Prevents windows from being dragged outside the viewport
- **Size Validation**: Ensures resized windows don't exceed viewport boundaries
- **Top Offset Support**: Configurable toolbar offset to keep windows below the top toolbar
- **Reusable Design**: Single service instance shared across all draggable window components

**Key Methods**:
- `constrainDragPosition()` - Validates and constrains window position during dragging
- `constrainResizeSize()` - Validates and constrains window resize dimensions
- `constrainWindowPosition()` - Validates window position (used when restoring)
- `isValidSize()` - Checks if dimensions are valid according to configuration
- `setConfig()` - Updates boundary configuration

### 2. AI Chat Window Improvements
**File**: `src/app/components/project-map/ai-chat/ai-chat.component.ts`

**Changes**:
- Integrated with WindowBoundaryService
- Window now stays completely within viewport boundaries
- Automatically positions below top toolbar (64px desktop, 56px mobile)
- Improved maximize/restore functionality with boundary validation

### 3. Console Wrapper Improvements
**File**: `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`

**Changes**:
- Integrated with WindowBoundaryService
- Window now stays completely within viewport boundaries
- Smart positioning below top toolbar (64px desktop, 56px mobile)
- **Drag behavior improvement**: Only header area is draggable (previously entire window)
- **Cursor feedback**: Added grab/grabbing cursor for better UX
- Buttons no longer trigger drag (using `$event.stopPropagation()`)

---

## Technical Details

### Boundary Calculation Logic

#### For `left` Positioning
```typescript
minLeft = 0;                              // Cannot go beyond left edge
maxLeft = window.innerWidth - windowWidth; // Cannot go beyond right edge
```

#### For `right` Positioning
```typescript
minRight = 0;                              // Cannot go beyond right edge
maxRight = window.innerWidth - windowWidth; // Cannot go beyond left edge
```

#### For `top` Positioning
```typescript
minTop = topOffset || 0;                           // Cannot go above toolbar
maxTop = window.innerHeight - windowHeight;         // Cannot go beyond bottom
```

#### For `bottom` Positioning
```typescript
minBottom = 0;                                        // Cannot go beyond bottom
maxBottom = window.innerHeight - windowHeight - topOffset; // Cannot go above toolbar
```

### Configuration Example

```typescript
// Set top offset to keep window below toolbar
const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
this.boundaryService.setConfig({ topOffset: toolbarHeight });
```

---

## Files Modified

### New Files
- `src/app/services/window-boundary.service.ts` - Window boundary constraint service
- `docs/services/window-boundary-service.md` - Service documentation

### Modified Files
- `src/app/components/project-map/ai-chat/ai-chat.component.ts` - Integrated boundary service
- `src/app/components/project-map/console-wrapper/console-wrapper.component.ts` - Integrated boundary service, improved drag behavior
- `src/app/components/project-map/console-wrapper/console-wrapper.component.html` - Updated drag event binding
- `src/app/components/project-map/console-wrapper/console-wrapper.component.scss` - Added cursor styles
- `docs/services-review.md` - Added new service reference
- `docs/SUMMARY.md` - Updated file count

---

## Breaking Changes

**None**. This is a pure enhancement with no breaking changes.

---

## API Changes

### WindowBoundaryService (New)

```typescript
// New service with the following public API:

interface BoundaryConfig {
  minVisibleSize: number;  // Default: 100
  minWidth: number;        // Default: 500
  minHeight: number;       // Default: 400
  maxWidth?: number;
  maxHeight?: number;
  topOffset?: number;      // Toolbar height (64px desktop, 56px mobile)
}

class WindowBoundaryService {
  getConfig(): Observable<BoundaryConfig>
  getConfigValue(): BoundaryConfig
  setConfig(config: Partial<BoundaryConfig>): void
  constrainDragPosition(currentStyle: WindowStyle, movementX: number, movementY: number): WindowStyle
  constrainResizeSize(width: number, height: number, left?: number, top?: number): SizeResult
  constrainWindowPosition(style: WindowStyle): WindowStyle
  isValidSize(width: number, height: number): boolean
}
```

---

## UI/UX Improvements

### Console Window
- ✅ Dragging now only works from the header area (previously entire window)
- ✅ Cursor changes to hand icon when hovering over header
- ✅ Cursor changes to grabbing when actively dragging
- ✅ Buttons (minimize, close) no longer accidentally trigger drag
- ✅ Window stays fully visible at all times

### AI Chat Window
- ✅ Window stays fully visible at all times
- ✅ Automatically positions below toolbar
- ✅ Maximize/restore functionality properly constrained

---

## Testing

### Manual Testing Checklist
- [ ] Drag console window to all four edges - should not go outside viewport
- [ ] Drag AI Chat window to all four edges - should not go outside viewport
- [ ] Drag console window to top - should stop at toolbar (64px from top on desktop)
- [ ] Drag AI Chat window to top - should stop at toolbar (64px from top on desktop)
- [ ] Resize both windows - should not resize beyond viewport
- [ ] Maximize AI Chat window - should fill entire viewport below toolbar
- [ ] Restore AI Chat window - should return to previous position
- [ ] Try to drag from console window content area - should not drag (only header)
- [ ] Click console window buttons - should not trigger drag

---

## Future Enhancements

Potential improvements for future iterations:
1. **Snap-to-edge**: Automatically snap windows to edges when dragged close
2. **Collision detection**: Prevent multiple windows from overlapping
3. **Window persistence**: Save and restore window positions across sessions
4. **Multi-monitor support**: Handle windows across multiple monitors
5. **Animation**: Smooth animations when boundaries are enforced

---

## Related Documentation

- [WindowBoundaryService Documentation](../services/window-boundary-service.md)
- [Services Directory Review](../services-review.md)
- [AI Chat Implementation Plan](../todo/ai-chat-implementation-plan.md)

---

**Date**: 2026-03-09
**Author**: Development Team
**Review Status**: ✅ Completed
