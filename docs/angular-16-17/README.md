# Angular 16 → 17 升级指南

## 概述

本文档详细记录从 Angular 16 升级到 Angular 17 时需要关注的问题、风险以及具体需要修改的文件和代码。

---

## 当前版本状态

| 包 | 当前版本 | 目标版本 |
|---|---------|---------|
| Angular | 16.2.x | 17.x |
| Angular Material | 16.2.x | 17.x |
| RxJS | 7.5+ | 7.x |
| TypeScript | 4.9.5 | **5.0+** ⚠️ |

---

## 主要 Breaking Changes

### 1. TypeScript 版本要求 ✅
- Angular 17 需要 TypeScript **5.0+**
- 当前版本 4.9.5 需要升级

### 2. Standalone Components 默认化 ✅
- Angular 17 默认使用 Standalone Components
- `NgModule` 变为可选（但仍支持）
- 项目无需强制迁移到 Standalone

### 3. Forms 模块变化 ⚠️
- `FormControl` 默认变为 **untyped**
- 需要显式指定类型或使用 `UntypedFormControl`

### 4. 新的控制流语法
- `@if`, `@for`, `@switch` 替代 `*ngIf`, `*ngFor`, `ngSwitch`
- 旧语法仍然支持但推荐迁移

### 5. NgIf 和 @if
- 模板中的 `*ngIf` 语法变化

### 6. 依赖注入
- 推荐使用 `inject()` 函数替代构造函数注入

---

## 需要修改的文件清单

### 1. TypeScript 配置
- `tsconfig.json` - 可能需要更新 target

### 2. Forms 类型修复（67 个文件）
- 详见 [Forms 类型修复清单](./Forms类型修复清单.md)

### 3. Standalone 组件（当前 3 个，已有基础）
- 详见 [Standalone 组件清单](./Standalone组件清单.md)

---

## 升级建议步骤

### 步骤 1: 更新 TypeScript
```json
// package.json
"typescript": "~5.0.0"
```

### 步骤 2: 更新 Angular 包
```bash
npm install @angular/core@17 @angular/material@17 @angular/cdk@17 --legacy-peer-deps
```

### 步骤 3: 修复 Forms 类型
- 为所有 `FormControl` 和 `FormGroup` 添加类型
- 或使用 `UntypedFormControl`/`UntypedFormGroup`

### 步骤 4: 测试
- 运行 `npm run build`
- 运行 `npm test`

---

## 相关文件

- [Forms 类型修复清单](./Forms类型修复清单.md)
- [Standalone 组件清单](./Standalone组件清单.md)
- [代码修改示例](./代码修改示例.md)
