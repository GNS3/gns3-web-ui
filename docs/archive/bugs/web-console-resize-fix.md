<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Web Console Resize Fix

**Date**: 2026-03-25
**Fixed**: 2026-03-30
**Issue**: xterm.js terminal did not fill the console window when maximized

---

## Problem

When maximizing the console window, the container dimensions changed correctly but the xterm.js terminal remained at the original size, resulting in unused empty space.

## Root Cause

An unnecessary wrapper layer `.xterm-console` existed between the flex container and `app-web-console` component:

```
BEFORE (Problematic Layout)
═══════════════════════════════════════════════════════════════
consoleWrapper (fixed size)
  └── .console-content (flex column, height: 100%)
        └── .console-area (flex: 1, flex-direction: column)
              ├── .consoleHeader (fixed height)
              └── .xterm-console (❌ NO flex properties)
                    └── app-web-console
═══════════════════════════════════════════════════════════════

The .xterm-console wrapper lacked flex properties, so it did not
expand to fill the remaining space in the flex container.
```

## Solution

Two changes made:

```
AFTER (Fixed Layout)
═══════════════════════════════════════════════════════════════
consoleWrapper (fixed size)
  └── .console-content (flex column, height: 100%)
        └── .console-area (flex: 1, flex-direction: column)
              ├── .consoleHeader (fixed height)
              └── app-web-console (:host { flex: 1, min-height: 0 })
                    └── xterm.js terminal (fills container)
═══════════════════════════════════════════════════════════════

1. Removed .xterm-console wrapper layer
2. Made app-web-console :host a proper flex child
```

### Changed Files

| File | Change |
|------|--------|
| `console-wrapper.component.html` | Removed `.xterm-console` wrapper |
| `console-wrapper.component.scss` | Removed `.xterm-console` styles |
| `web-console.component.scss` | Updated `:host` to flex layout |

### CSS Change Summary

**Before**:
```
display: block → terminal didn't expand
```

**After**:
```
display: flex
flex-direction: column
flex: 1          ← Key: allows expansion
min-height: 0    ← Key: allows shrinking below content size
height: 100%
```

## Key Insight

In Angular flex layouts with `ChangeDetectionStrategy.OnPush`, unnecessary wrapper elements cause sizing issues. Each wrapper layer must have proper flex properties to pass dimensions down the layout tree:

```
Flex Layout Rules:
═══════════════════════════════════════════════════════════════
To be a flex child that expands:
  ✓ parent: display: flex (or inline-flex)
  ✓ child: flex: 1 AND min-height: 0

To be a flex container:
  ✓ display: flex
  ✓ flex-direction: column (for vertical)
  ✓ overflow: hidden (to clip children)
═══════════════════════════════════════════════════════════════
```

## Resize Handling

The `ResizeObserver` in `web-console.component.ts` automatically resizes the terminal when the container size changes:

```
ResizeObserver Flow:
═══════════════════════════════════════════════════════════════
Container Resizes
        │
        ▼
ResizeObserver Callback
        │
        ▼
Skip if (width === 0 || height === 0)
        │
        ▼
requestAnimationFrame → fitTerminal()
        │
        ├── fitAddon.fit()    → resize xterm.js
        ├── Update cols/rows   → store in service
        └── term.resize()    → apply new dimensions
═══════════════════════════════════════════════════════════════
```

## Lessons Learned

1. **Remove unnecessary wrappers** - Each wrapper adds complexity to the flex layout chain
2. **Flex children need `flex: 1` AND `min-height: 0`** - Both are required for proper expansion
3. **Test with OnPush change detection** - Issues may not appear in default mode
4. **Use ResizeObserver for dynamic sizing** - Better than window resize events

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
