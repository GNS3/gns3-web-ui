# Plan B: Web Components Bridge Implementation Plan

## Overview

Use Web Components (Custom Elements) to wrap FlowNet-Lab's React AI chat component as a Web Component, then integrate it into the gns3-web-ui (Angular 14) project.

**Advantages**:
- Progressive migration, no disruption to existing Angular topology functionality
- Reuse FlowNet-Lab's high-quality React chat components
- Independent builds, no mutual impact

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      gns3-web-ui (Angular 14)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  project-map.component                                    │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │  Topology Component│  │  <ai-chat-wc></ai-chat-wc>     │  │  │
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
│  │              │  │  │  MessageBubble (90% reusable)     │  │ │
│  │              │  │  │  ChatInput (80% reusable)         │  │ │
│  │              │  │  │  ToolCallDialog (85% reusable)    │  │ │
│  │              │  │  │  ToolResultDialog (85% reusable)  │  │ │
│  └──────────────┘  │  └────────────────────────────────────┘  │ │
│                    └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Adapter Layer
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    gns3-web-ui Backend API                      │
│  /v3/projects/{projectId}/chat/stream (SSE)                    │
│  /v3/projects/{projectId}/chat/sessions                         │
│  /v3/projects/{projectId}/chat/sessions/{sessionId}/history    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
gns3-web-ui/
├── projects/
│   └── ai-chat-wc/              # React Web Component project
│       ├── src/
│       │   ├── components/      # UI components (copied from FlowNet-Lab)
│       │   │   ├── Chat/
│       │   │   │   ├── ChatContainer.tsx
│       │   │   │   ├── ChatInput.tsx
│       │   │   │   ├── ConversationSidebar.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   ├── ToolCallDialog.tsx
│       │   │   │   └── ToolResultDialog.tsx
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   └── useChat.ts    # Adapted hook
│       │   ├── services/
│       │   │   ├── apiAdapter.ts # API adapter layer
│       │   │   └── chatService.ts
│       │   ├── store/
│       │   │   └── chatStore.ts  # Zustand store (reusable)
│       │   ├── types/
│       │   │   └── chat.ts       # Type definitions (adapted)
│       │   ├── App.tsx           # Web Component entry
│       │   └── index.tsx        # Build entry
│       ├── package.json
│       ├── vite.config.ts        # Vite configuration
│       └── tsconfig.json
├── src/
│   └── app/
│       └── components/
│           └── project-map/
│               ├── project-map.component.ts  # Integrate Web Component
│               └── ai-chat-wc.js             # Build output
```

---

## Component Reuse Assessment

### UI Components (copied from FlowNet-Lab)

| Component | Reuse Level | Modifications Needed |
|------|-----------|-----------|
| `MessageBubble.tsx` | 90% | Replace icon library |
| `ChatInput.tsx` | 80% | Replace icon library |
| `ConversationSidebar.tsx` | 80% | API endpoint adaptation |
| `ToolCallDialog.tsx` | 85% | Minor style adjustments |
| `ToolResultDialog.tsx` | 85% | Minor style adjustments |
| `ChatContainer.tsx` | 80% | API adaptation |

### Core Logic Layer

| Module | Reuse Level | Description |
|------|-----------|------|
| `chatStore.ts` (Zustand) | 95% | State management logic is fully generic |
| `useChat.ts` | 80% | Need to replace API calls |
| SSE Stream Processing | 95% | Logic is fully generic |

---

## Implementation Steps

### Phase 1: Create React Project and Configure Build

#### 1.1 Create Vite + React Project

```bash
cd /home/yueguobin/myCode/GNS3/gns3-web-ui/projects
npm create vite@latest ai-chat-wc -- --template react-ts
cd ai-chat-wc
npm install
```

#### 1.2 Install Dependencies

```bash
# Core dependencies
npm install zustand marked lucide-react clsx tailwind-merge

