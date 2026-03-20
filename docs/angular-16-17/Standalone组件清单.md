# Standalone 组件清单

## 概述

Angular 17 默认使用 Standalone Components，但项目仍可使用 NgModule。本文件记录当前项目的 Standalone 组件状态。

---

## 当前 Standalone 组件（共 3 个）

| 序号 | 文件路径 | 说明 |
|------|---------|------|
| 1 | `src/app/components/dialogs/confirmation-dialog/confirmation-dialog.component.ts` | 确认对话框 |
| 2 | `src/app/components/project-map/ai-chat/tool-details-dialog.component.ts` | AI 工具详情对话框 |
| 3 | `src/app/components/project-map/ai-chat/tool-call-display.component.ts` | AI 工具调用显示组件 |

---

## 当前 NgModules（共 5 个）

| 序号 | 文件路径 | 说明 |
|------|---------|------|
| 1 | `src/app/app.module.ts` | 主应用模块 |
| 2 | `src/app/app-routing.module.ts` | 路由模块 |
| 3 | `src/app/cartography/cartography.module.ts` | 制图模块 |
| 4 | `src/app/testing/app-testing/app-testing.module.ts` | 测试模块 |

---

## 组件统计

| 类型 | 数量 |
|------|------|
| 总组件 (@Component) | 200+ |
| Standalone 组件 | 3 |
| NgModule | 5 |

---

## Standalone 迁移说明

### 什么是 Standalone Component？

Standalone Component 是不需要 NgModule 即可独立使用的组件。它们通过 `standalone: true` 属性声明，并直接导入所需的依赖。

### 当前项目结构

项目目前使用传统的 NgModule 架构。在 Angular 17 中：

- **不需要**强制迁移到 Standalone
- NgModule 仍然完全支持
- 可以逐步混合使用

### 是否需要迁移？

| 方案 | 优点 | 缺点 |
|------|------|------|
| 保持 NgModule | 无需修改 | 无法使用新特性 |
| 逐步迁移 | 逐步采用新特性 | 工作量大 |
| 全部迁移 | 完全现代化 | 风险高 |

### 推荐策略

1. **保守方案**: 停留在 Angular 17，继续使用 NgModule
2. **混合方案**: 新组件使用 Standalone，旧组件保持 NgModule
3. **完全迁移**: 全面重构（风险高，不推荐）

---

## Standalone 组件示例

```typescript
// Standalone 组件示例
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,  // 标记为 standalone
  imports: [MatButtonModule, MatDialogModule],  // 直接导入依赖
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  // ...
}
```

### 与 NgModule 的对比

```typescript
// NgModule 方式
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html'
})
export class ExampleComponent { }

// 需要在 NgModule 中声明
@NgModule({
  declarations: [ExampleComponent],
  imports: [CommonModule]
})
export class AppModule { }
```
