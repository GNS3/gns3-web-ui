# GNS3 Copilot AI Chat 功能实现方案

## 📋 方案概述

AI Chat 功能将集成到项目拓扑图的左侧工具栏中，允许用户与 GNS3 Copilot Agent 交互，获取网络拓扑辅助和设备管理功能。

---

## 🏗️ 整体架构

### 后端 API 集成
**基础路径**: `/v3/projects/{project_id}/chat/`

**核心接口**:
- `POST /stream` - SSE 流式对话
- `GET /sessions` - 获取会话列表
- `GET /sessions/{session_id}/history` - 获取会话历史
- `PATCH /sessions/{session_id}` - 重命名会话
- `DELETE /sessions/{session_id}` - 删除会话
- `PUT/DELETE /sessions/{session_id}/pin` - 置顶/取消置顶

### 前端架构设计
```
Project Map Component (项目拓扑图组件)
└── Left Toolbar (左侧工具栏)
    └── AI Chat Button (AI聊天按钮) 【新增】
        └── AI Chat Panel (AI聊天面板) 【ai-chat.component.ts】
            ├── Session List (会话列表侧边栏) 【chat-session-list.component.ts】
            ├── Chat Interface (聊天主区域)
            │   ├── Message List (消息列表) 【chat-message-list.component.ts】
            │   │   ├── Tool Call Display (工具调用显示) 【tool-call-display.component.ts】
            │   │   └── JSON Viewer (JSON查看器) 【json-viewer.component.ts】
            │   └── Input Area (输入区域) 【chat-input-area.component.ts】
            ├── Draggable Tool Dialog (可拖拽工具对话框) 【draggable-tool-dialog.component.ts】
            └── Session Controls (会话控制)
                ├── New Chat (新建会话)
                ├── Rename (重命名)
                ├── Delete (删除)
                └── Pin/Unpin (置顶)
```

> **注意**: 面板可调整大小功能直接集成在 `ai-chat.component.ts` 中，未使用独立的 `ai-chat-panel.component.ts`

---

## 📁 需要修改和新增的模块/文件

### 1. **服务层** (新增)

**文件**: `src/app/services/ai-chat.service.ts`

**主要职责**:
- 处理所有 AI Chat API 调用
- 管理 SSE 连接和流式响应
- 维护会话状态和消息历史
- 处理工具调用的流式累积
- 管理统计信息

**核心方法**:
```typescript
- streamChat(projectId, message, sessionId?)  // 流式对话
- getSessions(projectId)                       // 获取会话列表
- getSessionHistory(projectId, sessionId)      // 获取会话历史
- renameSession(projectId, sessionId, title)   // 重命名会话
- deleteSession(projectId, sessionId)          // 删除会话
- pinSession(projectId, sessionId)             // 置顶会话
- unpinSession(projectId, sessionId)           // 取消置顶
```

---

### 2. **组件层** (新增)

**目录**: `src/app/components/project-map/ai-chat/`

**新增组件列表**:

#### **`ai-chat.component.ts`**
- AI Chat 功能的入口组件
- 管理整体聊天状态和布局
- 协调会话列表和聊天界面
- 处理面板显示/隐藏逻辑
- 集成可调整大小的面板功能（拖拽调整大小，面板位置持久化到 localStorage）
- 处理 SSE 流式事件 (content, tool_call, tool_start, tool_end, error, done, heartbeat)

#### **`chat-session-list.component.ts`**
- 显示聊天会话列表
- 会话项显示:
  - 标题（可编辑）
  - 最后一条消息预览
  - 统计信息（消息数、token 使用量）
  - 置顶标识
  - 时间戳
- 会话管理操作（重命名、删除、置顶）
- 新建会话按钮

#### **`chat-message-list.component.ts`**
- 可滚动的消息历史显示
- 消息类型 (实际支持):
  - `user` - 用户消息 (右侧，带头像)
  - `assistant` - AI 消息 (左侧，支持流式显示)
  - `system` - 系统消息 (居中)
  - `tool_call` - 工具调用请求 (可展开参数)
  - `tool_result` - 工具执行结果 (可折叠)
  - `error` - 错误消息 (红色标识)
- 新消息自动滚动到底部
- Markdown 渲染 (使用 marked 库)
- 命令语法高亮 (Cisco IOS)
- JSON 语法高亮

