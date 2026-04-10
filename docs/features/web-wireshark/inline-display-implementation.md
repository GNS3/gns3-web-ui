# Web Wireshark Inline Display - Implementation Progress

## Phase 1: MVP ✅ COMPLETE

### Implemented Features

#### 1. Context Menu Integration
- ✅ Added "Open Web Wireshark (Inline)" option to link context menu
- ✅ Icon: `open_in_full` (Material Icon)
- ✅ Shows when link is capturing

#### 2. InlineWindowService
**File**: `src/app/services/inline-window.service.ts`

Features:
- ✅ Manage inline window lifecycle (create/close)
- ✅ Track window state (size, position, open status)
- ✅ Support multiple concurrent windows
- ✅ Prevent duplicate windows for same link

Key Methods:
```typescript
openInlineWebWireshark(link, controller, targetElement): string
closeInlineWindow(windowId): void
getWindowState(windowId): InlineWindowState
hasOpenWindowForLink(linkId): boolean
closeWindowsForLink(linkId): void
```

#### 3. Component Architecture
**Files**:
- `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/start-web-wireshark-inline-action.component.ts`
- `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/start-web-wireshark-inline-action.component.html`

Features:
- ✅ Standalone component (Angular Zoneless)
- ✅ Input signals for controller, project, link
- ✅ Error handling and user feedback
- ✅ Integration with InlineWindowService

#### 4. UI/UX Design
**File**: `src/styles/_dialogs.scss`

Features:
- ✅ Modern Material Design 3 styling
- ✅ Theme-aware colors (uses CSS variables)
- ✅ Draggable header (cursor: move)
- ✅ Close button with hover effects
- ✅ Smooth transitions and shadows
- ✅ Responsive iframe container

#### 5. Window Structure
```
.web-wireshark-inline-container
├── .web-wireshark-inline-header (draggable)
│   ├── .window-title (with icon)
│   └── .close-button (×)
└── .web-wireshark-inline-iframe-container
    └── iframe (xpra-html5)
```

---

## Usage

### Opening Web Wireshark Inline
1. Right-click on a capturing link
2. Select "Open Web Wireshark (Inline)"
3. Window appears in canvas at position (0, 0)
4. Wireshark loads in iframe

### Closing Web Wireshark Inline
- Click × button in window header
- Window is removed from DOM
- State is cleaned up

---

## Technical Details

### Window ID Format
```
inline-wireshark-{sequentialId}
```

### Default Window Size
- Width: 800px
- Height: 600px

### Default Position
- X: 0px
- Y: 0px

### Z-Index
- 1000 (above other canvas elements)

---

## Phase 2: Enhancements (Planned)

### 1. Resizable Windows ⏳
**Priority**: High

Implementation:
- Add resize handles to window borders
- Support 8-point resizing (corners + edges)
- Minimum size constraints (400x300)
- Maximum size constraints (screen size)

### 2. Draggable Windows ⏳
**Priority**: High

Implementation:
- Implement drag on header
- Constrain to canvas bounds
- Update position state
- Visual feedback during drag

### 3. Multi-Window Management ⏳
**Priority**: Medium

Features:
- Track all open windows
- Window list UI
- Bring to front on click
- Prevent overlapping

### 4. Window Controls ⏳
**Priority**: Medium

Features:
- Minimize button
- Maximize button
- Collapse/expand
- Always on top toggle

---

## Phase 3: Polish (Planned)

### 1. State Persistence ⏳
**Priority**: Low

Features:
- Save window position/size
- Restore on project reload
- Per-link preferences

### 2. Keyboard Shortcuts ⏳
**Priority**: Low

- Ctrl+Shift+W: Open inline
- Esc: Close focused window
- Ctrl+Tab: Cycle windows

### 3. Performance Optimization ⏳
**Priority**: Low

- Lazy load iframe content
- Pause rendering when hidden
- Memory management

---

## Known Limitations

### Current MVP Limitations
1. **Fixed position**: Window always appears at (0, 0)
2. **Fixed size**: Cannot resize window
3. **No drag**: Cannot move window
4. **Single instance**: Only one window per link
5. **No state persistence**: Position lost on reload

### Browser Limitations
1. **CSP restrictions**: May block iframe content in some environments
2. **Cross-origin**: xpra-html5 must be same-origin
3. **Memory**: Multiple iframes may impact performance

---

## Files Modified/Created

### Created Files
1. `src/app/services/inline-window.service.ts` (New)
2. `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/start-web-wireshark-inline-action.component.ts` (New)
3. `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/start-web-wireshark-inline-action.component.html` (New)

### Modified Files
1. `src/app/components/project-map/context-menu/context-menu.component.ts` (Added import)
2. `src/app/components/project-map/context-menu/context-menu.component.html` (Added component)
3. `src/styles/_dialogs.scss` (Added styles)

---

## Testing Checklist

### MVP Testing
- [ ] Right-click menu shows "Open Web Wireshark (Inline)"
- [ ] Click opens window in canvas
- [ ] Wireshark loads in iframe
- [ ] Close button removes window
- [ ] No errors in console
- [ ] Works with multiple links

### Phase 2 Testing
- [ ] Window can be resized
- [ ] Window can be dragged
- [ ] Multiple windows open correctly
- [ ] Windows don't overlap

---

## Next Steps

1. ✅ Commit Phase 1 (MVP)
2. ⏳ Implement Phase 2 (Enhancements)
3. ⏳ Implement Phase 3 (Polish)
4. ⏳ User testing and feedback
5. ⏳ Documentation updates
