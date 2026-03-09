# AI Chat Implementation & Architecture

> Complete implementation guide and component architecture for GNS3 AI Chat feature

---

## Document Information

**Created**: 2026-03-07
**Updated**: 2026-03-10
**Status**: ✅ Implemented

---

## 1. Overview

The AI Chat feature is integrated into the left toolbar of the project topology map, allowing users to interact with the GNS3 Copilot Agent to get network topology assistance and device management functionality.

### Core Features
- SSE streaming conversation
- Session management (create, rename, delete, pin)
- Markdown message rendering
- Tool call/result display
- JSON result viewer
- Dark/light theme support

---

## 2. Architecture

### Backend API Integration
**Base Path**: `/v3/projects/{project_id}/chat/`

**Core Endpoints**:
- `POST /stream` - SSE streaming conversation
- `GET /sessions` - Get session list
- `GET /sessions/{session_id}/history` - Get session history
- `PATCH /sessions/{session_id}` - Rename session
- `DELETE /sessions/{session_id}` - Delete session
- `PUT/DELETE /sessions/{session_id}/pin` - Pin/Unpin session

### Component Hierarchy
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

## 3. File Structure

### Current Files (9 total)

| File | Type | Size | Template | Styles | Used By |
|------|------|------|----------|--------|---------|
| `ai-chat.component.ts` | Component | ~34 KB | External HTML | External SCSS | `project-map.component` |
| `ai-chat.component.html` | Template | ~4 KB | - | - | `ai-chat.component.ts` |
| `ai-chat.component.scss` | Styles | ~10 KB | - | - | `ai-chat.component.ts` |
| `chat-input-area.component.ts` | Component | ~9 KB | Inline | Inline | `ai-chat.component` |
| `chat-message-list.component.ts` | Component | ~11 KB | Inline | External SCSS | `ai-chat.component` |
| `chat-message-list.component.scss` | Styles | ~14 KB | - | - | `chat-message-list.component.ts` |
| `chat-session-list.component.ts` | Component | ~18 KB | Inline | Inline | `ai-chat.component` |
| `tool-call-display.component.ts` | Component | ~4 KB | Inline | Inline | `chat-message-list.component.ts` |
| `tool-details-dialog.component.ts` | Component | ~8 KB | Inline | Inline | `chat-message-list.component.ts` |

**Total**: ~112 KB of TypeScript/SCSS/HTML code

---

## 4. Service Layer

### AiChatService
**Location**: `src/app/services/ai-chat.service.ts`

**Main Responsibilities**:
- Handle all AI Chat API calls
- Manage SSE connections and streaming responses
- Maintain session state and message history
- Handle streaming accumulation of tool calls

**Core Methods**:
```typescript
- streamChat(projectId, message, sessionId?)  // Streaming conversation
- getSessions(projectId)                       // Get session list
- getSessionHistory(projectId, sessionId)     // Get session history
- renameSession(projectId, sessionId, title)  // Rename session
- deleteSession(projectId, sessionId)         // Delete session
- pinSession(projectId, sessionId)           // Pin session
- unpinSession(projectId, sessionId)         // Unpin session
```

### WindowBoundaryService
**Location**: `src/app/services/window-boundary.service.ts`

**Main Responsibilities**:
- Provide window boundary constraint for draggable/resizable windows
- Ensure windows stay within viewport
- Smart positioning to avoid toolbar overlap

---

## 5. Component Details

### 1. ai-chat.component

**Purpose**: Main AI Chat panel container

**Responsibilities**:
- SSE event handling (content, tool_call, tool_end events)
- Message state management
- Session management
- Chat input/output coordination
- Tool execution coordination

**Pattern**: Standalone, external template/styles

---

### 2. chat-session-list.component

**Purpose**: Display and manage chat sessions

**Responsibilities**:
- Session list display
- Session selection
- New session creation
- Session deletion (with confirmation dialog)
- Session title display

**Pattern**: Declared in app.module, inline template/styles

