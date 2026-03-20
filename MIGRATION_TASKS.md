# 迁移任务清单

## Phase 0: 准备阶段

### 环境准备
- [x] 创建迁移分支 modernization/angular-21-migration
- [ ] 检查并更新依赖包到最新稳定版
- [ ] 配置 ESLint 强制使用现代 Angular API
- [ ] 创建性能基准测试脚本

### 基础设施
- [ ] 创建 src/app/standalone/ 目录结构
- [ ] 创建迁移辅助脚本
- [ ] 设置 CI/CD 检查点

### 文档和培训
- [x] 创建迁移计划文档
- [ ] 编写 Standalone Components 指南
- [ ] 编写 Signals 使用指南
- [ ] 准备团队培训材料

### 试点模块分析
- [ ] 分析 progress 组件依赖关系
- [ ] 分析 ai-chat 组件依赖关系
- [ ] 分析 topology-summary 组件依赖关系
- [ ] 确定试点模块迁移顺序

---

## Phase 1: Standalone Components 试点

### progress 组件迁移
- [ ] 转换为 standalone
- [ ] 测试功能完整性
- [ ] 性能对比测试
- [ ] 代码审查

### ai-chat 组件迁移
- [ ] 转换为 standalone
- [ ] 测试功能完整性
- [ ] 性能对比测试
- [ ] 代码审查

### topology-summary 组件迁移
- [ ] 转换为 standalone
- [ ] 测试功能完整性
- [ ] 性能对比测试
- [ ] 代码审查

### 试点总结
- [ ] 记录迁移经验教训
- [ ] 更新迁移指南
- [ ] 评估 ROI
- [ ] 制定全面推广计划

---

## Phase 2: Signals 引入

### 识别候选场景
- [ ] 审查工具栏状态管理
- [ ] 审查选择管理器
- [ ] 审查进度服务
- [ ] 确定优先迁移列表

### Signals 迁移
- [ ] 迁移工具栏状态 (project-map.component)
- [ ] 迁移选择状态 (selection-manager)
- [ ] 迁移进度状态 (progress.service)
- [ ] 其他组件 signals 迁移

---

## 进度跟踪

- 开始日期: 2026-03-21
- 当前阶段: Phase 0 - 准备阶段
- 已完成任务: 2
- 待完成任务: 30+
- 完成度: 5%

---

**最后更新**: 2026-03-21
