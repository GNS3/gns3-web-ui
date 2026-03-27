# AI Chat - Complete Guide

> Complete documentation for GNS3 Web UI AI Chat functionality

**Version**: v1.2
**Last Updated**: 2026-03-19
**Status**: ✅ Implemented

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Feature Overview](#2-feature-overview)
3. [Architecture](#3-architecture)
4. [Component Documentation](#4-component-documentation)
5. [State Management](#5-state-management)
6. [Technical Details](#6-technical-details)
7. [Session Management & SSE](#7-session-management--sse)
8. [Window Management](#8-window-management)
9. [Theme Support](#9-theme-support)
10. [API Reference](#10-api-reference)
11. [Maintenance Guide](#11-maintenance-guide)

---

## 1. Quick Start

### 1.1 Enable AI Chat

AI Chat is integrated into GNS3 Web UI, no additional configuration required.

1. Open GNS3 Web UI
2. Click the **AI Chat** icon in the toolbar
3. Start chatting with the AI assistant

### 1.2 Code Files

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
│   └── ai-chat.store.ts                 # State management (RxJS)
├── utils/
│   └── ai-profile.util.ts               # AI profile utility functions
└── models/
    └── ai-chat.interface.ts             # Data interfaces
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
| **Panel State Persistence** | Window position/size saved to localStorage | ✅ |
| **Model Selector** | Switch between configured LLM models | ✅ |
| **Copilot Mode** | Switch between Teaching Assistant and Lab Automation modes | ✅ |

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
│  │  │  (API Interaction)│ │   (RxJS State)          │   │   │
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
         AiChatStore (State - RxJS BehaviorSubject)
              ↓
         AiChatService (API)
              ↓
       Backend SSE (Streaming via Fetch API)
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
| Angular | 14.3.0 | Frontend framework |
| RxJS | 6.6.7 | Reactive programming & State management |
| Material Design | - | UI components (MatDialog, MatSnackBar) |
| ngx-markdown | - | Markdown rendering |
| ngx-json-viewer | - | JSON viewing |
| SSE (Fetch API) | - | Server-sent events streaming |

### 3.4 Component Hierarchy

```
project-map.component
    ↓
ai-chat.component (Main container)
    ├─→ chat-session-list.component (Session sidebar)
    ├─→ chat-message-list.component (Message display area)
    │       ├─→ tool-call-display.component (Inline tool call display)
    │       └─→ tool-details-dialog.component (Modal dialog for details)
    └─→ chat-input-area.component (Input field)
```

---

## 4. Component Documentation

### 4.1 AiChatComponent

**Files**: `ai-chat.component.ts/html/scss`

**Responsibilities**:
- Main container for AI Chat feature
- Manages child component layout
- Handles panel collapse/expand/maximize/minimize
- Manages window dragging and resizing
- Coordinates between service and store
- SSE event handling (content, tool_call, tool_end events)
- Message state management
- Session management
- Chat input/output coordination
- Tool execution coordination

**Key Features**:
- Responsive layout (collapsed/expanded/maximized/minimized states)
- Integrated with Console devices panel
- Window drag and resize support with boundary constraints
- Panel state persistence via localStorage
- Theme adaptation (light/dark)

**Window States**:
- **Normal**: Default floating panel (800x900px)
- **Maximized**: Full viewport coverage
- **Minimized**: Hidden (use toolbar icon to restore)
- **Collapsed**: Sidebar only (48px width)

---

### 4.2 ChatMessageListComponent

**Files**: `chat-message-list.component.ts/scss`

**Responsibilities**:
- Render message list
- Handle user/AI/system messages
- Render tool calls and results
- Message rendering with Markdown
- Auto-scroll behavior
- Empty state display
- Tool details dialog triggers

**Dependencies**:
- `ngx-markdown` for Markdown rendering
- `ToolCallDisplayComponent` (standalone)
- `ToolDetailsDialogComponent` (standalone)

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
- Modal dialog management

**Dependencies**:
- `ngx-json-viewer` for JSON display

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

**Features**:
- Syntax highlighted JSON
- Collapsible nodes
- Copy to clipboard
- Dark/light theme support
- Solid background (performance optimized, no glassmorphism)
- Resizable dialog (800px default, min 600px, max 95vw)

**Theme Support**:
- Dynamically passes `panelClass` based on current theme
- Light theme: JSON syntax highlighting with blue/green colors
- Dark theme: JSON syntax highlighting with cyan/green colors

---

### 4.4 ChatSessionListComponent

**Files**: `chat-session-list.component.ts`

**Responsibilities**:
- Session list display
- Session selection
- New session creation
- Session deletion (with confirmation dialog)
- Session title display

---

### 4.5 ChatInputAreaComponent

**Files**: `chat-input-area.component.ts`

**Responsibilities**:
- Message input field with auto-resize textarea
- Send button with loading state
- Model selector chip with dropdown menu
- Input state management

**Key Features**:
- **Auto-resize Textarea**: Dynamically adjusts height based on content (48px-200px)
- **Keyboard Shortcuts**: Ctrl/Cmd+Enter to send messages
- **Model Selector**: Display and switch between configured LLM models
  - Chip-style button with cyan gradient
  - Shows shortened model name (e.g., "Gemini 2.5 Flash")
  - Hover tooltip displays full name with domain (e.g., "gemini-2.5-flash (api.google.com)")
  - Dropdown menu lists all available models with checkmark for current selection
  - Clicking a model sets it as default via API
- **Model Name Display Logic**:
  - Removes provider prefix (e.g., "google/", "meta-llama/")
  - Replaces hyphens and underscores with spaces
  - Capitalizes first letter of each word
  - Extracts domain from base_url for platform identification
  - Examples:
    - "google/gemini-2.5-flash" → "Gemini 2.5 Flash"
    - "meta-llama/llama-3.1-70b" → "Llama 3.1 70b"
    - "openai/gpt-4o" → "Gpt 4o"
- **Copilot Mode Selector**: Switch between AI assistant modes
  - Located in model selector dropdown menu (bottom section)
  - Two available modes:
    - **Teaching Assistant**: Diagnostics only - Provides guidance and analysis
    - **Lab Automation**: Full configuration access - Can make configuration changes
  - Visual indication of current mode with checkmark icon
  - Mode preference persists with model configuration
  - Changing mode updates current model's copilot_mode setting via API

**Inputs**:
- `placeholder`: Input placeholder text
- `disabled`: Disable input (during streaming)
- `maxLength`: Maximum message length (default: 4000)
- `showCharCount`: Show character count
- `warningThreshold`: Character count warning threshold (default: 0.9)
- `modelConfigs`: Array of available LLM model configurations
- `currentModelId`: ID of currently selected model
- `currentCopilotMode`: Current copilot mode (`'teaching_assistant'` | `'lab_automation_assistant'`)

**Outputs**:
- `messageSent`: Emitted when user sends a message
- `inputChanged`: Emitted on input change
- `modelSelected`: Emitted when user selects a different model
- `copilotModeSelected`: Emitted when user switches copilot mode

---

### 4.6 AI Profile Utility Functions

**File**: `utils/ai-profile.util.ts`

**Purpose**: Centralized utility functions for processing AI model configurations

**Exported Functions**:

#### `getModelDisplayName(config: LLMModelConfigWithSource): string`

Extracts domain from `base_url` and formats model name with domain.

**Returns**: Display name in format `"model (domain)"`

**Examples**:
```typescript
getModelDisplayName(config)
// Returns: "gemini-2.5-flash (api.google.com)"
// Returns: "gpt-4o (openrouter.com)"
```

**Features**:
- Extracts hostname from `base_url` using URL API
- Removes `www.` prefix and port numbers
- Falls back to `provider` if URL parsing fails

---

#### `shortenModelName(model: string): string`

Removes provider prefix and formats model name to title case.

**Examples**:
```typescript
shortenModelName("google/gemini-2.5-flash")
// Returns: "Gemini 2.5 Flash"

shortenModelName("meta-llama/llama-3.1-70b")
// Returns: "Llama 3.1 70b"

shortenModelName("openai/gpt-4o")
// Returns: "Gpt 4o"
```

**Features**:
- Removes provider prefix (e.g., `google/`, `meta-llama/`)
- Replaces hyphens and underscores with spaces
- Capitalizes first letter of each word

---

**Why Utility Functions?**
- ✅ **DRY Principle**: Eliminates code duplication across components
- ✅ **Single Source of Truth**: Model name formatting logic in one place
- ✅ **Easy Testing**: Pure functions can be unit tested independently
- ✅ **Reusability**: Can be used by any component that needs model display names
- ✅ **Maintainability**: Changes to formatting logic only need to be made once

---

### 4.7 ToolCallDisplayComponent

**Files**: `tool-call-display.component.ts`

**Responsibilities**:
- Display tool call summary
- Click to open details dialog
- Visual feedback for tool status

---

### 4.8 ConfirmationDialogComponent

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

## 5. State Management

### 5.1 RxJS BehaviorSubject Implementation

**Implementation**: Uses RxJS `BehaviorSubject` for reactive state management

**Key Services**:
- `AiChatStore`: Centralized state store using BehaviorSubject pattern
- `AiChatService`: API communication service

**State Categories**:
```typescript
// Project & Session State
currentProjectId$: BehaviorSubject<string | null>
currentSessionId$: BehaviorSubject<string | null>
sessions$: BehaviorSubject<ChatSession[]>

// Message State
messagesMap: Map<string, ChatMessage[]>
messages$: BehaviorSubject<Map<string, ChatMessage[]>>

// Streaming State
isStreaming$: BehaviorSubject<boolean>

// Tool Call State
currentToolCalls$: BehaviorSubject<Map<string, ToolCall>>

// Panel State
panelState$: BehaviorSubject<ChatPanelState>

// Session UI State
sessionUIStates$: BehaviorSubject<Map<string, SessionUIState>>
```

**Why RxJS over Zustand?**
- ✅ Native Angular integration
- ✅ Powerful operators (takeUntil, tap, map)
- ✅ Automatic memory leak prevention
- ✅ Better TypeScript support

---

## 6. Technical Details

### 6.1 Markdown Rendering

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

### 6.2 JSON Viewer

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

### 6.3 Panel State Persistence

**Storage**: localStorage

**Saved State**:
```typescript
interface ChatPanelState {
  isOpen: boolean;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  position: {
    top: number;
    right?: number;
    left?: number;
  };
}
```

**Key**: `ai-chat-panel-state`

**Behavior**:
- State saved on drag end, resize end, maximize/minimize
- Loaded on component initialization
- isOpen/isMaximized/isMinimized reset to false on page load
- Debounced save (300ms) to reduce localStorage writes

---

### 6.4 Window Boundary Service

**Purpose**: Keep AI Chat window within viewport bounds

**Features**:
- Constrain position during drag
- Constrain size during resize
- Auto-adjust on window resize
- Configurable top offset (toolbar height)

**Integration**:
```typescript
// Set top offset to keep AI Chat below toolbar
const toolbarHeight = window.innerWidth <= 768 ? 56 : 64;
this.boundaryService.setConfig({ topOffset: toolbarHeight });

// Constrain drag position
this.style = this.boundaryService.constrainDragPosition(
  this.style,
  event.movementX,
  event.movementY
);

// Constrain resize size
const constrained = this.boundaryService.constrainResizeSize(
  width,
  height,
  left,
  top
);
```

---

## 7. Session Management & SSE

### 7.1 Session ID Management

**Generation Strategy**: Frontend generates UUID v4

**Why frontend generation?**
1. No waiting for server response
2. Immediate UI update for new session
3. Support offline creation (future)

**Implementation**:
```typescript
// Frontend generates UUID
const sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});
this.aiChatStore.setCurrentSessionId(sessionId);

// Send message with session_id
this.aiChatService.streamChat(this.controller, projectId, {
  message,
  session_id: sessionId,
  stream: true
});
```

**Bug Fix**:
- **Issue**: When clicking + to create new session, service layer session_id wasn't reset
- **Solution**: Sync clear both store and service session_id on session creation

---

### 7.2 SSE (Server-Sent Events)

**Purpose**: Stream AI responses

**Why SSE Requires New Connection Per Message**

**SSE (Server-Sent Events)** is a **unidirectional** communication protocol:
- **Server -> Client**: Data flow
- **Client -> Server**: Not possible through SSE connection

**Implementation** (using Fetch API):
```typescript
fetch(url, {
  method: 'POST',
  headers: headersObj,
  body: JSON.stringify(request)
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processStream = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            const event: ChatEvent = JSON.parse(data);
            if (event.type !== 'heartbeat') {
              observer.next(event);
            }
          }
        }
      }
    }
  };

  processStream();
});
```

**Benefits**:
- Real-time response display
- Unidirectional push, no polling needed
- Better browser compatibility than EventSource

**Event Types**:
- `content`: Text content from AI
- `tool_call`: Tool invocation with parameters
- `tool_start`: Tool execution started
- `tool_end`: Tool execution finished
- `done`: Stream completed
- `heartbeat`: Keep-alive (skipped)
- `error`: Error occurred

---

### 7.3 Multi-Round Conversations

**How Context is Maintained**

The backend maintains conversation context through **session_id**, not through a persistent SSE connection.

```
Round 1:
Client -> POST /chat/stream {message: "hello", session_id: "uuid-1"}
Client <- SSE: "Hello!"
[Connection closes]

Round 2:
Client -> POST /chat/stream {message: "How are you?", session_id: "uuid-1"}
Client <- SSE: "I'm doing great!"
[Connection closes]
```

**Key Point**: Each round creates a new SSE connection, but uses the **same session_id** to maintain context.

---

## 8. Window Management

### 8.1 Default Window Size

**Current Default**: 800px × 900px

**Architecture**: Store is the single source of truth for default values.

**File**: `src/app/stores/ai-chat.store.ts`

**Line 38-39** - Panel state defaults:
```typescript
private panelState$ = new BehaviorSubject<ChatPanelState>({
  isOpen: false,
  width: 800,   // ← Modify this for default width
  height: 900,  // ← Modify this for default height
  isMaximized: false,
  isMinimized: false,
  position: {
    top: 80,
    right: 20
  }
});
```

**Important**: After changing default size, users need to clear localStorage:
```javascript
localStorage.removeItem('ai-chat-panel-state');
```

---

### 8.2 WindowBoundaryService Integration

**Configuration**:
```typescript
interface BoundaryConfig {
  minVisibleSize: number;  // Default: 100
  minWidth: number;        // Default: 500
  minHeight: number;       // Default: 400
  maxWidth?: number;       // Optional
  maxHeight?: number;      // Optional
  topOffset?: number;      // Toolbar height
}
```

**Features**:
- Resizable panel with min/max constraints
- Drag to reposition
- Boundary constraints to stay within viewport
- Toolbar offset handling (64px desktop, 56px mobile)

---

## 9. Theme Support

The AI Chat components use CSS variables for theme adaptation:

- `.dark-theme` / `.light-theme` classes applied by app
- `prose dark:prose-invert` for Markdown content
- Custom colors for JSON viewer in dark mode
- Dialog styling adapts to theme

### 9.1 Theme Application

**AI Chat Container Theme Classes**:
```html
<div class="ai-chat-container"
     [class.dark-theme]="!isLightThemeEnabled"
     [class.light-theme]="isLightThemeEnabled"
     ...>
```

**Key Points**:
- AI Chat follows the **global theme setting**, independent of map background theme
- Font colors automatically adapt based on applied theme class:
  - Dark theme: White text (`rgba(255, 255, 255, 0.85)`)
  - Light theme: Dark text (`rgba(0, 0, 0, 0.87)`)
- Material Design CSS variables provide consistent theming across all components

**Theme Resolution**:
```typescript
// In ai-chat.component.ts (line 82-84)
this.themeService.getActualTheme() === 'light'
  ? (this.isLightThemeEnabled = true)
  : (this.isLightThemeEnabled = false);
```

**Important**: AI Chat uses `getActualTheme()` which returns the global theme, not `getActualMapTheme()` which considers map background settings. This ensures AI Chat remains readable regardless of map background.

---

## 10. API Reference

### 10.1 Chat Endpoints

**Base URL**: `{protocol}://{host}:{port}/v3`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/{project_id}/chat/stream` | Stream chat (SSE) |
| GET | `/projects/{project_id}/chat/sessions` | Get sessions list |
| GET | `/projects/{project_id}/chat/sessions/{session_id}/history` | Get session history |
| PATCH | `/projects/{project_id}/chat/sessions/{session_id}` | Rename session |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}` | Delete session |
| PUT | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Pin session |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Unpin session |

### 10.2 AI Profiles Endpoints

**Base URL**: `{protocol}://{host}:{port}/v3`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/access/users/{user_id}/llm-model-configs` | Get all LLM model configs for user |
| PUT | `/access/users/{user_id}/llm-model-configs/default/{config_id}` | Set default model config |

### 10.3 SSE Event Types

| Event Type | Description |
|------------|-------------|
| `content` | Text content from AI assistant |
| `tool_call` | Tool invocation with parameters |
| `tool_start` | Tool execution started |
| `tool_end` | Tool execution finished with result |
| `done` | Stream completed successfully |
| `heartbeat` | Keep-alive signal (skipped) |
| `error` | Error occurred |

---

## 11. Maintenance Guide

### 11.1 File Structure Summary

**Total Files**: 14 files (~112 KB)

| Category | Files |
|----------|-------|
| Components | 9 files (6 components) |
| Services | 2 files |
| Stores | 1 file |
| Models | 2 files |

### 11.2 Adding New Features

**Guidelines**:
1. **Consider Standalone Pattern**: New components should be standalone
2. **Use Framework Modules**: Check for existing solutions before custom implementation
3. **Follow Size Guidelines**:
   - Small (<100 lines): Inline template/styles
   - Medium (100-300 lines): Consider external
   - Large (>300 lines): External files
4. **Document Dependencies**: Update this file when adding new components

### 11.3 Code Review Checklist

- [ ] Component is standalone or properly declared
- [ ] No unused imports
- [ ] No duplicate functionality
- [ ] Follows existing patterns
- [ ] Documented in this file

### 11.4 Future Improvements

**Migration Tasks**:
- [ ] Migrate `chat-message-list` to standalone
- [ ] Migrate `chat-session-list` to standalone

**Potential Optimizations**:
- [ ] Virtual scrolling for large message lists (>100 messages)
- [ ] Message pagination/caching
- [ ] Lazy loading of historical messages

---

## 12. Changelog

### v1.2 (2026-03-19)

**New Features**:
- ✅ Added LLM model selector in chat input area
  - Chip-style button with cyan gradient positioned next to send button
  - Displays shortened model name (e.g., "Gemini 2.5 Flash")
  - Hover tooltip shows full model name with domain (e.g., "gemini-2.5-flash (api.google.com)")
  - Dropdown menu lists all configured models with visual checkmark for current selection
  - Model selection sets as default via API call
  - Intelligent model name formatting:
    - Removes provider prefix (google/, meta-llama/, etc.)
    - Replaces hyphens and underscores with spaces
    - Capitalizes first letter of each word
    - Extracts domain from base_url for platform identification
  - Examples: "google/gemini-2.5-flash" → "Gemini 2.5 Flash (api.google.com)"
- ✅ Added AI Profiles API integration
  - GET /v3/access/users/{user_id}/llm-model-configs - Fetch all configured models
  - PUT /v3/access/users/{user_id}/llm-model-configs/default/{config_id} - Set default model
- ✅ Added model configuration loading on chat initialization
- ✅ Added user feedback via MatSnackBar on model switch

**Code Quality Improvements**:
- ✅ Extracted utility functions to `utils/ai-profile.util.ts`
  - `getModelDisplayName()` - Format model name with domain
  - `shortenModelName()` - Shorten and format model name for display
  - Eliminates ~60 lines of duplicate code across components
  - Improves maintainability and testability
- ✅ Added `@utils/*` path mapping in tsconfig.app.json
- ✅ Updated documentation with utility functions section

**Documentation**:
- ✅ Added model selector feature documentation
- ✅ Added AI Profiles API endpoints reference
- ✅ Added utility functions documentation (section 4.6)

### v1.1 (2026-03-18)

**Bug Fixes**:
- ✅ Fixed AI Chat theme class application
  - Changed from custom `lightTheme` class to standard global theme classes (`.dark-theme` / `.light-theme`)
  - Ensures proper font color rendering in all theme combinations
  - AI Chat now correctly follows global theme setting, independent of map background theme
  - Fixed issue where fonts appeared dark when global theme is dark + map background is set to always light

### v1.0 (2026-03-10)

**New Features**:
- ✅ Complete AI Chat functionality
- ✅ Multi-session management
- ✅ Tool Call/Result display
- ✅ JSON details dialog
- ✅ Confirmation dialog component
- ✅ Markdown streaming rendering
- ✅ Dark/Light theme adaptation
- ✅ Panel state persistence
- ✅ Window boundary constraints

**Bug Fixes**:
- ✅ session_id reset issue
- ✅ Tool details dialog light theme colors
- ✅ JSON expansion defaults
- ✅ Firefox tab label covered by xterm
- ✅ Markdown prose spacing
- ✅ Legacy tool message format conversion

**Optimizations**:
- ✅ Remove unused styles (189 lines)
- ✅ Consolidate documentation structure
- ✅ RAF optimization for drag operations
- ✅ Debounced state saving (300ms)

---

## 13. External Dependencies

| Module | Version | Purpose |
|--------|---------|---------|
| `ngx-markdown` | 14.0.1 | Markdown rendering |
| `ngx-json-viewer` | 3.2.1 | JSON display |
| `@angular/material` | 14.2.7 | UI components |
| `@angular/cdk` | 14.2.7 | CDK features |

---

**Maintained By**: Development Team
**Last Updated**: 2026-03-19
