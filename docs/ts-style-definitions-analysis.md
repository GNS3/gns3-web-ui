# TypeScript 宽度/高度定义规范符合性分析

**生成日期**: 2026-03-29
**分析范围**: `src/app/**/*.ts`
**规范依据**: `docs/angular21-CSS/01-css-coding-standards.md`

---

## 规则说明

根据项目 CSS 编码规范：

> **No style overrides in TS** - Dialog width/height/maxWidth/maxHeight must be in CSS, not TS

**核心规则**: 对话框的宽度、高度、最大宽度、最大高度定义必须在 CSS 文件中，不能在 TypeScript 中定义。

---

## 分类清单

### ❌ 违反规范的文件

这些文件在 TypeScript 中定义了对话框的尺寸属性，**应该迁移到 CSS**：

| 文件路径 | 行号 | 违规代码 | 迁移目标 |
|---------|------|----------|----------|
| `services/dialog-config.service.ts` | 30-32 | `width: '800px', maxWidth: '800px', maxHeight: '80vh'` | `_dialogs.scss` |
| `services/dialog-config.service.ts` | 38-40 | `width: '500px', maxWidth: '500px', maxHeight: '80vh'` | `_dialogs.scss` |
| `services/dialog-config.service.ts` | 89-90 | `width: '1000px', maxWidth: '1000px'` | `_dialogs.scss` |
| `services/dialog-config.service.ts` | 101-103 | `width: '700px', maxWidth: '700px', maxHeight: '600px'` | `_dialogs.scss` |
| `services/dialog-config.service.ts` | 110-111 | `width: '1000px', maxWidth: '1000px'` | `_dialogs.scss` |
| `services/dialog-config.service.ts` | 132-134 | `width: '500px', maxWidth: '500px', maxHeight: '200px'` | `_dialogs.scss` |
| `layouts/default-layout/default-layout.component.ts` | 193-194 | `width: '800px', maxHeight: '800px'` | `_dialogs.scss` |
| `components/user-management/user-management.component.ts` | 138, 149, 177 | `width: '400px'`, `width: '500px'` | `_dialogs.scss` |
| `components/user-management/user-detail/user-detail.component.ts` | 152-153 | `width: '400px', height: '300px'` | `_dialogs.scss` |
| `components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts` | 156, 181, 252 | `width: '700px'`, `width: '400px'` | `_dialogs.scss` |
| `components/projects/projects.component.ts` | 161, 189, 201, 233-234, 285-286 | `width: '400px'`, `width: '550px', maxHeight: '650px'`, `width: '700px', maxHeight: '850px'` | `_dialogs.scss` |
| `components/image-manager/image-manager.component.ts` | 206, 305, 329, 354-355, 368-369 | `width: '450px'`, `width: '600px', maxHeight: '550px'`, `width: '550px', maxHeight: '650px'` | `_dialogs.scss` |
| `components/role-management/role-management.component.ts` | 132, 165 | `width: '400px'`, `width: '500px', height: '250px'` | `_dialogs.scss` |
| `components/acl-management/acl-management.component.ts` | 125, 138, 166 | `width: '1000px'`, `width: '500px'` | `_dialogs.scss` |
| `components/controllers/controllers.component.ts` | 217, 294 | `width: '350px'`, `width: '400px'` | `_dialogs.scss` |
| `components/projects/import-project-dialog/import-project-dialog.component.ts` | 170-171 | `width: '300px', height: '150px'` | `_dialogs.scss` |
| `components/group-management/group-management.component.ts` | 128, 152 | `width: '400px'`, `width: '500px', height: '250px'` | `_dialogs.scss` |
| `components/group-details/group-details.component.ts` | 134-135, 147-148 | `width: '700px', height: '500px'`, `width: '500px', height: '200px'` | `_dialogs.scss` |
| `components/group-details/group-ai-profile-tab/group-ai-profile-tab.component.ts` | 139, 162, 231 | `width: '700px'`, `width: '400px'` | `_dialogs.scss` |
| `components/resource-pools-management/resource-pools-management.component.ts` | 107, 131 | `width: '400px'`, `width: '500px', height: '250px'` | `_dialogs.scss` |
| `components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts` | 115-116 | `width: '300px', height: '150px'` | `_dialogs.scss` |
| `components/common/progress-dialog/progress-dialog.service.ts` | 11 | `width: '250px'` | `_dialogs.scss` |
| `components/project-map/project-map.component.ts` | 988, 998, 1021, 1069-1070, 1132-1133, 1145-1146 | `width: '400px'`, `width: '700px', maxHeight: '850px'`, `width: '800px', maxHeight: '800px'`, `width: '600px', height: '650px'` | `_dialogs.scss` |
| `components/project-map/new-template-dialog/new-template-dialog.component.ts` | 381, 394-395, 463-464, 529-530, 583-584, 620-621, 684-685 | `width: '250px'`, `width: '400px', height: '200px'`, `width: '400px', height: '250px'` | `_dialogs.scss` |
| `components/project-map/ai-chat/chat-message-list.component.ts` | 291, 293-294, 312, 314-315 | `width: '800px', maxWidth: '95vw', maxHeight: '85vh'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/idle-pc-action/idle-pc-action.component.ts` | 26 | `width: '500px'` | `_dialogs.scss` |
| `components/preferences/common/delete-template-component/delete-template.component.ts` | 25-26 | `width: '300px', height: '250px'` | `_dialogs.scss` |
| `components/preferences/common/symbols/symbols.component.ts` | 158, 264 | `width: '400px'` | `_dialogs.scss` |
| `components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts` | 92 | `width: '500px'` | `_dialogs.scss` |
| `components/project-map/node-editors/configurator/docker/configurator-docker.component.ts` | 84 | `width: '800px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/export-config/export-config-action.component.ts` | 39 | `width: '500px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/import-config/import-config-action.component.ts` | 43 | `width: '500px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/show-node-action/show-node-action.component.ts` | 24-25 | `width: '600px', maxHeight: '600px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/edit-text-action/edit-text-action.component.ts` | 37 | `width: '300px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/edit-config/edit-config-action.component.ts` | 26-27 | `width: '600px', height: '500px'` | `_dialogs.scss` |
| `components/project-map/context-menu/actions/edit-style-action/edit-style-action.component.ts` | 33 | `width: '800px'` | `_dialogs.scss` |
| `components/users/logged-user/logged-user.component.ts` | 44 | `width: '500px'` | `_dialogs.scss` |

