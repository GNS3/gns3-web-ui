# 方案 B：Web Components 桥接实现计划

## 📋 概述

利用 Web Components (Custom Elements) 将 FlowNet-Lab 的 React AI 聊天组件封装为 Web Component，然后集成到 gns3-web-ui (Angular 14) 项目中。

**优势**：
- 渐进式迁移，不破坏现有 Angular 拓扑功能
- 复用 FlowNet-Lab 高质量的 React 聊天组件
- 独立构建，互不影响

---

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      gns3-web-ui (Angular 14)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  project-map.component                                    │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │  拓扑图组件     │  │  <ai-chat-wc></ai-chat-wc>     │  │  │
│  │  │                 │  │  (Web Component)               │  │  │
│  │  │                 │  │                                 │  │  │
│  │  └─────────────────┘  └────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Props / Events
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ai-chat-wc (React → Web Component)            │
│  ┌──────────────┐  ┌────────────────────────────────────────┐ │
│  │ Conversation │  │           ChatContainer                 │ │
│  │  Sidebar    │  │  ┌────────────────────────────────────┐  │ │
│  │              │  │  │  MessageBubble (可复用 90%)       │  │ │
│  │              │  │  │  ChatInput (可复用 80%)           │  │ │
│  │              │  │  │  ToolCallDialog (可复用 85%)      │  │ │
│  │              │  │  │  ToolResultDialog (可复用 85%)    │  │ │
│  └──────────────┘  │  └────────────────────────────────────┘  │ │
│                    └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API 适配层
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    gns3-web-ui Backend API                      │
│  /v3/projects/{projectId}/chat/stream (SSE)                    │
│  /v3/projects/{projectId}/chat/sessions                         │
│  /v3/projects/{projectId}/chat/sessions/{sessionId}/history    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
gns3-web-ui/
├── projects/
│   └── ai-chat-wc/              # React Web Component 项目
│       ├── src/
│       │   ├── components/      # UI 组件（从 FlowNet-Lab 复制）
│       │   │   ├── Chat/
│       │   │   │   ├── ChatContainer.tsx
│       │   │   │   ├── ChatInput.tsx
│       │   │   │   ├── ConversationSidebar.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   ├── ToolCallDialog.tsx
│       │   │   │   └── ToolResultDialog.tsx
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   └── useChat.ts    # 适配后的 hook
│       │   ├── services/
│       │   │   ├── apiAdapter.ts # API 适配层
│       │   │   └── chatService.ts
│       │   ├── store/
│       │   │   └── chatStore.ts  # Zustand store (可复用)
│       │   ├── types/
│       │   │   └── chat.ts       # 类型定义（适配）
│       │   ├── App.tsx           # Web Component 入口
│       │   └── index.tsx        # 构建入口
│       ├── package.json
│       ├── vite.config.ts        # Vite 配置
│       └── tsconfig.json
├── src/
│   └── app/
│       └── components/
│           └── project-map/
│               ├── project-map.component.ts  # 集成 Web Component
│               └── ai-chat-wc.js             # 构建输出
```

---

## 🔄 组件复用评估

### UI 组件（从 FlowNet-Lab 复制）

| 组件 | 可复用程度 | 需修改内容 |
|------|-----------|-----------|
| `MessageBubble.tsx` | ⭐⭐⭐⭐⭐ 90% | 替换图标库 |
| `ChatInput.tsx` | ⭐⭐⭐⭐ 80% | 替换图标库 |
| `ConversationSidebar.tsx` | ⭐⭐⭐⭐ 80% | API 端点适配 |
| `ToolCallDialog.tsx` | ⭐⭐⭐⭐ 85% | 样式微调 |
| `ToolResultDialog.tsx` | ⭐⭐⭐⭐ 85% | 样式微调 |
| `ChatContainer.tsx` | ⭐⭐⭐⭐ 80% | API 适配 |

### 核心逻辑层

| 模块 | 可复用程度 | 说明 |
|------|-----------|------|
| `chatStore.ts` (Zustand) | ⭐⭐⭐⭐⭐ 95% | 状态管理逻辑完全通用 |
| `useChat.ts` | ⭐⭐⭐⭐ 80% | 需替换 API 调用 |
| SSE 流处理 | ⭐⭐⭐⭐⭐ 95% | 逻辑完全通用 |

---

## 📋 实施步骤

### 第一阶段：创建 React 项目并配置构建

#### 1.1 创建 Vite + React 项目

```bash
cd /home/yueguobin/myCode/GNS3/gns3-web-ui/projects
npm create vite@latest ai-chat-wc -- --template react-ts
cd ai-chat-wc
npm install
```

#### 1.2 安装依赖

```bash
# 核心依赖
npm install zustand marked lucide-react clsx tailwind-merge

