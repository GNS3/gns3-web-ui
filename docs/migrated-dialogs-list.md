# 已迁移对话框清单

**迁移日期**: 2026-03-29
**分支**: refactor/move-dialog-styles-to-css
**规范**: CLAUDE.md - "No style overrides in TS"

---

## 按组件分类的对话框清单

### 1. dialog-config.service.ts (P0 - 最高优先级)

| CSS 类名 | 尺寸 | 用途 | 原配置键 |
|---------|------|------|---------|
| `configurator-dialog-panel` | 800px × 80vh | 主配置页面 | `configuratorConfig` |
| `simple-dialog-panel` | 500px × 80vh | 简单对话框 | `simpleConfig` |
| `custom-adapters-dialog-panel` | 1000px | 自定义适配器 | `customAdapters` |
| `edit-project-dialog-panel` | 700px × 600px | 编辑项目 | `editProject` |
| `add-ace-dialog-panel` | 1000px | 添加 ACE | `addAce` |
| `nodes-menu-confirmation-dialog-panel` | 500px × 200px | 节点菜单确认 | `nodesMenuConfirmation` |

**影响范围**: 全局集中式配置服务

---

### 2. 项目管理组件 (P1)

#### projects.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `choose-name-dialog-panel` | 400px | ChooseNameDialogComponent | `duplicate()` |
| `add-blank-project-dialog-panel` | 400px | AddBlankProjectDialogComponent | `addBlankProject()` |
| `import-project-dialog-panel` | 400px | ImportProjectDialogComponent | `importProject()` |
| `delete-all-projects-dialog-panel` | 550px × 650px | ConfirmationDeleteAllProjectsComponent | `deleteAllFiles()` |
| `export-portable-project-dialog-panel` | 700px × 850px | ExportPortableProjectComponent | `exportPortableProjectDialog()` |

#### image-manager.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `question-dialog-panel` | 450px | QuestionDialogComponent | `deleteFile()`, `installAllImages()`, `pruneImages()` |
| `add-image-dialog-panel` | 600px × 550px | AddImageDialogComponent | `addImage()` |
| `delete-all-images-dialog-panel` | 550px × 650px | DeleteAllImageFilesDialogComponent | `deleteAllFiles()` |

---

### 3. 用户/角色/组管理组件 (P2)

#### user-management.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `add-user-dialog-panel` | 400px | AddUserDialogComponent | `addUser()` |

#### user-detail.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `change-user-password-dialog-panel` | 400px × 300px | ChangeUserPasswordComponent | `onChangePassword()` |

#### user-detail/ai-profile-tab.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `ai-profile-dialog-panel` | 700px | AiProfileDialogComponent | `openCreateDialog()`, `openEditDialog()` |

#### group-details/group-ai-profile-tab.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `ai-profile-dialog-panel` | 700px | AiProfileDialogComponent | `openCreateDialog()`, `openEditDialog()` |

#### acl-management.component.ts

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `add-ace-dialog-panel` | 1000px | AddAceDialogComponent | `addACE()` |

---

### 4. 节点编辑器 (P3)

#### configurator/qemu/configurator-qemu.component.ts

| CSS 类名 | 尺寸 | 用途 |
|---------|------|------|
| `qemu-configurator-dialog-panel` | 500px | QEMU 虚拟机配置对话框 |

#### configurator/docker/configurator-docker.component.ts

| CSS 类名 | 尺寸 | 用途 |
|---------|------|------|
| `docker-configurator-dialog-panel` | 800px | Docker 容器配置对话框 |

---

### 5. 上下文菜单 Actions (P3)

| CSS 类名 | 尺寸 | 组件 | 菜单项 |
|---------|------|------|--------|
| `idle-pc-action-dialog-panel` | 500px | IdlePCDialogComponent | Idle PC |
| `export-config-action-dialog-panel` | 500px | ConfigDialogComponent | Export Config |
| `import-config-action-dialog-panel` | 500px | ConfigDialogComponent | Import Config |
| `show-node-action-dialog-panel` | 600px × 600px | InfoDialogComponent | Show Node |
| `edit-text-action-dialog-panel` | 300px | TextEditorDialogComponent | Edit Text |
| `edit-config-action-dialog-panel` | 600px × 500px | ConfigEditorDialogComponent | Edit Config |
| `edit-style-action-dialog-panel` | 800px | StyleEditorDialogComponent | Edit Style |