**总计**: 约 **40+ 个组件**存在违规情况

---

### ✅ 符合规范的文件

这些文件中的宽度/高度定义是合理的，**不需要迁移**：

#### 1. 测试文件 (Test Files)
测试数据中的样式定义是测试必需的，符合规范：

| 文件路径 | 说明 |
|---------|------|
| `cartography/widgets/links/style-translator.spec.ts` | 链接样式测试数据 |
| `cartography/widgets/links/bezier-link-layout.spec.ts` | 贝塞尔曲线布局测试数据 |
| `components/drawings-listeners/*/drawing-resized.component.spec.ts` | 绘图调整大小测试 |
| `components/drawings-listeners/*/node-dragged.component.spec.ts` | 节点拖拽测试 |
| `components/drawings-listeners/*/link-created.component.spec.ts` | 链接创建测试 |
| `components/projects/import-project-dialog/import-project-dialog.component.spec.ts` | 项目导入对话框测试 |
| `components/projects/add-blank-project-dialog/add-blank-project-dialog.component.spec.ts` | 空白项目对话框测试 |
| `components/project-map/helpers/node-created-label-styles-fixer.spec.ts` | 标签样式修复测试 |

#### 2. 动态样式 (Dynamic Styles)
这些样式是动态计算的，必须在 TypeScript 中处理：

