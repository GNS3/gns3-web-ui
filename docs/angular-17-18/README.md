# Angular 17 → 18 升级指南

## 概述

本文档记录从 Angular 17 升级到 Angular 18 时需要关注的问题和变更。

---

## 当前版本状态

| 包 | 当前版本 | 目标版本 |
|---|---------|---------|
| Angular | 17.3.x | 18.x |
| Angular Material | 17.3.x | 18.x |
| RxJS | 7.5+ | 7.x |
| TypeScript | 5.4.x | **5.5+** ⚠️ |

---

## 主要变化

### 1. TypeScript 要求 ✅
- Angular 18 需要 TypeScript **5.5+**
- 当前 5.4.x 需要升级

### 2. Zoneless 实验性支持
- Angular 18 引入 zoneless change detection（实验性）
- 默认仍然使用 Zone.js，无需修改

### 3. 新的控制流语法
- `@if`, `@for`, `@switch` 成为正式特性
- 旧语法 `*ngIf`, `*ngFor` 仍然支持

### 4. Standalone Components
- Standalone 成为推荐方式
- NgModule 仍然完全支持

### 5. SSR 变化
- Angular Universal 合并到 Angular 核心
- `@angular/ssr` 包

### 6. Forms 类型
- 更好的类型推断
- 67 个文件使用 FormControl/FormGroup（与 Angular 17 相同）

---

## 需要修改的文件

### 1. TypeScript 配置
- `package.json` - 升级 TypeScript 版本

### 2. 主题系统
- `src/styles/theme-v2.scss` - 可能需要适配

### 3. Forms 类型（可选）
- 67 个文件使用 FormControl/FormGroup
- 详见 [Forms 类型修复清单](../angular-16-17/Forms类型修复清单.md)

---

## 升级步骤

### 步骤 1: 更新 TypeScript
```json
"typescript": "~5.5.0"
```

### 步骤 2: 更新 Angular 包
```bash
npm install @angular/core@18 @angular/material@18 @angular/cdk@18 --legacy-peer-deps
```

### 步骤 3: 测试
- 运行 `npm run build`
- 运行 `npm test`

---

## 风险评估

| 问题 | 风险等级 | 备注 |
|------|---------|------|
| TypeScript 升级 | **低** | 5.4 → 5.5 |
| 第三方库兼容 | **中** | 需测试 |
| SSR | **低** | 项目未使用 |
| 控制流语法 | **低** | 兼容 |

---

## 对比 Angular 17

| 特性 | Angular 17 | Angular 18 |
|------|-----------|-----------|
| TypeScript | 5.4+ | 5.5+ |
| Zoneless | 实验性 | 实验性（改进） |
| 控制流 | @if/@for | @if/@for（正式） |
| Standalone | 推荐 | 推荐 |

---

## 相关文件

- [Forms 类型修复清单](../angular-16-17/Forms类型修复清单.md)
- [Standalone 组件清单](../angular-16-17/Standalone组件清单.md)