# 开发依赖
npm install -D @webcomponents/custom-elements
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
npm install -D @types/node
```

#### 1.3 配置 Tailwind CSS

```bash
npx tailwindcss init -p
```

**tailwind.config.js**:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        destructive: 'var(--destructive)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

#### 1.4 配置 Vite 构建为 Web Component

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      name: 'AiChatWC',
      fileName: (format) => `ai-chat-wc.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    cssCodeSplit: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
})
```

---

### 第二阶段：复制并适配 FlowNet-Lab 组件

#### 2.1 复制 UI 组件

从 FlowNet-Lab 复制以下文件到 `src/components/Chat/`:

- `ChatContainer.tsx`
- `ChatInput.tsx`
- `ConversationSidebar.tsx`
- `MessageBubble.tsx`
- `ToolCallDialog.tsx`
- `ToolResultDialog.tsx`
- `index.ts`

#### 2.2 复制并适配 Store

复制 `store/chatStore.ts`，进行以下修改：

1. 移除 localStorage 持久化（由 Angular 侧管理）
2. 添加接收外部 projectId 的能力

#### 2.3 复制并适配 Hooks

复制 `hooks/useChat.ts`，进行以下修改：

1. 将 `chatService` 替换为本地适配版本
2. 移除 session 创建逻辑（由 Angular 侧处理）

---

### 第三阶段：创建 API 适配层

#### 3.1 创建 API 适配器（含 SSE 重试逻辑）

**⚠️ 注意**：Angular 的 zone.js 有时会干扰 fetch + ReadableStream

**推荐方案**：使用 EventSource（如果后端支持）或 fetch + ReadableStream + zone.js 兼容处理

**方案A：EventSource（更稳定）**
```typescript
/**
 * EventSource 方案（推荐）
 * 优点：浏览器原生、自动重连、更稳定
 * 注意：需要后端支持 GET 请求返回 SSE
 *
 * 架构：
 * POST /chat -> 返回 stream_id
 * GET /chat/stream/{stream_id} -> SSE
 */
class SseClient {
  private eventSource: EventSource | null = null;

  connect(streamId: string, onMessage: (data: any) => void) {
    this.eventSource = new EventSource(`/chat/stream/${streamId}`, {
      withCredentials: true
    });

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      // 自动重连逻辑
    };
  }

  disconnect() {
    this.eventSource?.close();
  }
}
```

**方案B：fetch + ReadableStream（当前方案，需兼容 zone.js）**
```typescript
/**
 * fetch + ReadableStream 方案
 * 如果遇到 zone.js 干扰，使用 NgZone.run() 包装回调
 */
import { NgZone } from '@angular/core';

// 在 Angular 侧使用
this.ngZone.run(() => {
  callback(data);
});
```

**SSE 重试机制说明**：
- 自动重试：网络波动时最多重试 3 次
- 指数退避：重试间隔 1s, 2s, 4s
- Token 刷新：检测到 401 时触发 token 更新回调

```typescript
/**
 * 鲁棒的 SSE 流处理
 */
