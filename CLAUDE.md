# GNS3 Web UI - Claude Code Assistant Guide

> This document provides essential information for Claude Code to understand and work effectively with the GNS3 Web UI project.

**Last Updated**: 2026-03-25

---

## Project Overview

**GNS3 Web UI** is the web-based graphical user interface for [GNS3 (Graphical Network Simulator-3)](https://www.gns3.com/), a network software emulator that allows users to design and simulate complex network topologies.

### Key Information

| Item | Value |
|------|-------|
| **Version** | 3.1.0-dev.1 |
| **License** | GPLv3 |
| **Repository** | https://github.com/GNS3/gns3-web-ui.git |
| **Framework** | Angular 21.0.0 |
| **Package Manager** | Yarn |
| **Node Version** | >=18.0.0 |

### Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Angular 21.0.0 |
| UI Library | Angular Material 21.0.0 (MDC-based) |
| State Management | Signals (modern) + RxJS (legacy) |
| Styling | SCSS, Bootstrap 5.1.3, Tailwind CSS 3.4.19 |
| Map Rendering | D3.js (dagre-d3-es for graph layout) |
| Terminal Emulation | xterm.js |
| Testing | Karma + Jasmine |

---

## Project Structure

```
gns3-web-ui/
├── src/
│   ├── app/
│   │   ├── components/         # 253 components
│   │   │   ├── project-map/    # Main network topology map
│   │   │   ├── preferences/    # Settings/templates management
│   │   │   ├── projects/       # Project management
│   │   │   └── ...
│   │   ├── services/           # 71 services
│   │   ├── stores/             # State management (AI Chat store)
│   │   ├── models/             # TypeScript interfaces/models
│   │   ├── cartography/        # D3.js map rendering components
│   │   └── material.imports.ts # Centralized Angular Material imports
│   ├── styles/                 # SCSS style files
│   └── styles.scss             # Global styles entry point
├── docs/                       # Project documentation
├── angular.json                # Angular CLI configuration
├── package.json                # Dependencies
└── tslint.json                 # TypeScript linting rules
```

---

## Development Commands

```bash
# Install dependencies
yarn install

# Development server (http://127.0.0.1:4200/)
yarn ng serve

# Production build
yarn ng build --configuration=production

# Run tests
yarn ng test

# Lint code
yarn ng lint

# Format code with Prettier
yarn prettier:write

# Check formatting
yarn prettier:check
```

---

## Architecture Patterns

### 1. Standalone Components

All components use standalone architecture (no NgModules required for components).

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class MyComponent { }
```

### 2. Change Detection Strategy

- **OnPush** is the standard for all components (105/253 already migrated)
- All components/services are **Zoneless compatible** (100% verified)
- Migration progress tracked in `docs/angular-21/component-migration-tracker.md`

### 3. Signal-Based State Management

**Modern approach** (preferred):
```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private _state = signal(initialValue);
  readonly state = this._state.asReadonly();
}
```

**Legacy approach** (still acceptable):
```typescript
@Injectable({ providedIn: 'root' })
export class LegacyService {
  private _subject = new BehaviorSubject<T>(initial);
  readonly stream$ = this._subject.asObservable();
}
```

### 4. Model Input Signals (Two-Way Binding)

Use `model()` for two-way data binding instead of `ngModel`:

```typescript
// Model signals for form fields
name = model('');
adaptersCount = model(0);
tags = model<string[]>([]);

// In template - text input
<input matInput [value]="name()" (input)="name.set($event.target.value)" />

// In template - checkbox
<mat-checkbox [checked]="consoleAutoStart()" (change)="consoleAutoStart.set($event.checked)">
```

### 5. Centralized Material Imports

All Angular Material modules are centralized in:
- `/src/app/material.imports.ts` - imports

---

## Coding Standards

### TypeScript/Angular Conventions

| Rule | Setting |
|------|---------|
| Arrow return shorthand | Enabled |
| Semicolons | Always required |
| Quotes | Single quotes allowed |
| Max line length | 140 characters |
| Component selector prefix | `app` (kebab-case) |
| Directive selector prefix | `app` (camelCase) |
| `no-submodule-imports` | Disabled |
| `no-implicit-dependencies` | Disabled |

### Component File Structure

```
component/
├── component.component.ts      # Logic
├── component.component.html    # Template
├── component.component.scss    # Styles
└── component.component.spec.ts # Tests
```

### Service Patterns

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  // Modern: Use signals
  private _state = signal(initialValue);
  readonly state = this._state.asReadonly();

  // With computed values
  readonly derivedState = computed(() => this._state() * 2);
}
```

