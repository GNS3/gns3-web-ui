# Angular 升级计划：14 → 19/20

## 当前状态

- **当前版本**：Angular 14.3.0
- **目标版本**：Angular 19 或 20
- **升级策略**：逐个大版本递增升级
- **分支**：`feat/remove-electron-and-upgrade-angular`

## 概述

本文档详细说明了将 GNS3 Web UI 从 Angular 14 升级到 Angular 19/20 的分步计划。我们将一次升级一个大版本，以确保稳定性并及时发现问题。

---

## 第一阶段：Angular 14 → 15

### 前置要求
- Node.js 14.15.x 或更高版本（推荐：16.x 或 18.x）

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^15.2.0",
"@angular/common": "^15.2.0",
"@angular/compiler": "^15.2.0",
"@angular/core": "^15.2.0",
"@angular/forms": "^15.2.0",
"@angular/platform-browser": "^15.2.0",
"@angular/platform-browser-dynamic": "^15.2.0",
"@angular/router": "^15.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^15.2.0",
"@angular/material": "^15.2.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^15.2.0",
"@angular/cli": "^15.2.0",
"@angular/compiler-cli": "^15.2.0",
"@angular/language-service": "^15.2.0",
"typescript": "~4.8.4"
```

#### 其他依赖
```json
"rxjs": "^7.5.0",
"zone.js": "^0.12.0"
```

### 需要处理的破坏性变更

1. **需要 TypeScript 4.8+** - 更新类型定义
2. **需要 RxJS 7** - 移除 `rxjs-compat`，更新 RxJS 操作符
3. **Zone.js 0.12.x** - 更新 zone.js 配置
4. **Angular Material 变更** - 检查已弃用的组件 API
5. **独立组件** - 新功能（可选采用）
6. **路由迁移** - 检查路由配置变更

### 升级方法评估

#### 当前项目状态
- **当前 Angular 版本**：14.3.0
- **当前 TypeScript**：4.6.4
- **当前 RxJS**：6.6.7（带有 rxjs-compat）
- **当前 Zone.js**：0.11.5
- **当前 Node.js**：v24.13.0 ✅（满足 Angular 15 要求）

#### Angular 15 要求
- **Node.js**：^14.20.0 || ^16.13.0 || ^18.10.0
- **TypeScript**：~4.8.2
- **RxJS**：^6.5.3 || ^7.4.0

#### ✅ 推荐使用 `ng update` 进行迁移

**为什么使用 `ng update`：**
1. **自动迁移脚本** - Angular 15 提供了内置的迁移 schematic，可以自动处理许多破坏性变更
2. **降低风险** - 经过充分测试的官方工具
3. **节省时间** - 自动化大部分繁琐的更新工作
4. **版本一致性** - 确保所有相关包的版本协调

**两步升级流程：**

**第一步：更新 Angular 核心**
```bash
ng update @angular/core @angular/cli --from 14 --to 15
```
这将自动：
- 更新 package.json 中的依赖
- 运行迁移 schematic
- 更新 TypeScript 到 4.8.x
- 处理大部分破坏性变更

**第二步：更新 Angular Material**
```bash
ng update @angular/material @angular/cdk --from 14 --to 15
```
这将运行 Material 特定的迁移

#### ⚠️ 需要手动处理的变更

即使使用 `ng update`，以下内容仍需手动处理：

**1. RxJS 6 → 7 升级（关键）**
```json
// 从 package.json 中移除
"rxjs-compat": "^6.6.7"  // ❌ 删除这个

// 更新 rxjs
"rxjs": "^7.5.0"  // ✅ 升级到 7.x
```
RxJS 7 移除了许多已废弃的 API。`rxjs-compat` 包是为了向后兼容的，在 RxJS 7 中不再需要。

**2. Zone.js 升级**
```json
"zone.js": "^0.12.0"  // 从 0.11.5 升级
```

**3. 第三方依赖兼容性**
验证这些包对 Angular 15 的兼容性：
- `angular-draggable-droppable` (6.1.0) - 检查更新
- `angular-resizable-element` (3.4.0) - 验证兼容性
- `ng-circle-progress` (1.6.0) - 可能需要替换
- `ng2-file-upload` (3.0.0) - 检查 Angular 15+ 支持
- `ngx-device-detector` (4.0.1) - 验证兼容性
- `d3-ng2-service` (2.2.0) - 检查更新

**4. 预期的常见问题**
- RxJS 操作符导入错误（大部分会被 ng update 自动修复）
- Angular Material 组件 API 变更
- TypeScript 类型错误（TypeScript 4.8 类型系统更严格）

#### 完整升级流程

```bash
# 1. 创建备份分支
git checkout -b upgrade/angular-14-to-15

