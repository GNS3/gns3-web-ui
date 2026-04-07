# Angular 21 ngModel Migration Guide

## Overview

This document tracks the migration from deprecated `[(ngModel)]` two-way binding to Angular 17+ `model()` signals in accordance with the Angular 21 Zoneless architecture requirements.

## Background

Angular 21 (Zoneless) does not support `ngModel` as it relies on Zone.js for change detection. All components must migrate to using `model()` signals for two-way binding patterns.

## Migration Pattern

### Before (Deprecated)

```html
<input [(ngModel)]="searchText" />
```

### After (Angular 21 Compatible)

```typescript
// Component (TypeScript)
searchText = model('');
```

```html
<input [value]="searchText()" (input)="searchText.set($event.target.value)" />
```

## Migration Progress

**Total: 38 files | Completed: 31 | Pending: 7**

## Files Requiring Migration

### Template Components

| File | Status |
|------|--------|
| `src/app/components/template/template.component.html` | Completed |
| `src/app/components/template/template-list-dialog/template-list-dialog.component.html` | Completed |

### Preferences Components

| File | Status |
|------|--------|
| `src/app/components/preferences/qemu/qemu-preferences/qemu-preferences.component.html` | Completed |
| `src/app/components/preferences/vpcs/vpcs-preferences/vpcs-preferences.component.html` | Completed |
| `src/app/components/preferences/vmware/vmware-preferences/vmware-preferences.component.html` | Completed |
| `src/app/components/preferences/virtual-box/virtual-box-preferences/virtual-box-preferences.component.html` | Completed |
| `src/app/components/preferences/dynamips/dynamips-preferences/dynamips-preferences.component.html` | Completed |
| `src/app/components/preferences/dynamips/ios-template-details/ios-template-details.component.html` | Completed |
| `src/app/components/preferences/common/symbols/symbols.component.html` | Completed |
| `src/app/components/preferences/common/udp-tunnels/udp-tunnels.component.html` | Completed |
| `src/app/components/preferences/common/ports/ports.component.html` | Completed |
| `src/app/components/preferences/common/custom-adapters-table/custom-adapters-table.component.html` | Completed |
| `src/app/components/preferences/common/custom-adapters/custom-adapters.component.html` | Completed |

### Project-Map Components

| File | Status |
|------|--------|
| `src/app/components/project-map/drawings-editors/style-editor/style-editor.component.html` | Completed |
| `src/app/components/project-map/drawings-editors/text-editor/text-editor.component.html` | Completed |
| `src/app/components/project-map/ai-chat/chat-input-area.component.html` | Completed |
| `src/app/components/project-map/packet-capturing/packet-filters/packet-filters.component.html` | Completed |
| `src/app/components/project-map/packet-capturing/start-capture/start-capture.component.html` | Completed |
| `src/app/components/project-map/node-editors/configurator/docker/edit-network-configuration/edit-network-configuration.component.html` | Completed |
| `src/app/components/project-map/node-editors/configurator/docker/configure-custom-adapters/configure-custom-adapters.component.html` | Completed |
| `src/app/components/project-map/node-editors/config-editor/config-editor.component.html` | Completed |
| `src/app/components/project-map/node-editors/configurator/cloud/configurator-cloud.component.html` | Completed |
| `src/app/components/project-map/new-template-dialog/new-template-dialog.component.html` | Completed |
| `src/app/components/project-map/log-console/log-console.component.html` | Completed |
| `src/app/components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.html` | Completed |

### Management Components

| File | Status |
|------|--------|
| `src/app/components/controllers/controllers.component.html` | Completed |
| `src/app/components/projects/projects.component.html` | Completed |
| `src/app/components/projects/edit-project-dialog/edit-project-dialog.component.html` | Completed |
| `src/app/components/projects/choose-name-dialog/choose-name-dialog.component.html` | Completed |
| `src/app/components/user-management/user-management.component.html` | Completed |
| `src/app/components/role-management/role-management.component.html` | Completed |
| `src/app/components/settings/settings.component.html` | Pending |
| `src/app/components/resource-pools-management/resource-pools-management.component.html` | Pending |
| `src/app/components/image-manager/image-manager.component.html` | Pending |
| `src/app/components/group-management/group-detail-dialog/group-detail-dialog.component.html` | Pending |
| `src/app/components/group-management/group-management.component.html` | Pending |
| `src/app/components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component.html` | Pending |
| `src/app/components/acl-management/acl-management.component.html` | Pending |

## Notes

- When migrating, ensure `FormsModule` is removed from imports if only using `model()` signals
- Use `cd.markForCheck()` after async operations in `OnPush` change detection components
- Some components may require `ReactiveFormsModule` instead if complex validation is needed
