# GNS3 Copilot AI Chat Feature Implementation Plan

## Overview

The AI Chat feature will be integrated into the left toolbar of the project topology map, allowing users to interact with the GNS3 Copilot Agent to get network topology assistance and device management functionality.

---

## Architecture

### Backend API Integration
**Base Path**: `/v3/projects/{project_id}/chat/`

**Core Endpoints**:
- `POST /stream` - SSE streaming conversation
- `GET /sessions` - Get session list
- `GET /sessions/{session_id}/history` - Get session history
- `PATCH /sessions/{session_id}` - Rename session
- `DELETE /sessions/{session_id}` - Delete session
- `PUT/DELETE /sessions/{session_id}/pin` - Pin/Unpin session

### Frontend Architecture Design
```
Project Map Component
└── Left Toolbar
    └── AI Chat Button [New]
        └── AI Chat Panel [ai-chat.component.ts]
            ├── Session List Sidebar [chat-session-list.component.ts]
            ├── Chat Interface
            │   ├── Message List [chat-message-list.component.ts]
            │   │   ├── Tool Call Display [tool-call-display.component.ts]
            │   │   └── JSON Viewer [json-viewer.component.ts]
            │   └── Input Area [chat-input-area.component.ts]
            ├── Draggable Tool Dialog [draggable-tool-dialog.component.ts]
            └── Session Controls
                ├── New Chat
                ├── Rename
                ├── Delete
                └── Pin/Unpin
```

> **Note**: The resizable panel functionality is directly integrated in `ai-chat.component.ts`, without using a separate `ai-chat-panel.component.ts`

---

## Files to Modify and Add

### 1. Service Layer (New)

**File**: `src/app/services/ai-chat.service.ts`

**Main Responsibilities**:
- Handle all AI Chat API calls
- Manage SSE connections and streaming responses
- Maintain session state and message history
- Handle streaming accumulation of tool calls
- Manage statistics

**Core Methods**:
```typescript
- streamChat(projectId, message, sessionId?)  // Streaming conversation
- getSessions(projectId)                       // Get session list
- getSessionHistory(projectId, sessionId)      // Get session history
- renameSession(projectId, sessionId, title)   // Rename session
- deleteSession(projectId, sessionId)          // Delete session
- pinSession(projectId, sessionId)             // Pin session
- unpinSession(projectId, // Unpin session sessionId)
```

---

### 2. Component Layer (New)

**Directory**: `src/app/components/project-map/ai-chat/`

**New Component List**:

#### `ai-chat.component.ts`
- Entry component for AI Chat feature
- Manage overall chat state and layout
- Coordinate session list and chat interface
- Handle panel show/hide logic
- Integrate resizable panel functionality (drag to resize, panel position persisted to localStorage)
- Handle SSE streaming events (content, tool_call, tool_start, tool_end, error, done, heartbeat)

#### `chat-session-list.component.ts`
- Display chat session list
- Session item display:
  - Title (editable)
  - Last message preview
  - Statistics (message count, token usage)
  - Pin indicator
  - Timestamp
- Session management operations (rename, delete, pin)
- New session button

#### `chat-message-list.component.ts`
- Scrollable message history display
- Message types (actually supported):
  - `user` - User message (right, with avatar)
  - `assistant` - AI message (left, supports streaming)
  - `system` - System message (centered)
  - `tool_call` - Tool call request (expandable parameters)
  - `tool_result` - Tool execution result (collapsible)
  - `error` - Error message (red indicator)
- Auto-scroll to bottom for new messages
- **Markdown rendering (using ngx-markdown + Tailwind Typography)**
- Command syntax highlighting (Cisco IOS)
- JSON syntax highlighting

#### `chat-input-area.component.ts`
- Multi-line text input
- Send button and keyboard shortcuts (Enter/Ctrl+Enter)
- Character counter
- Disabled state during streaming
- File attachments (future expansion)

#### `tool-call-display.component.ts`
- Display tool call information
- Display tool name and accumulated parameters
- Visual indicator for parameter accumulation
- Collapsible tool results
- JSON result syntax highlighting
- Tool execution status display (accumulating/ready/executing/completed)
- Angular animations effects