# 2. 清理依赖
rm -rf node_modules yarn.lock

# 3. 更新 Angular 核心
ng update @angular/core @angular/cli --from 14 --to 15

# 4. 手动编辑 package.json：移除 rxjs-compat，更新 rxjs 到 ^7.5.0

# 5. 更新 Angular Material
ng update @angular/material @angular/cdk --from 14 --to 15

# 6. 重新安装依赖
yarn install

# 7. 构建并检查错误
ng build

# 8. 运行测试
ng test

# 9. 修复 lint
ng lint --fix

# 10. 格式化代码
yarn prettier:write
```

#### 风险评估
**风险等级：中等**
- Angular 14→15 是一个相对平滑的升级
- 大部分变更可以通过 ng update 自动处理
- 主要工作量在 RxJS 升级和第三方依赖验证

### 迁移步骤

1. 更新所有 Angular 包到 15.2.x
2. 运行 `ng update @angular/core @angular/cli --from 14 --to 15 --migrate-only`
3. 更新 TypeScript 到 4.8.4
4. 更新 RxJS 到 7.x 并移除 rxjs-compat
5. 更新 zone.js 到 0.12.x
6. 更新 Angular Material/CDK 到 15.2.x
7. 运行 `ng update @angular/material --from 14 --to 15 --migrate-only`
8. 修复编译错误
9. 运行测试并修复失败的测试
10. 构建并验证

### 预计工作量
- 时间：2-4 小时
- 风险：中等

---

## 第二阶段：Angular 15 → 16

### 前置要求
- Node.js 16.14.x 或更高版本（推荐：18.x）

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^16.2.0",
"@angular/common": "^16.2.0",
"@angular/compiler": "^16.2.0",
"@angular/core": "^16.2.0",
"@angular/forms": "^16.2.0",
"@angular/platform-browser": "^16.2.0",
"@angular/platform-browser-dynamic": "^16.2.0",
"@angular/router": "^16.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^16.2.0",
"@angular/material": "^16.2.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^16.2.0",
"@angular/cli": "^16.2.0",
"@angular/compiler-cli": "^16.2.0",
"typescript": "~5.1.3"
```

### 需要处理的破坏性变更

1. **需要 TypeScript 5.1+** - 重大类型系统变更
2. **必需输入** - 组件必需输入的新语法
3. **路由器** - 新的路由配置选项
4. **表单** - 类型化表单功能（可选迁移）
5. **Angular Material** - 基于 MDC 的组件被替换
6. **构建系统** - 基于 esbuild 的构建器（可选）

### 迁移步骤

1. 更新所有 Angular 包到 16.2.x
2. 运行 `ng update @angular/core @angular/cli --from 15 --to 16 --migrate-only`
3. 更新 TypeScript 到 5.1.x
4. 更新 Angular Material/CDK 到 16.2.x
5. 运行 Material 迁移
6. 修复编译错误（特别是类型错误）
7. 运行测试并修复失败的测试
8. 构建并验证

### 预计工作量
- 时间：3-5 小时
- 风险：中高

---

## 第三阶段：Angular 16 → 17

