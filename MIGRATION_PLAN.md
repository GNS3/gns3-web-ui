# Angular 21 现代化迁移计划

## 📋 项目现状分析

### 当前架构
- **框架版本**: Angular 21.0.0
- **组件总数**: 253 个
- **架构模式**: NgModule-based (100% standalone: false)
- **状态管理**: RxJS + 传统服务
- **变更检测**: OnPush (286 处，覆盖率较高)
- **控制流**: 传统 *ngIf/*ngFor (678 处)
- **样式**: SCSS

### 技术债务统计
| 项目 | 当前数量 | 最佳实践 | 差距 |
|------|---------|---------|------|
| Standalone Components | 0/270 | 100% | ❌ 严重偏离 |
| Signals 使用 | 0 | 大量使用 | ❌ 未采用 |
| 控制流 (*ngIf/*ngFor) | 678 | @if/@for | ⚠️ 需迁移 |
| ngClass/ngStyle | 70 | 原生绑定 | ⚠️ 需优化 |
| @HostBinding/@HostListener | 19 | host 配置 | ⚠️ 需迁移 |
| @Input/@Output 装饰器 | 104 | 函数式 API | ⚠️ 可选 |
| inject() 函数 | 0 | 优先使用 | ⚠️ 可选 |

---

## 🎯 迁移目标

### 核心目标
1. ✅ 稳定性优先: 确保应用功能不受影响
2. 🚀 性能提升: 通过 signals 和 OnPush 优化变更检测
3. 📦 包体积优化: Standalone components 改善 tree-shaking
4. 🔧 开发体验: 使用现代 API 简化代码
5. 📚 可维护性: 符合 Angular 21 最佳实践

---

## 📅 分阶段迁移计划

### Phase 0: 准备阶段（1 周）

#### 0.1 环境准备
- [x] 创建迁移分支 modernization/angular-21-migration
- [ ] 更新依赖到最新稳定版
- [ ] 配置 ESLint 规则（强制新代码使用现代 API）
- [ ] 建立迁移检查清单

#### 0.2 基础设施
- [ ] 创建 src/app/standalone/ 目录（新组件目录）
- [ ] 创建迁移工具脚本（可选）
- [ ] 设置性能基准测试
- [ ] 准备回滚计划

---

### Phase 1: Standalone Components 试点（2-3 周）

#### 1.1 选择试点模块
**候选模块**:
1. src/app/components/progress/ - 进度条组件（1 个）
2. src/app/components/ai-chat/ - AI 聊天组件（1 个）
3. src/app/components/topology-summary/ - 拓扑摘要（1 个）

#### 1.2 迁移步骤
**步骤 1**: 转换为 Standalone
**步骤 2**: 移除 NgModule 依赖
**步骤 3**: 测试验证

---

### Phase 2: Signals 引入（3-4 周）

#### 2.1 识别迁移候选
**适合使用 Signals 的场景**:
1. 简单状态管理（loading, error, flags）
2. UI 交互状态（expanded, selected, visible）
3. 表单状态
4. 计算属性（derived state）

#### 2.2 Signals 迁移模式
- 模式 1: Input Signal
- 模式 2: Model Signal
- 模式 3: Computed Signal
- 模式 4: RxJS to Signals (effect)

---

### Phase 3-8: 详细计划
[见完整文档]

---

## 📊 成功指标

### 定量指标
- [ ] Standalone Components 覆盖率 > 80%
- [ ] Signals 使用数量 > 50
- [ ] 新控制流语法覆盖率 > 80%
- [ ] 包体积减少 > 10%
- [ ] 首屏加载时间减少 > 15%

---

## 📅 时间表

| Phase | 阶段名称 | 预计时长 | 状态 |
|-------|---------|---------|------|
| 0 | 准备阶段 | 1 周 | 🔄 进行中 |
| 1 | Standalone 试点 | 2-3 周 | ⏳ 待开始 |
| 2 | Signals 引入 | 3-4 周 | ⏳ 待开始 |
| 3 | 新控制流 | 2-3 周 | ⏳ 待开始 |
| 4 | ngClass/ngStyle | 1-2 周 | ⏳ 待开始 |
| 5 | Host 装饰器 | 1 周 | ⏳ 待开始 |
| 6 | 全面 Standalone | 4-6 周 | ⏳ 待开始 |
| 7 | 函数式 API | 1-2 周 | ⏳ 待开始 |
| 8 | 清理优化 | 1-2 周 | ⏳ 待开始 |

**总预计时间**: 16-25 周（约 4-6 个月）

---

**最后更新**: 2026-03-21
**文档版本**: 1.0