---

## CSS/Style Conventions

> **Critical**: Follow these CSS standards strictly. See `docs/angular21-CSS/01-css-coding-standards.md` for full details.

### Rules Summary

| Rule | Description |
|------|-------------|
| **No `!important`** | Solve specificity through selector specificity |
| **No `::ng-deep`** | Deprecated - use ViewEncapsulation or global styles |
| **No `ViewEncapsulation.None`** | Strictly prohibited (causes style pollution) |
| **No hardcoded colors** | Use Material theme CSS variables (`--mat-sys-*`) |
| **No custom colors in components** | All colors via Material theme tokens |
| **Dialog styles centralized** | All dialog styles in `src/styles/_dialogs.scss` |
| **Use `panelClass`** | For dialog style scoping |
| **BEM naming required** | Use `.gns3-card__header` pattern |
| **Style logic in HTML** | Prefer `[class.is-active]="signal()"` over string concatenation |

### Material Theme Variables

**Primary Colors**:
| Token | Purpose |
|-------|---------|
| `--mat-sys-primary` | Main theme color for FABs, buttons, links |
| `--mat-sys-on-primary` | Text/icons on primary color |
| `--mat-sys-primary-container` | Light/dark variant for containers |
| `--mat-sys-on-primary-container` | Text on primary container |

**Surface Colors**:
| Token | Purpose |
|-------|---------|
| `--mat-sys-background` | Page background |
| `--mat-sys-surface` | Cards, sheets, dialogs |
| `--mat-sys-surface-container-*` | Elevation levels (lowest, low, medium, high, highest) |
| `--mat-sys-outline` | Borders, dividers |

### Correct Examples

```scss
// ✅ Correct: Use Material theme variables
.card {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

// ✅ Correct: Use BEM naming
.gns3-card {
  &__header {
    padding: 16px;
  }

  &--disabled {
    opacity: 0.5;
  }
}

// ✅ Correct: HTML controls style classes
// TypeScript
isActive = signal(false);

// Template
<button [class.active]="isActive()">Click</button>
```

### Incorrect Examples

```scss
// ❌ Wrong: Using !important
.card {
  width: 100% !important;
}

// ❌ Wrong: Using ::ng-deep
::ng-deep .mat-mdc-button {
  border-radius: 8px;
}

// ❌ Wrong: Hardcoded colors
.button {
  background-color: #2196f3;
  color: white;
}

// ❌ Wrong: Using ViewEncapsulation.None
@Component({
  encapsulation: ViewEncapsulation.None, // ❌ STRICTLY PROHIBITED
})
```

### Dialog Styling

All dialog styles must be centralized in `src/styles/_dialogs.scss`:

```typescript
// Use panelClass when opening dialog
const dialogRef = this.dialog.open(MyDialogComponent, {
  panelClass: 'my-custom-dialog-panel',
});
```

```scss
// In src/styles/_dialogs.scss
.my-custom-dialog-panel {
  .mdc-dialog__surface,
  .mat-mdc-dialog-surface {
    background: var(--mat-sys-surface);
    color: var(--mat-sys-on-surface);
  }
}
```

---

## Variable Naming Conventions

### TypeScript

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `class MyService` |
| Interfaces | PascalCase | `interface NodeTemplate` |
| Methods/Functions | camelCase | `getTemplate()`, `saveProject()` |
| Variables | camelCase | `projectId`, `isLoading` |
| Private members | _prefix + camelCase | `_state`, `_httpClient` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Signals | camelCase with optional suffix | `isActive`, `nodes$` (observable) |
| Computed signals | camelCase, noun | `filteredNodes`, `totalCount` |
| Model signals | same name as field | `name`, `adaptersCount` |

### SCSS/CSS

| Type | Convention | Example |
|------|------------|---------|
| Component root class | kebab-case + BEM prefix | `.gns3-card`, `.project-map` |
| BEM element | __ separator | `.gns3-card__header` |
| BEM modifier | -- separator | `.gns3-card--disabled` |
| Custom properties | --prefixed-kebab-case | `--mat-sys-primary` |
| State classes | .is-* or .has-* | `.is-active`, `.has-error` |

