# TypeScript 样式定义规范符合性分析（基于 CLAUDE.md）

**分析日期**: 2026-03-29
**规范依据**: `/home/yueguobin/myCode/GNS3/gns3-web-ui/CLAUDE.md`

---

## CLAUDE.md 核心规范

### CSS/Style Conventions 规则（第 257-370 行）

| 规则 | 状态 | 描述 |
|------|------|------|
| **No style overrides in TS** | ⚠️ CRITICAL | Dialog width/height/maxWidth/maxHeight must be in CSS, not TS |
| **Dialog styles centralized** | ⚠️ CRITICAL | All dialog styles in `src/styles/_dialogs.scss` |
| **Use `panelClass`** | ⚠️ CRITICAL | For dialog style scoping |

### Dialog Styling 规范示例（第 350-370 行）

```typescript
// ✅ 正确做法
const dialogRef = this.dialog.open(MyDialogComponent, {
  panelClass: 'my-custom-dialog-panel',
});
```

```scss
// src/styles/_dialogs.scss
.my-custom-dialog-panel {
  .mdc-dialog__surface,
  .mat-mdc-dialog-surface {
    background: var(--mat-sys-surface);
    color: var(--mat-sys-on-surface);
  }
}
```

---

## 分析分类

### ❌ 严重违规：对话框尺寸定义在 TypeScript 中

这些文件直接违反了 **"No style overrides in TS"** 规则：

#### dialog-config.service.ts - 集中式配置服务

```typescript
// ❌ 违规：所有这些定义应该在 CSS 中
width: '800px',
maxWidth: '800px',
maxHeight: '80vh'
```

**影响范围**: 最大，这是集中式对话框配置服务
**迁移优先级**: **P0 - 最高**

---

#### 组件直接定义对话框尺寸

以下组件在 `dialog.open()` 调用中直接定义了尺寸属性：

| 组件 | 违规属性 | 推荐迁移方案 |
|------|----------|-------------|
| `layouts/default-layout/default-layout.component.ts` | width: '800px', maxHeight: '800px' | 创建 `.default-layout-dialog-panel` 样式类 |
| `components/user-management/user-management.component.ts` | width: '400px', width: '500px' | 创建 `.user-management-dialog-panel` 样式类 |
| `components/user-management/user-detail/user-detail.component.ts` | width: '400px', height: '300px' | 创建 `.user-detail-dialog-panel` 样式类 |
| `components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts` | width: '700px', width: '400px' | 创建 `.ai-profile-dialog-panel` 样式类 |
| `components/projects/projects.component.ts` | width: '400px'/'550px'/'700px', maxHeight: '650px'/'850px' | 创建 `.projects-dialog-panel` 样式类 |
| `components/image-manager/image-manager.component.ts` | width: '450px'/'600px'/'550px', maxHeight: '550px'/'650px' | 创建 `.image-manager-dialog-panel` 样式类 |
| `components/role-management/role-management.component.ts` | width: '400px', width: '500px', height: '250px' | 创建 `.role-management-dialog-panel` 样式类 |
| `components/acl-management/acl-management.component.ts` | width: '1000px', width: '500px' | 创建 `.acl-management-dialog-panel` 样式类 |
| `components/controllers/controllers.component.ts` | width: '350px', width: '400px' | 创建 `.controllers-dialog-panel` 样式类 |
| `components/group-management/group-management.component.ts` | width: '400px', width: '500px', height: '250px' | 创建 `.group-management-dialog-panel` 样式类 |
| `components/group-details/group-details.component.ts` | width: '700px', height: '500px', width: '500px', height: '200px' | 创建 `.group-details-dialog-panel` 样式类 |
| `components/resource-pools-management/resource-pools-management.component.ts` | width: '400px', width: '500px', height: '250px' | 创建 `.resource-pools-dialog-panel` 样式类 |
| `components/common/progress-dialog/progress-dialog.service.ts` | width: '250px' | 创建 `.progress-dialog-panel` 样式类 |
| `components/project-map/project-map.component.ts` | width: '400px'/'600px'/'700px'/'800px', maxHeight: '600px'/'800px'/'850px', height: '650px' | 创建 `.project-map-dialog-panel` 样式类 |
| `components/project-map/new-template-dialog/new-template-dialog.component.ts` | width: '250px'/'400px', height: '200px'/'250px' | 创建 `.new-template-dialog-panel` 样式类 |
| `components/project-map/ai-chat/chat-message-list.component.ts` | width: '800px', maxWidth: '95vw', maxHeight: '85vh' | 创建 `.chat-message-list-panel` 样式类 |
| `components/project-map/context-menu/actions/idle-pc-action/idle-pc-action.component.ts` | width: '500px' | 创建 `.idle-pc-action-panel` 样式类 |
| `components/preferences/common/delete-template-component/delete-template.component.ts` | width: '300px', height: '250px' | 创建 `.delete-template-panel` 样式类 |
| `components/preferences/common/symbols/symbols.component.ts` | width: '400px' | 创建 `.symbols-dialog-panel` 样式类 |
| `components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts` | width: '500px' | 创建 `.qemu-configurator-panel` 样式类 |
| `components/project-map/node-editors/configurator/docker/configurator-docker.component.ts` | width: '800px' | 创建 `.docker-configurator-panel` 样式类 |
| `components/project-map/context-menu/actions/export-config/export-config-action.component.ts` | width: '500px' | 创建 `.export-config-panel` 样式类 |
| `components/project-map/context-menu/actions/import-config/import-config-action.component.ts` | width: '500px' | 创建 `.import-config-panel` 样式类 |
| `components/project-map/context-menu/actions/show-node-action/show-node-action.component.ts` | width: '600px', maxHeight: '600px' | 创建 `.show-node-panel` 样式类 |
| `components/project-map/context-menu/actions/edit-text-action/edit-text-action.component.ts` | width: '300px' | 创建 `.edit-text-panel` 样式类 |
| `components/project-map/context-menu/actions/edit-config/edit-config-action.component.ts` | width: '600px', height: '500px' | 创建 `.edit-config-panel` 样式类 |
| `components/project-map/context-menu/actions/edit-style-action/edit-style-action.component.ts` | width: '800px' | 创建 `.edit-style-panel` 样式类 |
| `components/users/logged-user/logged-user.component.ts` | width: '500px' | 创建 `.logged-user-dialog-panel` 样式类 |

