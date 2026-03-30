# ngModel 迁移进度

> 将 `[(ngModel)]` 迁移至 Angular 21 signal 模式

**最后更新**: 2026-03-27
**总文件数**: 40
**已完成**: 1 (2.5%)
**待迁移**: 39 (97.5%)

---

## 迁移模式

### Pattern 1: 显示用 Checkbox

```html
<!-- Before -->
<mat-checkbox [ngModel]="isVisible" (change)="...">

<!-- After -->
<mat-checkbox [checked]="isVisible" (change)="...">
```

### Pattern 2: Text Input → model()

```typescript
// Component
searchText = model('');

// Template
<input [value]="searchText()" (input)="searchText.set($event.target.value)" />
```

### Pattern 3: Select → model()

```typescript
// Component
type = model('');

// Template
<mat-select [value]="type()" (selectionChange)="type.set($event.value)">
```

---

## 待迁移文件清单

### 高优先级 (1)

| 文件 | 原因 |
|------|------|
| `settings.component.html` | 5 个 checkboxes |

### 中优先级 (22)

| 分类 | 文件数 |
|------|--------|
| Preferences (含 symbol/adapters/ports 等) | 11 |
| Project Map editors | 10 |
| Template components | 2 |

### 低优先级 (16)

| 分类 | 文件数 |
|------|--------|
| Search inputs | ~15 |
| Other | ~1 |

---

## 已完成

- `project-map.component.html` - 8 checkboxes 迁移至 `[checked]`

---

## 相关文档

- [Zoneless 开发指南](./zoneless-guide.md)
