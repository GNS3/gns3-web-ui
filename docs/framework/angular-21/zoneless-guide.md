# Angular Zoneless Development Guide

> This project uses Angular 21 Zoneless architecture. Zone.js is disabled, and all change detection is explicit.

---

## Core Requirements

| Rule | Description |
|------|-------------|
| **OnPush** | All components must use `ChangeDetectionStrategy.OnPush` |
| **Standalone** | All components must be standalone (Angular 21 default) |
| **Signals** | Prefer signals for state management |
| **markForCheck** | Must call `cd.markForCheck()` after async operations |

---

## Forbidden APIs

| API | Alternative |
|-----|-------------|
| `Zone.run()` | `effect()` or direct state updates |
| `NgZone` | `ChangeDetectorRef.markForCheck()` |
| `[(ngModel)]` | `model()` signals or Reactive Forms |
| `ApplicationRef.tick()` | `cd.markForCheck()` |

---

## Key Patterns

### 1. Signal Inputs

```typescript
// ✅ Use signal input
readonly myValue = input<string>('');
readonly count = input<number>(0);

// ❌ Avoid setter
@Input() set value(v: string) { this._value.set(v); }
```

### 2. Model Signals (Two-Way Binding)

```typescript
// ✅ Text input
name = model('');
<input [value]="name()" (input)="name.set($event.target.value)" />

// ✅ Checkbox
active = model(false);
<mat-checkbox [checked]="active()" (change)="active.set($event.checked)">

// ✅ Select
type = model('');
<mat-select [value]="type()" (selectionChange)="type.set($event.value)">
```

### 3. Mark Check After Async Operations

```typescript
constructor(private cd: ChangeDetectorRef) {}

ngOnInit() {
  this.http.get('/api/data').subscribe(data => {
    this.data.set(data);
    this.cd.markForCheck();  // Required
  });
}
```

### 4. Dynamic Component Loading

```typescript
// Must call detectChanges() after creating component
this.instance = this.container.createComponent(MyComponent);
this.instance.changeDetectorRef.detectChanges();
```

---

## References

- [Angular Zoneless Official Docs](https://angular.dev/guide/zoneless)
- [Model Input Signals](https://angular.dev/tutorials/signals/6-two-way-binding-with-model-signals)
- [ChangeDetectorRef](https://angular.dev/api/core/ChangeDetectorRef)

---

## Known Issues

### mat-checkbox with FormsModule

In Zoneless mode, prefer `[checked]` over `[ngModel]` for display-only checkboxes:

```html
<!-- ✅ Recommended: display-only checkbox -->
<mat-checkbox [checked]="isVisible" (change)="toggle($event.checked)">

<!-- ⚠️ Only use ngModel when two-way binding is needed -->
```

### Dynamic Component Loading

`ViewContainerRef.createComponent` does not automatically trigger change detection in Zoneless mode. Must call `detectChanges()` after creating a component.
