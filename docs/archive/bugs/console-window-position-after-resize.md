# Bug Fix: Console Window Position After Resize

> Fix console window jumping to bottom when opened from sidebar after resize

**Date**: 2026-03-19
**Component**: `ConsoleWrapperComponent`
**Type**: Bug Fix
**Severity**: Medium
**Status**: ✅ Fixed

---

## Bug Description

### Symptoms
- User resizes the web console window
- User clicks a node from the sidebar to open its console
- Console window jumps to the bottom of the screen

### Root Cause
**Resize handler switches positioning mode from `bottom`/`left` to `top`/`left`**

```
Normal state:
Console uses bottom: '20px', left: '80px' positioning
    ↓
User resizes console window
    ↓
onResizeEnd() uses constrainResizeSize() which returns top/left coordinates
    ↓
❌ Position mode switches to top/left, bottom property is lost
    ↓
User clicks sidebar node
    ↓
addTab() → minimize(false) tries to read currentBottom
    ↓
currentBottom is undefined (was removed in onResizeEnd)
    ↓
Uses default value '20px'
    ↓
❌ Console jumps to bottom
```

---

## Solution

### Core Approach
**Preserve the original positioning mode (bottom vs top) during resize operations**

### Implementation

#### Modified `onResizeEnd` method in `console-wrapper.component.ts`

```typescript
onResizeEnd(event: ResizeEvent): void {
  // Check if current positioning uses bottom instead of top
  const currentStyle = this.style as WindowStyle;
  const usesBottomPositioning = currentStyle.bottom !== undefined && currentStyle.top === undefined;

  // Use boundary service to constrain size
  const constrained = this.boundaryService.constrainResizeSize(
    event.rectangle.width || this.resizedWidth,
    event.rectangle.height || this.resizedHeight,
    event.rectangle.left,
    event.rectangle.top
  );

  // Preserve positioning mode (bottom vs top) to avoid window jumping
  if (usesBottomPositioning) {
    // Convert top to bottom: bottom = window.innerHeight - top - height
    const bottom = window.innerHeight - constrained.top! - constrained.height;
    this.style = {
      position: 'fixed',
      left: `${constrained.left}px`,
      bottom: `${bottom}px`,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };
  } else {
    this.style = {
      position: 'fixed',
      left: `${constrained.left}px`,
      top: `${constrained.top}px`,
      width: `${constrained.width}px`,
      height: `${constrained.height}px`,
    };
  }

  // ... rest of the method
}
```

---

## Why This Works

### Key Points

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| Position detection | None | Checks if using `bottom` positioning |
| Resize behavior | Always switches to `top` | Preserves original positioning mode |
| Coordinate conversion | Not needed | Converts `top` to `bottom` when needed |
| Sidebar node click | Window jumps to bottom | Window stays in place |

### Position Coordinate Conversion

When using `bottom` positioning:
- Original resize library provides `top` coordinate
- Need to convert to `bottom` coordinate
- Formula: `bottom = window.innerHeight - top - height`

Example:
```
Window height: 1000px
Console top: 300px (from resize event)
Console height: 600px

bottom = 1000 - 300 - 600 = 100px

Result: Console maintains visual position using bottom: 100px
```

---

## Technical Details

### CSS Positioning Modes

**Bottom/Left Positioning** (default for console):
```css
.consoleWrapper {
  position: fixed;
  bottom: 20px;
  left: 80px;
}
```

**Top/Left Positioning** (used after resize before fix):
```css
.consoleWrapper {
  position: fixed;
  top: 580px;  /* calculated by resize library */
  left: 80px;
}
```

Both position the console at the same visual location, but:
- `bottom` positioning maintains distance from bottom edge
- `top` positioning maintains distance from top edge

When `minimize(false)` tries to restore position:
- It reads `currentBottom` from style
- If style has `top` instead of `bottom`, `currentBottom` is undefined
- Falls back to default `bottom: '20px'`, causing the jump

---

## Related Code

### Files Modified
- **Component**: `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`
  - Method: `onResizeEnd()` (lines 219-251)

### Related Services
- **WindowBoundaryService**: `src/app/services/window-boundary.service.ts`
  - Method: `constrainResizeSize()` - provides size constraints with top/left coordinates
  - Method: `constrainDragPosition()` - correctly handles both bottom and top positioning

---

## Testing Checklist

- [x] Resize console window
- [x] Click node from sidebar after resize
- [x] Verify console stays in same position
- [x] Test multiple resize operations
- [x] Test with console at different screen positions
- [x] Test minimize/maximize operations
- [x] Verify window state saves/loads correctly

---

## Summary

The bug occurred due to **inconsistent positioning modes**:
- Console defaults to `bottom`/`left` positioning
- Resize handler forced switch to `top`/`left` positioning
- Subsequent operations expected `bottom` positioning

By detecting and preserving the original positioning mode during resize:
1. ✅ Console maintains visual position across resize operations
2. ✅ Sidebar node clicks don't cause window jumping
3. ✅ Consistent behavior throughout the user session
4. ✅ Backward compatible with existing saved window states