**总计**: **30+ 个组件**需要迁移

---

### ⚠️ 潜在问题：内联样式对象

以下组件在 TypeScript 中定义样式对象，用于 `[style]` 绑定。

虽然 Angular 技术上支持这种模式，但根据 CLAUDE.md 规范：
- 固定样式应该在 CSS 中
- 只有动态计算的样式才应该在 TS 中

#### 1. AI Chat 相关组件

`components/project-map/ai-chat/tool-call-display.component.ts`:
```typescript
// ⚠️ 固定尺寸，应该在 CSS 中
width: 16px;
height: 16px;
width: 14px;
height: 14px;
```

**建议**: 迁移到组件的 `.scss` 文件

---

`components/project-map/ai-chat/chat-input-area.component.ts`:
```typescript
// ⚠️ 混合了固定和动态样式
width: 100%;
min-width: 0;
min-height: 48px;
max-height: 200px;
line-height: 1.5;
height: 36px;
min-width: 100px;  // 固定
max-width: 200px;  // 固定
width: 16px;
height: 16px;
width: 18px;
height: 18px;
width: 48px;
height: 48px;
width: 20px;
height: 20px;
min-height: 48px;
line-height: 1.2;
```

**建议**: 将固定尺寸迁移到 CSS，保留动态计算的样式

---

`components/project-map/ai-chat/chat-session-list.component.ts`:
```typescript
// ⚠️ 固定尺寸
width: 100%;
height: 100%;
min-width: 0;
width: 32px;
height: 32px;
```

**建议**: 迁移到组件的 `.scss` 文件

---

#### 2. 其他组件的内联样式

`components/topology-summary/topology-summary.component.ts:115`:
```typescript
// ⚠️ 位置和尺寸都是固定的
this.style = {
  top: '60px',
  right: '0px',
  width: '320px',
  height: '400px'
};
```

**建议**: 迁移到组件的 `.scss` 文件，使用类名控制

---

`components/project-map/console-wrapper/console-wrapper.component.ts:157, 564, 568`:
```typescript
// ✅ 合理：动态计算的尺寸
width: `${this.resizedWidth}px`
```

**判断**: 合理，因为尺寸是动态计算的

---

`components/project-map/log-console/log-console.component.ts:111`:
```typescript
// ⚠️ 看起来是固定尺寸
this.style = { width: '848px', height: '477px' };
```

**建议**: 迁移到 CSS，除非有动态计算需求

---

`components/project-map/ai-chat/ai-chat.component.ts:301-302, 871-872, 886-887`:
```typescript
// ✅ 合理：动画状态
width: '0px',
height: '0px',
width: '100vw',
height: '100vh'
```

**判断**: 合理，用于展开/收起动画

---

### ✅ 符合规范的情况

