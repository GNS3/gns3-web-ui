<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md). 


# Bug Fix: Text Drawing Position Offset on Add

> Fix text drawings appearing with significant downward offset when created via "Add a Note"

**Date**: 2026-04-04
**Component**: `TextDrawingWidget`, `TextElementFactory`
**Type**: Bug Fix
**Severity**: Medium
**Status**: ✅ Fixed

---

## Bug Description

### Symptoms
- User clicks "Add a Note" button on the toolbar
- User clicks on the canvas to place the text input
- User enters text and clicks elsewhere to save
- The saved text appears **40-50px lower** than the original click position

### Root Cause

**`expectedHeight` mismatch in yOffset calculation**

When creating a text drawing, the `TextElementFactory` sets a default `height = 100` for all text elements:

```typescript
// text-element-factory.ts
getDrawingElement(): DrawingElement {
  let textElement = new TextElement();
  textElement.height = 100;  // Default height for all text
  textElement.width = 100;
  // ...
}
```

However, the actual rendered text typically has a much smaller bbox height (e.g., ~14px for 11pt font).

The `TextDrawingWidget` attempts to vertically center the text within the drawing box:

```typescript
// text-drawing.ts
const yOffset = expectedHeight / 2 - (bbox.y + bbox.height / 2);
// With expectedHeight=100, bbox.height≈14:
// yOffset = 100/2 - (0 + 14/2) = 50 - 7 = 43px
```

This results in a **43px downward offset** when the text fills only a small fraction of the drawing box.

---

## Solution

### Core Approach

**Only apply yOffset when text actually fills a significant portion of the expected height**

The fix adds a `fillRatio` check to determine if the yOffset adjustment should be applied:

```typescript
// text-drawing.ts
merge.attr('transform', function (this: SVGTextElement, text: TextElement) {
  const bbox = this.getBBox();
  const expectedHeight = Number(text.height);
  const fillRatio = expectedHeight > 0 ? bbox.height / expectedHeight : 0;
  const yOffset =
    isFinite(expectedHeight) && fillRatio > 0.5
      ? expectedHeight / 2 - (bbox.y + bbox.height / 2)
      : 0;
  return `translate(0, ${yOffset})`;
});
```

When `fillRatio <= 0.5` (text uses less than 50% of the drawing box height), no yOffset is applied.

### Why This Works

| Scenario | fillRatio | yOffset Applied | Result |
|----------|-----------|-----------------|--------|
| Large multi-line text filling box | > 0.5 | Yes | Properly centered |
| Small note with minimal text | <= 0.5 | No | Positioned at click point |

---

## Files Modified

### `src/app/cartography/widgets/drawings/text-drawing.ts`

**Method**: `draw()` - transform attribute calculation

**Change**: Added `fillRatio` condition to prevent excessive yOffset when text doesn't fill the drawing box.

### `src/app/cartography/components/text-editor/text-editor.component.scss`

**Change**: Added `transform-origin: top left` to ensure the temporary text editor input div scales correctly from its position origin.

---

## Technical Notes

### Coordinate System

The canvas uses a coordinate system where:
- `(0, 0)` is at the **center** of the viewport (not top-left)
- `getZeroZeroTransformationPoint()` returns the viewport center coordinates
- Drawing positions are stored as canvas coordinates

### Text Rendering Pipeline

1. User clicks "Add a Note" → temporary HTML div appears at click position
2. User enters text → clicks elsewhere to save
3. `TextAddedDataEvent` emitted with canvas coordinates
4. Server creates `Drawing` with SVG content
5. `DrawingDataSource` receives the drawing
6. `TextDrawingWidget` renders the SVG text at `drawing.x, drawing.y`

### Remaining Minor Offset

After the fix, a small offset (~2-3 pixels) may remain due to:
- CSS `dominant-baseline: text-before-edge` vs SVG coordinate system differences
- Font rendering precision at different DPI scales

This minor offset is within acceptable tolerance and does not significantly impact usability.

---

## Testing Checklist

- [x] Add a note and verify it appears at click position
- [x] Add multi-line notes and verify centering behavior
- [x] Test with different zoom levels
- [x] Test with pan transformations applied
- [x] Verify existing text drawings still render correctly
- [x] Test "Edit Text" functionality (double-click on existing text)

---

## Related Issues

- **Previous fix**: Node label drag offset (`node-label-dragged.component.ts`)
  - Similar issue where drag delta was being double-applied
  - Fixed by synchronizing datum position during drag

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