### 前置要求
- Node.js 18.13.x 或更高版本
- Angular 17 需要更新的构建系统

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^17.3.0",
"@angular/common": "^17.3.0",
"@angular/compiler": "^17.3.0",
"@angular/core": "^17.3.0",
"@angular/forms": "^17.3.0",
"@angular/platform-browser": "^17.3.0",
"@angular/platform-browser-dynamic": "^17.3.0",
"@angular/router": "^17.3.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^17.3.0",
"@angular/material": "^17.3.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^17.3.0",
"@angular/cli": "^17.3.0",
"@angular/compiler-cli": "^17.3.0",
"typescript": "~5.2.2"
```

### 需要处理的破坏性变更

1. **需要 TypeScript 5.2+**
2. **新的控制流语法** - `@if`、`@for`、`@switch` 替换 `*ngIf`、`*ngFor`
3. **独立组件** - 现在是默认方式
4. **Signals（信号）** - 新的响应式原语（可选迁移）
5. **构建系统** - esbuild 成为默认
6. **Angular Material** - CDK 变更和弃用

### 迁移步骤

1. 更新所有 Angular 包到 17.3.x
2. 运行 `ng update @angular/core @angular/cli --from 16 --to 17 --migrate-only`
3. 更新 TypeScript 到 5.2.x
4. 更新 Angular Material/CDK 到 17.3.x
5. 运行 Material 迁移
6. **关键**：迁移到新的控制流语法（有自动迁移可用）
7. 考虑迁移到独立组件
8. 修复编译错误
9. 运行测试并修复失败的测试
10. 构建并验证

### 预计工作量
- 时间：5-8 小时
- 风险：高（控制流语法变更）

---

## 第四阶段：Angular 17 → 18

### 前置要求
- Node.js 18.19.1 或更高版本（推荐：20.x）

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^18.2.0",
"@angular/common": "^18.2.0",
"@angular/compiler": "^18.2.0",
"@angular/core": "^18.2.0",
"@angular/forms": "^18.2.0",
"@angular/platform-browser": "^18.2.0",
"@angular/platform-browser-dynamic": "^18.2.0",
"@angular/router": "^18.2.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^18.2.0",
"@angular/material": "^18.2.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^18.2.0",
"@angular/cli": "^18.2.0",
"@angular/compiler-cli": "^18.2.0",
"typescript": "~5.4.2"
```

### 需要处理的破坏性变更

1. **需要 TypeScript 5.4+**
2. **Zone.js 优化** - 无区域（Zoneless）实验性功能可用
3. **Signals 增强** - 更成熟的信号 API
4. **延迟加载** - 新的块语法
5. **Angular Material** - 组件更新和弃用
6. **构建优化** - esbuild 改进

### 迁移步骤

1. 更新所有 Angular 包到 18.2.x
2. 运行 `ng update @angular/core @angular/cli --from 17 --to 18 --migrate-only`
3. 更新 TypeScript 到 5.4.x
4. 更新 Angular Material/CDK 到 18.2.x
5. 运行 Material 迁移
6. 修复编译错误
7. 运行测试并修复失败的测试
8. 构建并验证

### 预计工作量
- 时间：2-4 小时
- 风险：中等

---

## 第五阶段：Angular 18 → 19

