# Angular 15 → 16 升级指南

## 概述

本文档记录从 Angular 15 升级到 Angular 16 时需要关注的问题和潜在风险。

## 当前版本状态

| 包 | 当前版本 | 目标版本 |
|---|---------|---------|
| Angular | 15.2.x | 16.x |
| Angular Material | 15.2.x | 16.x |
| RxJS | 7.5+ | 7.x |
| TypeScript | 4.9.5 | 4.9+ |

---

## 主要 Breaking Changes

### 1. TypeScript 版本要求
- Angular 16 需要 TypeScript **4.9+**
- 当前版本已满足要求 ✅

### 2. RxJS 变化
- RxJS 7 已完全兼容 ✅

### 3. Angular Material 废弃
- `mat-chip-list` → `mat-chip-grid` 已在 Angular 15 完成 ✅

### 4. Forms 模块变化
- `FormControl` 默认变为 **untyped**
- 可能需要为 `FormControl`、`FormGroup` 添加泛型类型

### 5. Standalone Components
- Angular 16 正式支持独立组件
- 需要检查是否有 `NgModule` 依赖问题

### 6. HttpClient
- `HttpParams` 变为不可变，需要使用 `.set()` 方法

---

## 第三方库兼容性风险

### 高风险库

| 包名 | 当前版本 | 使用位置 | 风险 |
|-----|---------|---------|-----|
| **ngx-markdown** | 15.1.2 | app.module.ts | 中 |
| **ng2-file-upload** | 3.0.0 | import-project-dialog | 高 |
| **ngx-device-detector** | 4.0.1 | 9个组件 | 高 |
| **angular-draggable-droppable** | 6.1.0 | 待确认 | 高 |

### ngx-device-detector 使用位置

```
src/app/services/protocol-handler.service.ts
src/app/components/project-map/ai-chat/chat-message-list.component.ts
src/app/components/project-map/screenshot-dialog/screenshot-dialog.component.ts
src/app/components/project-map/new-template-dialog/new-template-dialog.component.ts
src/app/components/project-map/import-appliance/import-appliance.component.ts
src/app/components/project-map/context-menu/actions/console-device-action-browser/console-device-action-browser.component.ts
src/app/components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component.ts
src/app/components/preferences/ios-on-unix/add-iou-template/add-iou-template.component.ts
src/app/components/preferences/dynamips/add-ios-template/add-ios-template.component.ts
```

---

## 升级建议

1. **先尝试安装**
   ```bash
   npm install @angular/core@16 @angular/material@16 @angular/cdk@16 --legacy-peer-deps
   ```

2. **处理第三方库**
   - 检查每个库的最新版本
   - 可能需要降级或寻找替代方案

3. **修复 Forms 类型**
   - 检查 `FormControl`、`FormGroup` 使用
   - 可能需要添加显式类型

4. **测试**
   - 运行 `npm run build`
   - 运行 `npm test`

---

## 相关文件

- [第三方库分析](./第三方库分析.md)
