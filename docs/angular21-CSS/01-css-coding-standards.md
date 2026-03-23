# GNS3 Web UI CSS 样式规范

本文档定义了 GNS3 Web UI 项目的样式编码规范，确保样式代码的一致性、可维护性和性能。

---

## 1. Angular Material 默认样式优先

**规则**：优先使用 Angular Material 提供的默认样式，避免不必要的样式覆盖。

```scss
// ✅ 正确：使用 Material 提供的默认样式
mat-form-field {
  width: 100%;
}

// ❌ 错误：覆盖 Material 默认样式
.mat-mdc-form-field {
  height: 50px;
}
```

---

## 2. 无颜色备用值

**规则**：禁止硬编码颜色值作为备用值，所有颜色应通过 Material 主题变量获取。

```scss
// ✅ 正确：使用 CSS 变量或 Material 主题
.card {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

// ❌ 错误：硬编码备用颜色
.card {
  background-color: var(--mat-sys-surface, #ffffff);
  color: var(--mat-sys-on-surface, #000000);
}
```

---

## 3. 禁止自定义背景色或其他颜色

**规则**：禁止在组件中自定义背景色、文本色等颜色，所有颜色必须引用 Material 主题 Token。

```scss
// ✅ 正确：使用 Material 主题变量
.button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
}

// ❌ 错误：自定义颜色
.button {
  background-color: #2196f3;
  color: white;
}
```

---

## 4. 禁止 !important

**规则**：严格禁止使用 `!important`，应通过选择器 specificity 解决样式优先级问题。

```scss
// ✅ 正确：通过选择器提升优先级
.form-field.mat-mdc-form-field {
  width: 100%;
}

// ❌ 错误：使用 !important
.form-field {
  width: 100% !important;
}
```

---

## 5. 禁止 ::ng-deep

**规则**：`::ng-deep` 是已弃用的 API，禁止使用。应使用 ViewEncapsulation 或全局样式。

```scss
// ✅ 正确：使用组件样式或全局样式
:host {
  display: block;
}

// ❌ 错误：使用 ::ng-deep
::ng-deep .mat-mdc-button {
  border-radius: 8px;
}
```

---

## 6. 清理冗余样式代码

**规则**：定期清理未使用和重复的样式代码，保持样式文件精简。

```scss
// ❌ 错误：冗余样式
.card {
  width: 100%;
  margin: 0;
  padding: 0;
}

.card {
  width: 100%;
  margin: 0;
}

// ✅ 正确：合并重复样式
.card {
  width: 100%;
  margin: 0;
  padding: 0;
}
```

---

## 7. 禁止修改第三方组件内层 DOM

**规则**：严禁在组件内部尝试修改第三方组件（Angular Material）的内层 DOM 结构。

如果必须修改 Angular Material 组件的尺寸或边距，应优先使用：

1. **CSS 变量（Custom Properties）**
2. **Density（密度）系统**

```scss
// ✅ 正确：使用 CSS 变量
mat-form-field {
  --mdc-text-field-container-height: 56px;
  --mat-form-field-container-justify-content: center;
}

// ✅ 正确：使用 Density
@use '@angular/material' as mat;

mat-form-field {
  @include mat.form-field-density(-1);
}
```

---

## 8. 组件 :host 布局属性明确定义

**规则**：所有组件都应明确定义 `:host` 的布局属性，避免在父组件中对子组件标签直接写 width/height。

```scss
// ✅ 正确：组件自身定义布局
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// ❌ 错误：父组件直接控制子组件尺寸
// parent.component.html
<app-child style="width: 500px; height: 300px;"></app-child>
```

---

## 9. 全面拥抱 CSS 自定义属性（Variables）

**规则**：Angular Material 3 已全面基于 CSS 变量，禁止直接硬编码颜色值。

```scss
// ✅ 正确：使用 Material 主题 Token
.button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border-color: var(--mat-sys-outline);
}

// ❌ 错误：硬编码颜色
.button {
  background-color: #2196f3;
  color: #ffffff;
  border-color: #e0e0e0;
}
```

---

## 10. 样式逻辑归 HTML，样式定义归 CSS

**规则**：优先使用 `[class.is-active]="signal()"` 切换类名，禁止在 TS 逻辑中拼接复杂的样式字符串。

```typescript
// ✅ 正确：使用信号控制类名
@Component({})
export class MyComponent {
  isActive = signal(false);

  toggle() {
    this.isActive.update(v => !v);
  }
}
```

```html
<!-- ✅ 正确：HTML 控制样式类 -->
<button [class.active]="isActive()">Click</button>
```

```typescript
// ❌ 错误：在 TS 中拼接样式字符串
this.renderer.setStyle(el, 'background-color', '#2196f3');
this.renderer.addClass(el, 'custom-style-' + this.variant);
```

```scss
// ✅ 正确：CSS 定义样式变体
.button.active {
  background-color: var(--mat-sys-primary);
}

.button.variant-primary {
  background-color: var(--mat-sys-primary-container);
}
```

---

## 11. 弹窗样式必须在全局 styles.scss 中定义

**规则**：针对弹窗的微调，必须在全局 `styles.scss` 中定义专门的 `panelClass`，禁止在组件局部作用域"钩"弹窗样式。

```typescript
// ✅ 正确：使用 panelClass
const dialogRef = this.dialog.open(MyDialogComponent, {
  panelClass: 'my-custom-dialog-panel',
  // ...
});
```

```scss
// ✅ 正确：在全局 styles.scss 中定义
.mat-mdc-dialog-panel.my-custom-dialog-panel {
  --mdc-dialog-container-max-width: 800px;
  --mdc-dialog-container-min-width: 400px;
}
```

```scss
// ❌ 错误：在组件局部作用域修改弹窗样式
// my-dialog.component.scss
::ng-deep .mat-mdc-dialog-container {
  max-width: 800px;
}
```

---

## 12. 强制 BEM 命名法

**规则**：即使有视图封装，也建议给组件根元素一个唯一的类名，防止在全局搜索或调试时找不到样式的源头。

```scss
// ✅ 正确：使用 BEM 命名法
.gns3-card {
  &__header {
    padding: 16px;
  }

  &__content {
    margin-top: 8px;
  }

  &--disabled {
    opacity: 0.5;
  }
}
```

```html
<!-- 使用示例 -->
<div class="gns3-card gns3-card--disabled">
  <div class="gns3-card__header">Title</div>
  <div class="gns3-card__content">Content</div>
</div>
```

---

## 附录：Material 3 主题变量参考

| 用途 | CSS 变量 |
|------|----------|
| 主色 | `--mat-sys-primary` |
| 主色文本 | `--mat-sys-on-primary` |
| 背景色 | `--mat-sys-surface` |
| 文本色 | `--mat-sys-on-surface` |
| 轮廓色 | `--mat-sys-outline` |
| 错误色 | `--mat-sys-error` |
| 容器色 | `--mat-sys-primary-container` |
| 悬停色 | `--mat-sys-hover` |
| 聚焦色 | `--mat-sys-focus` |

---

## 检查清单

在提交代码前，请确保：

- [ ] 没有使用 `!important`
- [ ] 没有使用 `::ng-deep`
- [ ] 没有硬编码颜色值
- [ ] 使用 Material 主题变量
- [ ] 弹窗样式使用 `panelClass`
- [ ] 组件使用 BEM 命名
- [ ] 样式逻辑在 HTML 中控制

---

**版本**: 1.0
**最后更新**: 2026-03-20