#### `json-viewer.component.ts` (Additional)
- Formatted display of JSON data
- Support collapse/expand JSON nodes
- Syntax highlighting
- Copy functionality

#### `draggable-tool-dialog.component.ts` (Additional)
- Draggable tool execution result dialog
- Support resize
- Position persisted to localStorage

---

### 3. Data Models (New)

**File**: `src/app/models/ai-chat.interface.ts`

**Core Interface Definitions**:

```typescript
// SSE Event Types
interface ChatEvent {
  type: 'content' | 'tool_call' | 'tool_start' | 'tool_end' |
        'error' | 'done' | 'heartbeat';
  content?: string;           // AI text content
  tool_call?: ToolCall;       // Tool call information
  tool_name?: string;         // Tool name
  tool_output?: string;       // Tool execution result
  tool_call_id?: string;      // Tool call ID
  error?: string;             // Error message
  session_id?: string;        // Session ID
  message_id?: string;        // Message ID
}

// Chat Session
interface ChatSession {
  id: number;                 // Database auto-increment ID
  thread_id: string;          // LangGraph thread_id
  user_id: string;            // User ID
  project_id: string;         // Project ID
  title: string;              // Session title
  message_count: number;      // Message count
  llm_calls_count: number;    // LLM call count
  input_tokens: number;       // Input token count
  output_tokens: number;      // Output token count
  total_tokens: number;       // Total token count
  last_message_at: string;    // Last message time
  created_at: string;         // Creation time
  updated_at: string;         // Update time
  pinned: boolean;            // Pinned status
}

// Chat Message
interface ChatMessage {
  id: string;                 // Message unique identifier
  role: 'user' | 'assistant' | 'system' | 'tool' | 'tool_call' | 'tool_result'; // Actually supported message roles
  content: string;            // Message content
  created_at: string;         // Creation time
  tool_calls?: ToolCall[];    // Tool call list (assistant message)
  tool_call_id?: string;      // Related tool call ID
  name?: string;              // Tool name (tool/tool_result message)
  metadata?: any;             // Metadata
  toolCall?: ToolCall;        // Single tool call (tool_call message)
  toolName?: string;          // Tool name (tool_result message)
  toolOutput?: any;           // Tool output (tool_result message)
}

// Tool Call
interface ToolCall {
  id: string;                 // Tool call ID
  type: 'function';
  function: {
    name: string;             // Tool name
    arguments: string;        // Arguments JSON string
    complete?: boolean;       // Whether arguments are complete
  };
}
```

---

### 4. State Management (New)

**File**: `src/app/stores/ai-chat.store.ts`

**State Structure**:
```typescript
interface AIChatState {
  currentProjectId: string | null;      // Current project ID
  currentSessionId: string | null;       // Current session ID
  sessions: ChatSession[];                // Session list
  messagesMap: Map<string, ChatMessage[]>; // Message history (sessionId -> messages)
  isStreaming: boolean;                   // Whether streaming
  currentToolCalls: Map<string, ToolCall>; // Current tool call state
  panelState: {                           // Panel state (persisted to localStorage)
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
  };
  error: string | null;                   // Error message
}
```

**Implementation**:
- Use RxJS Observable and BehaviorSubject
- Follow the project's existing service-based state management pattern
- Do not introduce additional state management libraries (like NgRx)

---

### 5. Existing Files to Modify

#### `src/app/components/project-map/project-map-menu/project-map-menu.component.html`
Add AI Chat button to toolbar:
```html
<button mat-icon-button
        matTooltip="AI Assistant"
        (click)="openAIChat()">
  <mat-icon>psychology</mat-icon>
</button>
```

#### `src/app/components/project-map/project-map-menu/project-map-menu.component.ts`
Add method to open AI Chat:
```typescript
openAIChat() {
  this.aiChatService.openChatPanel(this.project);
}
```

#### `src/app/components/project-map/project-map.component.scss`
Add styles for AI Chat panel integration

---

## Data Flow Design

### 1. Initialize Chat
```
User clicks AI Chat Button
    ↓
Check if project is already opened
    ↓
Load session list for current project
    ↓
Create new session or select existing session
    ↓
Show chat panel
```