---

### 3. chat-message-list.component

**Purpose**: Display chat message history

**Responsibilities**:
- Message rendering with Markdown
- Tool call/result inline display
- Auto-scroll behavior
- Empty state display
- Tool details dialog triggers

**Dependencies**:
- `ngx-markdown` for Markdown rendering
- `ToolCallDisplayComponent` (standalone)
- `ToolDetailsDialogComponent` (standalone)

**Pattern**: Declared in app.module, inline template, external SCSS

---

### 4. chat-input-area.component

**Purpose**: User input for chat messages

**Responsibilities**:
- Message input field
- Send button
- Clear history button
- Input state management

**Pattern**: Standalone, inline template/styles

---

### 5. tool-call-display.component

**Purpose**: Inline display of tool calls in messages

**Responsibilities**:
- Display tool call summary
- Click to open details dialog
- Visual feedback for tool status

**Pattern**: Standalone, inline template/styles

---

### 6. tool-details-dialog.component

**Purpose**: Modal dialog for detailed tool call/result information

**Responsibilities**:
- Display detailed tool arguments
- Display tool execution results
- JSON formatting via `ngx-json-viewer`
- Modal dialog management

**Dependencies**:
- `ngx-json-viewer` for JSON display

**Features**:
- Syntax highlighted JSON
- Collapsible nodes
- Copy to clipboard
- Dark/light theme support
- Glassmorphism effect (backdrop-filter blur)
- Resizable dialog (800px default, min 600px, max 95vw)

**Glassmorphism Effect Configuration**:
Located in `tool-details-dialog.component.ts` styles (line 209-231):
```scss
/* Dialog container styling with glassmorphism effect */
::ng-deep .mat-mdc-dialog-container {
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 151, 167, 0.15) !important;
}

/* Make dialog surface transparent for glassmorphism */
::ng-deep .mat-mdc-dialog-surface {
  background-color: transparent !important;
}

/* Dark theme: 75% opacity */
::ng-deep .dark-theme .mat-mdc-dialog-container {
  background-color: rgba(30, 41, 55, 0.75) !important;
}

/* Light theme: 85% opacity */
::ng-deep .light-theme .mat-mdc-dialog-container {
  background-color: rgba(255, 255, 255, 0.85) !important;
}
```

**Note**: Glassmorphism effect requires content behind the dialog to be visible.

---

## 6. External Dependencies

| Module | Version | Purpose | Used By |
|--------|---------|---------|---------|
| `ngx-markdown` | 14.0.1 | Markdown rendering | chat-message-list |
| `ngx-json-viewer` | 3.2.1 | JSON display | tool-details-dialog |
| `@angular/material` | 14.2.7 | UI components | All |
| `@angular/cdk` | 14.2.7 | CDK features | All |

---

## 7. Data Flow

### Message Flow
```
User Input (chat-input-area)
    ↓
ai-chat.component (SSE handling)
    ↓
chat-message-list.component (display)
    ↓
tool-call-display / tool-details-dialog
```

### Tool Execution Flow
```
AI generates tool_call
    ↓
chat-message-list displays inline summary
    ↓
User clicks → tool-details-dialog opens
    ↓
ngx-json-viewer displays formatted JSON
```

---

## 8. Standalone vs Declared Components

### Standalone Components (4)
- `ai-chat.component.ts`
- `chat-input-area.component.ts`
- `tool-call-display.component.ts`
- `tool-details-dialog.component.ts`

**Advantages**:
- Self-contained with imports
- Easier to reuse
- Better tree-shaking

### Declared in app.module (2)
- `chat-message-list.component.ts`
- `chat-session-list.component.ts`

**Note**: Should be migrated to standalone in future

---

## 9. Code Organization Patterns

| Component | Template | Styles | Reason |
|-----------|----------|--------|--------|
| ai-chat | External | External | Large component (~34000 lines combined) |
| chat-message-list | Inline | External | Medium logic, shared styles |
| Others | Inline | Inline | Small utilities (<100 lines) |

