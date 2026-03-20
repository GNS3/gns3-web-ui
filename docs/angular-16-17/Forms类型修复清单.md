# Forms 类型修复清单

## 概述

Angular 17 中，`FormControl` 默认变为 **untyped**，需要为每个 `FormControl` 和 `FormGroup` 添加泛型类型，或使用 `UntypedFormControl`/`UntypedFormGroup`。

## 需要修改的文件（共 67 个）

### 用户管理模块 (5 个文件)

| 序号 | 文件路径 |
|------|---------|
| 1 | `src/app/components/user-management/add-user-dialog/add-user-dialog.component.ts` |
| 2 | `src/app/components/user-management/user-detail/user-detail.component.ts` |
| 3 | `src/app/components/user-management/user-detail/change-user-password/change-user-password.component.ts` |
| 4 | `src/app/components/user-management/edit-user-dialog/edit-user-dialog.component.ts` |

### 用户组管理模块 (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 5 | `src/app/components/group-management/add-group-dialog/add-group-dialog.component.ts` |
| 6 | `src/app/components/group-details/group-details.component.ts` |

### 角色管理模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 7 | `src/app/components/role-management/add-role-dialog/add-role-dialog.component.ts` |

### 资源池管理模块 (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 8 | `src/app/components/resource-pools-management/add-resource-pool-dialog/add-resource-pool-dialog.component.ts` |
| 9 | `src/app/components/resource-pool-details/resource-pool-details.component.ts` |

### ACL 管理模块 (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 10 | `src/app/components/acl-management/add-ace-dialog/autocomplete/autocomplete.component.ts` |
| 11 | `src/app/components/acl-management/add-ace-dialog/add-ace-dialog.component.ts` |

### 控制器模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 12 | `src/app/components/controllers/add-controller-dialog/add-controller-dialog.component.ts` |

### 登录模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 13 | `src/app/components/login/login.component.ts` |

### 模板模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 14 | `src/app/components/template/template-list-dialog/template-list-dialog.component.ts` |

### 快照模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 15 | `src/app/components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component.ts` |

### 设置模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 16 | `src/app/components/settings/console/console.component.ts` |

### 项目管理模块 (4 个文件)

| 序号 | 文件路径 |
|------|---------|
| 17 | `src/app/components/projects/save-project-dialog/save-project-dialog.component.ts` |
| 18 | `src/app/components/projects/import-project-dialog/import-project-dialog.component.ts` |
| 19 | `src/app/components/projects/edit-project-dialog/edit-project-dialog.component.ts` |
| 20 | `src/app/components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts` |

### 项目地图模块 - 对话框 (12 个文件)

| 序号 | 文件路径 |
|------|---------|
| 21 | `src/app/components/project-map/screenshot-dialog/screenshot-dialog.component.ts` |
| 22 | `src/app/components/project-map/packet-capturing/start-capture/start-capture.component.ts` |
| 23 | `src/app/components/project-map/new-template-dialog/template-name-dialog/template-name-dialog.component.ts` |
| 24 | `src/app/components/project-map/log-console/log-console.component.ts` |
| 25 | `src/app/components/project-map/change-hostname-dialog/change-hostname-dialog.component.ts` |
| 26 | `src/app/components/project-map/console-wrapper/console-wrapper.component.ts` |

### 项目地图模块 - 配置器 (14 个文件)

| 序号 | 文件路径 |
|------|---------|
| 27 | `src/app/components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component.ts` |
| 28 | `src/app/components/project-map/node-editors/configurator/vmware/configurator-vmware.component.ts` |
| 29 | `src/app/components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component.ts` |
| 30 | `src/app/components/project-map/node-editors/configurator/switch/configurator-switch.component.ts` |
| 31 | `src/app/components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts` |
| 32 | `src/app/components/project-map/node-editors/configurator/qemu/qemu-image-creator/qemu-image-creator.component.ts` |
| 33 | `src/app/components/project-map/node-editors/configurator/nat/configurator-nat.component.ts` |
| 34 | `src/app/components/project-map/node-editors/configurator/iou/configurator-iou.component.ts` |
| 35 | `src/app/components/project-map/node-editors/configurator/ios/configurator-ios.component.ts` |
| 36 | `src/app/components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component.ts` |
| 37 | `src/app/components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component.ts` |
| 38 | `src/app/components/project-map/node-editors/configurator/docker/configurator-docker.component.ts` |
| 39 | `src/app/components/project-map/node-editors/configurator/cloud/configurator-cloud.component.ts` |
| 40 | `src/app/components/project-map/node-editors/configurator/atm_switch/configurator-atm-switch.component.ts` |

