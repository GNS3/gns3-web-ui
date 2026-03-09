# Project Map Component - Code Review Documentation

---

**Document Generated**: 2026-03-07
**Review Tool**: Claude Code (Sonnet 4.5)
**Review Scope**: src/app/components/project-map/ (Project Map Component)

---

## Overview

Project map component handles network topology visualization, node management, link management, and AI chat integration.

---

## Module Functions


### Core Components

#### **ProjectMapComponent**
- Project topology main container
- Node, link, drawing management
- Layer, grid, toolbar control
- WebSocket communication management
- Console and log integration

#### **AiChatComponent** (ai-chat/)
- AI chat main interface
- Draggable, resizable
- Session management
- Tool call display

#### **ChatMessageListComponent** (ai-chat/)
- Message list rendering
- Markdown support
- Code highlighting
- Streaming message handling

#### **ChatInputAreaComponent** (ai-chat/)
- User input area
- File upload support
- Message sending

---

## Issues Found

### Critical Security Issues

#### 1. **XSS Vulnerability - Markdown Not Sanitized** (Critical)
**File**: `ai-chat/chat-message-list/chat-message-list.component.ts:240-241`

**Description**:
```typescript
const html = marked(content) as string;
return this.sanitizer.bypassSecurityTrustHtml(html);
```

**Risk**: Malicious markdown may contain script injection

**Fix Recommendation**:
```typescript
import DOMPurify from 'dompurify';

private formatMessage(content: string): SafeHtml | string {
  if (!content) {
    return '';
  }

  try {
    // Configure marked
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    // Sanitize with DOMPurify
    const dirtyHtml = marked(content);
    const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
                     'strong', 'em', 'del', 'a', 'table'],
      ALLOWED_ATTR: ['href', 'title', 'class', 'data-language'],
      ALLOW_DATA_ATTR: false
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  } catch (e) {
    console.error('Markdown rendering error:', e);
    return this.escapeHtml(content);
  }
}

private escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

#### 2. **JWT Token Stored in Plain Text**
**File**: `ai-chat.service.ts:365-367`

**Description**:
```typescript
if (controller.authToken) {
  return headers.set('Authorization', `Bearer ${controller.authToken}`);
}
```

**Fix Recommendation**:
```typescript
// Consider using more secure storage
// 1. Use sessionStorage instead of memory
// 2. Implement token auto-refresh
// 3. Set reasonable expiration time
```

---

### Performance Issues

#### 3. **Frequent DOM Operations**
**File**: `chat-message-list.component.ts:326-343`

**Description**:
```typescript
formatted = formatted
  .replace(/^([A-Z][A-Za-z0-9]*)#(\S*)/gm, '<span class="cisco-prompt">$1#$2</span>')
  .replace(/\b(GigabitEthernet|Serial|FastEthernet|Ethernet|Loopback|Port-channel|Tunnel|Vlan)\d*\/\d*(\.\d+)?(\s|$)/g, '<span class="cisco-interface">$&</span>')
  // Multiple regex replace operations
```

**Fix Recommendation**:
```typescript
// Use pre-compiled regex
private static CISCO_PROMPT_REGEX = /^([A-Z][A-Za-z0-9]*)#(\S*)/gm;
private static CISCO_INTERFACE_REGEX = /\b(GigabitEthernet|Serial|FastEthernet|Ethernet|Loopback|Port-channel|Tunnel|Vlan)\d*\/\d*(\.\d+)?(\s|$)/g;

private formatMessage(content: string): SafeHtml | string {
  let formatted = content;

  // Use cached regex
  formatted = formatted.replace(ChatMessageListComponent.CISCO_PROMPT_REGEX, '<span class="cisco-prompt">$1#$2</span>');
  formatted = formatted.replace(ChatMessageListComponent.CISCO_INTERFACE_REGEX, '<span class="cisco-interface">$&</span>');

  // ... other formatting
}
```

#### 4. **Repeated Node Scaling Calculation**
**File**: `project-map.component.ts:323-331`

**Description**:
```typescript
applyScalingOfNodeSymbols() {
  this.nodesDataSource.getItems().forEach((node) => {
    if (node.height > this.symbolService.getMaximumSymbolSize()) {
      let newDimensions = this.symbolService.scaleDimensionsForNode(node);
      node.width = newDimensions.width;
      node.height = newDimensions.height;
    }
  });
}
```

**Fix Recommendation**:
```typescript
// Cache scaled nodes
private scaledNodesCache = new Set<string>();

applyScalingOfNodeSymbols() {
  this.nodesDataSource.getItems().forEach((node) => {
    if (this.scaledNodesCache.has(node.node_id)) {
      return;  // Already processed
    }

    if (node.height > this.symbolService.getMaximumSymbolSize()) {
      const newDimensions = this.symbolService.scaleDimensionsForNode(node);
      node.width = newDimensions.width;
      node.height = newDimensions.height;
      this.scaledNodesCache.add(node.node_id);
    }
  });
}
```

---

### Memory Leak Issues

#### 5. **Timer Not Cleaned Up**
**File**: `ai-chat/ai-chat.component.ts:58-59`

**Description**:
```typescript
private saveStateTimer: any = null;
private dragRafId: number | null = null;
```

**Fix Recommendation**:
```typescript
private cleanup(): void {
  // Cleanup timer
  if (this.saveStateTimer) {
    clearTimeout(this.saveStateTimer);
    this.saveStateTimer = null;
  }

  // Cleanup RAF
  if (this.dragRafId !== null) {
    cancelAnimationFrame(this.dragRafId);
    this.dragRafId = null;
  }

  // Reset state
  this.aiChatStore.resetSessionState();
  this.currentToolCalls.clear();
  this.currentAssistantMessage = null;
}

ngOnDestroy() {
  this.cleanup();
}
```

#### 6. **WebSocket Connection Cleanup Incomplete**
**File**: `project-map.component.ts:1124-1129`

**Description**:
```typescript
if (this.projectws) {
  if (this.projectws.OPEN) this.projectws.close();
}
```

**Fix Recommendation**:
```typescript
public ngOnDestroy() {
  // Robust WebSocket cleanup
  this.closeWebSocketSafely(this.projectws);
  this.closeWebSocketSafely(this.ws);

  // Cleanup other resources
  if (this.projectMapSubscription) {
    this.projectMapSubscription.unsubscribe();
  }
}

private closeWebSocketSafely(ws: WebSocket | null): void {
  if (!ws) return;

  try {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, 'Component destroyed');
    }
  } catch (error) {
    console.error('Error closing WebSocket:', error);
  }
}
```

#### 7. **Dynamic Component Instances May Leak**
**File**: `project-map.component.ts:241-254`

**Description**:
```typescript
const { TopologySummaryComponent } = await import('../topology-summary/topology-summary.component');
this.instance = this.viewContainerRef.createComponent(TopologySummaryComponent);
```

**Fix Recommendation**:
```typescript
private dynamicComponentRefs: ComponentRef<any>[] = [];

