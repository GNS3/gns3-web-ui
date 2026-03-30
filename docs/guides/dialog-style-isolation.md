# Dialog Style Isolation - Dialog Styling Architecture

> Centralized Dialog Styling with Component-Specific Overrides

**Last Updated**: 2026-03-30
**Status**: ✅ Active

---

## Architecture Overview

GNS3 Web UI uses a **layered dialog styling architecture**:

```
┌─────────────────────────────────────────┐
│         .base-dialog-panel              │  ← Base Styles
│    (typography, spacing, common styles) │
└──────────────────┬──────────────────────┘
                   ↓ Inherited
┌─────────────────────────────────────────┐
│    .configurator-dialog-panel           │  ← Configurator Overrides
│    (800px, tabs, form-grid, disk-card)  │
└──────────────────┬──────────────────────┘
                   ↓ Applied
┌─────────────────────────────────────────┐
│      Dialog Component                   │
└─────────────────────────────────────────┘
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **Consistency** | All dialogs share unified visual appearance |
| **Maintainability** | Base styles defined once, changes propagate everywhere |
| **Flexibility** | Components can add specific overrides when needed |
| **DRY Principle** | No repetition of common styles across components |

---

## Panel Classes Reference

### Base Dialog Panel

**Class**: `.base-dialog-panel`
**Purpose**: All dialogs inherit this for common styles

| Element | Spacing | Notes |
|---------|---------|-------|
| Title | 24px 24px 0 24px | Font: 18px, weight 500 |
| Content | 16px 24px 0 24px | With overflow-y: auto |
| Actions | 16px 24px | justify-content: flex-end, gap: 8px |
| Form fields | margin-bottom: 4px | |
| Checkboxes | margin-bottom: 8px | |
| Cards | margin-bottom: 16px | |

### Configurator Dialog Panel

**Class**: `.configurator-dialog-panel`
**Purpose**: Node configuration dialogs (QEMU, IOS, Docker, etc.)

| Property | Value |
|----------|-------|
| Max Width | 800px |
| Max Height | 80vh |
| Content Height | calc(80vh - 140px) |

### Simple Dialog Panel

**Class**: `.simple-dialog-panel`
**Purpose**: Sub dialogs like Image Creator

| Property | Value |
|----------|-------|
| Max Width | 500px |

---

## Usage Patterns

### Pattern 1: Standard Dialog

```typescript
this.dialog.open(MyDialogComponent, {
  panelClass: ['base-dialog-panel'],
});
```

### Pattern 2: Configuration Dialog

```typescript
this.dialog.open(ConfiguratorDialogComponent, {
  panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
});
```

### Pattern 3: Simple Sub-Dialog

```typescript
this.dialog.open(ImageCreatorDialog, {
  panelClass: ['simple-dialog-panel'],
});
```

---

## Form Layout Patterns

### Two-Column Form Grid

```
┌─────────────────┬─────────────────┐
│    Field 1      │    Field 2      │
├─────────────────┴─────────────────┤
│        Full Width Checkbox         │
└────────────────────────────────────┘
```

**Classes**: `.form-grid` + `.form-grid__full`

### Card Layout

```
┌─────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐    │
│  │   Card 1    │ │   Card 2    │    │
│  │   HDA       │ │   HDB       │    │
│  └─────────────┘ └─────────────┘    │
│  ┌─────────────────────────────┐    │
│  │         Card 3 (Full)       │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Classes**: `.disk-cards-grid` + `.disk-card`

---

## Spacing System

The dialog system follows an 8px base spacing grid:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline elements |
| sm | 8px | Compact spacing |
| md | 12px | Between related items |
| base | 16px | Standard padding |
| lg | 24px | Section spacing |
| xl | 32px | Major sections |

---

## Best Practices

### DO

- ✅ Include `'base-dialog-panel'` in panelClass for standard dialogs
- ✅ Use Material Design 3 theme variables (`--mat-sys-*`)
- ✅ Follow the 8px spacing system
- ✅ Use semantic class names (e.g., `.configurator-dialog-panel`)

### DON'T

- ❌ Use `::ng-deep` in component styles
- ❌ Hardcode color values
- ❌ Use `ViewEncapsulation.None`
- ❌ Pass panelClass as string (must be array)

---

## Related Files

| File | Purpose |
|------|---------|
| `src/styles/_dialogs.scss` | Centralized dialog styles |
| `src/app/components/project-map/node-editors/configurator/` | Configurator dialogs |

---

**Last Updated**: 2026-03-30