#### **`chat-input-area.component.ts`**
- 多行文本输入框
- 发送按钮及键盘快捷键（Enter/Ctrl+Enter）
- 字符计数器
- 流式传输时禁用状态
- 文件附件（未来扩展）

#### **`tool-call-display.component.ts`**
- 显示工具调用信息
- 显示工具名称和累积的参数
- 参数累积的视觉指示器
- 可折叠的工具结果
- JSON 结果语法高亮
- 工具执行状态显示 (accumulating/ready/executing/completed)
- Angular animations 动画效果

#### **`json-viewer.component.ts`** (额外新增)
- JSON 数据的格式化显示
- 支持折叠/展开 JSON 节点
- 语法高亮
- 复制功能

#### **`draggable-tool-dialog.component.ts`** (额外新增)
- 可拖拽的工具执行结果对话框
- 支持调整大小
- 位置持久化到 localStorage

---

### 3. **数据模型** (新增)

**文件**: `src/app/models/ai-chat.interface.ts`

**核心接口定义**:

```typescript
// SSE 事件类型
interface ChatEvent {
  type: 'content' | 'tool_call' | 'tool_start' | 'tool_end' |
        'error' | 'done' | 'heartbeat';
  content?: string;           // AI 文本内容
  tool_call?: ToolCall;       // 工具调用信息
  tool_name?: string;         // 工具名称
  tool_output?: string;       // 工具执行结果
  tool_call_id?: string;      // 工具调用 ID
  error?: string;             // 错误信息
  session_id?: string;        // 会话 ID
  message_id?: string;        // 消息 ID
}

// 聊天会话
interface ChatSession {
  id: number;                 // 数据库自增 ID
  thread_id: string;          // LangGraph thread_id
  user_id: string;            // 用户 ID
  project_id: string;         // 项目 ID
  title: string;              // 会话标题
  message_count: number;      // 消息数量
  llm_calls_count: number;    // LLM 调用次数
  input_tokens: number;       // 输入 token 数
  output_tokens: number;      // 输出 token 数
  total_tokens: number;       // 总 token 数
  last_message_at: string;    // 最后消息时间
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  pinned: boolean;            // 是否置顶
}

// 聊天消息
interface ChatMessage {
  id: string;                 // 消息唯一标识
  role: 'user' | 'assistant' | 'system' | 'tool' | 'tool_call' | 'tool_result'; // 实际支持的消息角色
  content: string;            // 消息内容
  created_at: string;         // 创建时间
  tool_calls?: ToolCall[];    // 工具调用列表 (assistant 消息)
  tool_call_id?: string;      // 关联的工具调用 ID
  name?: string;              // 工具名称 (tool/tool_result 消息)
  metadata?: any;             // 元数据
  toolCall?: ToolCall;        // 单个工具调用 (tool_call 消息)
  toolName?: string;          // 工具名称 (tool_result 消息)
  toolOutput?: any;           // 工具输出 (tool_result 消息)
}

// 工具调用
interface ToolCall {
  id: string;                 // 工具调用 ID
  type: 'function';
  function: {
    name: string;             // 工具名称
    arguments: string;        // 参数 JSON 字符串
    complete?: boolean;       // 参数是否完整
  };
}
```

---

### 4. **状态管理** (新增)

**文件**: `src/app/stores/ai-chat.store.ts`

**状态结构**:
```typescript
interface AIChatState {
  currentProjectId: string | null;      // 当前项目 ID
  currentSessionId: string | null;       // 当前会话 ID
  sessions: ChatSession[];                // 会话列表
  messagesMap: Map<string, ChatMessage[]>; // 消息历史 (sessionId -> messages)
  isStreaming: boolean;                   // 是否正在流式传输
  currentToolCalls: Map<string, ToolCall>; // 当前工具调用状态
  panelState: {                           // 面板状态 (持久化到 localStorage)
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
  };
  error: string | null;                   // 错误信息
}
```

**实现方式**:
- 使用 RxJS Observable 和 BehaviorSubject
- 遵循项目现有的服务化状态管理模式
- 不引入额外的状态管理库（如 NgRx）

---

### 5. **需要修改的现有文件**