# Dev dependencies
npm install -D @webcomponents/custom-elements
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
npm install -D @types/node
```

#### 1.3 Configure Tailwind CSS

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

#### 1.4 Configure Vite to Build as Web Component

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

### Phase 2: Copy and Adapt FlowNet-Lab Components

#### 2.1 Copy UI Components

Copy the following files from FlowNet-Lab to `src/components/Chat/`:

- `ChatContainer.tsx`
- `ChatInput.tsx`
- `ConversationSidebar.tsx`
- `MessageBubble.tsx`
- `ToolCallDialog.tsx`
- `ToolResultDialog.tsx`
- `index.ts`

#### 2.2 Copy and Adapt Store

Copy `store/chatStore.ts` and make the following modifications:

1. Remove localStorage persistence (managed by Angular side)
2. Add ability to receive external projectId

#### 2.3 Copy and Adapt Hooks

Copy `hooks/useChat.ts` and make the following modifications:

1. Replace `chatService` with local adapted version
2. Remove session creation logic (handled by Angular side)

---

### Phase 3: Create API Adapter Layer

#### 3.1 Create API Adapter (with SSE Retry Logic)

**Note**: Angular's zone.js sometimes interferes with fetch + ReadableStream

**Recommended Approach**: Use EventSource (if backend supports) or fetch + ReadableStream + zone.js compatible handling

**Option A: EventSource (More Stable)**
```typescript
/**
 * EventSource approach (recommended)
 * Pros: Browser native, auto-reconnect, more stable
 * Note: Requires backend to support GET request returning SSE
 *
 * Architecture:
 * POST /chat -> returns stream_id
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
      // Auto-reconnect logic
    };
  }

  disconnect() {
    this.eventSource?.close();
  }
}
```

**Option B: fetch + ReadableStream (Current approach, needs zone.js compatibility)**
```typescript
/**
 * fetch + ReadableStream approach
 * If encountering zone.js interference, wrap callback with NgZone.run()
 */
import { NgZone } from '@angular/core';

// Use on Angular side
this.ngZone.run(() => {
  callback(data);
});
```

**SSE Retry Mechanism**:
- Auto-retry: Max 3 retries on network fluctuations
- Exponential backoff: Retry intervals 1s, 2s, 4s
- Token refresh: Trigger token update callback when 401 detected

```typescript
/**
 * Robust SSE stream processing
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
        // Token expired, throw specific error for upper layer to handle
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
      return; // Successful completion
    } catch (error) {
      lastError = error as Error;

      if ((error as Error).message === 'TOKEN_EXPIRED') {
        // Throw immediately, let upper layer handle token refresh
        throw error;
      }

      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
```

#### 3.2 Create API Adapter

**src/services/apiAdapter.ts**:
```typescript
/**
 * API Adapter
 * Adapt gns3-web-ui API endpoints to FlowNet-Lab format
 */

const API_BASE = '/v3';  // Passed via props

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

### Phase 4: Create Web Component Entry

