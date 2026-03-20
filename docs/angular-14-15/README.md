# Angular 14 → 15 升级文档

**GNS3 Web UI 项目**
**创建日期**: 2026-03-20
**维护者**: Frontend Team

---

## 📁 文档结构

```
docs/angular-14-15/
├── README.md                        # 本文件
├── RxJS-7-Migration-Guide.md       # 完整升级指南（详细）
├── 文件修改清单.md                  # 快速参考表格
└── migrate-rxjs7.sh                 # 自动迁移脚本
```

---

## 🚀 快速开始

### 1. 了解升级内容

首先阅读 **文件修改清单.md**，了解需要修改的文件和内容。

### 2. 阅读详细指南

如果需要了解详细的修改原因和代码示例，请阅读 **RxJS-7-Migration-Guide.md**。

### 3. 执行迁移

使用提供的自动迁移脚本：

```bash
cd /home/yueguobin/myCode/GNS3/gns3-web-ui

# 运行迁移脚本
./docs/angular-14-15/migrate-rxjs7.sh
```

---

## 📊 升级概览

### 影响范围

| 类型 | 文件数量 | 修改次数 |
|------|----------|----------|
| 源代码文件 | 10 | 35+ |
| 测试文件 | ~20 | ~30 |
| **总计** | **~30** | **~65+** |

### 主要变更

1. **throwError 参数** - 必须使用工厂函数
2. **Observable. 前缀** - 静态方法不再需要前缀
3. **操作符改名** - `.do()` → `.pipe(tap())`
4. **类型检查** - 更严格的类型定义

---

## 📝 文件说明

### RxJS-7-Migration-Guide.md

**完整的升级指南**，包含：

- 升级概述
- 详细的修改清单
- 代码示例（修改前后对比）
- 升级步骤
- 测试验证方法
- 回滚计划
- 常见问题解答

**适合**: 第一次阅读，全面了解升级内容

**阅读时间**: 30-45 分钟

---

### 文件修改清单.md

**快速参考表格**，包含：

- 所有需要修改的文件列表
- 每个文件的修改位置
- 修改前后代码对照
- 批量修改脚本
- 修改检查清单

**适合**: 升级时快速查阅

**使用场景**:
- 查找特定文件的修改内容
- 确认所有文件都已修改
- 作为 checklist 使用

---

### migrate-rxjs7.sh

**自动迁移脚本**，功能：

1. 创建备份分支
2. 批量修改源代码
3. 修改测试文件
4. 生成手动修改清单
5. 编译检查

**使用方法**:

```bash
# 赋予执行权限（如果还没有）
chmod +x docs/angular-14-15/migrate-rxjs7.sh

# 运行脚本
./docs/angular-14-15/migrate-rxjs7.sh
```

**脚本功能**:

```bash
✓ 自动修改 throwError 参数
✓ 自动移除 Observable. 前缀
✓ 修改测试文件
✓ 生成手动修改清单
✓ 创建备份分支
✓ 编译检查
```

**注意**: 脚本无法自动修改 `.do()` 操作符，需要手动处理。

---

## 🔧 升级步骤

### 第一步：准备工作

```bash
# 1. 切换到 master 分支
git checkout master

# 2. 拉取最新代码
git pull origin master

# 3. 创建升级分支
git checkout -b upgrade/angular-15-rxjs-7
```

### 第二步：备份

```bash
# 创建备份标签
git tag pre-rxjs7-upgrade
```

### 第三步：运行迁移脚本

```bash
# 运行自动迁移
./docs/angular-14-15/migrate-rxjs7.sh
```

### 第四步：手动修改

根据生成的 `需要手动修改的文件.txt`，手动修改：

1. **`.do()` 操作符** → `.pipe(tap())`
2. **添加导入语句**
3. **修复编译错误**

### 第五步：编译检查

```bash
# 运行编译
npm run build

# 查看错误并修复
# 常见错误：缺少导入、类型不匹配
```

### 第六步：运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run e2e

# 测试覆盖率
npm run coverage
```

### 第七步：提交

```bash
# 查看修改
git status
git diff

# 提交
git add .
git commit -m "feat: migrate to RxJS 7

