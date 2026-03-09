# AI Chat 功能文档

> AI Chat 功能的完整文档索引和代码文件梳理

---

## 📚 文档索引

### 实现方案
| 文档 | 说明 | 状态 |
|------|------|------|
| [ai-chat-implementation-plan.md](./ai-chat-implementation-plan.md) | AI Chat 初始实现计划 | ✅ 已实现 |
| [ai-chat-ui-optimization-plan.md](./ai-chat-ui-optimization-plan.md) | UI 优化方案（JSON viewer等） | ✅ 已实现 |
| [ai-chat-component-architecture.md](./ai-chat-component-architecture.md) | 组件架构文档 | ✅ 已完成 |
| [ai-chat-json-viewer-implementation.md](./ai-chat-json-viewer-implementation.md) | JSON Viewer 实现记录 | ✅ 已完成 |
| [confirmation-dialog-component.md](./confirmation-dialog-component.md) | 确认对话框组件 | ✅ 已实现 |

### 问题修复
| 文档 | 说明 |
|------|------|
| [ai-chat-delete-fix.md](./ai-chat-delete-fix.md) | 删除会话修复记录 |
| [ai-chat-session-id-and-sse.md](./ai-chat-session-id-and-sse.md) | Session ID 与 SSE 问题 |

### 更新日志
| 文档 | 说明 |
|------|------|
| [ai-chat-updates-2026-03-08.md](./ai-chat-updates-2026-03-08.md) | 2026-03-08 更新日志 |

### 相关文档
| 文档 | 说明 |
|------|------|
| [console-devices-panel-plan.md](../todo/console-devices-panel-plan.md) | Console 设备列表侧边栏方案 |

---

## 2. 代码文件清单

### 2.1 核心组件 (src/app/components/project-map/ai-chat/)

| 文件 | 类型 | 说明 |
|------|------|------|
| `ai-chat.component.ts` | Component | 主组件，AI Chat面板容器 |
| `ai-chat.component.html` | Template | 主模板 |
| `ai-chat.component.scss` | Style | 主样式 |
| `chat-message-list.component.ts` | Component | 消息列表渲染 |
| `chat-message-list.component.scss` | Style | 消息样式 |
| `chat-input-area.component.ts` | Component | 输入区域 |
| `chat-session-list.component.ts` | Component | 会话列表 |
| `tool-call-display.component.ts` | Component | 工具调用显示 |
| `tool-details-dialog.component.ts` | Component | 工具详情对话框 |

**总计**: 9个文件

### 2.2 服务与状态 (src/app/services/, src/app/stores/)

| 文件 | 类型 | 说明 |
|------|------|------|
| `services/ai-chat.service.ts` | Service | AI Chat API交互服务 |
| `services/ai-profiles.service.ts` | Service | AI Profile管理服务 |
| `stores/ai-chat.store.ts` | Store | AI Chat状态管理 |

**总计**: 3个文件

### 2.3 数据模型 (src/app/models/)

| 文件 | 类型 | 说明 |
|------|------|------|
| `models/ai-chat.interface.ts` | Interface | AI Chat数据接口定义 |
| `models/ai-profile.ts` | Interface | AI Profile接口 |

**总计**: 2个文件

---

## 3. 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Chat Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐     ┌─────────────────────────────┐   │
│  │   ai-chat.component    │     │  ConsoleWrapperComponent   │   │
│  │   (主面板)            │     │  (Console设备面板)         │   │
│  └────────┬─────────┘     └─────────────────────────────┘   │
│           │                                                   │
│  ┌────────┴─────────────────────────────────────────────┐    │
│  │                    Components                        │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐  │    │
│  │  │ chat-message-   │  │ chat-session-          │  │    │
│  │  │ list.component  │  │ list.component         │  │    │
│  │  └────────┬────────┘  └───────────┬───────────┘  │    │
│  │           │                        │               │    │
│  │  ┌────────┴────────┐  ┌───────────┴───────────┐  │    │
│  │  │ chat-input-    │  │ tool-call-display    │  │    │
│  │  │ area.component │  │ .component           │  │    │
│  │  └─────────────────┘  └─────────────────────┘  │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ tool-details-dialog.component (JSON Viewer) │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│           │                                                  │
│  ┌────────┴─────────────────────────────────────────────┐    │
│  │                    Services                          │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │    │
│  │  │ ai-chat.service │  │ ai-chat.store (NgRx)    │   │    │
│  │  └────────┬────────┘  └───────────┬───────────┘   │    │
│  │           │                        │               │    │
│  │  ┌────────┴────────────────────────┴───────────┐  │    │
│  │  │          ai-profiles.service                 │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│           │                                                  │
│  ┌────────┴─────────────────────────────────────────────┐    │
│  │                    Models                            │    │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  │    │
│  │  │ ai-chat.interface   │  │ ai-profile.ts       │  │    │
│  │  │ (所有数据接口)      │  │ (Profile接口)       │  │    │
│  │  └─────────────────────┘  └─────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 数据流

```
User Input
    │
    ▼
┌─────────────────────────────┐
│  chat-input-area.component  │
│  (用户输入发送)              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     ai-chat.service         │
│  (SSE 流式请求)              │
└──────────────┬──────────────┘
               │
               ▼ (SSE Events)
┌─────────────────────────────┐
│     ai-chat.store           │
│  (状态管理)                  │
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌────────────┐    ┌────────────────────────┐
│ 消息列表   │    │  会话列表              │
│ Component  │    │  Component             │
└────────────┘    └────────────────────────┘
```

---

## 5. 依赖关系

### 5.1 组件依赖

```
ai-chat.component
├── chat-message-list.component
│   ├── tool-call-display.component
│   └── tool-details-dialog.component (Dialog)
├── chat-input-area.component
└── chat-session-list.component
```

### 5.2 外部依赖

| 模块 | 版本 | 用途 |
|------|------|------|
| `ngx-markdown` | - | Markdown渲染 |
| `ngx-json-viewer` | 3.2.1 | JSON格式化显示 |
| `ngx-electron` | - | Electron集成 |

---

## 6. 功能清单

### 6.1 已实现功能

| 功能 | 组件 | 说明 |
|------|------|------|
| ✅ 消息展示 | chat-message-list | 支持user/assistant/system/tool_call/tool_result |
| ✅ Markdown渲染 | chat-message-list | 使用ngx-markdown |
| ✅ 流式输出 | ai-chat.service | SSE实时流 |
| ✅ 会话管理 | chat-session-list | 创建/删除/切换会话 |
| ✅ 工具调用显示 | tool-call-display | 显示AI调用的工具 |
| ✅ 工具结果详情 | tool-details-dialog | JSON Viewer展示结果 |
| ✅ Dark/Light主题 | 各组件 | 适配暗色/亮色主题 |

### 6.2 规划中功能

| 功能 | 组件 | 说明 |
|------|------|------|
| 📋 Console设备面板 | console-devices-panel | 设备列表侧边栏 |
| 📋 快捷键切换 | - | Electron全局快捷键 |

---

## 7. 样式文件

| 文件 | 说明 |
|------|------|
| `ai-chat.component.scss` | 主面板样式 |
| `chat-message-list.component.scss` | 消息列表样式（包含prose dark/light主题） |
| `tool-details-dialog.component.scss` | 工具详情对话框样式 |

---

## 8. 待清理文件

根据之前的工作，有一些可能不再需要的文件：

| 文件 | 说明 |
|------|------|
| `_deprecated_ai-chat-device-result-card-plan.md` | 已废弃的方案文档，可删除 |

---

*文档创建时间: 2026-03-10*
*最后更新: 2026-03-10*