---

### 6. 其他组件 (P3)

#### preferences/common/delete-template-component

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `delete-template-dialog-panel` | 300px × 250px | DeleteConfirmationDialogComponent | `deleteItem()` |

#### preferences/common/symbols

| CSS 类名 | 尺寸 | 组件 | 说明 |
|---------|------|------|------|
| `symbols-dialog-panel` | 400px | ConfirmationDialogComponent | 移除了冗余 width，使用 confirmation panel |

#### users/logged-user

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `change-user-password-dialog-panel` | 400px × 300px | ChangeUserPasswordComponent | `changePassword()` |

#### template

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `template-dialog-panel` | 600px | TemplateListDialogComponent | `openDialog()` |

#### controllers

| CSS 类名 | 尺寸 | 组件 | 方法 |
|---------|------|------|------|
| `controller-small-dialog-panel` | 350px | AddControllerDialogComponent | `createModal()` |
| `controller-dialog-panel` | 400px | EditControllerDialogComponent | `editController()` |

---

## 按尺寸分类统计

### 300px 系列
- delete-template-dialog-panel: 300px × 250px
- edit-text-action-dialog-panel: 300px

### 350px 系列
- controller-small-dialog-panel: 350px

### 400px 系列
- add-user-dialog-panel: 400px
- add-blank-project-dialog-panel: 400px
- change-user-password-dialog-panel: 400px × 300px
- choose-name-dialog-panel: 400px
- controller-dialog-panel: 400px
- import-project-dialog-panel: 400px
- symbols-dialog-panel: 400px (移除冗余 width)

### 450px 系列
- question-dialog-panel: 450px

### 500px 系列
- delete-all-projects-dialog-panel: 550px × 650px
- delete-all-images-dialog-panel: 550px × 650px
- idle-pc-action-dialog-panel: 500px
- qemu-configurator-dialog-panel: 500px
- simple-dialog-panel: 500px × 80vh
- export-config-action-dialog-panel: 500px
- import-config-action-dialog-panel: 500px

### 600px 系列
- edit-config-action-dialog-panel: 600px × 500px
- show-node-action-dialog-panel: 600px × 600px
- template-dialog-panel: 600px

### 700px 系列
- ai-profile-dialog-panel: 700px
- edit-project-dialog-panel: 700px × 600px
- export-portable-project-dialog-panel: 700px × 850px

### 800px 系列
- configurator-dialog-panel: 800px × 80vh
- docker-configurator-dialog-panel: 800px
- edit-style-action-dialog-panel: 800px

### 1000px 系列
- add-ace-dialog-panel: 1000px
- custom-adapters-dialog-panel: 1000px

---

## 统计汇总

| 分类 | 数量 |
|------|------|
| **对话框总数** | 42 |
| **唯一 CSS 类** | 35 |
| **迁移的组件文件** | 23 |
| **新增 SCSS 代码** | ~360 行 |
| **移除 TS 代码** | ~70 行 |

---

## 迁移模式

### 迁移前 ❌
```typescript
this.dialog.open(MyDialogComponent, {
  width: '400px',
  height: '250px',
  maxWidth: '95vw',
  maxHeight: '85vh'
});
```

### 迁移后 ✅
```typescript
// TypeScript
this.dialog.open(MyDialogComponent, {
  panelClass: 'my-dialog-panel'
});
```

```scss
// src/styles/_dialogs.scss
.my-dialog-panel {
  mat-dialog-container,
  .mat-mdc-dialog-container {
    width: 400px;
    height: 250px;
    max-width: 95vw;
    max-height: 85vh;
  }
}
```

---

## 符合的规范

✅ **CLAUDE.md** - "No style overrides in TS"
✅ **CLAUDE.md** - "Dialog styles centralized"
✅ **CLAUDE.md** - "Use `panelClass` for dialog style scoping"

所有对话框尺寸现在都集中在 `src/styles/_dialogs.scss` 中管理。