#### 4.1 Create Main Component

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
    // Add stopPropagation to prevent event bubbling to Angular
    // Add pointer-events and focus trap to prevent shortcut conflicts
    <div
      className="ai-chat-wc-root h-full w-full"
      onKeyDown={(e) => {
        e.stopPropagation();
        // Intercept key shortcuts like ESC
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

// Web Component wrapper - add render debounce to avoid frequent rerenders
class AiChatWCElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;
  private renderTimer: ReturnType<typeof setTimeout> | null = null;

  static get observedAttributes() {
    return ['project-id', 'controller-host', 'controller-port', 'controller-auth-token'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      // Use debounce to avoid Angular frequently triggering updates
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
   * Use debounce to avoid Angular template triggering multiple attribute updates
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
    // Reuse existing root, avoid recreating
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

// Register custom element - use Light DOM (shadow: false)
customElements.define('ai-chat-wc', AiChatWCElement);

export default AiChatWCElement;
```

#### 4.2 Create Entry File

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

### Phase 5: Build and Integrate into Angular

#### 5.1 Build Web Component

```bash
cd projects/ai-chat-wc
npm run build
```

Output files: `dist/ai-chat-wc.es.js`, `dist/ai-chat-wc.umd.js`

#### 5.2 Copy to Angular Project

```bash
cp dist/ai-chat-wc.es.js ../../src/assets/
cp dist/ai-chat-wc.umd.js ../../src/assets/
```

#### 5.3 Integrate in Angular

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

  // Controller info (obtained from service)
  controllerHost = 'localhost';
  controllerPort = '3080';
  controllerAuthToken = '';

  ngOnInit() {
    // Get current project and controller info
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
    // Dynamically load Web Component script (ES Module needs type="module")
    const existingScript = document.querySelector('script[src*="ai-chat-wc"]');
    if (existingScript) {
      console.log('AI Chat WC already loaded');
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';  // Critical: ES Module must set this
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
    // Get current project ID from project service
    // Get auth info from controller service
  }
}
```

**project-map.component.html**:
```html
<div class="project-map-container">
  <!-- Topology Component -->
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

## Communication Mechanism

### Angular → React (Web Component)

Pass via HTML attributes (Props):

```html
<ai-chat-wc
  project-id="proj-123"
  controller-host="192.168.1.100"
  controller-port="3080"
  controller-auth-token="jwt-token">
</ai-chat-wc>
```

### React (Web Component) → Angular

Notify via Custom Events:

```typescript
// React side
const handleSessionCreate = (sessionId: string) => {
  this.dispatchEvent(new CustomEvent('session-create', {
    detail: { sessionId },
    bubbles: true,
    composed: true,
  }));
};

// Angular side
wc.addEventListener('session-create', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  console.log('Session created:', detail.sessionId);
});
```

---

## Implementation Checklist

### Phase 1: Project Initialization
- [ ] Create Vite + React project
- [ ] Configure Tailwind CSS
- [ ] Configure Vite Web Component build
- [ ] Install dependencies

### Phase 2: Component Migration
- [ ] Copy Chat components (FlowNet-Lab → ai-chat-wc)
- [ ] Copy chatStore (Zustand)
- [ ] Copy useChat hook
- [ ] Replace icon library (lucide-react)
- [ ] Adapt styles (Tailwind class names)

### Phase 3: API Adaptation
- [ ] Create API adapter
- [ ] Implement SSE streaming
- [ ] Implement session CRUD
- [ ] Implement history loading

### Phase 4: Web Component Encapsulation
- [ ] Create Web Component entry
- [ ] Implement attribute listening
- [ ] Implement event dispatching
- [ ] Build test

### Phase 5: Angular Integration
- [ ] Load Web Component script
- [ ] Integrate into project-map
- [ ] Pass project context
- [ ] Handle event communication

### Phase 6: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Style compatibility tests

---

## Workload Estimation

| Phase | Task | Estimated Time |
|------|------|-----------|
| Phase 1 | Project initialization | 1-2 hours |
| Phase 2 | Component migration | 2-4 hours |
| Phase 3 | API adaptation | 2-3 hours |
| Phase 4 | WC encapsulation | 1-2 hours |
| Phase 5 | Angular integration | 1-2 hours |
| Phase 6 | Testing | 2-3 hours |
| **Total** | | **9-16 hours** |

---

## Risks and Notes

### 1. Style Isolation (Must Do)
- **Must use `shadow: false` (Light DOM)**, reasons:
  - Tailwind CSS variables (--primary, --background, etc.) can directly pass through
  - No additional handling needed for theme color synchronization
  - Styles can directly reuse Angular global CSS
  - Floating panel drag and resize event handling is simpler
  - Better DevTools debugging experience

**Implementation**:
```typescript
class AiChatWCElement extends HTMLElement {
  // Don't call attachShadow, keep Light DOM
  connectedCallback() {
    this.render();
  }
}
```

**Angular Global CSS Isolation**:
- All React components use unified class prefix `.ai-chat-wc-root`
- Avoid Angular global CSS (like normalize / reset) polluting React components
- Add prefix in Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  prefix: 'wc-',  // All class names get prefix, like wc-p-4
  // ...
}
```

### 2. React and Angular Event Conflicts
- Operations inside the chat box may trigger global listeners on Angular side
- **Optimization suggestion**: Add stopPropagation at the outermost layer:
```typescript
<div onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
  <ChatContainer ... />
</div>
```

### 3. Token Sync and SSE Reconnection (Must Do)
- After Angular's token expires, SSE connection needs to reconnect with new token
- **Recommended Option B (Proactive)**: Angular actively pushes new token

**Add update method to ApiAdapter**:
```typescript
class ApiAdapter {
  updateAuthToken(newToken: string) {
    this.controller.authToken = newToken;
    // If there's an active SSE connection, need to disconnect and reconnect
    this.reconnectIfNeeded();
  }

  private reconnectIfNeeded() {
    // Implement reconnection logic
  }
}
```

**Web Component listens for attribute changes**:
```typescript
attributeChangedCallback(name, old, new) {
  if (name === 'controller-auth-token' && new !== old) {
    this.apiAdapter?.updateAuthToken(new);
  }
}
```

**Angular side**:
```html
<ai-chat-wc
  [attr.controller-auth-token]="currentAuthToken$ | async"
></ai-chat-wc>
```

### 4. Build Size Optimization
- ~~Must configure React/ReactDOM as externals~~
- **Correct approach**: React should be bundled into Web Component
- Reason: Web Component design philosophy is "self-contained"
- Size about 250KB gzip, completely acceptable

**Correct vite.config.ts**:
```typescript
export default defineConfig({
  build: {
    target: 'es2018',  // Compatible with mainstream browsers
    minify: 'esbuild',
    cssCodeSplit: false,  // Bundle CSS into JS
    sourcemap: true,
    // Don't external React! Bundle everything
  },
})
```

**Final bundle structure**:
```
ai-chat-wc.es.js
  ├ React 18
  ├ ReactDOM 18
  ├ Zustand
  └ Chat UI
```

### 5. Session Management Taken Over by Angular (Recommended)
- Currently React side will createSession, deleteSession, renameSession on its own
- Recommended: Angular handles all CRUD session operations, React only handles rendering + sending messages + receiving stream
- Bidirectional communication via attributes + events

**Benefits**:
- Unified list caching, search, recent session sorting on Angular side
- Avoid state inconsistency between both sides

**Implementation**:
```typescript
// Angular side manages sessions
// React only receives session-id attribute, notifies via events for message sending

// Angular → React
<ai-chat-wc
  [attr.session-id]="currentSessionId"
  (message-send)="onMessageSend($event)"
></ai-chat-wc>

// React → Angular event
this.dispatchEvent(new CustomEvent('message-send', {
  detail: { message: 'hello' },
  bubbles: true
}));
```

### 6. Angular 14 Compatibility
- Angular 14 needs to add `CUSTOM_ELEMENTS_SCHEMA` in the corresponding Module:
```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Must add
})
export class ProjectMapModule { }
```

### 7. Static Resource Paths
- Use `import.meta.url` to dynamically get paths, prevent 404

---

## Integration Testing Checklist

After completing integration, please check:

1. **SSE Connection Maintenance**: When switching devices, will SSE be cut off by Angular change detection?
2. **Scrollbar Conflicts**: Add `overscroll-behavior: contain` to `ai-chat-panel`
3. **Theme Color Sync**: Check if Web Component can change colors in real-time via CSS variables

---

## Future Extensions

1. **Theme Sync**: Implement theme synchronization between Angular and React components
2. **State Persistence**: Sync Web Component state to Angular side
3. **Lazy Loading**: Implement lazy loading for Web Component
4. **SSR Support**: Consider compatibility if migrating to SSR in the future
