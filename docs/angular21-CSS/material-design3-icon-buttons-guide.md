# Material Design 3 Icon Buttons - Implementation Guide

This document records the implementation of Material Design 3 (MD3) icon buttons for the controllers table, providing a reference for future form and table component styling.

## Overview

This guide demonstrates how to properly style Angular Material icon buttons using MD3 CSS variables and best practices, ensuring compliance with the project's CSS coding standards.

## Key Implementation Details

### 1. Button Container Styling

Use MD3 CSS variables to control button dimensions and state layer:

```scss
button[mat-icon-button] {
  // Layout (CSS native properties - no Material variables available)
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  // Material Design 3 CSS Variables
  --mat-icon-button-state-layer-size: 32px;  // Controls hover background size
  --mat-icon-button-icon-size: 20px;         // Controls icon size

  border-radius: 50%;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Why this approach**:
- ✅ Uses official Material CSS variables where available
- ✅ CSS native properties for layout (Material doesn't provide these)
- ✅ Follows MD3 specifications
- ✅ Complies with project coding standards

### 2. Hover State Layer Implementation

Create a hover effect using a `::before` pseudo-element for the state layer:

```scss
button[mat-icon-button] {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: var(--mat-icon-button-state-layer, var(--mat-sys-on-surface-variant, #1f1f1f));
    opacity: 0;
    transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover::before {
    opacity: var(--mat-icon-button-hover-state-layer-opacity, 0.08);
  }

  &:active::before {
    opacity: var(--mat-icon-button-pressed-state-layer-opacity, 0.12);
  }
}
```

**Key points**:
- State layer opacity follows MD3 specifications: hover 8%, pressed 12%
- Uses Material theme variables for colors
- Smooth transitions with Material easing curves

### 3. Semantic Color Scheme

Assign different colors to different button actions using theme variables:

```scss
// Primary action (e.g., "Go to Projects")
.primary-action-btn {
  &::before {
    background-color: var(--mat-sys-primary, #1976d2);
  }

  &:hover::before {
    opacity: 0.12;
  }

  &:hover mat-icon {
    color: var(--mat-sys-primary, #1976d2);
  }
}

// Start action (success/green)
button[mat-icon-button]:has(.mat-icon[aria-label*="Start"]) {
  &::before {
    background-color: var(--mat-sys-tertiary, #4caf50);
  }

  &:hover::before {
    opacity: 0.12;
  }

  &:hover mat-icon {
    color: var(--mat-sys-tertiary, #4caf50);
  }
}

// Stop action (warning/orange)
button[mat-icon-button]:has(.mat-icon[aria-label*="Stop"]) {
  &::before {
    background-color: var(--mat-sys-error, #ff9800);
  }

  &:hover::before {
    opacity: 0.12;
  }

  &:hover mat-icon {
    color: var(--mat-sys-error, #ff9800);
  }
}

// Delete action (error/red)
button[color="warn"] {
  &::before {
    background-color: var(--mat-sys-error, #f44336);
  }

  &:hover::before {
    opacity: 0.12;
  }

  &:hover mat-icon {
    color: var(--mat-sys-error, #f44336);
  }
}
```

**Color scheme**:
- **Primary actions**: `--mat-sys-primary` (blue)
- **Positive actions**: `--mat-sys-tertiary` (green)
- **Warning actions**: `--mat-sys-error` (orange)
- **Destructive actions**: `--mat-sys-error` (red)

### 4. Icon Animation

Add subtle icon scaling on interaction:

```scss
button[mat-icon-button] {
  mat-icon {
    transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  &:hover mat-icon {
    transform: scale(1.08);
  }

  &:active mat-icon {
    transform: scale(0.95);
  }
}
```

## Available Material CSS Variables

### Icon Button Variables

```scss
// Colors
--mat-icon-button-state-layer       // State layer background color
--mat-icon-button-icon              // Icon color
--mat-icon-button-ripple            // Ripple effect color

// Sizes
--mat-icon-button-icon-size         // Icon size (default: 24px)
--mat-icon-button-state-layer-size  // State layer size (default: 48px)
--mat-icon-button-touch-target-size // Touch target size (accessibility)

// Opacity
--mat-icon-button-hover-state-layer-opacity    // Hover opacity (default: 0.08)
--mat-icon-button-focus-state-layer-opacity    // Focus opacity
--mat-icon-button-pressed-state-layer-opacity  // Pressed opacity (default: 0.12)

// Other
--mat-icon-button-container-shape   // Border radius
```

## Table Layout Best Practices

### Width Management

For consistent layout across the application:

```scss
// Container width
.table-container {
  width: 100%;
  max-width: 1000px;  // Adjust based on content needs
  margin: 0 auto;
}

// Search form
.controllers-search-form {
  width: 100%;
  max-width: 1000px;  // Match table width
  margin: 16px auto;
}

// Header
.default-header {
  max-width: 1000px;  // Match table width
  margin: 0 auto;
}
```

### Actions Column Styling

```scss
// Actions cell
mat-cell[mat-column="actions"] {
  justify-content: flex-end;
  padding: 0 16px;
  overflow: visible;  // Allow hover effects to overflow
}

// Actions button container
.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  // Don't use gap - Material buttons have built-in spacing
}
```

## Common Pitfalls

### ❌ What NOT to Do

```scss
// Don't use gap - it doesn't work with table layout
.actions-cell {
  gap: 4px;  // ❌ Won't work in HTML tables
}

// Don't use hardcoded colors
button:hover {
  background-color: rgba(244, 67, 54, 0.1);  // ❌ Hardcoded
}

// Don't use !important
button {
  margin: 0 !important;  // ❌ Violates coding standards
}

// Don't use ::ng-deep
::ng-deep .mat-icon-button {  // ❌ Deprecated API
  border-radius: 8px;
}
```

### ✅ What TO Do

```scss
// Use Material variables
button:hover::before {
  opacity: var(--mat-icon-button-hover-state-layer-opacity, 0.08);  // ✅
}

// Use theme colors
&::before {
  background-color: var(--mat-sys-primary, #1976d2);  // ✅
}

// Use proper selectors
button[mat-icon-button]:has(.mat-icon[aria-label*="Start"]) {  // ✅
  // ...
}
```

## Compliance Checklist

Before committing changes, ensure:

- [ ] No hardcoded color values
- [ ] No `!important` usage
- [ ] No `::ng-deep` usage
- [ ] Material CSS variables used where available
- [ ] CSS native properties for layout (display, width, height, etc.)
- [ ] Theme variables for colors (`--mat-sys-*`)
- [ ] Follows Material Design 3 specifications
- [ ] Proper semantic naming for button variants

## Migration from Angular 14 to Angular 21

### Key Changes

1. **Icon Button Styling**
   - Old: Direct background-color manipulation
   - New: State layer with opacity control

2. **Color System**
   - Old: Hardcoded RGBA values
   - New: Theme tokens (`--mat-sys-*`)

3. **Layout Control**
   - Old: Margin/padding adjustments
   - New: CSS variables for sizes

4. **Hover Effects**
   - Old: Transform scale on button
   - New: State layer with icon color change

## Example: Complete Implementation

See `src/app/components/controllers/controllers.component.scss` for the complete implementation of MD3 icon buttons in a table context.

## Resources

- [Angular Material CDK Table Source Code](https://github.com/angular/components/blob/main/src/cdk/table/table.ts)
- [Material Design 3 Button Specs](https://m3.material.io/components/buttons/overview)
- [Project CSS Coding Standards](./css-coding-standards.md)
- [Material CSS Variables Reference](./material-css-variables-complete.md)

---

**Version**: 1.0
**Last Updated**: 2026-03-23
**Related Component**: Controllers Table
**Angular Version**: 21.x