### 前置要求
- Node.js 20.11.1 或更高版本

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^19.0.0",
"@angular/common": "^19.0.0",
"@angular/compiler": "^19.0.0",
"@angular/core": "^19.0.0",
"@angular/forms": "^19.0.0",
"@angular/platform-browser": "^19.0.0",
"@angular/platform-browser-dynamic": "^19.0.0",
"@angular/router": "^19.0.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^19.0.0",
"@angular/material": "^19.0.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^19.0.0",
"@angular/cli": "^19.0.0",
"@angular/compiler-cli": "^19.0.0",
"typescript": "~5.5.x"
```

### 需要处理的破坏性变更

1. **需要 TypeScript 5.5+**
2. **增强的 Signals** - 更多功能和稳定性
3. **默认独立组件** - 模块完全弃用
4. **Angular Material** - 重大组件更新
5. **性能改进** - 构建和运行时优化

### 迁移步骤

1. 更新所有 Angular 包到 19.0.x
2. 运行 `ng update @angular/core @angular/cli --from 18 --to 19 --migrate-only`
3. 更新 TypeScript 到 5.5.x
4. 更新 Angular Material/CDK 到 19.0.x
5. 运行 Material 迁移
6. 将剩余的模块迁移到独立组件（如果有）
7. 修复编译错误
8. 运行测试并修复失败的测试
9. 构建并验证

### 预计工作量
- 时间：3-5 小时
- 风险：中等

---

## 第六阶段（可选）：Angular 19 → 20

### 前置要求
- Node.js 20.11.1 或更高版本

### 包更新

#### Angular 核心包
```json
"@angular/animations": "^20.0.0",
"@angular/common": "^20.0.0",
"@angular/compiler": "^20.0.0",
"@angular/core": "^20.0.0",
"@angular/forms": "^20.0.0",
"@angular/platform-browser": "^20.0.0",
"@angular/platform-browser-dynamic": "^20.0.0",
"@angular/router": "^20.0.0"
```

#### Angular Material & CDK
```json
"@angular/cdk": "^20.0.0",
"@angular/material": "^20.0.0"
```

#### 开发依赖
```json
"@angular-devkit/build-angular": "^20.0.0",
"@angular/cli": "^20.0.0",
"@angular/compiler-cli": "^20.0.0",
"typescript": "~5.6.x"
```

### 迁移步骤

1. 更新所有 Angular 包到 20.0.x
2. 运行 `ng update @angular/core @angular/cli --from 19 --to 20 --migrate-only`
3. 更新 TypeScript 到 5.6.x
4. 更新 Angular Material/CDK 到 20.0.x
5. 修复编译错误
6. 运行测试并修复失败的测试
7. 构建并验证

### 预计工作量
- 时间：2-4 小时
- 风险：低-中等

---

## 常用迁移命令

### 每次升级前
```bash
# 创建功能分支
git checkout -b upgrade/angular-X到Y

# 清理安装
rm -rf node_modules package-lock.json yarn.lock
npm install
# 或
yarn install
```

### 升级期间
```bash
# 运行 Angular 迁移
ng update @angular/core @angular/cli --from X --to Y --migrate-only

# 运行 Material 迁移
ng update @angular/material --from X --to Y --migrate-only

# 检查问题
ng build
ng test
```

### 每次升级后
```bash
# 修复 lint 问题
ng lint --fix

# 运行 prettier
yarn prettier:write

# 提交更改
git add .
git commit -m "feat: 升级到 Angular Y"
```

---

## 每个阶段后的测试检查清单

- [ ] 项目成功构建 (`ng build`)
- [ ] 生产构建成功 (`ng build --configuration=production`)
- [ ] 所有单元测试通过 (`ng test`)
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint/TSLint 警告
- [ ] 应用启动无错误
- [ ] 手动测试关键功能
- [ ] 检查控制台警告/错误

---

## 需要关注的第三方依赖

这些包在 Angular 升级期间可能需要更新：

- `angular-draggable-droppable` - 检查 Angular 版本兼容性
- `angular-resizable-element` - 检查更新
- `ng-circle-progress` - 可能需要替换或更新
- `ng2-file-upload` - 检查 Angular 15+ 支持
- `ngx-device-detector` - 检查更新
- `d3-ng2-service` - 验证兼容性
- `xterm` - 应该兼容但需验证

---

## 回滚计划

如果任何升级阶段严重失败：

1. 回滚到之前的提交
2. 创建 issue 记录失败详情
3. 研究导致问题的具体破坏性变更
4. 在修复后再次尝试升级
5. 如果阻塞问题严重，考虑停留在前一版本

---

## 时间估计

- **第一阶段 (14→15)**：2-4 小时
- **第二阶段 (15→16)**：3-5 小时
- **第三阶段 (16→17)**：5-8 小时
- **第四阶段 (17→18)**：2-4 小时
- **第五阶段 (18→19)**：3-5 小时
- **第六阶段 (19→20)**：2-4 小时

**总预计时间**：17-30 小时

---

## 参考资料

- [Angular 更新指南](https://update.angular.io/)
- [Angular 更新日志](https://github.com/angular/angular/blob/main/CHANGELOG.md)
- [Angular Material 更新日志](https://github.com/angular/components/blob/main/CHANGELOG.md)
- [RxJS 迁移指南](https://rxjs-dev.firebaseapp.com/guide/v6/migration)
- [Angular 博客](https://blog.angular.io/)
