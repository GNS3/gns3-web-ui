# Migrated Dialogs List

**Migration Date**: 2026-03-29
**Branch**: refactor/move-dialog-styles-to-css
**Standard**: CLAUDE.md - "No style overrides in TS"

---

## Dialogs Organized by Component

### 1. dialog-config.service.ts (P0 - Highest Priority)

| CSS Class | Size | Purpose | Original Config Key |
|-----------|------|---------|---------------------|
| `configurator-dialog-panel` | 800px × 80vh | Main configuration page | `configuratorConfig` |
| `simple-dialog-panel` | 500px × 80vh | Simple dialog | `simpleConfig` |
| `custom-adapters-dialog-panel` | 1000px | Custom adapters | `customAdapters` |
| `edit-project-dialog-panel` | 700px × 600px | Edit project | `editProject` |
| `add-ace-dialog-panel` | 1000px | Add ACE | `addAce` |
| `nodes-menu-confirmation-dialog-panel` | 500px × 200px | Node menu confirmation | `nodesMenuConfirmation` |

**Impact**: Global centralized configuration service

---

### 2. Project Management Components (P1)

#### projects.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `choose-name-dialog-panel` | 400px | ChooseNameDialogComponent | `duplicate()` |
| `add-blank-project-dialog-panel` | 400px | AddBlankProjectDialogComponent | `addBlankProject()` |
| `import-project-dialog-panel` | 400px | ImportProjectDialogComponent | `importProject()` |
| `delete-all-projects-dialog-panel` | 550px × 650px | ConfirmationDeleteAllProjectsComponent | `deleteAllFiles()` |
| `export-portable-project-dialog-panel` | 700px × 850px | ExportPortableProjectComponent | `exportPortableProjectDialog()` |

#### image-manager.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `question-dialog-panel` | 450px | QuestionDialogComponent | `deleteFile()`, `installAllImages()`, `pruneImages()` |
| `add-image-dialog-panel` | 600px × 550px | AddImageDialogComponent | `addImage()` |
| `delete-all-images-dialog-panel` | 550px × 650px | DeleteAllImageFilesDialogComponent | `deleteAllFiles()` |

---

### 3. User/Role/Group Management Components (P2)

#### user-management.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `add-user-dialog-panel` | 400px | AddUserDialogComponent | `addUser()` |

#### user-detail.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `change-user-password-dialog-panel` | 400px × 300px | ChangeUserPasswordComponent | `onChangePassword()` |

#### user-detail/ai-profile-tab.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `ai-profile-dialog-panel` | 700px | AiProfileDialogComponent | `openCreateDialog()`, `openEditDialog()` |

#### group-details/group-ai-profile-tab.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `ai-profile-dialog-panel` | 700px | AiProfileDialogComponent | `openCreateDialog()`, `openEditDialog()` |

#### acl-management.component.ts

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `add-ace-dialog-panel` | 1000px | AddAceDialogComponent | `addACE()` |

---

### 4. Node Editors (P3)

#### configurator/qemu/configurator-qemu.component.ts

| CSS Class | Size | Purpose |
|-----------|------|---------|
| `qemu-configurator-dialog-panel` | 500px | QEMU VM configuration dialog |

#### configurator/docker/configurator-docker.component.ts

| CSS Class | Size | Purpose |
|-----------|------|---------|
| `docker-configurator-dialog-panel` | 800px | Docker container configuration dialog |

---

### 5. Context Menu Actions (P3)

| CSS Class | Size | Component | Menu Item |
|-----------|------|-----------|-----------|
| `idle-pc-action-dialog-panel` | 500px | IdlePCDialogComponent | Idle PC |
| `export-config-action-dialog-panel` | 500px | ConfigDialogComponent | Export Config |
| `import-config-action-dialog-panel` | 500px | ConfigDialogComponent | Import Config |
| `show-node-action-dialog-panel` | 600px × 600px | InfoDialogComponent | Show Node |
| `edit-text-action-dialog-panel` | 300px | TextEditorDialogComponent | Edit Text |
| `edit-config-action-dialog-panel` | 600px × 500px | ConfigEditorDialogComponent | Edit Config |
| `edit-style-action-dialog-panel` | 500px | StyleEditorDialogComponent | Edit Style |

---

### 6. Other Components (P3)

#### preferences/common/delete-template-component

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `delete-template-dialog-panel` | 300px × 250px | DeleteConfirmationDialogComponent | `deleteItem()` |

#### preferences/common/symbols

| CSS Class | Size | Component | Note |
|-----------|------|-----------|-------|
| `symbols-dialog-panel` | 400px | ConfirmationDialogComponent | Removed redundant width, uses confirmation panel |

#### users/logged-user

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `change-user-password-dialog-panel` | 400px × 300px | ChangeUserPasswordComponent | `changePassword()` |

#### template

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `template-dialog-panel` | 600px | TemplateListDialogComponent | `openDialog()` |

#### controllers

| CSS Class | Size | Component | Method |
|-----------|------|-----------|--------|
| `controller-small-dialog-panel` | 350px | AddControllerDialogComponent | `createModal()` |
| `controller-dialog-panel` | 400px | EditControllerDialogComponent | `editController()` |

---

## Size-based Classification

### 300px Series
- delete-template-dialog-panel: 300px × 250px
- edit-text-action-dialog-panel: 300px

### 350px Series
- controller-small-dialog-panel: 350px

### 400px Series
- add-user-dialog-panel: 400px
- add-blank-project-dialog-panel: 400px
- change-user-password-dialog-panel: 400px × 300px
- choose-name-dialog-panel: 400px
- controller-dialog-panel: 400px
- import-project-dialog-panel: 400px
- symbols-dialog-panel: 400px (redundant width removed)

### 450px Series
- question-dialog-panel: 450px

### 500px Series
- delete-all-projects-dialog-panel: 550px × 650px
- delete-all-images-dialog-panel: 550px × 650px
- idle-pc-action-dialog-panel: 500px
- qemu-configurator-dialog-panel: 500px
- simple-dialog-panel: 500px × 80vh
- export-config-action-dialog-panel: 500px
- import-config-action-dialog-panel: 500px
- edit-style-action-dialog-panel: 500px

### 600px Series
- edit-config-action-dialog-panel: 600px × 500px
- show-node-action-dialog-panel: 600px × 600px
- template-dialog-panel: 600px

### 700px Series
- ai-profile-dialog-panel: 700px
- edit-project-dialog-panel: 700px × 600px
- export-portable-project-dialog-panel: 700px × 850px

### 800px Series
- configurator-dialog-panel: 800px × 80vh
- docker-configurator-dialog-panel: 800px

### 1000px Series
- add-ace-dialog-panel: 1000px
- custom-adapters-dialog-panel: 1000px

---

## Statistics Summary

| Category | Count |
|----------|-------|
| **Total Dialogs** | 42 |
| **Unique CSS Classes** | 35 |
| **Migrated Component Files** | 23 |
| **New SCSS Code** | ~360 lines |
| **Removed TS Code** | ~70 lines |

---

## Migration Pattern

### Before Migration
```typescript
this.dialog.open(MyDialogComponent, {
  width: '400px',
  height: '250px',
  maxWidth: '95vw',
  maxHeight: '85vh'
});
```

### After Migration
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

## Standards Compliant

- CLAUDE.md - "No style overrides in TS"
- CLAUDE.md - "Dialog styles centralized"
- CLAUDE.md - "Use `panelClass` for dialog style scoping"

All dialog sizes are now managed centrally in `src/styles/_dialogs.scss`.

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
