<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# AI Chat - Complete Guide

> Complete documentation for GNS3 Web UI AI Chat functionality

**Version**: v1.5
**Last Updated**: 2026-04-18
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
│   ├── tool-details-dialog.component.*  # JSON details dialog
│   └── code-block-dialog.component.*    # Full-size code block dialog
├── services/
│   ├── ai-chat.service.ts               # API interaction & SSE streaming
│   └── ai-profiles.service.ts           # Profile management
├── stores/
│   └── ai-chat.store.ts                 # RxJS state (BehaviorSubject)
├── utils/
│   └── ai-profile.util.ts               # Model name formatting
└── models/
    ├── ai-chat.interface.ts             # Chat data interfaces
    └── ai-profile.ts                    # LLM config & profile interfaces
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
    │       ├─→ tool-details-dialog.component (JSON details)
    │       └─→ code-block-dialog.component (Code block viewer)
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
      ToolDetailsDialog (JSON Details)
              ↓
      CodeBlockDialog (Code Block Viewer)
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Angular 21 | Zoneless framework |
| RxJS | Reactive state (BehaviorSubject) |
| Material 21 | UI components |
| ngx-markdown | Markdown rendering |
| Custom JSON Viewer | JSON display (Material-based) |
| SSE (Fetch API) | Server-sent events streaming |

---

## 4. Component Overview

### AiChatComponent

Main container managing panel state, SSE events, and child coordination.

**Window States**: Normal (800×900px), Maximized, Minimized (hidden)

### ChatMessageListComponent

Renders messages with Markdown, handles auto-scroll, triggers tool dialogs, displays tool calls inline.

**Features**:
- Message rendering with Markdown support
- Auto-scroll to latest message
- Inline tool call display (clickable)
- Code block collapse for long blocks (>50 lines)
- Opens ToolDetailsDialog for JSON inspection
- Opens CodeBlockDialog for full-size code viewing

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

### CodeBlockDialogComponent

Modal dialog for displaying long code blocks with better readability.

**Features**: Language display, Material Design styling, scrollable content

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
| Session UI | `sessionUIStates$` (editing/expanded per session) |
| Error | `error$` |

### Panel State (localStorage: `ai-chat-panel-state`)

```typescript
interface ChatPanelState {
  isOpen: boolean;        // Always false on load
  width: number;          // Default: 800
  height: number;         // Default: 900
  isMaximized?: boolean;  // Reset to false on load
  isMinimized?: boolean;  // Reset to false on load
  position?: {
    top?: number;
    right?: number;
    left?: number;
  };
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
Round 1: POST /v3/projects/{pid}/chat/stream {session_id: "uuid-1"} → SSE response → Connection closes
Round 2: POST /v3/projects/{pid}/chat/stream {session_id: "uuid-1"} → SSE response → Connection closes
```

Each request creates new SSE connection but uses same `session_id` for context.

---

## 7. Window Management

### WindowBoundaryService

Keeps AI Chat within viewport bounds.

**Constraints**:
- Min size: 500×400px
- Top offset: configurable via `topOffset` parameter (set by caller)
- Auto-adjusts on window resize

### State Persistence

- Saved on drag end, resize end, maximize/minimize
- Immediate save to `localStorage` (no debounce)
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
| POST | `/v3/projects/{project_id}/chat/stream` | SSE stream |
| GET | `/projects/{project_id}/chat/sessions` | List sessions |
| GET | `/projects/{project_id}/chat/sessions/{session_id}/history` | Get history |
| PATCH | `/projects/{project_id}/chat/sessions/{session_id}` | Rename |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}` | Delete |
| PUT | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Pin |
| DELETE | `/projects/{project_id}/chat/sessions/{session_id}/pin` | Unpin |
| POST | `/v3/projects/{project_id}/chat/sessions/{session_id}/abort` | Abort streaming |

### AI Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/access/users/{user_id}/llm-model-configs` | Get all configs |
| PUT | `/access/users/{user_id}/llm-model-configs/default/{config_id}` | Set default |
| PATCH | `/access/users/{user_id}/llm-model-configs/{config_id}` | Update config |

---

## Maintenance

### Adding New Components

1. **Use standalone pattern**: All components must be standalone with explicit imports
2. **Use Material components**: Leverage Angular Material 21 components when available
3. **Follow file organization**: Each component in its own directory with component file, template, styles, and spec
4. **Apply OnPush change detection**: All components must use `ChangeDetectionStrategy.OnPush`
5. **Use inject() for DI**: Prefer `inject()` over constructor injection for consistency
6. **Write tests**: All components require corresponding `.spec.ts` files
7. **Document changes**: Update this guide when adding new components or changing architecture

### Component Size Guidelines

Based on actual AI Chat component sizes:

| Component Type | Typical Lines | Example |
|----------------|---------------|---------|
| Simple dialogs | 50-200 lines | `code-block-dialog.component.ts` (57 lines) |
| Medium components | 200-400 lines | `chat-session-list.component.ts` (279 lines), `chat-message-list.component.ts` (321 lines), `chat-input-area.component.ts` (303 lines) |
| Complex components | 400+ lines | `ai-chat.component.ts` (1453 lines) |

**Note**: All components should be in separate files regardless of size for maintainability.

### Code Review Checklist

Use this checklist when reviewing AI Chat components:

- [ ] **Standalone component** with explicit imports (standalone is default in Angular 21)
- [ ] **No unused imports** (check imports array)
- [ ] **No duplicate functionality** (verify against existing components)
- [ ] **State management**: Uses signals (inputs) or BehaviorSubject (store) appropriately
- [ ] **Zoneless compliant**: No `NgZone`, `ApplicationRef.tick()`, or `[(ngModel)]`
- [ ] **Change detection**: `ChangeDetectionStrategy.OnPush` applied
- [ ] **Manual change detection**: Uses `markForCheck()` after async operations
- [ ] **Styling**: Uses Material theme variables (`--mat-sys-*`), no hardcoded colors
- [ ] **No style penetration**: No `::ng-deep`, `:deep()`, or `ViewEncapsulation.None`
- [ ] **Tests included**: Component has corresponding `.spec.ts` file
- [ ] **Documentation**: Complex logic has JSDoc comments

### Architecture Principles

1. **Separation of Concerns**
   - Components handle UI and user interactions
   - Services handle API calls and business logic
   - Store (AiChatStore) manages shared state
   - Utils contain pure functions

2. **Data Flow**
   - Unidirectional data flow: Store → Component → View
   - Events flow up: View → Component → Store/Service
   - Avoid two-way binding except for `model()` signals

3. **Error Handling**
   - Services emit errors via RxJS `error`
   - Components display user-friendly messages via MatSnackBar
   - Store maintains error state for recovery

### Future Improvements

Known technical debt and optimization opportunities:

- [ ] **Virtual scrolling** for large message lists (>100 messages)
- [ ] **Message pagination** to limit initial load (currently loads all)
- [ ] **Lazy loading** for historical messages when scrolling up
- [ ] **Message caching** to reduce API calls when switching sessions
- [ ] **Optimize markdown rendering** for large code blocks
- [ ] **Add message search** functionality
- [ ] **Implement message editing** for user messages
- [ ] **Add message reactions** (thumbs up/down for AI responses)
- [ ] **Streaming cancellation** improvement (better abort handling)
- [ ] **Offline mode support** for drafting messages without connection

---

**Last Updated**: 2026-04-18

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