| 文件路径 | 说明 |
|---------|------|
| `components/topology-summary/topology-summary.component.ts:115` | 组件位置样式对象 `{ top: '60px', right: '0px', width: '320px', height: '400px' }` |
| `components/project-map/console-wrapper/console-wrapper.component.ts:157, 564, 568` | 控制台包装器动态尺寸样式 |
| `components/project-map/log-console/log-console.component.ts:111` | 日志控制台尺寸样式 |
| `components/project-map/ai-chat/ai-chat.component.ts:301-302, 871-872, 886-887` | AI 聊天窗口展开/收起动画尺寸 |

#### 3. 内联样式对象 (Inline Style Objects)
使用 `[style]` 绑定的样式对象，这是 Angular 的合法模式：

| 文件路径 | 说明 |
|---------|------|
| `components/project-map/ai-chat/tool-call-display.component.ts:56-57, 90-91` | 图标尺寸样式对象 |
| `components/project-map/ai-chat/chat-input-area.component.ts:155-162, 200-202, 256-257, 273-274, 282-283, 333-334` | 聊天输入区域动态样式 |
| `components/project-map/ai-chat/chat-session-list.component.ts:166, 177, 277, 303, 326, 341, 354-355` | 会话列表样式对象 |

#### 4. 数据模型 (Data Models)
数据结构中的字段，非样式定义：

| 文件路径 | 说明 |
|---------|------|
| `stores/ai-chat.store.ts:45-46` | AI 聊天窗口尺寸配置（默认状态） |
| `models/controller-settings-models/graphics-view.ts:10` | 图形视图配置 `scene_width: 2000` |
| `cartography/widgets/links/serial-link.ts:30` | 串行链接默认样式 `width: 2` |
| `cartography/widgets/links/ethernet-link.ts:29` | 以太网链接默认样式 `width: 2` |

#### 5. Angular 动画状态 (Animation States)
Angular 动画框架中的状态定义，这是正确用法：

| 文件路径 | 说明 |
|---------|------|
| `components/project-map/new-template-dialog/new-template-dialog.component.ts:63` | 折叠状态动画 `height: '0px'` |

---

## 迁移建议

### 迁移模式

#### ❌ 当前违规模式
```typescript
// TypeScript
this.dialog.open(MyDialogComponent, {
  width: '400px',
  height: '250px',
  maxWidth: '95vw',
  maxHeight: '85vh'
});
```

#### ✅ 推荐模式
```typescript
// TypeScript - 只指定 panelClass
this.dialog.open(MyDialogComponent, {
  panelClass: 'my-dialog-panel'
});
```

```scss
// src/styles/_dialogs.scss
.my-dialog-panel {
  .mdc-dialog__surface,
  .mat-mdc-dialog-surface {
    width: 400px;
    height: 250px;
    max-width: 95vw;
    max-height: 85vh;
  }
}
```

### 优先级

建议按以下优先级进行迁移：

| 优先级 | 组件类别 | 原因 |
|--------|----------|------|
| **P0** | `dialog-config.service.ts` | 集中式配置服务，影响范围最大 |
| **P1** | 项目管理相关 | 用户最常用的功能 |
| **P2** | 用户/角色/组管理 | 管理员功能 |
| **P3** | 节点编辑器和上下文菜单 | 高级功能 |
| **P4** | 其他对话框 | 较少使用的功能 |

---

## 统计摘要

| 分类 | 数量 |
|------|------|
| **违规组件** | 40+ |
| **符合规范的组件** | 30+ |
| **测试文件** | 12 |
| **动态样式** | 8 |
| **数据模型** | 4 |
| **总计检测文件** | 80+ |

---

## 相关文档

- `docs/angular21-CSS/01-css-coding-standards.md` - CSS 编码规范
- `docs/dialog-style-isolation-guide.md` - 对话框样式隔离指南
- `src/styles/_dialogs.scss` - 对话框样式集中管理文件