**Guideline**:
- >200 lines → Consider external files
- <100 lines → Use inline
- Shared styles → External SCSS

---

## 10. Performance Characteristics

### Bundle Size Contribution
- Main component files: ~112 KB source
- External dependencies: ~40 KB (ngx-json-viewer)

### Runtime Performance
- Change detection: OnPush where applicable
- Lazy loading: Tool details dialogs
- Stream processing: SSE events handled incrementally

---

## 11. Window Management

### Default Window Size
**Current Default**: 800px × 900px

To change the default window size, modify **6 locations** across **2 files**:

#### File 1: `src/app/components/project-map/ai-chat/ai-chat.component.ts` (4 locations)

1. **Line 45** - Resize width state
   ```typescript
   public resizedWidth: number = 800;
   ```

2. **Line 46** - Resize height state
   ```typescript
   public resizedHeight: number = 900;
   ```

3. **Line 184** - Default style width
   ```typescript
   this.style = {
     // ...
     width: '800px',
     height: '900px',
   };
   ```

#### File 2: `src/app/stores/ai-chat.store.ts` (2 locations)

4. **Line 38** - Panel state width
   ```typescript
   private panelState$ = new BehaviorSubject<ChatPanelState>({
     isOpen: false,
     width: 800,
     height: 900,
   ```
   ```

**Important**: After changing default size, users need to clear localStorage:
```javascript
localStorage.removeItem('ai-chat-panel-state');
```

### WindowBoundaryService Integration
- Resizable panel with min/max constraints
- Drag to reposition
- Boundary constraints to stay within viewport
- Toolbar offset handling (64px desktop, 56px mobile)

### Configuration
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

---

## 12. Dark/Light Theme Support

The AI Chat components use CSS variables for theme adaptation:

- `.dark-theme` / `.light-theme` classes applied by app
- `prose dark:prose-invert` for Markdown content
- Custom colors for JSON viewer in dark mode
- Dialog styling adapts to theme

---

## 13. Cleanup Record

The following files were removed as redundant:

| File | Reason | Replacement |
|------|--------|-------------|
| `device-command-card.*` | Unused custom implementation | `ngx-json-viewer` |
| `cisco-syntax-highlight.service.ts` | Unused custom implementation | `ngx-json-viewer` |
| `draggable-tool-dialog.component.ts` | No references | N/A |
| `json-viewer.component.ts` | Replaced by framework | `ngx-json-viewer` |

**Total cleaned**: ~685 lines of custom code removed

---

## 14. Maintenance Guidelines

### Adding New Features

1. **Consider Standalone Pattern**: New components should be standalone
2. **Use Framework Modules**: Check for existing solutions before custom implementation
3. **Follow Size Guidelines**:
   - Small (<100 lines): Inline template/styles
   - Medium (100-300 lines): Consider external
   - Large (>300 lines): External files
4. **Document Dependencies**: Update this file when adding new components

### Code Review Checklist

- [ ] Component is standalone or properly declared
- [ ] No unused imports
- [ ] No duplicate functionality
- [ ] Follows existing patterns
- [ ] Documented in this file

---

## 15. Future Improvements

### Migration Tasks
- [ ] Migrate `chat-message-list` to standalone
- [ ] Migrate `chat-session-list` to standalone

### Potential Optimizations
- [ ] Virtual scrolling for large message lists (>100 messages)
- [ ] Message pagination/caching
- [ ] Lazy loading of historical messages

---

## 16. Related Documentation

- [AI Chat UI Optimization Plan](./ai-chat-ui-optimization-plan.md)
- [AI Chat JSON Viewer Implementation](./ai-chat-json-viewer-implementation.md)
- [Confirmation Dialog Component](./confirmation-dialog-component.md)
- [Window Boundary Service](../services/window-boundary-service.md)

---

**Last Updated**: 2026-03-10
**Status**: ✅ All files verified in use
**Maintainer**: Development Team