async createTopologySummary() {
  const { TopologySummaryComponent } = await import('../topology-summary/topology-summary.component');
  const ref = this.viewContainerRef.createComponent(TopologySummaryComponent);
  this.dynamicComponentRefs.push(ref);
  return ref;
}

ngOnDestroy() {
  // Destroy all dynamically created components
  this.dynamicComponentRefs.forEach(ref => {
    try {
      ref.destroy();
    } catch (error) {
      console.error('Error destroying component:', error);
    }
  });
  this.dynamicComponentRefs = [];
}
```

---

## Recommendations

### Priority 1 - Immediate Fixes

#### 1. Fix XSS Vulnerability
```bash
npm install dompurify @types/dompurify
```

```typescript
// chat-message-list.component.ts
import DOMPurify from 'dompurify';

private formatMessage(content: string): SafeHtml | string {
  if (!content) return '';

  try {
    const dirtyHtml = marked(content);
    const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
                     'strong', 'em', 'del', 'a'],
      ALLOWED_ATTR: ['href', 'title', 'class']
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  } catch (e) {
    return this.escapeHtml(content);
  }
}
```

#### 2. Fix Memory Leaks
```typescript
// ai-chat.component.ts
export class AiChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private saveStateTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
      this.saveStateTimer = null;
    }
  }

  private debouncedSavePanelState() {
    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
    }

    this.saveStateTimer = setTimeout(() => {
      this.savePanelState();
    }, 300);
  }
}
```

### Priority 2 - Short-term Improvements

#### 1. Performance Optimization
```typescript
// Use virtual scrolling
<cdk-virtual-scroll-viewport itemSize="80" maxBufferPx="500" minBufferPx="200">
  <app-chat-message-list
    *cdkVirtualFor="let message of messages; trackBy: trackByMessageId"
    [message]="message">
  </app-chat-message-list>
</cdk-virtual-scroll-viewport>

trackByMessageId(index: number, message: ChatMessage): string {
  return message.id;
}
```

#### 2. Improve Error Handling
```typescript
// ai-chat.service.ts
streamChatMessages(request: ChatRequest): Observable<ChatEvent> {
  return this.http.post(`${this.apiUrl}/chat`, request, {
    headers: this.getHeaders(),
    observe: 'events',
    responseType: 'text',
    reportProgress: true
  }).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Chat stream error:', error);

      // Return user-friendly error
      const userError: ChatError = {
        type: 'error',
        message: this.getUserFriendlyErrorMessage(error),
        code: error.status
      };

      return of(userError as ChatEvent);
    })
  );
}

private getUserFriendlyErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Authentication failed. Please log in again.';
  }
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment.';
  }
  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }
  return 'An error occurred. Please try again.';
}
```

#### 3. Add Loading State
```typescript
// ai-chat.component.ts
export class AiChatComponent {
  loading = false;
  sendingMessage = false;

  sendMessage(content: string) {
    if (this.sendingMessage || !content.trim()) {
      return;
    }

    this.sendingMessage = true;

    this.aiChatService.sendMessage(this.currentSessionId, content).pipe(
      finalize(() => {
        this.sendingMessage = false;
      })
    ).subscribe();
  }
}
```

### Priority 3 - Long-term Improvements

#### 1. Implement Offline Support
```typescript
// chat-queue.service.ts
@Injectable({ providedIn: 'root' })
export class ChatQueueService {
  private queue: ChatMessage[] = [];
  private isOnline = true;

  constructor(private connectionService: ConnectionService) {
    this.connectionService.isOnline$.subscribe(online => {
      this.isOnline = online;
      if (online) {
        this.flushQueue();
      }
    });
  }

  enqueue(message: ChatMessage) {
    if (this.isOnline) {
      return this.sendNow(message);
    } else {
      this.queue.push(message);
      this.saveToLocalStorage();
      return of(null);
    }
  }

  private flushQueue() {
    const messages = [...this.queue];
    this.queue = [];

    forkJoin(messages.map(m => this.sendNow(m))).subscribe();
  }
}
```

#### 2. Add Message Search
```typescript
// chat-search.service.ts
@Injectable({ providedIn: 'root' })
export class ChatSearchService {
  searchMessages(query: string, messages: ChatMessage[]): ChatMessage[] {
    if (!query.trim()) {
      return messages;
    }

    const lowerQuery = query.toLowerCase();

    return messages.filter(message => {
      // Search message content
      if (message.content?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search tool calls
      if (message.tool_calls) {
        return message.tool_calls.some(call =>
          call.function.name.toLowerCase().includes(lowerQuery)
        );
      }

      return false;
    });
  }

  highlightMatches(message: ChatMessage, query: string): string {
    if (!query || !message.content) {
      return message.content;
    }

    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return message.content.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
```

---

## AI Chat Specific Issues

### Security Issues

#### 1. **Tool Calls Not Validated**
**Risk**: Malicious server may return dangerous tool calls

**Fix Recommendation**:
```typescript
private validateToolCall(call: ToolCall): boolean {
  // Whitelist allowed tools
  const allowedTools = [
    'get_device_config',
    'analyze_network',
    'check_connectivity'
  ];

  if (!allowedTools.includes(call.function.name)) {
    console.warn('Unknown tool:', call.function.name);
    return false;
  }

  // Validate arguments
  try {
    JSON.parse(call.function.arguments);
    return true;
  } catch {
    console.warn('Invalid tool arguments');
    return false;
  }
}
```

#### 2. **Streaming Response Size Limit**
**Risk**: Unlimited streaming data may cause memory overflow

**Fix Recommendation**:
```typescript
private MAX_STREAM_SIZE = 10 * 1024 * 1024; // 10MB
private currentStreamSize = 0;

streamChatMessages(request: ChatRequest): Observable<ChatEvent> {
  this.currentStreamSize = 0;

  return this.http.post(`${this.apiUrl}/chat`, request, {
    responseType: 'text',
    observe: 'events'
  }).pipe(
    map(event => {
      if (event.type === HttpEventType.DownloadProgress) {
        this.currentStreamSize += event.loaded;

        if (this.currentStreamSize > this.MAX_STREAM_SIZE) {
          throw new Error('Response too large');
        }
      }
      return event;
    })
  );
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe('ChatMessageListComponent', () => {
  it('should sanitize malicious HTML', () => {
    const malicious = '<script>alert("xss")</script>Hello';
    component.message = { content: malicious };
    const rendered = component.formatMessage(malicious);
    expect(rendered).not.toContain('<script>');
  });

  it('should escape HTML in code blocks', () => {
    const code = '```html\n<script>alert("xss")</script>\n```';
    component.message = { content: code };
    const rendered = component.formatMessage(code);
    expect(rendered).toContain('&lt;script&gt;');
  });
});
```

### Integration Tests
```typescript
it('should handle streaming responses', async () => {
  const response$ = service.streamChatMessages({ content: 'Hello' });

  const events = [];
  response$.subscribe(event => events.push(event));

  await waitFor(() => expect(events.length).toBeGreaterThan(0));
  expect(events[0].type).toBe('message_start');
});
```