### 项目地图模块 - 绘图编辑器 (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 41 | `src/app/components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts` |
| 42 | `src/app/components/project-map/drawings-editors/text-editor/text-editor.component.ts` |
| 43 | `src/app/components/project-map/drawings-editors/style-editor/style-editor.component.ts` |

### 首选项模块 - VPCS (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 44 | `src/app/components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component.ts` |
| 45 | `src/app/components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component.ts` |

### 首选项模块 - VMware (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 46 | `src/app/components/preferences/vmware/vmware-template-details/vmware-template-details.component.ts` |
| 47 | `src/app/components/preferences/vmware/add-vmware-template/add-vmware-template.component.ts` |

### 首选项模块 - VirtualBox (2 个文件)

| 序号 | 文件路径 |
|------|---------|
| 48 | `src/app/components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component.ts` |
| 49 | `src/app/components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component.ts` |

### 首选项模块 - QEMU (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 50 | `src/app/components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component.ts` |
| 51 | `src/app/components/preferences/qemu/copy-qemu-vm-template/copy-qemu-vm-template.component.ts` |
| 52 | `src/app/components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component.ts` |

### 首选项模块 - IOU (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 53 | `src/app/components/preferences/ios-on-unix/iou-template-details/iou-template-details.component.ts` |
| 54 | `src/app/components/preferences/ios-on-unix/copy-iou-template/copy-iou-template.component.ts` |
| 55 | `src/app/components/preferences/ios-on-unix/add-iou-template/add-iou-template.component.ts` |

### 首选项模块 - IOS (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 56 | `src/app/components/preferences/dynamips/ios-template-details/ios-template-details.component.ts` |
| 57 | `src/app/components/preferences/dynamips/copy-ios-template/copy-ios-template.component.ts` |
| 58 | `src/app/components/preferences/dynamips/add-ios-template/add-ios-template.component.ts` |

### 首选项模块 - Docker (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 59 | `src/app/components/preferences/docker/docker-template-details/docker-template-details.component.ts` |
| 60 | `src/app/components/preferences/docker/copy-docker-template/copy-docker-template.component.ts` |
| 61 | `src/app/components/preferences/docker/add-docker-template/add-docker-template.component.ts` |

### 首选项模块 - 内置节点 (3 个文件)

| 序号 | 文件路径 |
|------|---------|
| 62 | `src/app/components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component.ts` |
| 63 | `src/app/components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component.ts` |
| 64 | `src/app/components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component.ts` |
| 65 | `src/app/components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component.ts` |
| 66 | `src/app/components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component.ts` |

### 其他模块 (1 个文件)

| 序号 | 文件路径 |
|------|---------|
| 67 | `src/app/components/direct-link/direct-link.component.ts` |

---

## 修改示例

### 方案一：使用 UntypedFormControl（推荐）

```typescript
// 修改前
name = new FormControl('');
age = new FormControl(0);
form = new FormGroup({
  name: new FormControl(''),
  age: new FormControl(0)
});

// 修改后
name = new UntypedFormControl('');
age = new UntypedFormControl(0);
form = new UntypedFormGroup({
  name: new UntypedFormControl(''),
  age: new UntypedFormControl(0)
});
```

### 方案二：添加泛型类型

```typescript
// 修改后
name = new FormControl<string>('');
age = new FormControl<number>(0);
form = new FormGroup({
  name: new FormControl<string>(''),
  age: new FormControl<number>(0)
});
```