#### 1. 测试文件中的样式数据

所有 `.spec.ts` 文件中的样式定义都是合理的，因为它们是测试数据：

- `cartography/widgets/links/style-translator.spec.ts`
- `cartography/widgets/links/bezier-link-layout.spec.ts`
- `components/drawings-listeners/*/drawing-resized.component.spec.ts`
- `components/drawings-listeners/*/node-dragged.component.spec.ts`
- `components/drawings-listeners/*/link-created.component.spec.ts`
- `components/projects/import-project-dialog/import-project-dialog.component.spec.ts`
- `components/projects/add-blank-project-dialog/add-blank-project-dialog.component.spec.ts`
- `components/project-map/helpers/node-created-label-styles-fixer.spec.ts`

---

#### 2. 数据模型和配置

这些不是样式定义，是数据结构：

```typescript
// ✅ 合理：数据模型
stores/ai-chat.store.ts:45-46
  width: 800,
  height: 900,

models/controller-settings-models/graphics-view.ts:10
  scene_width: 2000;

cartography/widgets/links/serial-link.ts:30
  width: 2,

cartography/widgets/links/ethernet-link.ts:29
  width: 2,
```

---

#### 3. Angular 动画状态

```typescript
// ✅ 合理：动画框架必需
components/project-map/new-template-dialog/new-template-dialog.component.ts:63
  state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
```

---

## 迁移指南

### 对话框尺寸迁移模式

#### 步骤 1: 在 CSS 中定义样式

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

#### 步骤 2: 修改 TypeScript

```typescript
// ❌ 之前
this.dialog.open(MyDialogComponent, {
  width: '400px',
  height: '250px',
  maxWidth: '95vw',
  maxHeight: '85vh'
});

// ✅ 之后
this.dialog.open(MyDialogComponent, {
  panelClass: 'my-dialog-panel'
});
```

---

### 内联样式迁移模式

#### 固定样式 → CSS

```typescript
// ❌ 之前
this.style = { width: '16px', height: '16px' };
```

```html
<!-- 模板 -->
<div [style]="style"></div>
```

```scss
/* ✅ 之后：组件 SCSS */
.icon {
  width: 16px;
  height: 16px;
}
```

```html
<!-- 模板 -->
<div class="icon"></div>
```

#### 动态样式 → 保留在 TS

```typescript
// ✅ 合理：动态计算
this.style = {
  width: `${this.resizedWidth}px`,
  height: `${this.resizedHeight}px`
};
```

---

## 优先级矩阵

| 优先级 | 类别 | 组件数量 | 理由 |
|--------|------|----------|------|
| **P0** | dialog-config.service.ts | 1 | 集中式配置，影响最大 |
| **P1** | 项目管理相关 | 5 | 用户最常用功能 |
| **P2** | 用户/角色/组/ACL管理 | 8 | 管理员功能 |
| **P3** | 节点编辑器和上下文菜单 | 12 | 高级功能 |
| **P4** | AI Chat 内联样式 | 3 | 较新功能 |
| **P5** | 其他内联样式 | 5 | 影响较小 |

---

## 统计摘要

| 分类 | 数量 | 规范符合性 |
|------|------|-----------|
| ❌ 对话框尺寸违规 | 30+ | **违反 CLAUDE.md** |
| ⚠️ 内联样式对象 | 8 | **需审查** |
| ✅ 测试文件 | 12 | 符合规范 |
| ✅ 动态样式 | 5 | 符合规范 |
| ✅ 数据模型 | 4 | 符合规范 |
| ✅ 动画状态 | 1 | 符合规范 |
| **总计** | **60+** | **约 50% 需要调整** |

---

## 建议行动计划

### 第一阶段：高优先级对话框（1-2 周）

1. 迁移 `dialog-config.service.ts`
2. 迁移项目管理相关对话框
3. 迁移用户/角色/组管理对话框

### 第二阶段：中优先级对话框（1 周）

1. 迁移节点编辑器对话框
2. 迁移上下文菜单对话框
3. 迁移其他对话框

### 第三阶段：内联样式审查（1 周）

1. 审查 AI Chat 组件的内联样式
2. 审查其他组件的内联样式
3. 将固定样式迁移到 CSS
4. 保留必要的动态样式

---

## 相关文档

- `CLAUDE.md` (第 257-370 行) - CSS/Style Conventions
- `docs/angular21-CSS/01-css-coding-standards.md` - 完整 CSS 编码规范
- `docs/dialog-style-isolation-guide.md` - 对话框样式隔离指南
- `src/styles/_dialogs.scss` - 对话框样式集中管理文件