### 2. Send Message Flow
```
User enters message and clicks send
    ↓
Add user message to local state
    ↓
Call aiChatService.streamChat()
    ↓
Establish SSE connection
    ↓
Process received events:
    - content: Append to AI message content
    - tool_call: Update tool call display
    - tool_start: Show tool execution started
    - tool_end: Show tool execution result
    - error: Show error message
    - done: Complete message
    ↓
Update session statistics
```

### 3. Tool Call Processing Flow
```
Receive tool_call event (streaming)
    ↓
Accumulate arguments (arguments gradually complete)
    ↓
Show tool call with progress indicator
    ↓
Receive tool_start event
    ↓
Show tool execution status
    ↓
Receive tool_end event
    ↓
Show tool execution result
```

---

## UI Design

### Panel Layout
```
┌─────────────────────────────────────────────────┐
│ AI Assistant                         [_] [□] [×]│
├──────────────────────┬──────────────────────────┤
│ Session List (250px)│ Chat Area                 │
│ ┌─────────────────┐  │                          │
│ │ New Chat     +   │  │ ┌──────────────────────┐ │
│ ├─────────────────┤  │ │ User: Check version   │ │
│ │📌 Topology Help│  │ └──────────────────────┘ │
│ │ Last: How to...│  │                          │
│ ├─────────────────┤  │ ┌──────────────────────┐ │
│ │ Network Debug  │  │ │Assistant: Let me...   │ │
│ │ Last: Router...│  │ │ [Streaming...]         │ │
│ └─────────────────┘  │ └──────────────────────┘ │
│                      │                          │
│                      │ ┌──────────────────────┐ │
│                      │ │ 🔧 Execute Command    │ │
│                      │ │ Params: {...}        │ │
│                      │ └──────────────────────┘ │
│                      │ ┌──────────────────────┐ │
│                      │ │ [Input]           [Send]│ │
│                      │ └──────────────────────┘ │
└──────────────────────┴──────────────────────────┘
```

### UI/UX Principles
- **Theme Support**: Light/dark theme support
- **Resizable**: Drag to resize panel
- **Collapsible**: Minimize to icon view
- **Responsive**: Adapt to different screen sizes
- **Accessibility**: Keyboard navigation, ARIA labels

---

## Key Technical Implementation

### SSE Event Handling
```typescript
// Service layer method
streamChat(projectId: string, message: string, sessionId?: string): Observable<ChatEvent> {
  return new Observable<ChatEvent>((observer) => {
    // Use fetch to send POST request (EventSource doesn't support POST)
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

      // Read streaming response
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

    // Return cleanup function
    return () => {
      reader?.cancel();
    };
  });
}
```

### Tool Call Argument Accumulation
```typescript
// Component logic
handleToolCallEvent(toolCall: ToolCall) {
  const existing = this.currentToolCalls.get(toolCall.id);

  if (!existing) {
    // New tool call
    this.currentToolCalls.set(toolCall.id, {
      ...toolCall,
      function: {
        ...toolCall.function,
        complete: false
      }
    });
    this.displayToolCallStarted(toolCall);
  } else {
    // Update existing tool call arguments
    existing.function.arguments = toolCall.function.arguments;
    existing.function.complete = toolCall.function.complete || false;
    this.updateToolCallDisplay(existing);
  }

  // Arguments complete, ready to execute
  if (toolCall.function.complete) {
    this.markToolCallReady(toolCall);
  }
}
```

---

## Implementation Checklist

### Phase 1: Infrastructure
- [ ] Create AI Chat service and basic API methods
- [ ] Define all data model TypeScript interfaces
- [ ] Create basic component structure
- [ ] Implement SSE streaming
- [ ] Add AI Chat button to toolbar

### Phase 2: Core Features
- [ ] Implement chat message list component
- [ ] Implement chat input area component
- [ ] Implement session list component
- [ ] Add session CRUD operations
- [ ] Implement message streaming display UI

### Phase 3: Advanced Features
- [ ] Tool call display component
- [ ] Tool call argument accumulation logic
- [ ] Session statistics display
- [ ] Pin/Unpin functionality
- [ ] Markdown rendering

### Phase 4: Optimization
- [ ] Resizable panel
- [ ] Theme integration
- [ ] Error handling
- [ ] Loading state
- [ ] Keyboard shortcuts
- [ ] Accessibility

