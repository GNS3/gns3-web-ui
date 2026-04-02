# Services 单元测试计划

> 为 GNS3 Web UI 的 71 个服务创建全面的单元测试

**创建时间**: 2026-04-02
**当前状态**: 🚧 进行中
**测试框架**: Vitest + Angular Test Bed

---

## 📊 总体进度

```
进度: 3/71 (4%)
███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

| 阶段 | 已完成 | 总计 | 进度 |
|------|--------|------|------|
| 🟢 简单服务 (9-50行) | 3 | 35 | 9% |
| 🟡 中等服务 (50-150行) | 0 | 23 | 0% |
| 🔴 复杂服务 (>150行) | 0 | 13 | 0% |

---

## 🎯 测试优先级

### 高优先级服务
- 核心业务逻辑
- 用户交互频繁
- 数据处理关键路径

### 中优先级服务
- 配置管理
- 辅助功能
- UI相关服务

### 低优先级服务
- 纯代理服务
- 简单配置服务
- 第三方集成

---

## 📝 测试记录

### ✅ 已完成

| # | 服务名 | 文件大小 | 测试数 | 状态 | 提交 |
|---|--------|----------|--------|------|------|
| 1 | tools.service.ts | 33 行 | 19 | ✅ 完成 | 65dd25cb |
| 2 | mapScale.service.ts | 28 行 | 26 | ✅ 完成 | a3f7df79 |
| 3 | snapshot.service.ts | 25 行 | 20 | ✅ 完成 | 67c69db8 |
| 4 | login.service.ts | 33 行 | 19 | ✅ 完成 | 待提交 |

### 🚧 进行中

| # | 服务名 | 文件大小 | 测试数 | 状态 |
|---|--------|----------|--------|------|
| 5 | toaster.service.ts | 41 行 | - | ⏳ 下一个 |

### 📅 待测试

| # | 服务名 | 文件大小 | 优先级 | 备注 |
|---|--------|----------|--------|------|
| 6 | user.service.ts | 44 行 | 🔴 高 | 用户 |
| 7 | group.service.ts | 70 行 | 🟡 中 | 分组 |
| 8 | info.service.ts | 79 行 | 🟡 中 | 项目信息 |
| 9 | notification.service.ts | 81 行 | 🟡 中 | 通知 |
| 10 | link.service.ts | 133 行 | 🔴 高 | 链接 |
| ... | ... | ... | ... | ... |

---

## 🔧 测试模板

每个服务测试应包含：

1. **依赖注入测试**
   - 服务创建成功
   - 必需依赖注入

2. **公共方法测试**
   - 正常路径
   - 边界条件
   - 错误处理

3. **Observable 测试**
   - 订阅验证
   - 完成状态
   - 错误处理

4. **HTTP 服务测试**
   - Mock HttpClient
   - 请求验证
   - 响应处理

---

## 📚 参考资料

- [Vitest 官方文档](https://vitest.dev/)
- [Angular 测试指南](https://angular.dev/guide/testing)
- [项目测试配置](../../framework/angular-21/vitest-testing-setup.md)

---

**最后更新**: 2026-04-02 12:30
**维护者**: Claude Code Assistant

---

## 🎯 最近完成

### ✅ login.service.ts (2026-04-02)
- **测试数**: 19
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建和 controller_id 属性
  - login 方法（4个测试）
  - getLoggedUser 方法（3个测试）
  - getLoggedUserRefToken 方法（4个测试）
  - 边界情况（4个测试）
- **提交**: 待提交

### ✅ snapshot.service.ts (2026-04-02)
- **测试数**: 20
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建
  - create/delete/list/restore 方法
  - URL 构建
  - 边界情况
- **提交**: `test: add unit tests for SnapshotService (20 tests)`

### ✅ mapScale.service.ts (2026-04-02)
- **测试数**: 26
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建和默认值
  - getScale/setScale 方法
  - resetToDefault 方法
  - Context 集成
  - 缩放范围和边界情况
- **提交**: `test: add unit tests for MapScaleService (26 tests)`

### ✅ tools.service.ts (2026-04-02)
- **测试数**: 19
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建和初始化
  - 5个工具的激活/停用
  - 多工具同时激活
  - 边界情况处理
- **提交**: `test: add unit tests for ToolsService (19 tests)`
