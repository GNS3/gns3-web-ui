# Standalone Components

This directory stores newly created **Standalone Components**.

## Directory Structure

```
standalone/
├── components/
│   ├── buttons/    # Button components
│   ├── forms/      # Form components
│   ├── indicators/ # Indicator components (loading bars, badges, etc.)
│   └── layout/     # Layout components
└── README.md
```

## Usage

### Creating a New Standalone Component

```bash
ng g component standalone/components/buttons/my-button --standalone
```

### Example Component Structure

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-my-button',
  imports: [CommonModule],
  template: `
    <button
      [class.primary]="variant === 'primary'"
      [class.secondary]="variant === 'secondary'"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button { padding: 8px 16px; border-radius: 4px; }
    .primary { background: blue; color: white; }
    .secondary { background: gray; color: white; }
  `]
})
export class MyButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
  onClick = output<MouseEvent>();
}
```

## Migration Guide

### Migrating from NgModule Components

1. Add `standalone: true`
2. Add `imports: []` to declare dependencies
3. Use `input()` instead of `@Input()`
4. Use `output()` instead of `@Output()`
5. Remove from NgModule's declarations

### Best Practices

- ✅ Use `input()` / `output()` functions
- ✅ Use `inject()` for dependency injection
- ✅ Use `computed()` for computed properties
- ✅ Use `@if` / `@for` control flow
- ✅ Use OnPush change detection strategy

## Related Documents

- [Migration Plan Document](../../MIGRATION_PLAN.md)
- [Task List](../../MIGRATION_TASKS.md)

---

**Last Updated**: 2026-03-21
