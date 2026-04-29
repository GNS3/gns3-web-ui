# GNS3 Web UI - Claude Code Assistant Guide

> Essential information for Claude Code to work effectively with the GNS3 Web UI project.

**Last Updated**: 2026-04-06

---

## Project Overview

**GNS3 Web UI** is the web-based graphical user interface for [GNS3](https://www.gns3.com/), a network software emulator.

### Key Information

| Item | Value |
|------|-------|
| **Version** | 3.1.0-dev.1 |
| **License** | GPLv3 |
| **Framework** | Angular 21.0.0 (Zoneless) |
| **Package Manager** | Yarn |
| **Node Version** | >=18.0.0 |

### Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Angular 21.0.0 (Zoneless) |
| UI Library | Angular Material 21.0.0 (MDC-based) |
| State Management | Signals (modern) + RxJS (legacy) |
| Change Detection | Zoneless (no Zone.js) |
| Styling | SCSS (196 files), Bootstrap 5.3.8, Angular Material 21.0.0 |
| Map Rendering | D3.js (dagre-d3-es) |
| Terminal Emulation | xterm.js 5.5.0 |
| Testing | Vitest 4.1.2 |

---

## Project Structure

```
gns3-web-ui/
├── src/app/
│   ├── components/         # 32 component directories
│   ├── services/           # 137 service files
│   ├── stores/             # State management (AI Chat store)
│   ├── models/             # TypeScript interfaces
│   ├── cartography/        # D3.js map rendering
│   └── material.imports.ts # Centralized Material imports
├── src/styles/             # SCSS style files
├── docs/                   # Project documentation
└── ...
```

---

## Development Commands

```bash
yarn install              # Install dependencies
yarn ng serve             # Development server (http://127.0.0.1:4200/)
yarn ng build             # Production build
yarn ng test              # Run tests
yarn ng lint              # Lint code
```

---

## Architecture Patterns

### ⚠️ CRITICAL: Zoneless Framework

**Zone.js is NOT used.** All change detection is explicit.

#### Forbidden APIs (STRICTLY PROHIBITED)

| API | Alternative |
|-----|-------------|
| `Zone.run()` | `effect()` or direct state updates |
| `NgZone` | `ChangeDetectorRef.markForCheck()` |
| `[(ngModel)]` | `model()` signals or Reactive Forms |
| `ApplicationRef.tick()` | `cd.markForCheck()` |

### Standalone Components

All components must be standalone with `ChangeDetectionStrategy.OnPush`.

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent { }
```

### Signal Inputs

```typescript
// ✅ Signal input
readonly myValue = input<string>('');

// ❌ Avoid setter
@Input() set value(v: string) { this._value.set(v); }
```

### Model Signals (Two-Way Binding)

```typescript
name = model('');
<input [value]="name()" (input)="name.set($event.target.value)" />
```

### Async Operations

```typescript
constructor(private cd: ChangeDetectorRef) {}

loadData() {
  this.http.get('/api/data').subscribe(data => {
    this.data.set(data);
    this.cd.markForCheck(); // Required after async
  });
}
```

---

## CSS/Style Conventions

### Critical Rules

| Rule | Description |
|------|-------------|
| **No `!important`** | Use selector specificity |
| **No `::ng-deep`** | Use ViewEncapsulation or global styles |
| **No `:deep()`** | Use ViewEncapsulation or global styles (style penetration forbidden) |
| **No `ViewEncapsulation.None`** | Causes style pollution |
| **No hardcoded colors** | Use Material theme CSS variables (`--mat-sys-*`) |
| **Dialog styles centralized** | All in `src/styles/_dialogs.scss` |
| **Use `panelClass`** | For dialog style scoping |

### Material Theme Variables

**All colors must use `--mat-sys-*` variables. No fallback colors allowed.**

> **⚠️ No fallback values**: Do not use fallback colors like `var(--mat-sys-primary, #6750A4)`. Material Design 3 variables are always defined in themes.

| Category | Prefix | Purpose |
|----------|--------|---------|
| Primary | `--mat-sys-primary` | FABs, buttons, links |
| Surface | `--mat-sys-surface` | Cards, sheets, dialogs |
| Background | `--mat-sys-background` | Page background |
| Error | `--mat-sys-error` | Error states |
| Container | `--mat-sys-surface-container-*` | Elevation levels |

**Reference**: `docs/guides/css/02-material3-variables.md`

### Correct Examples

```scss
// ✅ Correct
.card {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

// ✅ BEM naming
.gns3-card {
  &__header { padding: 16px; }
  &--disabled { opacity: 0.5; }
}
```

### Incorrect Examples

```scss
// ❌ Wrong: !important
.card { width: 100% !important; }

// ❌ Wrong: ::ng-deep
::ng-deep .mat-mdc-button { border-radius: 8px; }

// ❌ Wrong: Hardcoded colors
.button { background-color: #2196f3; }

// ❌ Wrong: Fallback colors (not allowed)
.button { background-color: var(--mat-sys-primary, #6750A4); }
```

### Dialog Styling

```typescript
const dialogRef = this.dialog.open(MyDialogComponent, {
  panelClass: 'my-custom-dialog-panel',
});
```

```scss
// In src/styles/_dialogs.scss
.my-custom-dialog-panel {
  .mat-mdc-dialog-surface {
    background: var(--mat-sys-surface);
  }
}
```

---

## Variable Naming Conventions

### TypeScript

| Type | Convention | Example |
|------|------------|---------|
| Classes/Interfaces | PascalCase | `class MyService` |
| Methods/Functions | camelCase | `getTemplate()` |
| Variables | camelCase | `projectId` |
| Private members | `_prefix` | `_state` |
| Signals | camelCase | `isActive` |
| Model signals | field name | `name` |

### SCSS/CSS

| Type | Convention | Example |
|------|------------|---------|
| Component root | kebab-case + BEM | `.gns3-card` |
| BEM element | `__` separator | `.gns3-card__header` |
| BEM modifier | `--` separator | `.gns3-card--disabled` |

### Template

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `<app-project-map>` |
| Events | (eventName) | `(click)` |
| Property binding | [property] | `[node]="selected"` |
| Two-way binding | `[(value)]` for model signals | `[(name)]` |

---

## Angular 21 Migration

### Current Status

- **Total Components**: 245 component files
- **OnPush Applied**: 248 files (100% migration complete)
- **Zoneless Compatible**: 100%

### Key Patterns

#### Input Setter to Signal Input

```typescript
// Before
@Input() set value(v: string) { this._value.set(v); }

// After
readonly value = input<string>('');
```

#### ngModel Migration

```typescript
// ❌ Before
<input [(ngModel)]="template.name" />

// ✅ After
<input [value]="name()" (input)="name.set($event.target.value)" />
```

---

## Pre-commit Checklist

### CSS/Style
- [ ] No `!important` in SCSS
- [ ] No `::ng-deep` in SCSS
- [ ] No `ViewEncapsulation.None`
- [ ] No hardcoded colors (auto-checked, see `.husky/check-hardcoded-colors.sh`)
- [ ] Material theme variables (`--mat-sys-*`) used
- [ ] Dialog styles in `src/styles/_dialogs.scss`

### Framework
- [ ] `ChangeDetectionStrategy.OnPush` applied
- [ ] `markForCheck()` after async operations
- [ ] No forbidden Zone.js APIs

### Code Quality
- [ ] No TypeScript/lint errors
- [ ] **NEVER commit/push without explicit user instruction**

---

## Hardcoded Color Protection

**Two-layer protection system** prevents code quality bypass:
- **Pre-commit**: Auto-checks for hardcoded colors + warns on `.husky/` modifications
- **CI**: Requires `hooks-update` label for hook changes

**Documentation**: [docs/guides/css/hardcoded-color-protection.md](docs/guides/css/hardcoded-color-protection.md)

---

## Documentation

**Full documentation index**: `docs/README.md`

| Document | Description |
|----------|-------------|
| `docs/features/ai-chat/ai-chat-guide.md` | ⭐ AI Chat implementation guide |
| `docs/features/context-menu.md` | Context menu (38 actions) |
| `docs/framework/angular-21/zoneless-guide.md` | ⭐ Zoneless patterns |
| `docs/framework/angular-21/vitest-test-isolation-guide.md` | ⭐ Test environment pollution fix |
| `docs/framework/angular-21/migration-progress.md` | Migration status tracking |
| `docs/guides/dialog-style-isolation.md` | ⭐ Dialog styling architecture |
| `docs/guides/css/02-material3-variables.md` | Material Design 3 CSS variables |
| `docs/guides/css/hardcoded-color-protection.md` | ⭐ Multi-layer color protection mechanism |
| `docs/known-issues/route-transition-white-flash.md` | Route transition white flash issue |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/material.imports.ts` | Centralized Material imports |
| `src/styles/_dialogs.scss` | Centralized dialog styles |
| `src/styles.scss` | Global styles entry point |
| `src/theme.scss` | Theme configuration |
