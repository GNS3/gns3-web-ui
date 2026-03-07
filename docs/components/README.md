# Components Directory - Code Review Index

本文档索引了 GNS3 Web UI 项目中 `src/app/components/` 目录下所有子组件的代码审查文档。

## 📁 文档索引

### 🔐 认证与用户管理

| 组件目录 | 文档 | 主要问题 |
|----------|------|----------|
| [login](./login/CODE_REVIEW.md) | [查看详情](./login/CODE_REVIEW.md) | 🔴 密码明文存储在 localStorage |
| [user-management](./user-management/CODE_REVIEW.md) | [查看详情](./user-management/CODE_REVIEW.md) | 🟠 异步验证器性能问题、API 密钥明文显示 |
| [group-management](./group-management/CODE_REVIEW.md) | [查看详情](./group-management/CODE_REVIEW.md) | 🟡 订阅管理缺失、权限验证缺失 |
| [role-management](./role-management/CODE_REVIEW.md) | [查看详情](./role-management/CODE_REVIEW.md) | 🟡 使用 UntypedFormControl、权限提升风险 |

### 📁 项目管理

| 组件目录 | 文档 | 主要问题 |
|----------|------|----------|
| [projects](./projects/CODE_REVIEW.md) | [查看详情](./projects/CODE_REVIEW.md) | 🔴 内存泄漏、XSS 防护不足 |
| [project-map](./project-map/CODE_REVIEW.md) | [查看详情](./project-map/CODE_REVIEW.md) | 🔴 XSS 漏洞（AI 聊天）、性能问题 |
| [snapshots](./REMAINING_COMPONENTS.md#snapshots-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 快照恢复验证缺失 |
| [template](./template/CODE_REVIEW.md) | [查看详情](./template/CODE_REVIEW.md) | 🔴 SVG 注入风险、拖拽坐标验证不足 |

### ⚙️ 系统管理

| 组件目录 | 文档 | 主要问题 |
|----------|------|----------|
| [settings](./REMAINING_COMPONENTS.md#settings-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 外部链接验证、设置验证 |
| [help](./REMAINING_COMPONENTS.md#help-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 文件读取安全 |
| [system-status](./REMAINING_COMPONENTS.md#system-status-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 路由参数验证 |
| [preferences](./CODE_REVIEW.md) | [主文档](../CODE_REVIEW.md) | 🟡 代码重复、懒加载缺失 |

### 🔧 资源管理

| 组件目录 | 文档 | 主要问题 |
|----------|------|----------|
| [image-manager](./REMAINING_COMPONENTS.md#image-manager-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟠 文件上传验证缺失 |
| [resource-pools-management](./REMAINING_COMPONENTS.md#resource-pools-management-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 代码重复、并发控制 |
| [controllers](./REMAINING_COMPONENTS.md#controllers-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟠 命令注入风险 |
| [acl-management](./REMAINING_COMPONENTS.md#acl-management-component) | [查看详情](./REMAINING_COMPONENTS.md) | 🟡 权限验证缺失 |

---

## 🚨 严重问题汇总

### 立即修复（本周内）

| 问题 | 位置 | 风险等级 |
|------|------|----------|
| 密码明文存储 | `login/login.component.ts:105-111` | 🔴 严重 |
| XSS 漏洞（AI 聊天） | `project-map/ai-chat/chat-message-list.component.ts:240-241` | 🔴 严重 |
| XSS 防护不足 | `projects/edit-project-dialog/readme-editor/readme-editor.component.ts:34-35` | 🔴 严重 |
| SVG 注入风险 | `template/template.component.ts` | 🔴 高 |
| 命令注入风险 | `controllers/controllers.component.ts` | 🔴 高 |

### 短期修复（本月内）

| 问题类别 | 影响组件 | 数量 |
|----------|----------|------|
| 内存泄漏 | projects, project-map 等 | 15+ |
| 订阅未清理 | 大部分组件 | 20+ |
| 权限验证缺失 | 多个管理组件 | 10+ |
| 输入验证不足 | 表单组件 | 15+ |

---

## 📊 问题统计

### 按严重程度

| 严重程度 | 数量 | 百分比 |
|----------|------|--------|
| 🔴 严重 | 5 | 10% |
| 🟠 高 | 12 | 24% |
| 🟡 中 | 25 | 50% |
| 🟢 低 | 8 | 16% |

### 按问题类型

| 问题类型 | 数量 |
|----------|------|
| 安全漏洞 | 15 |
| 内存泄漏 | 18 |
| 性能问题 | 8 |
| 代码质量 | 22 |
| 最佳实践违反 | 12 |

---

## 🛠️ 修复优先级

### 优先级 1 - 安全漏洞（立即）

```bash
# 1. 移除密码明文存储
# 2. 修复 XSS 漏洞
npm install dompurify @types/dompurify

# 3. 添加输入验证
# 4. 实现 SVG 净化
```

### 优先级 2 - 内存泄漏（本周）

```typescript
// 统一使用 takeUntil 模式
export class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 优先级 3 - 代码质量（本月）

```typescript
// 统一错误处理
// 添加类型安全
// 改进订阅管理
```

---

## 📝 文档结构

每个组件文档包含以下部分：

1. **概述** - 组件功能说明
2. **模块功能** - 子组件列表
3. **发现的问题** - 按严重程度分类
4. **修复建议** - 优先级排序的修复方案
5. **测试建议** - 单元测试和集成测试

---

## 🔗 相关文档

- [项目总览](../../CODE_REVIEW_SUMMARY.md)
- [Services 目录](../services/CODE_REVIEW.md)
- [Models 目录](../models/CODE_REVIEW.md)
- [Cartography 目录](../cartography/CODE_REVIEW.md)
