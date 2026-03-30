# Angular Zoneless 开发指南

> 本项目基于 Angular 21 Zoneless 架构。Zone.js 已禁用，所有变更检测均为显式控制。

---

## 核心要求

| 规则 | 说明 |
|------|------|
| **OnPush** | 所有组件必须使用 `ChangeDetectionStrategy.OnPush` |
| **Standalone** | 所有组件必须为 standalone（Angular 21 默认） |
| **Signals** | 状态管理优先使用 signals |
| **markForCheck** | 异步操作后必须调用 `cd.markForCheck()` |

---

## 禁止的 API

| API | 替代方案 |
|-----|---------|
| `Zone.run()` | `effect()` 或直接状态更新 |
| `NgZone` | `ChangeDetectorRef.markForCheck()` |
| `[(ngModel)]` | `model()` 信号 或 Reactive Forms |
| `ApplicationRef.tick()` | `cd.markForCheck()` |

---

## 关键模式

### 1. Signal 输入

```typescript
// ✅ 使用 signal input
readonly myValue = input<string>('');
readonly count = input<number>(0);

// ❌ 避免 setter
@Input() set value(v: string) { this._value.set(v); }
```

### 2. Model 信号（双向绑定）

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

### 3. 异步操作后标记检查

```typescript
constructor(private cd: ChangeDetectorRef) {}

ngOnInit() {
  this.http.get('/api/data').subscribe(data => {
    this.data.set(data);
    this.cd.markForCheck();  // 必须调用
  });
}
```

### 4. 动态组件加载

```typescript
// 创建组件后必须调用 detectChanges()
this.instance = this.container.createComponent(MyComponent);
this.instance.changeDetectorRef.detectChanges();
```

---

## 参考链接

- [Angular Zoneless 官方文档](https://angular.dev/guide/zoneless)
- [Model Input Signals](https://angular.dev/tutorials/signals/6-two-way-binding-with-model-signals)
- [ChangeDetectorRef](https://angular.dev/api/core/ChangeDetectorRef)

---

## 已知问题

### mat-checkbox 与 FormsModule

在 Zoneless 模式下，显示用 checkbox 优先使用 `[checked]` 而非 `[ngModel]`：

```html
<!-- ✅ 推荐：显示用 checkbox -->
<mat-checkbox [checked]="isVisible" (change)="toggle($event.checked)">

<!-- ⚠️ 仅在需要双向绑定时使用 ngModel -->
```

### 动态组件加载

`ViewContainerRef.createComponent` 在 Zoneless 模式下不会自动触发变更检测。创建组件后必须调用 `detectChanges()`。
