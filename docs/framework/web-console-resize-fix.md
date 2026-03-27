# Web Console Resize Fix

**Date**: 2026-03-25
**Issue**: xterm.js terminal did not fill the console window when maximized.

## Problem

When maximizing the console window, the container dimensions changed correctly (1241px height) but the xterm.js terminal remained at the original size (800x544), resulting in unused empty space.

### Root Cause

The original HTML structure had an unnecessary wrapper layer `.xterm-console` between the flex container and the `app-web-console` component:

```
consoleWrapper (fixed, height: 1241px after maximize)
  └── .console-content (flex column, height: 100%)
        └── .console-area (flex: 1, flex-direction: column)
              ├── .consoleHeader (fixed height)
              └── .xterm-console (no flex properties - did not expand)
                    └── app-web-console
```

The `.xterm-console` wrapper lacked `flex: 1` and `min-height: 0`, so it did not expand to fill the remaining space in the flex container. Even when `flex: 1` was added to `.xterm-console`, it did not work reliably.

## Solution

1. **Removed the unnecessary `.xterm-console` wrapper layer** - Direct placement of `app-web-console` inside `.console-area`.

2. **Made `app-web-console` host element a flex child** - Set `:host` to `flex: 1; min-height: 0; height: 100%` so it expands to fill remaining space.

### Changed Files

- `console-wrapper.component.html` - Removed `.xterm-console` wrapper
- `console-wrapper.component.scss` - Removed `.xterm-console` styles
- `web-console.component.scss` - Updated `:host` to use flex layout

### Before

```html
<div class="xterm-console" [hidden]="isMinimized">
  <app-web-console [hidden]="!(selected.value === index)" ...>
  </app-web-console>
</div>
```

### After

```html
<app-web-console [hidden]="isMinimized || !(selected.value === index)" ...>
</app-web-console>
```

### CSS Changes (web-console.component.scss)

```scss
// Before
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// After
:host {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}
```

## Key Insight

In Angular flex layouts with `ChangeDetectionStrategy.OnPush`, unnecessary wrapper elements can cause sizing issues. Each wrapper layer must have proper flex properties (`flex: 1`, `min-height: 0`) to pass dimensions down the layout tree. Reducing wrapper layers simplifies the layout chain and makes sizing more predictable.

## Additional Resize Handling

The `ResizeObserver` in `web-console.component.ts` handles automatic resizing:

```typescript
this.resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) continue;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Promise.resolve().then(() => {
          this.fitAddon.fit();
          // ...
        });
      });
    });
  }
});
```

This ensures the terminal resizes when the container dimensions change, using double `requestAnimationFrame` plus microtask to ensure DOM and Angular change detection have completed.
