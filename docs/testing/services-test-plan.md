# Services 单元测试计划

> 为 GNS3 Web UI 的 71 个服务创建全面的单元测试

**创建时间**: 2026-04-02
**当前状态**: 🚧 进行中
**测试框架**: Vitest + Angular Test Bed

---

## 📊 总体进度

```
进度: 13/71 (18%)
█████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

| 阶段 | 已完成 | 总计 | 进度 |
|------|--------|------|------|
| 🟢 简单服务 (9-50行) | 6 | 35 | 17% |
| 🟡 中等服务 (50-150行) | 7 | 23 | 30% |
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
| 4 | login.service.ts | 33 行 | 19 | ✅ 完成 | 43b033b2 |
| 5 | toaster.service.ts | 41 行 | 30 | ✅ 完成 | e7f6ce9d |
| 6 | user.service.ts | 44 行 | 35 | ✅ 完成 | 7f0a1086 |
| 7 | group.service.ts | 70 行 | 43 | ✅ 完成 | 4a3051cb |
| 8 | info.service.ts | 79 行 | 51 | ✅ 完成 | cd7245be |
| 9 | notification.service.ts | 81 行 | 43 | ✅ 完成 | 70b0d1bf |
| 10 | link.service.ts | 133 行 | 47 | ✅ 完成 | 33bb2e41 |
| 11 | drawing.service.ts | 148 行 | 51 | ✅ 完成 | fc20f663 |
| 12 | symbol.service.ts | 155 行 | 60 | ✅ 完成 | 52716a07 |
| 13 | project.service.ts | 168 行 | 65 | ✅ 完成 | 5a085f67 |
| 14 | template.service.ts | 21 行 | 16 | ✅ 完成 | 待提交 |

### 🚧 进行中

| # | 服务名 | 文件大小 | 测试数 | 状态 |
|---|--------|----------|--------|------|
| 15 | compute.service.ts | 27 行 | - | ⏳ 下一个 |

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

**最后更新**: 2026-04-02 12:47
**维护者**: Claude Code Assistant

---

## 🎯 最近完成

### ✅ symbol.service.ts (2026-04-02)
- **测试数**: 60
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (3个测试)
  - getMaximumSymbolSize 方法 (1个测试)
  - get 方法 (3个测试)
  - getByFilename 方法 (3个测试)
  - getDimensions 方法 (5个测试)
  - getSymbolBlobUrl 方法 (4个测试)
  - scaleDimensionsForNode 方法 (6个测试)
  - add 方法 (3个测试)
  - addFile 方法 (3个测试)
  - delete 方法 (4个测试)
  - load 方法 (2个测试)
  - list 方法 (4个测试)
  - listBuiltinSymbols 方法 (3个测试)
  - listCustomSymbols 方法 (3个测试)
  - raw 方法 (2个测试)
  - getSymbolFromTemplate 方法 (4个测试)
  - 缓存管理 (2个测试)
  - 边界情况 (5个测试)
- **提交**: 待提交

### ✅ project.service.ts (2026-04-02)
- **测试数**: 65
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (5个测试)
  - projectListUpdated 方法 (1个测试)
  - projectUpdateLockIcon 方法 (1个测试)
  - getReadmeFile 方法 (2个测试)
  - postReadmeFile 方法 (2个测试)
  - get 方法 (2个测试)
  - open 方法 (2个测试)
  - close 方法 (3个测试)
  - list 方法 (3个测试)
  - nodes/links/drawings 方法 (6个测试)
  - add/update/delete 方法 (5个测试)
  - getUploadPath/getExportPath 方法 (3个测试)
  - export/getStatistics/duplicate 方法 (6个测试)
  - isReadOnly 方法 (3个测试)
  - getCompression/getCompressionLevel 方法 (3个测试)
  - getexportPortableProjectPath 方法 (3个测试)
  - getProjectStatus 方法 (2个测试)
  - URL 构建 (1个测试)
  - 边界情况 (6个测试)
- **提交**: 待提交

### ✅ template.service.ts (2026-04-02)
- **测试数**: 16
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (3个测试)
  - list 方法 (4个测试)
  - deleteTemplate 方法 (5个测试)
  - newTemplateCreated Subject (2个测试)
  - 边界情况 (3个测试)
- **提交**: 待提交

### ✅ drawing.service.ts (2026-04-02)
- **测试数**: 51
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (2个测试)
  - add 方法 (5个测试)
  - duplicate 方法 (6个测试)
  - updatePosition 方法 (6个测试)
  - updateSizeAndPosition 方法 (4个测试)
  - updateText 方法 (5个测试)
  - update 方法 (4个测试)
  - delete 方法 (3个测试)
  - lockAllNodes 方法 (3个测试)
  - unLockAllNodes 方法 (3个测试)
  - URL 构建 (2个测试)
  - 边界情况 (8个测试)
- **提交**: 待提交

### ✅ link.service.ts (2026-04-02)
- **测试数**: 47
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (2个测试)
  - createLink 方法 (6个测试)
  - getLink 方法 (3个测试)
  - deleteLink 方法 (3个测试)
  - updateLink 方法 (6个测试)
  - updateLinkStyle 方法 (3个测试)
  - getAvailableFilters 方法 (3个测试)
  - updateNodes 方法 (4个测试)
  - startCaptureOnLink 方法 (3个测试)
  - stopCaptureOnLink 方法 (3个测试)
  - resetLink 方法 (3个测试)
  - streamPcap 方法 (3个测试)
  - URL 构建 (1个测试)
  - 边界情况 (3个测试)
- **提交**: 待提交

### ✅ notification.service.ts (2026-04-02)
- **测试数**: 43
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (4个测试)
  - notificationsPath 方法 (8个测试)
  - projectNotificationsPath 方法 (7个测试)
  - disconnect 方法 (3个测试)
  - handleMessage 方法 (6个测试)
  - Emitter (3个测试)
  - 边界情况 (9个测试)
  - URL 构建一致性 (3个测试)
- **提交**: 待提交

### ✅ info.service.ts (2026-04-02)
- **测试数**: 51
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (2个测试)
  - getInfoAboutNode 方法 - 所有节点类型 (14个测试)
  - getInfoAboutNode 方法 - 控制器信息 (3个测试)
  - getInfoAboutNode 方法 - 控制台信息 (4个测试)
  - getInfoAboutNode 方法 - 端口信息 (3个测试)
  - getInfoAboutPorts 方法 (5个测试)
  - getCommandLine 方法 - 不支持的节点类型 (8个测试)
  - getCommandLine 方法 - 支持的节点类型 (7个测试)
  - 边界情况 (4个测试)
- **提交**: 待提交

### ✅ group.service.ts (2026-04-02)
- **测试数**: 43
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (2个测试)
  - getGroups 方法 (3个测试)
  - getGroupMember 方法 (3个测试)
  - addGroup 方法 (3个测试)
  - delete 方法 (3个测试)
  - get 方法 (2个测试)
  - addMemberToGroup 方法 (3个测试)
  - removeUser 方法 (3个测试)
  - update 方法 (3个测试)
  - getGroupRole 方法 (3个测试)
  - removeRole 方法 (3个测试)
  - addRoleToGroup 方法 (3个测试)
  - URL 构建 (3个测试)
  - 边界情况 (6个测试)
- **提交**: 待提交

### ✅ user.service.ts (2026-04-02)
- **测试数**: 35
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建 (2个测试)
  - getInformationAboutLoggedUser 方法 (3个测试)
  - get 方法 (3个测试)
  - list 方法 (3个测试)
  - add 方法 (3个测试)
  - delete 方法 (3个测试)
  - update 方法 (5个测试，包含条件逻辑)
  - getGroupsByUserId 方法 (4个测试)
  - URL 构建 (2个测试)
  - 边界情况 (4个测试)
  - 方法返回类型 (3个测试)
- **提交**: 待提交

### ✅ toaster.service.ts (2026-04-02)
- **测试数**: 30
- **覆盖率**: 100%
- **测试内容**:
  - 服务创建和配置验证 (4个测试)
  - success 方法 (4个测试)
  - warning 方法 (4个测试)
  - error 方法 (5个测试)
  - 配置持续时间和面板类 (6个测试)
  - 配置定位 (2个测试)
  - 多个提示消息 (2个测试)
  - 边界情况 (3个测试)
- **提交**: 待提交

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