#### **`src/app/components/project-map/project-map-menu/project-map-menu.component.html`**
在工具栏添加 AI Chat 按钮:
```html
<button mat-icon-button
        matTooltip="AI 助手"
        (click)="openAIChat()">
  <mat-icon>psychology</mat-icon>
</button>
```

#### **`src/app/components/project-map/project-map-menu/project-map-menu.component.ts`**
添加打开 AI Chat 的方法:
```typescript
openAIChat() {
  this.aiChatService.openChatPanel(this.project);
}
```

#### **`src/app/components/project-map/project-map.component.scss`**
为 AI Chat 面板集成添加样式

---

## 🔄 数据流程设计

### **1. 初始化聊天**
```
用户点击 AI Chat 按钮
    ↓
检查项目是否已打开
    ↓
加载当前项目的会话列表
    ↓
创建新会话或选择已有会话
    ↓
显示聊天面板
```

### **2. 发送消息流程**
```
用户输入消息并点击发送
    ↓
将用户消息添加到本地状态
    ↓
调用 aiChatService.streamChat()
    ↓
建立 SSE 连接
    ↓
处理接收的事件:
    - content: 追加到 AI 消息内容
    - tool_call: 更新工具调用显示
    - tool_start: 显示工具开始执行
    - tool_end: 显示工具执行结果
    - error: 显示错误信息
    - done: 完成消息
    ↓
更新会话统计信息
```

### **3. 工具调用处理流程**
```
接收 tool_call 事件 (流式)
    ↓
累积参数 (arguments 逐步完整)
    ↓
显示工具调用及进度指示器
    ↓
接收 tool_start 事件
    ↓
显示工具执行状态
    ↓
接收 tool_end 事件
    ↓
显示工具执行结果
```

---

## 🎨 界面设计

