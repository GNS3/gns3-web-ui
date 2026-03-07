# AI Chat Session Management & SSE - Technical Documentation

## Overview

This document explains how session management works in the GNS3 AI Chat feature, including session_id generation, SSE (Server-Sent Events) connection lifecycle, and multi-round conversation handling.

**Last Updated**: 2026-03-08
**Status**: Production Ready

---

## Table of Contents

1. [Session ID Management](#session-id-management)
2. [SSE Connection Lifecycle](#sse-connection-lifecycle)
3. [Multi-Round Conversations](#multi-round-conversations)
4. [Implementation Details](#implementation-details)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [FAQ](#faq)

---

## Session ID Management

### Frontend UUID Generation Strategy

**Key Decision**: The frontend generates the session_id (UUID v4) when creating a new conversation, not the backend.

#### Why Frontend Generates session_id?

1. **Immediate Availability**: The session_id is known immediately, without waiting for backend response
2. **Consistent State**: Can save messages to Store with the correct session_id right away
3. **Avoids Race Conditions**: No timing issues between UI updates and async backend responses
4. **Better UX**: UI can display messages immediately without waiting

#### Implementation

**File**: `src/app/components/project-map/ai-chat/ai-chat.component.ts`

```typescript
sendMessage(message: string): void {
  // Create user message
  const userMessage: ChatMessage = {
    id: this.generateMessageId(),
    role: 'user',
    content: message,
    created_at: new Date().toISOString()
  };

  // Add to current messages
  this.currentMessages = [...this.currentMessages, userMessage];

  // Generate or use existing session_id
  let sessionId = this.currentSessionId || this.aiChatService.getCurrentSessionId();

  if (!sessionId) {
    // Generate new session_id for new conversation
    sessionId = this.generateUUID();  // Frontend generates UUID
    this.log('Generated new session_id:', sessionId);

    // Set streaming state BEFORE updating session_id
    // This prevents the subscriber from loading session history
    this.isStreaming = true;
    this.aiChatStore.setStreamingState(true);

    // Update store to track this session
    this.aiChatStore.setCurrentSessionId(sessionId);
  } else {
    // For existing sessions, also set streaming state early
    this.isStreaming = true;
    this.aiChatStore.setStreamingState(true);
  }

  // Save user message to store with the session_id
  this.aiChatStore.addMessage(sessionId, userMessage);

  // Start streaming chat with the session_id
  this.startChatStream(message, sessionId);
}

/**
 * Generate UUID v4
 * @returns UUID string (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
 */
private generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### Backend session_id Handling

**File**: `chat.py` (Backend)

```python
@router.post("/v3/projects/{project_id}/chat/stream")
async def stream_chat(request: ChatRequest, project_id: str):
    # Use frontend-provided session_id if available, otherwise generate new
    session_id = request.session_id or str(uuid.uuid4())

    if not request.session_id:
        log.debug("New session created: %s", session_id)
    else:
        log.debug("Continuing session: %s", session_id)
        log.debug("Loading history for session: %s", session_id)

    # Load conversation history from database using session_id
    thread = weave.get_thread(session_id)
    history = thread.get_history()

    # Call LLM with history + new message
    async for chunk in stream_llm(messages=history + [new_message], session_id=session_id):
        yield f"data: {json.dumps(chunk)}\n\n"

    # Save messages to database
    thread.add_message(user_message)
    thread.add_message(assistant_response)
```

---

## SSE Connection Lifecycle

### Why SSE Requires New Connection Per Message

**SSE (Server-Sent Events)** is a **unidirectional** communication protocol:
- **Server → Client**: Data flow
- **Client → Server**: Not possible through SSE connection

### Single Round Trip Flow

```
1. Client sends HTTP POST request:
   POST /v3/projects/{project_id}/chat/stream
   Headers: { Content-Type: application/json }
   Body: {
     "message": "hello",
     "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     "stream": true
   }

2. Server responds with SSE stream:
   HTTP/1.1 200 OK
   Content-Type: text/event-stream

   data: {"type": "content", "content": "你"}
   data: {"type": "content", "content": "好"}
   data: {"type": "done", "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}

3. Connection closes ❌
   (HTTP response completed, connection must close)
```

### Multi-Round Conversation Flow

```
Round 1:
Client → POST /chat/stream {message: "hello", session_id: "uuid-1"}
Client ← SSE: "你好！"
[Connection closes]

Round 2:
Client → POST /chat/stream {message: "如何?", session_id: "uuid-1"}  // Same session_id
Client ← SSE: "我很好！"
[Connection closes]

Round 3:
Client → POST /chat/stream {message: "再见", session_id: "uuid-1"}  // Same session_id
Client ← SSE: "拜拜！"
[Connection closes]
```

**Key Point**: Each round creates a new SSE connection, but uses the **same session_id** to maintain context.

---

## Multi-Round Conversations

### How Context is Maintained

The backend maintains conversation context through **session_id**, not through a persistent SSE connection.

#### Backend Context Management

```
Database (LangGraph Thread):
┌─────────────────────────────────────────┐
│ Thread ID: a1b2c3d4-e5f6-7890-abcd-...  │
├─────────────────────────────────────────┤
│ Message 1: {role: "user", content: "hello"}     │
│ Message 2: {role: "assistant", content: "你好！"}│
│ Message 3: {role: "user", content: "如何?"}    │
│ Message 4: {role: "assistant", content: "我很好！"}│
│ Message 5: {role: "user", content: "再见"}    │
│ Message 6: {role: "assistant", content: "拜拜！"}│
└─────────────────────────────────────────┘
```

#### Flow Diagram

```
User sends "hello" (with session_id="uuid-1"):
  Frontend → Backend: POST /chat/stream {message: "hello", session_id: "uuid-1"}
  Backend: Loads empty history (new session)
  Backend → LLM: [User: "hello"]
  Backend ← LLM: "你好！"
  Backend: Saves messages to database
  Backend → Frontend: SSE stream
  [Connection closes]

User sends "如何?" (with session_id="uuid-1"):
  Frontend → Backend: POST /chat/stream {message: "如何?", session_id: "uuid-1"}
  Backend: Loads history from database
  Backend → LLM: [User: "hello", Assistant: "你好！", User: "如何?"]
  Backend ← LLM: "我很好！"
  Backend: Saves messages to database
  Backend → Frontend: SSE stream
  [Connection closes]
```

---

## Implementation Details

### Frontend Components

#### 1. Service Layer (`ai-chat.service.ts`)

**Responsibilities**:
- Manages SSE connections
- Saves session_id from responses
- Provides current session_id to components

```typescript
export class AiChatService {
  private currentSessionId: string | null = null;

  streamChat(controller, projectId, request): Observable<ChatEvent> {
    return new Observable(observer => {
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      .then(response => response.body.getReader())
      .then(reader => {
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();

            // Parse SSE events
            const event: ChatEvent = JSON.parse(data);

            // Update current session ID
            if (event.session_id) {
              this.currentSessionId = event.session_id;
            }

            observer.next(event);
          }
        };
        processStream();
      });
    });
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}
```

#### 2. Store Layer (`ai-chat.store.ts`)

**Responsibilities**:
- Centralized state management
- Session and message storage
- Streaming state coordination

```typescript
export class AiChatStore {
  private currentSessionId$ = new BehaviorSubject<string | null>(null);
  private messagesMap = new Map<string, ChatMessage[]>();

  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId$.next(sessionId);
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    const currentMessages = this.messagesMap.get(sessionId) || [];
    this.messagesMap.set(sessionId, [...currentMessages, message]);
  }
}
```

#### 3. Component Layer (`ai-chat.component.ts`)

**Responsibilities**:
- Generate session_id for new conversations
- Coordinate UI updates
- Handle streaming events
- Prevent race conditions

**Key Implementation Details**:

1. **Prevent History Loading During Streaming**:

```typescript
// Subscribe to current session
this.aiChatStore.getCurrentSessionId().pipe(
  takeUntil(this.destroy$)
).subscribe(sessionId => {
  this.currentSessionId = sessionId;
  // Only load session messages if not currently streaming
  // This prevents clearing the current conversation while streaming is active
  if (sessionId && !this.isStreaming) {
    this.loadSessionMessages(sessionId);
  }
  this.cdr.markForCheck();
});
```

2. **Set Streaming State Before session_id Update**:

```typescript
if (!sessionId) {
  sessionId = this.generateUUID();

  // Set streaming state BEFORE updating session_id
  // This prevents the subscriber from loading session history
  this.isStreaming = true;
  this.aiChatStore.setStreamingState(true);

  // Now update session_id (subscriber won't load history)
  this.aiChatStore.setCurrentSessionId(sessionId);
}
```

3. **Reset Assistant Message Before New Stream**:

```typescript
private startChatStream(message: string, sessionId?: string): void {
  // Reset current assistant message to avoid appending to previous message
  this.currentAssistantMessage = null;

  // Start streaming
  this.aiChatService.streamChat(...).subscribe({
    complete: () => {
      this.currentAssistantMessage = null;  // Clean up
    }
  });
}
```

---

## Common Issues and Solutions

### Issue 1: User Message Not Displayed

**Symptom**: After sending a message, the user message disappears or doesn't show.

**Root Cause**: `setCurrentSessionId` triggers subscriber to load history, which overwrites current messages.

**Solution**:
1. Set `isStreaming = true` **before** calling `setCurrentSessionId`
2. Check `!this.isStreaming` in subscriber before loading history

```typescript
// ✅ CORRECT
this.isStreaming = true;
this.aiChatStore.setStreamingState(true);
this.aiChatStore.setCurrentSessionId(sessionId);

// ❌ WRONG
this.aiChatStore.setCurrentSessionId(sessionId);
this.isStreaming = true;
```

### Issue 2: New Session Created Every Time

**Symptom**: Backend creates a new session for each message instead of continuing the conversation.

**Root Cause**: session_id is not being sent in subsequent requests.

**Solution**: Ensure session_id is included in the request:

```typescript
this.aiChatService.streamChat(controller, projectId, {
  message: message,
  session_id: sessionId,  // ✅ Must include this
  stream: true
});
```

### Issue 3: Messages Appending to Wrong Session

**Symptom**: New messages are being added to a previous conversation's message list.

**Root Cause**: `currentAssistantMessage` is not being reset between streams.

**Solution**: Reset at the start of each stream:

```typescript
private startChatStream(message: string, sessionId?: string): void {
  // Reset current assistant message to avoid appending to previous message
  this.currentAssistantMessage = null;

  // ... rest of implementation
}
```

### Issue 4: SSE Connection Closes Prematurely

**Symptom**: Stream ends before all content is received.

**Root Cause**: Backend closes connection early, or client disconnects.

**Debug Steps**:
1. Check backend logs for errors
2. Verify `event.type === 'done'` is received
3. Check network tab in browser DevTools
4. Verify `complete` callback is called

---

## FAQ

### Q1: Why not use WebSocket instead of SSE?

**A**: SSE is simpler and sufficient for this use case:
- ✅ Server → Client streaming is all we need
- ✅ Built-in HTTP support (no additional libraries)
- ✅ Automatic reconnection handling
- ✅ Simpler backend implementation

**WebSocket benefits** (if needed in future):
- ✅ Bidirectional communication
- ✅ Lower latency (no HTTP overhead)
- ✅ Single connection for multiple messages

**Trade-offs**:
- SSE: New connection per message, but simpler
- WebSocket: Single connection, but more complex

### Q2: Does closing SSE connection lose context?

**A**: **No!** Context is maintained by the backend through session_id:
- Backend stores conversation in database (LangGraph Thread)
- Each request includes session_id
- Backend loads history from database using session_id
- Connection lifecycle is independent from conversation state

### Q3: Why generate session_id on frontend instead of backend?

**A**: Several advantages:
1. **Immediate availability**: No waiting for backend response
2. **UI consistency**: Can save messages immediately
3. **No race conditions**: Control over timing
4. **Better UX**: Messages appear instantly

**Backend is still authoritative**: If backend receives a request without session_id, it generates one.

### Q4: How does the backend handle concurrent messages?

**A**: Depends on implementation:
- **Current**: Sequential (one message at a time per session)
- **Future**: Could support concurrent messages with proper locking

**Best practice**: Disable input while streaming to prevent concurrent requests.

### Q5: What happens if session_id is lost or corrupted?

**A**: Backend creates a new session:
```python
session_id = request.session_id or str(uuid.uuid4())
```

Frontend mitigates this by:
- Saving session_id in Store (in-memory)
- Service layer also maintains session_id
- Generating new session_id if both are null

---

## Testing

### Manual Testing Checklist

- [ ] First message creates new session
- [ ] Frontend generates UUID v4 format
- [ ] session_id is sent in request body
- [ ] User message displays immediately
- [ ] SSE stream works correctly
- [ ] AI response displays in real-time
- [ ] Second message uses same session_id
- [ ] Context is maintained across messages
- [ ] Session list updates after message completes
- [ ] No race conditions or flickering
- [ ] Multiple sessions work independently

### Debug Logging

Add these logs to trace session_id flow:

```typescript
// Frontend
this.log('Store session_id:', this.currentSessionId);
this.log('Service session_id:', serviceSessionId);
this.log('Generated new session_id:', sessionId);
this.log('Sending message with session_id:', sessionId);
```

```python
# Backend
log.debug("Received session_id: %s", request.session_id)
log.debug("Loading history for session: %s", session_id)
log.debug("History length: %d", len(history))
log.debug("Saving messages to session: %s", session_id)
```

---

## References

- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [RFC 4122 - UUID](https://www.rfc-editor.org/rfc/rfc4122)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [LangGraph Threads](https://langchain-ai.github.io/langgraph/concepts/persistence/)

---

## Metadata

- **Created**: 2026-03-08
- **Author**: Claude Code
- **Type**: Technical Documentation
- **Status**: Production Ready
- **Version**: 1.0.0

**Related Documents**:
- [AI Chat Implementation Plan](../todo/ai-chat-implementation-plan.md)
- [AI Chat Delete Fix](./ai-chat-delete-fix.md)

**Keywords**: SSE, WebSocket, session_id, UUID, multi-round conversation, streaming, context management
