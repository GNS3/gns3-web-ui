# Material Design 3 CSS Variables Reference

> Based on Angular Material 21 MD3 Sass Mixin System

**Last Updated**: 2026-03-30
**Status**: ✅ Active

---

## Available Themes

| Class | Type | Primary | Tertiary | Use Case |
|-------|------|---------|----------|----------|
| `theme-deeppurple-amber` | Light | Purple | Yellow | Professional |
| `theme-indigo-pink` | Light | Indigo | Pink | Modern/Tech |
| `theme-pink-bluegrey` | Dark | Pink | Blue-grey | Entertainment |
| `theme-purple-green` | Dark | Purple | Green | Art/Design |

---

## Primary Colors

**Use**: FABs, buttons, active states, links, icons

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--mat-sys-primary` | Main color | #6750A4 | #D0BCFF |
| `--mat-sys-on-primary` | Text on primary | #FFFFFF | #381E72 |
| `--mat-sys-primary-container` | Light background | #EADDFF | #4F378B |
| `--mat-sys-on-primary-container` | Text on container | #21005D | #EADDFF |
| `--mat-sys-surface-tint` | Surface tint | #6750A4 | #D0BCFF |

---

## Secondary Colors

**Use**: Chips, filter chips, secondary buttons

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--mat-sys-secondary` | Secondary | #625B71 | #CCC2DC |
| `--mat-sys-on-secondary` | Text on secondary | #FFFFFF | #332D41 |
| `--mat-sys-secondary-container` | Container | #E8DEF8 | #4A4458 |
| `--mat-sys-on-secondary-container` | Text on container | #1D192B | #E8DEF8 |

---

## Tertiary Colors

**Use**: Third-party chips, decorative elements

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--mat-sys-tertiary` | Tertiary | #7D5260 | #EFB8C8 |
| `--mat-sys-on-tertiary` | Text on tertiary | #FFFFFF | #492532 |
| `--mat-sys-tertiary-container` | Container | #FFD8E4 | #633B48 |
| `--mat-sys-on-tertiary-container` | Text on container | #31111D | #FFD8E4 |

---

## Error Colors

**Use**: Error states, error messages

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--mat-sys-error` | Error | #B3261E | #F2B8B5 |
| `--mat-sys-on-error` | Text on error | #FFFFFF | #601410 |
| `--mat-sys-error-container` | Container | #F9DEDC | #8C1D18 |
| `--mat-sys-on-error-container` | Text on container | #410E0B | #F9DEDC |

---

## Surface Colors

**Use**: Page background, cards, sheets, dialogs

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--mat-sys-background` | Page background | #FFFBFE | #1C1B1F |
| `--mat-sys-on-background` | Text on background | #1C1B1F | #E6E1E5 |
| `--mat-sys-surface` | Default surface | #FFFBFE | #1C1B1F |
| `--mat-sys-on-surface` | Text on surface | #1C1B1F | #E6E1E5 |
| `--mat-sys-surface-variant` | Surface variant | #E7E0EC | #49454F |
| `--mat-sys-on-surface-variant` | Text on variant | #49454F | #CAC4D0 |
| `--mat-sys-outline` | Borders/dividers | #79747E | #938F99 |
| `--mat-sys-outline-variant` | Light borders | #CAC4D0 | #49454F |

---

## Surface Container Levels

**Use**: Navigation bars, cards, content sections (M3 replaces elevation with containers)

| Level | Variable | Light | Dark | Use Case |
|-------|----------|-------|------|----------|
| Lowest | `--mat-sys-surface-container-lowest` | #FFFFFF | #121212 | Page background |
| Low | `--mat-sys-surface-container-low` | #F7F2F7 | #1D1B1F | Bottom sheets |
| Default | `--mat-sys-surface-container` | #F3EDF7 | #211F26 | Cards, side nav |
| High | `--mat-sys-surface-container-high` | #ECE6F0 | #2B2831 | Dialogs, search |
| Highest | `--mat-sys-surface-container-highest` | #E6E0E9 | #36343B | Modals, nav |

---

## Typography

| Variable | Size | Weight | Line | Use Case |
|----------|------|--------|------|----------|
| `--mat-sys-display-large` | 57sp | - | 64 | |
| `--mat-sys-display-medium` | 45sp | - | 52 | |
| `--mat-sys-display-small` | 36sp | - | 44 | |
| `--mat-sys-headline-large` | 32sp | - | 40 | |
| `--mat-sys-headline-medium` | 28sp | - | 36 | |
| `--mat-sys-headline-small` | 24sp | - | 32 | |
| `--mat-sys-title-large` | 22sp | - | 28 | Dialog titles |
| `--mat-sys-title-medium` | 16sp | 500 | 24 | Section headers |
| `--mat-sys-title-small` | 14sp | 500 | 20 | |
| `--mat-sys-body-large` | 16sp | - | 24 | Primary text |
| `--mat-sys-body-medium` | 14sp | - | 20 | Secondary text |
| `--mat-sys-body-small` | 12sp | - | 16 | Hints, captions |
| `--mat-sys-label-large` | 14sp | 500 | 20 | Buttons |
| `--mat-sys-label-medium` | 12sp | 500 | 16 | Chips |
| `--mat-sys-label-small` | 11sp | 500 | 16 | Tags |

---

## Corner Radius

| Variable | Value | Use Case |
|----------|-------|----------|
| `--mat-sys-corner-none` | 0px | Dividers, strokes |
| `--mat-sys-corner-extra-small` | 4px | Chips, badges |
| `--mat-sys-corner-small` | 8px | Buttons, text fields |
| `--mat-sys-corner-medium` | 12px | Cards |
| `--mat-sys-corner-large` | 16px | FABs, dialogs |
| `--mat-sys-corner-extra-large` | 28px | Modal sheets |
| `--mat-sys-corner-full` | 50% | Circular buttons |

---

## State Layer Opacity

**Use**: Hover, focus, pressed, dragged states

| Variable | Value | State |
|----------|-------|-------|
| `--mat-sys-state-opacity-hover` | 0.08 | 8% on hover |
| `--mat-sys-state-opacity-focus` | 0.12 | 12% on focus |
| `--mat-sys-state-opacity-pressed` | 0.12 | 12% on press |
| `--mat-sys-state-opacity-dragged` | 0.16 | 16% on drag |

---

## Usage Pattern

```
.button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border-radius: var(--mat-sys-corner-full);
  padding: 0 24px;
  height: 40px;
}
```

---

## Variable Naming Quick Reference

```
--mat-sys-color        → Primary, Secondary, Tertiary, Error, Surface, Outline, Container
--mat-sys-typography   → display-*, headline-*, title-*, body-*, label-*
--mat-sys-corner       → none, extra-small, small, medium, large, extra-large, full
--mat-sys-state        → state-opacity-*
```

---

**Last Updated**: 2026-03-30
