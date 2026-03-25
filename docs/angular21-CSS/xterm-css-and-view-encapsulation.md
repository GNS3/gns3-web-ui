# Xterm.js CSS and Angular View Encapsulation

## Problem Description

When using xterm.js in Angular components, the library creates helper DOM elements dynamically for keyboard input handling and character measurement:

```html
<div class="xterm-helpers">
  <textarea class="xterm-helper-textarea" ...></textarea>
  <span class="xterm-char-measure-element" ...>WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW</span>
  <div class="composition-view"></div>
</div>
```

These elements should be visually hidden (xterm.js provides CSS to hide them), but they may become visible when Angular's view encapsulation interferes with the CSS selectors.

## Root Cause

Angular's view encapsulation adds attribute selectors (e.g., `_nghost-xxx`, `_ngcontent-xxx`) to elements and modifies CSS selectors to scope styles to components. This can interfere with third-party library CSS in several ways:

1. **Scoped CSS selectors don't match dynamic elements**: When xterm.js creates elements inside a component's view, the dynamic elements may not match the expected selectors if the encapsulation attributes are not properly applied.

2. **CSS specificity conflicts**: Angular's view encapsulation increases CSS specificity, which may override or be overridden by third-party library styles.

3. **Load order issues**: If the third-party CSS is loaded via `styleUrls` in the component, it may be processed differently than global styles.

## Solution

### Step 1: Load xterm.css Globally via angular.json

Add xterm.css to the global styles array in `angular.json`:

```json
{
  "architect": {
    "build": {
      "options": {
        "styles": [
          "node_modules/bootstrap/dist/css/bootstrap.min.css",
          "node_modules/notosans-fontface/css/notosans-fontface.min.css",
          "node_modules/material-design-icons/iconfont/material-icons.css",
          "node_modules/xterm/css/xterm.css",
          "src/styles/material3-theme-supplement.scss",
          "src/styles.scss",
          "src/tailwind-markdown.scss"
        ]
      }
    }
  }
}
```

### Step 2: Remove xterm.css from Component styleUrls

Remove the xterm.css import from component `styleUrls` to avoid double-loading and potential view encapsulation issues:

```typescript
// ❌ Wrong: Loading xterm.css via styleUrls (subject to view encapsulation)
@Component({
  styleUrls: ['../../../../../node_modules/xterm/css/xterm.css', './web-console.component.scss'],
  // ...
})

// ✅ Correct: xterm.css is loaded globally via angular.json
@Component({
  styleUrls: ['./web-console.component.scss'],
  // ...
})
```

## Why This Works

By loading xterm.css globally:

1. **No view encapsulation interference**: Global styles are not affected by Angular's view encapsulation
2. **Proper CSS cascade**: xterm.js's own CSS rules are applied correctly to its dynamically created elements
3. **Consistent behavior**: All xterm instances across the app use the same CSS

## xterm.js Helper Elements

The xterm.js library creates these helper elements:

| Element | Purpose | Default CSS |
|---------|---------|------------|
| `.xterm-helper-textarea` | Captures keyboard input for IME and mobile support | `position: absolute; left: -9999em; opacity: 0;` |
| `.xterm-char-measure-element` | Measures character dimensions for proper terminal sizing | `visibility: hidden; left: -9999em;` |
| `.composition-view` | Displays IME composition text | `display: none;` |
| `.xterm-helpers` | Container for helper elements | `position: absolute; top: 0; z-index: 5;` |

These elements are intentionally hidden but remain functional for xterm.js operation.

## Alternative Approaches (Not Recommended)

### Using ::ng-deep (Prohibited)

According to our CSS coding standards, `::ng-deep` is deprecated and must not be used:

```scss
// ❌ Wrong: Using ::ng-deep
::ng-deep .xterm-helpers {
  visibility: hidden;
}
```

### Using ViewEncapsulation.None (Prohibited)

Setting `ViewEncapsulation.None` is strictly prohibited as it disables style isolation and causes global pollution:

```typescript
// ❌ Wrong: Using ViewEncapsulation.None
@Component({
  encapsulation: ViewEncapsulation.None, // ❌ STRICTLY PROHIBITED
  // ...
})
```

### Using !important (Prohibited)

According to our CSS coding standards, `!important` must not be used:

```scss
// ❌ Wrong: Using !important
.xterm-helpers {
  visibility: hidden !important;
}
```

## Related Files

- `angular.json` - Global styles configuration
- `src/app/components/project-map/web-console/web-console.component.ts` - Embedded console component
- `src/app/components/web-console-full-window/web-console-full-window.component.ts` - Full-window console component
- `node_modules/xterm/css/xterm.css` - xterm.js's own CSS

## References

- [xterm.js GitHub](https://github.com/xtermjs/xterm.js)
- [Angular View Encapsulation](https://angular.dev/guide/components/host-elements-and-templates#styling)
- [GNS3 Web UI CSS Coding Standards](../css/01-css-coding-standards.md)
