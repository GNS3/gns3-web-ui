# Standalone Components

这个目录用于存放新创建的 **Standalone Components**（独立组件）。

## 目录结构

```
standalone/
├── components/
│   ├── buttons/    # 按钮组件
│   ├── forms/      # 表单组件
│   ├── indicators/ # 指示器组件（加载条、徽章等）
│   └── layout/     # 布局组件
└── README.md
```

## 使用说明

### 创建新的 Standalone 组件

```bash
ng g component standalone/components/buttons/my-button --standalone
```

### 示例组件结构

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

## 迁移指南

### 从 NgModule 组件迁移

1. 添加 `standalone: true`
2. 添加 `imports: []` 声明依赖
3. 使用 `input()` 替代 `@Input()`
4. 使用 `output()` 替代 `@Output()`
5. 移除 NgModule 中的 declarations

### 最佳实践

- ✅ 使用 `input()` / `output()` 函数
- ✅ 使用 `inject()` 进行依赖注入
- ✅ 使用 `computed()` 进行计算属性
- ✅ 使用 `@if` / `@for` 控制流
- ✅ 使用 OnPush 变更检测策略

## 关联文档

- [迁移计划文档](../../MIGRATION_PLAN.md)
- [任务清单](../../MIGRATION_TASKS.md)

---

**最后更新**: 2026-03-21
