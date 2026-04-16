<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# AI Chat Optimization Todos

## Current Issues

### Issue: Unnecessary Reload and Scroll on Session Switch

**Problem Description:**
When switching between chat sessions:
1. Messages are reloaded from the API every time, even if already cached
2. The message list automatically scrolls from top to bottom on every load
3. This causes poor UX when returning to a previously viewed conversation

**Current Behavior:**
```
Open Session A → Load messages → Scroll to bottom
Switch to Session B → Load messages → Scroll to bottom
Return to Session A → Reload messages → Scroll to bottom again ⚠️
```

**Root Cause:**
- `ai-chat.component.ts:197-208` - Session switch always calls `loadSessionMessages()`
- `loadSessionMessages()` always fetches from API, ignoring cache in `messagesMap`
- `chat-message-list.component.ts:136-149` - Message changes always trigger scroll to bottom

---

## Proposed Solutions

### Priority 1: Cache-First Loading (Recommended)

**Implementation:**
1. Check if messages exist in `AiChatStore.messagesMap` before calling API
2. Only fetch from API if cache miss
3. Add `isFirstLoad` flag to distinguish initial load vs. switch

**Files to Modify:**
- `src/app/components/project-map/ai-chat/ai-chat.component.ts`
  - Modify `loadSessionMessages()` to check cache first
  - Add `isFirstLoad: boolean` property

**Expected Outcome:**
- ✅ Reduce API calls by ~80% (for session switching)
- ✅ Instant session switching
- ✅ Only scroll on first load, not on switch

**Code Sketch:**
```typescript
private loadSessionMessages(sessionId: string): void {
  // Check cache first
  const cachedMessages = this.aiChatStore.getMessages(sessionId);
  if (cachedMessages && cachedMessages.length > 0) {
    // Use cache - no scrolling
    this.currentMessages = cachedMessages;
    this.cdr.markForCheck();
    return;
  }

  // Cache miss - fetch from API and mark as first load
  this.isFirstLoad = true;
  // ... existing API call logic
}
```

---

### Priority 2: Remember Scroll Position (Enhancement)

**Implementation:**
1. Store scroll position for each session in a `Map<sessionId, scrollTop>`
2. Save position before switching away
3. Restore position when switching back

**Files to Modify:**
- `src/app/components/project-map/ai-chat/ai-chat.component.ts`
  - Add `private scrollPositions = new Map<string, number>()`
- `src/app/components/project-map/ai-chat/chat-message-list.component.ts`
  - Add `@Input() initialScrollPosition = 0`
  - Restore position in `ngAfterViewInit()`

**Expected Outcome:**
- ✅ Perfect restoration of user's reading position
- ✅ More natural UX for long conversations

---

### Priority 3: Smart Scroll Strategy (Advanced)

**Implementation:**
1. Detect if user has already read the latest message
2. Only auto-scroll if there are new/unread messages
3. Respect user's scroll position if they've scrolled up

**Expected Outcome:**
- ✅ Intelligent scrolling that respects user intent
- ✅ Don't interrupt user reading history

---

## Additional Optimization Opportunities

### Virtual Scrolling for Long Conversations
**Issue:** Rendering 1000+ messages causes performance issues
**Solution:** Implement Angular CDK Virtual Scrolling
**Impact:** Major performance improvement for power users

### Message Pagination
**Issue:** Loading entire history at once is slow
**Solution:** Load messages in chunks (e.g., 50 at a time)
**Impact:** Faster initial load, reduced memory usage

### Streaming Animation Optimization
**Issue:** Message re-renders on every character during streaming
**Solution:** Batch updates or use different change detection strategy
**Impact:** Smoother streaming experience

---

## Implementation Order

1. ✅ **Priority 1** - Cache-first loading (Quick win, high impact)
2. ⬜ **Priority 2** - Remember scroll position (UX enhancement)
3. ⬜ **Priority 3** - Smart scroll strategy (Advanced feature)
4. ⬜ Virtual scrolling (For very long conversations)
5. ⬜ Message pagination (For large history)

---

## Related Files

- `src/app/components/project-map/ai-chat/ai-chat.component.ts` - Main chat component
- `src/app/components/project-map/ai-chat/chat-message-list.component.ts` - Message list with scroll logic
- `src/app/stores/ai-chat.store.ts` - State management with messagesMap cache
- `src/app/services/ai-chat.service.ts` - API service layer

---

## Notes

- Current implementation already has caching infrastructure (`messagesMap` in `AiChatStore`)
- Just need to utilize it properly before making API calls
- Consider localStorage persistence for scroll positions across page reloads

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