### Phase 5: Testing
- [ ] Service layer unit tests
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests

---

## Success Metrics

- **Performance**: SSE latency < 100ms
- **Usability**: Panel open time < 300ms
- **Reliability**: 99.9% connection success rate
- **Accessibility**: WCAG 2.1 AA compliant

---

## Future Enhancements

1. **Multimodal Support**: Image/file upload
2. **Voice Input**: Speech-to-text integration
3. **Export Sessions**: JSON/Markdown export
4. **Share Sessions**: Share sessions between users
5. **Custom Tools**: User-defined tool plugins
6. **Quick Actions**: Preset prompts
7. **Search**: Search within sessions

---

## Important Notes

1. **Prerequisites**:
   - GNS3 server must have Chat API enabled
   - User must have LLM settings configured (already implemented in AI Profile Management)
   - Project must be in "opened" state to use chat

2. **Data Isolation**:
   - Sessions are isolated by project and user
   - Each project creates `gns3-copilot/copilot_checkpoints.db` in project directory
   - Project deletion automatically cleans up related data

3. **Security**:
   - All sensitive data (API keys, JWT tokens) handled on server side
   - Passed through ContextVars, not persisted to database
   - Sensitive info automatically cleared from memory after request

4. **Tech Stack**:
   - Follow existing GNS3 Web UI patterns
   - Material Design component library
   - RxJS Observable reactive programming
   - ngx-markdown + Tailwind Typography (for Markdown rendering)
   - No additional state management libraries

---

## Message Rendering Module

Modules affecting AI Assistant message rendering:

### Core Rendering Files
| File | Purpose |
|------|---------|
| `chat-message-list.component.ts` | **Markdown rendering** - using ngx-markdown component |
| `chat-message-list.component.scss` | Message list styles |
| `ai-chat.component.scss` | Main panel styles |

### Style Related
| File | Purpose |
|------|---------|
| `src/tailwind-markdown.scss` | Tailwind CSS entry file |
| `tailwind.config.js` | Tailwind config (includes Typography plugin) |
| `chat-message-list.component.scss` | Message bubble, Cisco IOS highlight styles |

### Data/Config
| File | Purpose |
|------|---------|
| `ai-chat.interface.ts` | Message data structures `ChatMessage`, `MessageRole` |
| `ai-chat.store.ts` | Message state management |
| `ai-chat.service.ts` | SSE event handling, message flow |

### Auxiliary Rendering Components
| File | Purpose |
|------|---------|
| `tool-call-display.component.ts` | Tool call display |
| `json-viewer.component.ts` | JSON formatted display |
| `draggable-tool-dialog.component.ts` | Tool result dialog |

### Markdown Rendering Configuration

#### 1. Tailwind Typography Config (`tailwind.config.js`)
```javascript
module.exports = {
  content: ['./src/app/**/*.{html,ts}'],
  plugins: [require('@tailwindcss/typography')],
};
```

#### 2. CSS Classes in Components
Reference FlowNet-Lab implementation:
```html
<markdown class="prose prose-sm dark:prose-invert max-w-none min-w-0
  prose-p:break-words prose-ul:break-words prose-ol:break-words
  prose-pre:break-all prose-a:break-all prose-code:break-all"
  [data]="message.content">
</markdown>
```

| Class | Purpose |
|-------|---------|
| `prose` | Tailwind Typography base class |
| `prose-sm` | Small font size |
| `dark:prose-invert` | Dark theme adaptation |
| `max-w-none` | No max width limit |
| `min-w-0` | Allow shrinking |
| `prose-xxx:break-words` | Force word wrap, prevent overflow |

> **Note**: Message rendering uses `ngx-markdown` component + Tailwind Typography classes, no longer uses manual marked configuration.

---

## File List Summary

### New Files (10)
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

### New Config Files (3)
1. `tailwind.config.js` - Tailwind CSS configuration
2. `src/tailwind-markdown.scss` - Tailwind entry file

### Modified Files (3)
1. `src/app/components/project-map/project-map-menu/project-map-menu.component.html`
2. `src/app/components/project-map/project-map-menu/project-map-menu.component.ts`
3. `src/app/components/project-map/project-map.component.scss`