### Template

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `<app-project-map>` |
| Events | (eventName) | `(click)`, `(ngSubmit)` |
| Property binding | [property] | `[node]="selectedNode"` |
| Two-way binding | [(ngModel)] or [(value)] | `[(name)]` for model signals |
| Style class binding | [class.className] | `[class.is-active]="isActive()"` |
| Structural directives | @if, @for, @switch | `@for (node of nodes(); track node.id)` |

---

## Angular 21 Migration

### Current Status

- **Total Components**: 253
- **OnPush Migrated**: 105 (42%)
- **Default Strategy**: 147 (58%)
- **Zoneless Compatible**: 100% (324/324)

### Migration Priorities

1. **Phase 1**: Migrate all components to `ChangeDetectionStrategy.OnPush`
2. **Phase 2**: Syntax optimization (`styleUrls` → `styleUrl`, remove `standalone: true`)
3. **Phase 3**: Issue fixes

### Key Migration Patterns

#### Input Setter to Signal Input

```typescript
// Before (using setter)
@Input() set value(v: string) { this._value.set(v); }
readonly value = this._value.asReadonly();

// After (using signal input)
readonly value = input<string>('');
```

#### ngModel to model()

```typescript
// Before
<input [(ngModel)]="template.name" />

// After
<input [value]="name()" (input)="name.set($event.target.value)" />
```

---

## File Organization

### Component Organization

```
components/
├── my-feature/
│   ├── my-feature.component.ts
│   ├── my-feature.component.html
│   ├── my-feature.component.scss
│   └── my-feature.component.spec.ts
```

### Service Organization

```
services/
├── api/
│   ├── project.service.ts
│   └── node.service.ts
└── settings/
    └── mapsettings.service.ts
```

### Model/Interface Organization

```
models/
├── project.model.ts
├── node.model.ts
└── template.model.ts
```

---

## Common Patterns

### Opening a Dialog

```typescript
const dialogRef = this.dialog.open(MyDialogComponent, {
  width: '500px',
  panelClass: 'my-custom-dialog-panel',
  data: { nodeId: this.nodeId() }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Handle result
  }
});
```

### Using Signals in Templates

```typescript
// TypeScript
readonly nodes = signal<Node[]>([]);
readonly selectedNodeId = model<number | null>(null);
readonly filteredNodes = computed(() =>
  this.nodes().filter(n => n.projectId === this.projectId())
);

// Template
@for (node of filteredNodes(); track node.id) {
  <div [class.selected]="node.id === selectedNodeId()"
       (click)="selectedNodeId.set(node.id)">
    {{ node.name }}
  </div>
}
```

### Using ChangeDetectorRef with OnPush

```typescript
constructor(private cd: ChangeDetectorRef) {}

// After async operations
this.http.get('/api/data').subscribe(data => {
  this.data.set(data);
  this.cd.markForCheck();
});
```

---

## Pre-commit Checklist

Before committing code, ensure:

- [ ] No `!important` in SCSS
- [ ] No `::ng-deep` in SCSS
- [ ] No `ViewEncapsulation.None` (except documented exception)
- [ ] No hardcoded color values
- [ ] Material theme variables used for colors
- [ ] Dialog styles use `panelClass` in centralized location
- [ ] Components use BEM naming convention
- [ ] Style logic controlled in HTML templates
- [ ] Code formatted with `yarn prettier:write`
- [ ] OnPush change detection strategy applied

---

## Documentation

Full documentation available in `/docs`:

| Document | Description |
|----------|-------------|
| `docs/README.md` | Documentation index |
| `docs/ai-chat-complete-guide.md` | AI Chat feature implementation |
| `docs/angular-21/phased-migration-plan.md` | Migration strategy |
| `docs/angular-21/model-input-signals.md` | Signal input patterns |
| `docs/angular21-CSS/01-css-coding-standards.md` | CSS coding standards |
| `docs/angular21-CSS/02-material3-css-variables.md` | Material 3 variable reference |
| `docs/dialog-style-isolation-guide.md` | Dialog styling guide |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/material.imports.ts` | Centralized Material module imports |
| `src/styles/_dialogs.scss` | Centralized dialog styles |
| `src/styles/_theme-generator.scss` | Material theme generation |
| `src/styles.scss` | Global styles entry point |
| `src/theme.scss` | Theme configuration |
| `angular.json` | Angular CLI configuration |
| `tslint.json` | TypeScript linting rules |
