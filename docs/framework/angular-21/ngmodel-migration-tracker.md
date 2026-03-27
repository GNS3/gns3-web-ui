# ngModel Migration Tracker

> **Track progress of migrating from `[(ngModel)]` to modern Angular 21 Zoneless patterns**

**Last Updated**: 2026-03-27
**Total Files**: 40
**Migrated**: 1 (2.5%)
**Remaining**: 39 (97.5%)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Migration Strategy](#migration-strategy)
- [File Inventory](#file-inventory)
- [Migration Progress](#migration-progress)
- [Migration Patterns](#migration-patterns)

---

## 🎯 Overview

### What is ngModel?

`[(ngModel)]` is part of Angular's `FormsModule` that provides two-way data binding. In Angular 21 Zoneless architecture, it should be replaced with:

1. **Signal-based binding** using `model()` signals
2. **Property binding + event binding** pattern
3. **Reactive Forms** for complex forms

### Why Migrate?

| Reason | Description |
|--------|-------------|
| **Zoneless Compliance** | `FormsModule` relies on Zone.js for change detection |
| **Performance** | Signal-based updates are more efficient |
| **Modern Best Practice** | Aligns with Angular 17+ recommendations |
| **Future-Proof** | Prepares for eventual FormsModule deprecation |

---

## 🔄 Migration Strategy

### Pattern 1: Checkbox with `[ngModel]` → `[checked]`

**Use Case**: Display-only checkbox (no two-way binding needed)

**Before**:
```html
<mat-checkbox [ngModel]="isVisible" (change)="toggleVisibility($event.checked)">
  Show labels
</mat-checkbox>
```

**After**:
```html
<mat-checkbox [checked]="isVisible" (change)="toggleVisibility($event.checked)">
  Show labels
</mat-checkbox>
```

**Files Using This Pattern**: 8+ files

---

### Pattern 2: Search Input with `[(ngModel)]` → Signal Binding

**Use Case**: Simple text input with standalone option

**Before**:
```html
<input matInput [(ngModel)]="searchText" [ngModelOptions]="{ standalone: true }" />
```

**After**:
```typescript
// In component
searchText = model('');

// In template
<input matInput [value]="searchText()" (input)="searchText.set($event.target.value)" />
```

**Files Using This Pattern**: 15+ files

---

### Pattern 3: Form Input → Signal Model

**Use Case**: Two-way bound form input

**Before**:
```html
<input matInput [(ngModel)]="project.name" />
```

**After**:
```typescript
// In component
name = model('');

// In template
<input matInput [value]="name()" (input)="name.set($event.target.value)" />
```

**Files Using This Pattern**: 10+ files

---

### Pattern 4: mat-select with `[(ngModel)]` → Signal Model

**Use Case**: Dropdown selection

**Before**:
```html
<mat-select [(ngModel)]="selectedType">
  <mat-option value="type1">Type 1</mat-option>
</mat-select>
```

**After**:
```typescript
// In component
selectedType = model('');

// In template
<mat-select [value]="selectedType()" (selectionChange)="selectedType.set($event.value)">
  <mat-option value="type1">Type 1</mat-option>
</mat-select>
```

**Files Using This Pattern**: 5+ files

---

## 📁 File Inventory

### ✅ Migrated Files (1)

| File | Date | Pattern | Notes |
|------|------|---------|-------|
| `project-map.component.html` | 2026-03-27 | Checkbox `[ngModel]` → `[checked]` | 8 checkboxes migrated (Map Settings menu) |

**Migration Details**:
- **Component**: `project-map.component.html`
- **Lines Changed**: 122-142
- **Checkboxes Migrated**: 8
  1. `isInterfaceLabelVisible` - Show interface labels
  2. `isConsoleVisible` - Show console
  3. `isTopologySummaryVisible` - Show topology/controllers summary
  4. `notificationsVisibility` - Show notifications
  5. `layersVisibility` - Show layers
  6. `gridVisibility` - Show grid
  7. `project.snap_to_grid` - Snap to grid
  8. `symbolScaling` - Scale symbols
- **Pattern Applied**: `[ngModel]="variable"` → `[checked]="variable"`
- **FormsModule Removed**: Yes (no longer needed for these checkboxes)

---

### 📋 Pending Files (39)

#### 1. Project/Controller Management (6 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `controllers.component.html` | Search input | Low | 5 min |
| `projects.component.html` | Search input | Low | 5 min |
| `projects/edit-project-dialog.component.html` | Checkbox (4) | Medium | 10 min |
| `projects/choose-name-dialog.component.html` | Input | Medium | 5 min |
| `resource-pools-management.component.html` | Search input | Low | 5 min |
| `resource-pool-details.component.html` | Input | Medium | 5 min |

---

#### 2. User/Role/Permission Management (7 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `user-management.component.html` | Search input | Low | 5 min |
| `user-detail/ai-profile-tab/ai-profile-dialog/ai-profile-dialog.component.html` | Input (2) | Medium | 10 min |
| `role-management.component.html` | Search input | Low | 5 min |
| `group-management.component.html` | Search input | Low | 5 min |
| `group-details.component.html` | Search input | Low | 5 min |
| `group-details/add-user-to-group-dialog.component.html` | Search input | Low | 5 min |
| `group-details/add-role-to-group/add-role-to-group.component.html` | Search input | Low | 5 min |

---

#### 3. Template Management (2 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `template.component.html` | Search + select (4) | Medium | 15 min |
| `template/template-list-dialog.component.html` | Search + select (6) | Medium | 20 min |

---

#### 4. Preferences (11 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `settings.component.html` | Checkbox (5) | **High** | 15 min |
| `image-manager.component.html` | Search input | Low | 5 min |
| `preferences/common/symbols.component.html` | Search input | Low | 5 min |
| `preferences/common/custom-adapters.component.html` | Input + select (4) | Medium | 20 min |
| `preferences/common/custom-adapters-table.component.html` | Input (3) | Medium | 15 min |
| `preferences/common/udp-tunnels.component.html` | Input (4) | Medium | 20 min |
| `preferences/common/ports.component.html` | Input + select (4) | Medium | 20 min |
| `preferences/vpcs/vpcs-preferences.component.html` | Input | Medium | 5 min |
| `preferences/vmware/vmware-preferences.component.html` | Input | Medium | 5 min |
| `preferences/virtual-box/virtual-box-preferences.component.html` | Input | Medium | 5 min |
| `preferences/dynamips/dynamips-preferences.component.html` | Input | Medium | 5 min |
| `preferences/dynamips/ios-template-details/ios-template-details.component.html` | Select + input (6) | Medium | 30 min |
| `preferences/qemu/qemu-preferences.component.html` | Checkbox (2) | Medium | 10 min |

---

#### 5. Project Map/Editors (10 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `project-map/new-template-dialog.component.html` | Search + select (2) | Medium | 15 min |
| `project-map/log-console.component.html` | Command input | Medium | 5 min |
| `project-map/drawings-editors/text-editor/text-editor.component.html` | Color + text (2) | Medium | 10 min |
| `project-map/drawings-editors/style-editor/style-editor.component.html` | Input (10) | **High** | 45 min |
| `project-map/packet-capturing/start-capture.component.html` | Checkbox | Medium | 5 min |
| `project-map/packet-capturing/packet-filters.component.html` | Input (6) | Medium | 30 min |
| `project-map/node-editors/config-editor/config-editor.component.html` | Textarea (3) | Medium | 15 min |
| `project-map/node-editors/configurator/cloud/configurator-cloud.component.html` | Select + input (2) | Medium | 15 min |
| `project-map/node-editors/configurator/docker/edit-network-configuration.component.html` | Textarea | Medium | 5 min |
| `project-map/node-editors/configurator/docker/configure-custom-adapters.component.html` | Input | Medium | 5 min |
| `project-map/context-menu/dialogs/idle-pc-dialog.component.html` | Input | Medium | 5 min |

---

#### 6. Other (2 files)

| File | Type | Priority | Est. Effort |
|------|------|----------|-------------|
| `acl-management.component.html` | Search input | Low | 5 min |

---

## 📊 Migration Progress

### By Category

| Category | Total | Migrated | % Done |
|----------|-------|----------|--------|
| Project/Controller Management | 6 | 0 | 0% |
| User/Role/Permission | 7 | 0 | 0% |
| Template Management | 2 | 0 | 0% |
| Preferences | 13 | 0 | 0% |
| Project Map/Editors | 11 | 1 | 9% |
| Other | 1 | 0 | 0% |
| **Total** | **40** | **1** | **2.5%** |

---

### By Pattern

| Pattern | Count | Migrated | % Done |
|---------|-------|----------|--------|
| Search input | ~15 | 0 | 0% |
| Checkbox `[ngModel]` | ~8 | 8 (in 1 file) | 100% |
| Two-way binding | ~10 | 0 | 0% |
| Form input | ~14 | 0 | 0% |

---

## 🎯 Suggested Migration Order

### Phase 1: Low-Hanging Fruit (Quick Wins)
**Target**: Search inputs (15 files)
**Estimated Time**: 75 minutes (5 min each)

These files follow a consistent pattern and can be migrated quickly:

1. `controllers.component.html`
2. `projects.component.html`
3. `user-management.component.html`
4. `role-management.component.html`
5. `group-management.component.html`
6. `group-details.component.html`
7. `resource-pools-management.component.html`
8. `image-manager.component.html`
9. `acl-management.component.html`
10. `preferences/common/symbols.component.html`

---

### Phase 2: High-Priority Components
**Target**: Frequently used components
**Estimated Time**: 60 minutes

1. `settings.component.html` - 5 checkboxes (15 min)
2. `project-map/drawings-editors/style-editor/style-editor.component.html` - 10 inputs (45 min)

---

### Phase 3: Form Components
**Target**: Complex form inputs
**Estimated Time**: 4-5 hours

1. Dialog components (30 min)
2. Preferences components (2 hours)
3. Project map editors (2 hours)

---

### Phase 4: Template Components
**Target**: Template management
**Estimated Time**: 35 minutes

1. `template.component.html`
2. `template/template-list-dialog.component.html`

---

## 📝 Migration Checklist

### Before Migrating a File

- [ ] Read the component TypeScript file to understand the data model
- [ ] Identify which migration pattern to use
- [ ] Check if the component uses `FormsModule` (can be removed after migration)
- [ ] Look for related tests that may need updating

### During Migration

- [ ] Replace `[(ngModel)]` with appropriate pattern
- [ ] Update component TypeScript if using `model()` signals
- [ ] Remove `FormsModule` import if no longer needed
- [ ] Test the component functionality

### After Migration

- [ ] Run `yarn ng lint` to check for issues
- [ ] Run `yarn prettier:write` to format code
- [ ] Test the component in the browser
- [ ] Update this tracker document

---

## 🔗 Related Documentation

- [Angular 21 Migration Plan](./migration-plan.md)
- [Model Input Signals](./model-input-signals.md)
- [Component Migration Tracker](./component-tracker.md)
- [CLAUDE.md - Zoneless Requirements](../../../CLAUDE.md)

---

## 📅 Change Log

| Date | Action | Files |
|------|--------|-------|
| 2026-03-27 | Created tracker document | - |
| 2026-03-27 | Migrated `project-map.component.html` | 8 checkboxes from `[ngModel]` → `[checked]` |
| 2026-03-27 | Updated mat-checkbox-forms-module.md | Revised to recommend `[checked]` pattern |
| | | |
| | | |
