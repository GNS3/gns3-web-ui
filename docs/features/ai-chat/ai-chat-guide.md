# AI Chat - Complete Guide

> Complete documentation for GNS3 Web UI AI Chat functionality

**Version**: v1.3
**Last Updated**: 2026-03-30
**Status**: ✅ Implemented

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Feature Overview](#2-feature-overview)
3. [Architecture](#3-architecture)
4. [Component Overview](#4-component-overview)
5. [State Management](#5-state-management)
6. [Session & Streaming](#6-session--streaming)
7. [Window Management](#7-window-management)
8. [Theme Support](#8-theme-support)
9. [API Reference](#9-api-reference)

---

## 1. Quick Start

AI Chat is integrated into GNS3 Web UI - click the **AI Chat** icon in the toolbar to start.

### File Structure

```
src/app/
├── components/project-map/ai-chat/
│   ├── ai-chat.component.*              # Main panel container
│   ├── chat-message-list.component.*    # Message list (standalone)
│   ├── chat-input-area.component.*      # Input area with model selector
│   ├── chat-session-list.component.*    # Session sidebar (standalone)
│   ├── tool-call-display.component.*    # Tool call display
│   └── tool-details-dialog.component.*  # JSON details dialog
├── services/
│   ├── ai-chat.service.ts               # API interaction
│   └── ai-profiles.service.ts           # Profile management
├── stores/
│   └── ai-chat.store.ts                 # RxJS state (BehaviorSubject)
├── utils/
│   └── ai-profile.util.ts               # Model name formatting
└── models/
    └── ai-chat.interface.ts            # Data interfaces
```

---

## 2. Feature Overview

### Core Features

| Feature | Description |
|----------|-------------|
| **Streaming Response** | Real-time AI response via SSE |
| **Tool Calls** | Display and execute AI-suggested tools |
| **Multi-Session** | Multiple conversation sessions |
| **Session Persistence** | Auto-save to server |
| **Markdown Rendering** | Rich text with code highlighting |
| **JSON Viewer** | Interactive collapsible JSON |
| **Model Selector** | Switch between LLM models |
| **Copilot Mode** | Teaching Assistant / Lab Automation |
| **Panel State** | Position/size persisted to localStorage |

### Message Types

| Type | Display |
|------|---------|
| `user` | Right purple bubble |
| `assistant` | Left gray bubble |
| `system` | Centered yellow notice |
| `tool_call` | Left blue tag (clickable) |
| `tool_result` | Left green tag (clickable) |

---

## 3. Architecture

### Component Hierarchy

```
project-map.component
    ↓
ai-chat.component (Main container)
    ├─→ chat-session-list.component (Session sidebar)
    ├─→ chat-message-list.component (Message display)
    │       ├─→ tool-call-display.component
    │       └─→ tool-details-dialog.component
    └─→ chat-input-area.component (Input + Model selector)
```

### Data Flow

```
User Input → ChatInputArea
              ↓
         AiChatStore (RxJS BehaviorSubject)
              ↓
         AiChatService (API)
              ↓
       Backend SSE Stream
              ↓
      ChatMessageList (Render)
              ↓
         ToolCallDisplay (Tool Display)
              ↓
      ToolDetailsDialog (JSON Details)
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Angular 21 | Zoneless framework |
| RxJS | Reactive state (BehaviorSubject) |
| Material 21 | UI components |
| ngx-markdown | Markdown rendering |
| ngx-json-viewer | JSON display |
| SSE (Fetch API) | Server-sent events streaming |

---

## 4. Component Overview

### AiChatComponent

Main container managing panel state, SSE events, and child coordination.

**Window States**: Normal (800×900px), Maximized, Minimized (hidden), Collapsed (sidebar)

### ChatMessageListComponent

Renders messages with Markdown, handles auto-scroll, triggers tool dialogs.

**Styling**: User (right purple), Assistant (left gray), Tool calls (blue), Tool results (green)

### ChatInputAreaComponent

Auto-resizing textarea, model selector chip, copilot mode selector.

**Features**:
- Ctrl/Cmd+Enter to send
- Model name shortening: `google/gemini-2.5-flash` → `Gemini 2.5 Flash`
- Chip shows current model, dropdown lists all available models

### ToolDetailsDialogComponent

Modal dialog showing JSON for tool calls/results.

**Features**: Syntax highlighting, collapsible nodes, copy to clipboard, theme support

### AI Profile Utilities

Located in `utils/ai-profile.util.ts`:

| Function | Purpose |
|----------|---------|
| `getModelDisplayName()` | Format model name with domain |
| `shortenModelName()` | Remove provider prefix, title case |

---

## 5. State Management

### AiChatStore

RxJS BehaviorSubject-based centralized store.

**State Categories**:

| Category | Observable |
|----------|------------|
| Project/Session | `currentProjectId$`, `currentSessionId$`, `sessions$` |
| Messages | `messagesMap` (Map per session) |
| Streaming | `isStreaming$` |
| Tool Calls | `currentToolCalls$` |
| Panel | `panelState$` |
| Error | `error$` |

### Panel State (localStorage: `ai-chat-panel-state`)

```typescript
interface ChatPanelState {
  width: number;      // Default: 800
  height: number;      // Default: 900
  position: { top: number; right?: number; left?: number };
  isMaximized: boolean;
  isMinimized: boolean;
  isOpen: boolean;    // Always false on load
}
```

---

## 6. Session & Streaming

### Session ID Management

- Frontend generates UUID v4 for new sessions
- Same `session_id` reused across multi-round conversations
- Backend maintains context via `session_id`

### SSE Events

| Event | Description |
|-------|-------------|
| `content` | Text from AI assistant |
| `tool_call` | Tool invocation with parameters |
| `tool_start` | Execution started |
| `tool_end` | Execution finished |
| `done` | Stream completed |
| `error` | Error occurred |
| `heartbeat` | Keep-alive (skipped) |

### Multi-Round Pattern

```
Round 1: POST /chat/stream {session_id: "uuid-1"} → SSE response → Connection closes
Round 2: POST /chat/stream {session_id: "uuid-1"} → SSE response → Connection closes
```

Each request creates new SSE connection but uses same `session_id` for context.

---

## 7. Window Management

### WindowBoundaryService

Keeps AI Chat within viewport bounds.

**Constraints**:
- Min size: 500×400px
- Top offset: 64px (desktop), 56px (mobile)
- Auto-adjusts on window resize

### State Persistence

- Saved on drag end, resize end, maximize/minimize
- Debounced save (300ms)
- Reset on page load: `isOpen`, `isMaximized`, `isMinimized` → false

---

## 8. Theme Support

### Theme System

Uses Material Design 3 CSS variables (`--mat-sys-*`) for all colors.

### Theme Classes

AI Chat uses `theme-*` prefixed classes (e.g., `theme-deeppurple-amber`).

**Key Points**:
- Follows global theme via `themeService.getActualTheme()`
- Independent of map background theme
- Menu overlays handled via `(menuOpened)` event + `requestAnimationFrame`

### Theme Application Flow

1. Theme service notifies via `themeChanged`
2. Menu closes if open (forces re-render)
3. On reopen, `(menuOpened)` → `ensureMenuTheme()` applies correct classes

---

## 9. API Reference

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/{project_id}/chat/stream` | SSE stream |
| GET | `/projects/{project_id}/chat/sessions` | List sessions |
| GET | `/projects/{project_id}/chat/sessions/{session_id}/history` | Get history |
| PATCH | `/projects/{project_id}/chat/sessions/{session_id}` | Rename |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}` | Delete |
| PUT | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Pin |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Unpin |

### AI Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/access/users/{user_id}/llm-model-configs` | Get all configs |
| PUT | `/access/users/{user_id}/llm-model-configs/default/{config_id}` | Set default |
| PATCH | `/access/users/{user_id}/llm-model-configs/{config_id}` | Update config |

---

## Maintenance

### Adding New Components

1. Use standalone pattern
2. Use Material components when available
3. Follow size guidelines: inline (<100 lines), external (>300 lines)
4. Document in this file

### Code Review

- [ ] Standalone component
- [ ] No unused imports
- [ ] No duplicate functionality
- [ ] Uses signals/BehaviorSubject appropriately
- [ ] Zoneless compliant (no NgZone)

### Future Improvements

- [ ] Virtual scrolling for large message lists
- [ ] Message pagination/caching
- [ ] Lazy loading of historical messages

---

**Last Updated**: 2026-03-30

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
