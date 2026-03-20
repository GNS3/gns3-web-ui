# Angular 18 → 19 升级指南

## 概述

本文档记录从 Angular 18 升级到 Angular 19 时需要关注的问题和变更。

---

## 当前版本状态

| 包 | 当前版本 | 目标版本 |
|---|---------|---------|
| Angular | 18.2.x | 19.x |
| Angular Material | 18.2.x | 19.x |
| RxJS | 7.5+ | 7.x |
| TypeScript | 5.5.x | **5.6+** ⚠️ |

---

## 主要变化

### 1. TypeScript 要求 ✅
- Angular 19 需要 TypeScript **5.6+**
- 当前 5.5.x 需要升级

### 2. Zoneless
- Angular 19 进一步改进 zoneless
- 默认仍然使用 Zone.js，无需修改

### 3. Standalone Components
- Standalone 成为默认
- NgModule 继续支持但逐步淘汰

### 4. 新的控制流语法
- `@if`, `@for`, `@switch` 完全支持
- 旧语法仍然兼容

### 5. Signal API
- Signal 成为响应式推荐方式
- 可以逐步迁移（可选）

### 6. 服务端渲染
- Angular Universal 进一步集成

---

## 需要修改的文件

### 1. TypeScript 配置
- `package.json` - 升级 TypeScript 版本到 5.6+

### 2. 主题系统
- `src/styles/theme-v2.scss` - 可能需要适配

### 3. Forms（无需修改）
- 67 个文件使用 FormControl/FormGroup（向后兼容）

---

## 升级步骤

### 步骤 1: 更新 TypeScript
```json
"typescript": "~5.6.0"
```

### 步骤 2: 更新 Angular 包
```bash
npm install @angular/core@19 @angular/material@19 @angular/cdk@19 --legacy-peer-deps
```

### 步骤 3: 测试
- 运行 `npm run build`
- 运行 `npm test`

---

## 风险评估

| 问题 | 风险等级 | 备注 |
|------|---------|------|
| TypeScript 升级 | **低** | 5.5 → 5.6 |
| 第三方库兼容 | **中** | 需测试 |
| NgModule 淘汰 | **中** | 长期兼容 |
| Signal 迁移 | **低** | 可选 |

---

## 对比 Angular 18

| 特性 | Angular 18 | Angular 19 |
|------|-----------|-----------|
| TypeScript | 5.5+ | 5.6+ |
| Zoneless | 实验性 | 实验性（改进） |
| 控制流 | @if/@for | @if/@for（完善） |
| Standalone | 推荐 | 默认 |
| Signal | 支持 | 推荐 |

---

## 项目当前状态

### Forms 使用情况
- 67 个文件使用 FormControl/FormGroup
- 向后兼容，无需修改

### NgModules
- 5 个 NgModule
- 长期兼容，但推荐逐步迁移到 Standalone

### Zone.js
- 当前使用 Zone.js
- Angular 19 仍然支持，无需修改

---

## 相关文件

- [Forms 类型修复清单](../angular-16-17/Forms类型修复清单.md)
- [Standalone 组件清单](../angular-16-17/Standalone组件清单.md)
