# AI Chat Feature Documentation

> Complete documentation for GNS3 Web UI AI Chat functionality

**Version**: v1.0
**Last Updated**: 2026-03-10
**Status": ✅ Implemented

---

## 📑 Quick Navigation

| Section | Description |
|---------|-------------|
| [Quick Start](#1-quick-start) | Get started with AI Chat in 5 minutes |
| [Feature Overview](#2-feature-overview) | Core functionality |
| [Architecture](#3-architecture) | System design and data flow |
| [Component Docs](#4-component-documentation) | Component details |
| [Technical Details](#5-technical-details) | Session, SSE, Markdown rendering |
| [Changelog](#6-changelog) | Version history |

---

## 1. Quick Start

### 1.1 Enable AI Chat

AI Chat is integrated into GNS3 Web UI, no additional configuration required.

1. Open GNS3 Web UI
2. Click the **AI Chat** icon in the toolbar
3. Start chatting with the AI assistant

### 1.2 Core Features

- 💬 **Natural Language Interaction** - Ask network-related questions naturally
- 🔧 **Network Automation** - Automate network configuration and analysis
- 📊 **Multi-Session Management** - Support multiple conversation sessions
- 🎛️ **AI Profiles** - Configure different AI models and services

### 1.3 Code Files

```
src/app/
├── components/project-map/ai-chat/
│   ├── ai-chat.component.*              # Main panel container
│   ├── chat-message-list.component.*    # Message list
│   ├── chat-input-area.component.*      # Input area
│   ├── chat-session-list.component.*    # Session list
│   ├── tool-call-display.component.*    # Tool call display
│   └── tool-details-dialog.component.*  # JSON details dialog
├── services/
│   ├── ai-chat.service.ts               # API interaction
│   └── ai-profiles.service.ts           # Profile management
├── stores/
│   └── ai-chat.store.ts                 # State management
└── models/
    ├── ai-chat.interface.ts             # Data interfaces
    └── ai-profile.ts                     # Profile interface
```

---

## 2. Feature Overview

### 2.1 Core Features

| Feature | Description | Status |
|----------|-------------|--------|
| **Streaming Response** | Real-time AI response display | ✅ |
| **Tool Calls** | Display AI-called tools and parameters | ✅ |
| **Tool Results** | Show tool execution results | ✅ |
| **Multi-Session** | Support multiple conversation sessions | ✅ |
| **Session Persistence** | Auto-save sessions to server | ✅ |
| **Markdown Rendering** | Rich text formatting | ✅ |
| **Code Highlighting** | Auto-detect and highlight code | ✅ |
| **JSON Viewer** | Interactive JSON data viewer | ✅ |
| **Confirmation Dialog** | Secondary confirmation for dangerous operations | ✅ |

### 2.2 Message Types

| Type | Description | Display |
|------|-------------|---------|
| `user` | User message | Right purple bubble |
| `assistant` | AI assistant response | Left gray bubble |
| `system` | System message | Centered yellow notice |
| `tool_call` | Tool invocation | Left blue tag |
| `tool_result` | Execution result | Left green tag |

---

## 3. Architecture

### 3.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GNS3 Web UI                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐                                        │
│  │  AiChatComponent │  ← Main container                     │
│  │  (Main Panel)    │                                        │
│  └────────┬─────────┘                                        │
│           │                                                   │
│  ┌────────┴─────────────────────────────────────────────┐    │
│  │                   Child Components                     │    │
│  │  ┌──────────────────┐  ┌─────────────────────────┐  │    │
│  │  │ ChatMessageList  │  │  ChatSessionList        │  │    │
│  │  │  (Message List)  │  │  (Session List)          │  │    │
│  │  └────────┬─────────┘  └─────────────────────────┘  │    │
│  │           │                                            │    │
│  │  ┌────────┴────────────┐                             │    │
│  │  │ ToolCallDisplay     │                             │    │
│  │  │ (Tool Call Display) │                             │    │
│  │  └─────────────────────┘                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    Services & Store                    │   │
│  │  ┌──────────────────┐  ┌─────────────────────────┐   │   │
│  │  │  AiChatService   │  │   AiChatStore           │   │   │
│  │  │  (API Interaction)│ │   (State Management)    │   │   │
│  │  └────────┬─────────┘  └─────────────────────────┘   │   │
│  └───────────┼───────────────────────────────────────────┘   │
│              │                                                │
│  ┌───────────┴─────────────────────────────────────────┐     │
│  │               Backend API (SSE)                       │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User Input → ChatInputArea
              ↓
         AiChatStore (State)
              ↓
         AiChatService (API)
              ↓
       Backend SSE (Streaming)
              ↓
      ChatMessageList (Render)
              ↓
         ToolCallDisplay (Tool Display)
              ↓
      ToolDetailsDialog (JSON Details)
```

### 3.3 Tech Stack

| Technology | Version/Library | Purpose |
|------------|-----------------|---------|
| Angular | 17.x | Frontend framework |
| RxJS | 7.x | Reactive programming |
| Zustand | - | State management (Store) |
| ngx-markdown | - | Markdown rendering |
| ngx-json-viewer | - | JSON viewing |
| SSE | - | Server-sent events |
| UUID | - | Session ID generation |

---

## 4. Component Documentation

### 4.1 AiChatComponent

**Files**: `ai-chat.component.ts/html/scss`

**Responsibilities**:
- Main container for AI Chat feature
- Manages child component layout
- Handles panel collapse/expand

**Key Features**:
- Responsive layout (collapsed/expanded states)
- Integrated with Console devices panel
- Window drag and resize support

---

### 4.2 ChatMessageListComponent

**Files**: `chat-message-list.component.ts/scss`

**Responsibilities**:
- Render message list
- Handle user/AI/system messages
- Render tool calls and results

**Key Features**:
- Auto-scroll to bottom
- Streaming response animation
- Tool call details dialog

**Styling**:
- User messages: Right purple gradient bubble
- AI messages: Left gray bubble
- Tool calls: Blue clickable tags
- Tool results: Green clickable tags

---

### 4.3 ToolDetailsDialogComponent

**Files**: `tool-details-dialog.component.ts`

**Responsibilities**:
- Display detailed JSON for tool calls/results
- Support JSON content copying
- Dark/Light theme adaptation

**JSON Expansion Defaults**:
- Tool Call Arguments: `expanded="true"` (expanded)
- Tool Result Output: `expanded="false"` (collapsed)

**Key Methods**:
```typescript
openToolCallDialog(toolCall: ToolCall)
openAssistantToolResultDialog(result: ToolResult)
copyJsonToClipboard()
closeDialog()
```

---

### 4.4 ConfirmationDialogComponent

**Files**: `confirmation-dialog.component.ts` (standalone component)

**Responsibilities**:
- Secondary confirmation for dangerous operations
- Replaces original BottomSheet

**Why MatDialog?**
- ✅ Better z-index control
- ✅ More flexible positioning
- ✅ Better theme adaptation
- ❌ BottomSheet has layer issues in complex layouts

---

## 5. Technical Details

### 5.1 Session ID Management

**Generation Strategy**: Frontend generates UUID v4

**Why frontend generation?**
1. No waiting for server response
2. Immediate UI update for new session
3. Support offline creation (future)

**Implementation**:
```typescript
// Frontend generates UUID
const sessionId = crypto.randomUUID();
this.aiChatStore.setCurrentSessionId(sessionId);

// Send message with session_id
this.aiChatService.sendMessage(message, sessionId);
```

**Bug Fix**:
- **Issue**: When clicking + to create new session, service layer session_id wasn't reset
- **Solution**: Sync clear both store and service session_id on session creation

---

### 5.2 SSE (Server-Sent Events)

**Purpose**: Stream AI responses

**Implementation**:
```typescript
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle streaming data
};
```

**Benefits**:
- Real-time response display
- Unidirectional push, no polling needed
- Auto-reconnection

---

### 5.3 Markdown Rendering

**Library**: `ngx-markdown` + Tailwind Typography `prose`

**Configuration**:
```html
<markdown class="prose prose-sm dark:prose-invert" [data]="content">
</markdown>
```

**Issues**:
- prose default spacing too large
- ngx-markdown 2-3 nested container levels
- Angular ViewEncapsulation blocks style penetration

**Solution**:
```scss
// Use ::ng-deep to penetrate nested containers
markdown ::ng-deep p {
  margin-top: 0.25em !important;
  margin-bottom: 0.25em !important;
}
```

---

### 5.4 JSON Viewer

**Library**: `ngx-json-viewer`

**Features**:
- Syntax highlighting
- Collapsible nodes
- Dark/Light theme support

**Theme Colors**:
```scss
// Dark theme
--ngx-json-string: #a5d6ff;
--ngx-json-number: #79c0ff;
--ngx-json-key: #7ee787;

// Light theme
--ngx-json-string: #0451a5;
--ngx-json-number: #098658;
--ngx-json-key: #0451a5;
```

---

## 6. Changelog

### v1.0 (2026-03-10)

**New Features**:
- ✅ Complete AI Chat functionality
- ✅ Multi-session management
- ✅ Tool Call/Result display
- ✅ JSON details dialog
- ✅ Confirmation dialog component
- ✅ Markdown streaming rendering
- ✅ Dark/Light theme adaptation

**Bug Fixes**:
- ✅ session_id reset issue
- ✅ Tool details dialog light theme colors
- ✅ JSON expansion defaults
- ✅ Firefox tab label covered by xterm
- ✅ Markdown prose spacing

**Optimizations**:
- ✅ Remove unused styles (189 lines)
- ✅ Consolidate documentation structure

---

## 7. Related Documentation

### Detailed Implementation Docs

| Document | Description |
|----------|-------------|
| [implementation-plan.md](./implementation-plan.md) | Complete implementation plan (kept) |
| [session-id-and-sse.md](./session-id-and-sse.md) | Session and SSE technical details (kept) |

### Component Docs (Integrated into this doc)

The following component docs have been integrated into this main document:
- ~~ai-chat-json-viewer-implementation.md~~ → [4.3 ToolDetailsDialogComponent](#43-tooldetailsdialogcomponent)
- ~~confirmation-dialog-component.md~~ → [4.4 ConfirmationDialogComponent](#44-confirmationdialogcomponent)

### Archived Docs

- ~~ai-chat-ui-optimization-plan.md~~ → Completed optimizations
- ~~ai-chat-files-overview.md~~ → Content integrated into this doc

---

**Maintained By**: Development Team
**Last Updated**: 2026-03-10