async function* streamWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): AsyncGenerator<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        // Token 过期，抛出特定错误让上层处理
        throw new Error('TOKEN_EXPIRED');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            yield JSON.parse(line.slice(6));
          }
        }
      }
      return; // 成功结束
    } catch (error) {
      lastError = error as Error;

      if ((error as Error).message === 'TOKEN_EXPIRED') {
        // 立即抛出，让上层处理 token 刷新
        throw error;
      }

      if (attempt < maxRetries - 1) {
        // 指数退避
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
```

#### 3.2 创建 API 适配器

**src/services/apiAdapter.ts**:
```typescript
/**
 * API 适配器
 * 将 gns3-web-ui 的 API 端点适配为 FlowNet-Lab 格式
 */

const API_BASE = '/v3';  // 通过 props 传入

export class ApiAdapter {
  private baseUrl: string;
  private projectId: string;
  private controller: { host: string; port: number; authToken?: string };

  constructor(config: { baseUrl: string; projectId: string; controller: any }) {
    this.baseUrl = config.baseUrl;
    this.projectId = config.projectId;
    this.controller = config.controller;
  }

  private getAuthHeaders(): HeadersInit {
    if (this.controller.authToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.controller.authToken}`,
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  async streamChat(request: {
    message: string;
    sessionId?: string;
    stream?: boolean;
  }): Promise<ReadableStream> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        message: request.message,
        session_id: request.sessionId,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body;
  }

  async getSessions(): Promise<any[]> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSessionHistory(sessionId: string): Promise<any> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions/${sessionId}/history`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createSession(title: string): Promise<any> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions/${sessionId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async renameSession(sessionId: string, title: string): Promise<any> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions/${sessionId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async pinSession(sessionId: string): Promise<any> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions/${sessionId}/pin`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async unpinSession(sessionId: string): Promise<any> {
    const url = `${this.controller.host}:${this.controller.port}/v3/projects/${this.projectId}/chat/sessions/${sessionId}/pin`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export default ApiAdapter;
```

---

### 第四阶段：创建 Web Component 入口

#### 4.1 创建主组件

**src/App.tsx**:
```typescript
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ChatContainer } from './components/Chat';
import { useChatStore } from './store/chatStore';
import ApiAdapter from './services/apiAdapter';

interface AiChatWCProps {
  projectId: string;
  controllerHost: string;
  controllerPort: string;
  controllerAuthToken?: string;
}

export const AiChatWC: React.FC<AiChatWCProps> = (props) => {
  const [apiAdapter, setApiAdapter] = useState<ApiAdapter | null>(null);
  const setCurrentProjectId = useChatStore((state) => state.setCurrentProjectId);

  useEffect(() => {
    if (props.projectId) {
      const adapter = new ApiAdapter({
        baseUrl: '/v3',
        projectId: props.projectId,
        controller: {
          host: props.controllerHost,
          port: parseInt(props.controllerPort),
          authToken: props.controllerAuthToken,
        },
      });
      setApiAdapter(adapter);
      setCurrentProjectId(props.projectId);
    }
  }, [props.projectId, props.controllerHost, props.controllerPort, props.controllerAuthToken]);

  if (!apiAdapter) {
    return <div>Loading...</div>;
  }

  return (
    // 添加 stopPropagation 防止事件穿透到 Angular
    // 添加 pointer-events 和 focus trap 防止快捷键冲突
    <div
      className="ai-chat-wc-root h-full w-full"
      onKeyDown={(e) => {
        e.stopPropagation();
        // 拦截 ESC 等关键快捷键
        if (['Escape', 'Space', 'Enter'].includes(e.key)) {
          e.preventDefault();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ChatContainer apiAdapter={apiAdapter} />
    </div>
  );
};

// Web Component wrapper - 添加 render debounce 避免频繁 rerender
class AiChatWCElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;
  private renderTimer: ReturnType<typeof setTimeout> | null = null;

  static get observedAttributes() {
    return ['project-id', 'controller-host', 'controller-port', 'controller-auth-token'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      // 使用 debounce 避免 Angular 频繁触发更新
      this.scheduleRender();
    }
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.root?.unmount();
    this.root = null;
  }

  /**
   * 使用 debounce 避免 Angular 模板触发多次 attribute 更新
   */
  private scheduleRender() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.renderTimer = setTimeout(() => {
      this.render();
    }, 0);
  }

  private render() {
    // 复用已有 root，避免重复创建
    if (!this.root) {
      this.root = ReactDOM.createRoot(this);
    }

    this.root.render(
      <React.StrictMode>
        <AiChatWC
          projectId={this.getAttribute('project-id') || ''}
          controllerHost={this.getAttribute('controller-host') || 'localhost'}
          controllerPort={this.getAttribute('controller-port') || '3080'}
          controllerAuthToken={this.getAttribute('controller-auth-token') || ''}
        />
      </React.StrictMode>
    );
  }
}

// Register custom element - 使用 Light DOM（shadow: false）
customElements.define('ai-chat-wc', AiChatWCElement);

export default AiChatWCElement;
```

#### 4.2 创建入口文件

**src/index.tsx**:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import the custom element
import './App';

console.log('AI Chat Web Component loaded');
```

---

### 第五阶段：构建并集成到 Angular

#### 5.1 构建 Web Component

```bash
cd projects/ai-chat-wc
npm run build
```

输出文件：`dist/ai-chat-wc.es.js`, `dist/ai-chat-wc.umd.js`

#### 5.2 复制到 Angular 项目

```bash
cp dist/ai-chat-wc.es.js ../../src/assets/
cp dist/ai-chat-wc.umd.js ../../src/assets/
```

#### 5.3 在 Angular 中集成

**project-map.component.ts**:
```typescript
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-project-map',
  templateUrl: './project-map.component.html',
  styleUrls: ['./project-map.component.scss']
})
export class ProjectMapComponent implements OnInit, AfterViewInit {
  @ViewChild('aiChatContainer') aiChatContainer!: ElementRef;

  isChatOpen = false;
  currentProjectId = '';

  // Controller 信息（从服务获取）
  controllerHost = 'localhost';
  controllerPort = '3080';
  controllerAuthToken = '';

  ngOnInit() {
    // 获取当前项目和控制器信息
    this.loadCurrentProject();
  }

  ngAfterViewInit() {
    this.loadWebComponent();
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.initWebComponent();
    }
  }

  private loadWebComponent() {
    // 动态加载 Web Component 脚本（ES Module 需设置 type="module"）
    const existingScript = document.querySelector('script[src*="ai-chat-wc"]');
    if (existingScript) {
      console.log('AI Chat WC already loaded');
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';  // 关键：ES Module 必须设置
    script.src = 'assets/ai-chat-wc.es.js';
    script.onload = () => console.log('AI Chat WC loaded');
    script.onerror = (err) => console.error('Failed to load AI Chat WC:', err);
    document.head.appendChild(script);
  }

  private initWebComponent() {
    const wc = this.aiChatContainer.nativeElement as HTMLElement;
    wc.setAttribute('project-id', this.currentProjectId);
    wc.setAttribute('controller-host', this.controllerHost);
    wc.setAttribute('controller-port', this.controllerPort);
    wc.setAttribute('controller-auth-token', this.controllerAuthToken);
  }

  private loadCurrentProject() {
    // 从项目服务获取当前项目 ID
    // 从控制器服务获取认证信息
  }
}
```

**project-map.component.html**:
```html
<div class="project-map-container">
  <!-- 拓扑图组件 -->
  <app-topology></app-topology>

  <!-- AI Chat Web Component -->
  <div *ngIf="isChatOpen" class="ai-chat-panel" #aiChatContainer>
    <ai-chat-wc></ai-chat-wc>
  </div>
</div>
```

**project-map.component.scss**:
```scss
.ai-chat-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 700px;
  height: 600px;
  z-index: 1000;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  ai-chat-wc {
    width: 100%;
    height: 100%;
  }
}
```

---

## 🔧 通信机制

### Angular → React (Web Component)

通过 HTML 属性（Props）传递：

```html
<ai-chat-wc
  project-id="proj-123"
  controller-host="192.168.1.100"
  controller-port="3080"
  controller-auth-token="jwt-token">
</ai-chat-wc>
```

### React (Web Component) → Angular

通过 Custom Events 通知：

```typescript
// React 侧
const handleSessionCreate = (sessionId: string) => {
  this.dispatchEvent(new CustomEvent('session-create', {
    detail: { sessionId },
    bubbles: true,
    composed: true,
  }));
};

// Angular 侧
wc.addEventListener('session-create', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  console.log('Session created:', detail.sessionId);
});
```

---

## ✅ 实施清单

### 第一阶段：项目初始化
- [ ] 创建 Vite + React 项目
- [ ] 配置 Tailwind CSS
- [ ] 配置 Vite Web Component 构建
- [ ] 安装依赖包

### 第二阶段：组件迁移
- [ ] 复制 Chat 组件（FlowNet-Lab → ai-chat-wc）
- [ ] 复制 chatStore（Zustand）
- [ ] 复制 useChat hook
- [ ] 替换图标库（lucide-react）
- [ ] 适配样式（Tailwind 类名）

### 第三阶段：API 适配
- [ ] 创建 API 适配器
- [ ] 实现 SSE 流处理
- [ ] 实现会话 CRUD
- [ ] 实现历史加载

### 第四阶段：Web Component 封装
- [ ] 创建 Web Component 入口
- [ ] 实现属性监听
- [ ] 实现事件派发
- [ ] 构建测试

### 第五阶段：Angular 集成
- [ ] 加载 Web Component 脚本
- [ ] 集成到 project-map
- [ ] 传递项目上下文
- [ ] 处理事件通信

### 第六阶段：测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 样式兼容性测试

---

## 📊 工作量估算

| 阶段 | 任务 | 预计工作量 |
|------|------|-----------|
| 第一阶段 | 项目初始化 | 1-2 小时 |
| 第二阶段 | 组件迁移 | 2-4 小时 |
| 第三阶段 | API 适配 | 2-3 小时 |
| 第四阶段 | WC 封装 | 1-2 小时 |
| 第五阶段 | Angular 集成 | 1-2 小时 |
| 第六阶段 | 测试 | 2-3 小时 |
| **总计** | | **9-16 小时** |

---

## ⚠️ 风险与注意事项

### 1. 样式隔离（必须项）
- **必须使用 `shadow: false`（Light DOM）**，原因：
  - Tailwind CSS 变量（--primary, --background 等）可直接穿透
  - 主题色同步无需额外处理
  - 样式直接复用 Angular 全局 CSS
  - 浮动面板拖拽、resize 事件处理更简单
  - DevTools 调试体验更好

**实现方式**：
```typescript
class AiChatWCElement extends HTMLElement {
  // 不调用 attachShadow，保持 Light DOM
  connectedCallback() {
    this.render();
  }
}
```

**⚠️ Angular 全局 CSS 隔离**：
- 所有 React 组件使用统一的 class 前缀 `.ai-chat-wc-root`
- 避免 Angular 全局 CSS（如 normalize / reset）污染 React 组件
- 在 Tailwind 配置中添加 prefix：

```javascript
// tailwind.config.js
module.exports = {
  prefix: 'wc-',  // 所有类名加前缀，如 wc-p-4
  // ...
}
```

### 2. React 与 Angular 事件冲突
- 聊天框内的操作可能触发 Angular 侧的全局监听器
- **优化建议**：在最外层添加 stopPropagation：
```typescript
<div onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
  <ChatContainer ... />
</div>
```

### 3. Token 同步与 SSE 重连（必须项）
- Angular 的 token 过期后，SSE 连接需要携带新 token 重连
- **推荐方案B（主动式）**：Angular 主动 push 新 token

**ApiAdapter 增加更新方法**:
```typescript
class ApiAdapter {
  updateAuthToken(newToken: string) {
    this.controller.authToken = newToken;
    // 如果有活跃的 SSE 连接，需要断开重连
    this.reconnectIfNeeded();
  }

  private reconnectIfNeeded() {
    // 实现重连逻辑
  }
}
```

**Web Component 监听属性变化**:
```typescript
attributeChangedCallback(name, old, new) {
  if (name === 'controller-auth-token' && new !== old) {
    this.apiAdapter?.updateAuthToken(new);
  }
}
```

**Angular 侧**:
```html
<ai-chat-wc
  [attr.controller-auth-token]="currentAuthToken$ | async"
></ai-chat-wc>
```

### 4. 构建体积优化
- ~~必须将 React/ReactDOM 配置为 externals~~
- **正确方案**：React 应该打包进 Web Component
- 原因：Web Component 设计哲学是 "self-contained"
- 大小约 250KB gzip，完全可接受

**正确的 vite.config.ts**:
```typescript
export default defineConfig({
  build: {
    target: 'es2018',  // 兼容主流浏览器
    minify: 'esbuild',
    cssCodeSplit: false,  // CSS 打包进 JS
    sourcemap: true,
    // 不要 external React！全部打包进去
  },
})
```

**最终 bundle 结构**:
```
ai-chat-wc.es.js
  ├ React 18
  ├ ReactDOM 18
  ├ Zustand
  └ Chat UI
```

### 5. 会话管理由 Angular 接管（推荐）
- 目前 React 侧会自己 createSession、deleteSession、renameSession
- 建议改为：Angular 负责所有 CRUD 会话操作，React 只负责渲染 + 发送消息 + 接收流
- 通过属性 + 事件双向通信

**好处**：
- 统一在 Angular 侧做列表缓存、搜索、最近会话排序等
- 避免两边状态不一致

**实现方式**：
```typescript
// Angular 侧管理会话
// React 只接收 session-id 属性，通过事件通知消息发送

// Angular → React
<ai-chat-wc
  [attr.session-id]="currentSessionId"
  (message-send)="onMessageSend($event)"
></ai-chat-wc>

// React → Angular 事件
this.dispatchEvent(new CustomEvent('message-send', {
  detail: { message: 'hello' },
  bubbles: true
}));
```

### 6. Angular 14 兼容性
- Angular 14 需要在对应 Module 添加 `CUSTOM_ELEMENTS_SCHEMA`：
```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // 必须添加
})
export class ProjectMapModule { }
```

### 7. 静态资源路径
- 使用 `import.meta.url` 动态获取路径，防止 404

---

## 🔄 联调自测表

完成集成后，请检查：

1. **SSE 连接保持**：切换设备时，SSE 是否会被 Angular 变更检测切断？
2. **滚动条冲突**：给 `ai-chat-panel` 加 `overscroll-behavior: contain`
3. **主题色同步**：观察 Web Component 是否能通过 CSS 变量实时变色

---

## 🔄 后续扩展

1. **样式主题同步**：实现 Angular 主题与 React 组件的主题同步
2. **状态持久化**：Web Component 状态同步到 Angular 侧
3. **按需加载**：实现 Web Component 的 lazy loading
4. **SSR 支持**：如果未来迁移到 SSR，考虑兼容性