- Update throwError to use factory functions
- Remove Observable. prefix from static methods
- Replace .do() with .pipe(tap())
- Update all test files

Closes: #RXJS-7-UPGRADE
"

# 推送
git push origin upgrade/angular-15-rxjs-7
```

---

## 📋 检查清单

使用此清单确保完成所有步骤：

### 准备阶段

- [ ] 阅读完整升级指南
- [ ] 查看文件修改清单
- [ ] 创建升级分支
- [ ] 创建备份标签

### 执行阶段

- [ ] 运行自动迁移脚本
- [ ] 手动修改 `.do()` 操作符
- [ ] 检查并添加导入语句
- [ ] 运行编译检查
- [ ] 修复编译错误

### 测试阶段

- [ ] 运行单元测试
- [ ] 运行 E2E 测试
- [ ] 检查测试覆盖率
- [ ] 手动测试关键功能

### 完成阶段

- [ ] 提交代码
- [ ] 推送到远程
- [ ] 创建 Pull Request
- [ ] 代码审查
- [ ] 合并到主分支

---

## ⚠️ 注意事项

### 关键点

1. **throwError 必须使用工厂函数**
   ```typescript
   // ❌ 错误
   throwError(error)

   // ✅ 正确
   throwError(() => error)
   ```

2. **Observable. 前缀必须移除**
   ```typescript
   // ❌ 错误
   Observable.of(value)
   Observable.forkJoin([obs1, obs2])

   // ✅ 正确
   of(value)
   forkJoin([obs1, obs2])
   ```

3. **`.do()` 必须改为 `.pipe(tap())`**
   ```typescript
   // ❌ 错误
   source.do(fn)

   // ✅ 正确
   source.pipe(tap(fn))
   ```

### 常见错误

1. **缺少导入语句**
   - 错误：`Cannot find name 'forkJoin'`
   - 解决：添加 `import { forkJoin } from 'rxjs';`

2. **类型不匹配**
   - 错误：`Type 'Observable<unknown>' is not assignable...`
   - 解决：添加类型断言 `as Observable<Type>`

3. **测试文件报错**
   - 错误：`Observable.of is not a function`
   - 解决：确保已删除 `rxjs-compat`

---

## 🔄 回滚计划

如果升级出现问题，可以回滚：

```bash
# 方法 1: 使用备份标签
git checkout pre-rxjs7-upgrade
git checkout -b rollback-from-rxjs7

# 方法 2: 使用备份分支
git checkout backup/pre-rxjs7-migration-*

# 方法 3: Git reset
git reflog
git checkout HEAD@{n}  # n 是升级前的提交索引
```

---

## 📞 支持

如果遇到问题：

1. 查阅 **RxJS-7-Migration-Guide.md** 的常见问题章节
2. 检查生成的日志文件
3. 搜索项目 Issues
4. 联系团队资深成员

---

## 📚 参考资源

### 官方文档

- [RxJS 7 发布说明](https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#700-2021-04-29)
- [RxJS 7 迁移指南](https://rxjs.dev/deprecations/breaking-changes)
- [Angular 15 升级指南](https://update.angular.io/?v=14.0-15.0)

### 项目资源

- GNS3 Web UI 代码仓库
- 团队 Wiki
- 开发规范文档

---

## 📈 进度跟踪

| 阶段 | 状态 | 完成日期 |
|------|------|----------|
| 文档编写 | ✅ 完成 | 2026-03-20 |
| 脚本准备 | ✅ 完成 | 2026-03-20 |
| 代码审查 | 🟡 进行中 | - |
| 测试验证 | ⏳ 待开始 | - |
| 部署上线 | ⏳ 待开始 | - |

---

## 🎯 预期结果

升级完成后：

- ✅ RxJS 版本：6.6.7 → 7.5.0+
- ✅ 删除 rxjs-compat 依赖
- ✅ 所有编译错误修复
- ✅ 所有测试通过
- ✅ 性能保持或提升
- ✅ 功能完全兼容

---

**文档版本**: 1.0
**最后更新**: 2026-03-20
**维护者**: Frontend Team

---

## 📝 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-20 | 初始版本 |