### **面板布局**
```
┌─────────────────────────────────────────────────┐
│ AI 助手                           [_] [□] [×]  │
├──────────────────────┬──────────────────────────┤
│ 会话列表 (250px)     │ 聊天区域                 │
│ ┌─────────────────┐  │                          │
│ │ 新建会话    +   │  │ ┌──────────────────────┐ │
│ ├─────────────────┤  │ │ 用户: 查看版本信息   │ │
│ │📌 拓扑帮助     │  │ └──────────────────────┘ │
│ │ 上次: 如何配置...│  │                          │
│ ├─────────────────┤  │ ┌──────────────────────┐ │
│ │ 网络调试       │  │ │ 助手: 我来帮你检查... │ │
│ │ 上次: 路由器... │  │ │ [流式输出中...]       │ │
│ └─────────────────┘  │ └──────────────────────┘ │
│                      │                          │
│                      │ ┌──────────────────────┐ │
│                      │ │ 🔧 执行命令          │ │
│                      │ │ 参数: {...}          │ │
│                      │ └──────────────────────┘ │
│                      │ ┌──────────────────────┐ │
│                      │ │ [输入框]           [发送]│ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

### **UI/UX 原则**
- **主题适配**: 支持浅色/深色主题
- **可调整大小**: 拖拽调整面板尺寸
- **可折叠**: 最小化为图标视图
- **响应式**: 适配不同屏幕尺寸
- **无障碍**: 键盘导航、ARIA 标签

---

## 🔧 关键技术实现

### **SSE 事件处理**
```typescript
// 服务层方法
streamChat(projectId: string, message: string, sessionId?: string): Observable<ChatEvent> {
  return new Observable<ChatEvent>((observer) => {
    // 使用 fetch 发送 POST 请求（EventSource 不支持 POST）
    fetch(`${this.apiUrl}/projects/${projectId}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ message, session_id: sessionId })
    }).then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 读取流式响应
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            observer.complete();
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              observer.next(data);

              if (data.type === 'done' || data.type === 'error') {
                observer.complete();
              }
            }
          }
        }
      };

      processStream().catch(error => observer.error(error));
    }).catch(error => observer.error(error));

    // 返回清理函数
    return () => {
      reader?.cancel();
    };
  });
}
```

### **工具调用参数累积**
```typescript
// 组件逻辑
handleToolCallEvent(toolCall: ToolCall) {
  const existing = this.currentToolCalls.get(toolCall.id);

  if (!existing) {
    // 新的工具调用
    this.currentToolCalls.set(toolCall.id, {
      ...toolCall,
      function: {
        ...toolCall.function,
        complete: false
      }
    });
    this.displayToolCallStarted(toolCall);
  } else {
    // 更新现有工具调用的参数
    existing.function.arguments = toolCall.function.arguments;
    existing.function.complete = toolCall.function.complete || false;
    this.updateToolCallDisplay(existing);
  }

  // 参数完整，准备执行
  if (toolCall.function.complete) {
    this.markToolCallReady(toolCall);
  }
}
```

---

## ✅ 实施清单

### 第一阶段：基础设施
- [ ] 创建 AI Chat 服务及基础 API 方法
- [ ] 定义所有数据模型的 TypeScript 接口
- [ ] 创建基础组件结构
- [ ] 实现 SSE 流式处理
- [ ] 在工具栏添加 AI Chat 按钮

### 第二阶段：核心功能
- [ ] 实现聊天消息列表组件
- [ ] 实现聊天输入区域组件
- [ ] 实现会话列表组件
- [ ] 添加会话增删改查操作
- [ ] 实现消息流式显示 UI

### 第三阶段：高级功能
- [ ] 工具调用显示组件
- [ ] 工具调用参数累积逻辑
- [ ] 会话统计信息显示
- [ ] 置顶/取消置顶功能
- [ ] Markdown 渲染

### 第四阶段：优化完善
- [ ] 可调整大小的面板
- [ ] 主题集成
- [ ] 错误处理
- [ ] 加载状态
- [ ] 键盘快捷键
- [ ] 无障碍功能

### 第五阶段：测试
- [ ] 服务层单元测试
- [ ] 组件测试
- [ ] 集成测试
- [ ] E2E 测试

---

## 📊 成功指标

- **性能**: SSE 延迟 < 100ms
- **可用性**: 面板打开时间 < 300ms
- **可靠性**: 99.9% 连接成功率
- **无障碍**: 符合 WCAG 2.1 AA 标准

---

## 🚀 未来增强功能

1. **多模态支持**: 图片/文件上传
2. **语音输入**: 语音转文字集成
3. **导出会话**: JSON/Markdown 导出
4. **会话分享**: 用户间共享会话
5. **自定义工具**: 用户自定义工具插件
6. **快捷操作**: 预设提示词
7. **搜索功能**: 在会话中搜索

---

## 📝 重要说明

1. **依赖条件**:
   - GNS3 服务器需要启用 Chat API
   - 用户必须已配置 LLM 设置（已在 AI Profile Management 中实现）
   - 项目必须处于 "opened" 状态才能使用聊天功能

2. **数据隔离**:
   - 会话按项目和用户隔离
   - 每个项目在项目目录下创建 `gns3-copilot/copilot_checkpoints.db`
   - 项目删除时自动清理相关数据

3. **安全性**:
   - 所有敏感数据（API 密钥、JWT token）在服务端处理
   - 通过 ContextVars 传递，不持久化到数据库
   - 请求结束后自动清除内存中的敏感信息

4. **技术栈**:
   - 遵循现有 GNS3 Web UI 模式
   - Material Design 组件库
   - RxJS Observable 响应式编程
   - 不引入额外的状态管理库

---

## 📦 文件清单总结

### 新增文件 (10个)
1. `src/app/services/ai-chat.service.ts`
2. `src/app/models/ai-chat.interface.ts`
3. `src/app/stores/ai-chat.store.ts`
4. `src/app/components/project-map/ai-chat/ai-chat.component.ts`
5. `src/app/components/project-map/ai-chat/chat-session-list.component.ts`
6. `src/app/components/project-map/ai-chat/chat-message-list.component.ts`
7. `src/app/components/project-map/ai-chat/chat-input-area.component.ts`
8. `src/app/components/project-map/ai-chat/tool-call-display.component.ts`
9. `src/app/components/project-map/ai-chat/json-viewer.component.ts`
10. `src/app/components/project-map/ai-chat/draggable-tool-dialog.component.ts`

### 修改文件 (3个)
1. `src/app/components/project-map/project-map-menu/project-map-menu.component.html`
2. `src/app/components/project-map/project-map-menu/project-map-menu.component.ts`
3. `src/app/components/project-map/project-map.component.scss`
