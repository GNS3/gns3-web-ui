# Console Devices Panel - Implementation Documentation

## Document Information

**Created**: 2026-03-10
**Updated**: 2026-03-10
**Status**: ✅ **Completed**
**Version**: 1.7.0
**Author**: Development Team

---

## Version History

### v1.7.0 (2026-03-10)

**Bug Fixes**:
- ✅ Fix AI Chat Tool Details Dialog light theme colors
- ✅ Fix AI Chat JSON expansion defaults (Tool Call expanded, Result collapsed)
- ✅ Fix Firefox tab labels being covered by xterm black background

**Improvements**:
- ✅ Add light theme JSON syntax highlighting for tool details dialogs
- ✅ Pass theme class to dialog panelClass dynamically
- ✅ Add Firefox-specific tab label fixes with proper stacking context

### v1.6.0 (2026-03-10)

**Improvements**:
- ✅ Move GNS3 console tab to last position (after all device tabs)
- ✅ Device tabs now: Alt+1-8 (tab 0-7)
- ✅ GNS3 console: Alt+9 (last tab)
- ✅ More intuitive tab ordering with devices first

### v1.5.0 (2026-03-10)

**New Features**:
- ✅ Add localStorage to save/restore window state
- ✅ Window size and position persist across sessions
- ✅ Maximize state persists across sessions

**Improvements**:
- ✅ xterm automatically resizes when restoring maximized window
- ✅ Window state saved on resize, drag, and maximize
- ✅ Use ngAfterViewInit to ensure xterm is ready before sending resize events

### v1.4.0 (2026-03-10)

**New Features**:
- ✅ Add height maximize button (fullscreen icon)
- ✅ Add restore button (fullscreen_exit icon)

**Improvements**:
- ✅ xterm automatically resizes when window is maximized/restored
- ✅ Maximize keeps width unchanged (848px), only height changes

### v1.3.0 (2026-03-10)

**New Features**:
- ✅ Add ResizeObserver to WebConsole for automatic terminal resizing
- ✅ Initial xterm size set to cols: 100, rows: 32

**Improvements**:
- ✅ Update GNS3 console styles to match xterm appearance
- ✅ GNS3 console initial size: 848x477
- ✅ Increase default console window size to 848x600
- ✅ GNS3 console responds to window resize events
- ✅ GNS3 console header/input styling with dark theme (#1a1a1a)
- ✅ GNS3 console font: Menlo, Monaco, Courier New (13px)

**Bug Fixes**:
- ✅ Fix GNS3 console height calculation (header + input = 60px offset)

### v1.2.0 (2026-03-10)

**New Features**:
- ✅ Move GNS3 console to independent floating window
- ✅ Add toggle button (terminal icon) to header
- ✅ Add F12 shortcut to show/hide GNS3 console
- ✅ GNS3 console defaults to hidden

**Improvements**:
- ✅ Update keyboard shortcuts: Alt+1-9 now for devices only
- ✅ Support up to 9 device consoles (was 8)
- ✅ Simplified tab indexing (0-8 = devices)

### v1.1.0 (2026-03-10)

**New Features**:
- ✅ Add collapse/expand functionality to devices panel
- ✅ Add panel header with devices icon and title
- ✅ Implement togglePanel() method for collapse/expand
- ✅ Panel width: 200px (expanded) / 48px (collapsed)
- ✅ Default state: collapsed
- ✅ Smooth transition animation (0.2s)
- ✅ Icon scale effect on hover/active

**Improvements**:
- ✅ Increase default console window size to 800x600 (from 720x460)

### v1.0.0 (2026-03-10)

**Initial Release**:
- Device list sidebar with status indicators
- Device sorting (running first, alphabetical)
- Click to open console
- Alt+1-9 keyboard shortcuts
- Device status color differentiation
- Custom scrollbar styling
- Theme adaptation

---

## Overview

The Console Devices Panel is a sidebar feature added to the GNS3 Console window, providing users with a SecureCRT-like experience for managing multiple device consoles. This enhancement allows users to quickly view device status, open consoles, and switch between tabs using keyboard shortcuts.

---

## Features

### 1. Device List Sidebar

A sidebar displayed on the left side of the Console window showing all console-capable devices in the current project.

**Specifications**:
- **Width**: 200px (expanded), 48px (collapsed)
- **Default State**: Collapsed
- **Height**: Matches Console window height
- **Position**: Left side of Console window
- **Scroll**: Custom styled scrollbar (8px width, cyan accent)

**Collapse/Expand**:
- Click the panel header to toggle between collapsed and expanded states
- Collapsed: Shows only the "devices" icon
- Expanded: Shows full device list with names and status indicators
- Smooth transition animation (0.2s)

### 2. Device Status Indicators

Each device displays a colored status indicator dot:

| Status | Color | Description |
|--------|-------|-------------|
| `started` | `#22c55e` (green) | Device is running and console can be opened |
| `starting` | `#eab308` (yellow) | Device is starting up |
| `stopped` | `#6b7280` (gray) | Device is stopped |
| `suspended` | `#f97316` (orange) | Device is suspended |
| `errored` | `#ef4444` (red) | Device has an error |

**Visual Representation**:
```
●  R1        🖥  ← Running device (green dot)
○  S1        🖥  ← Stopped device (gray dot)
```

### 3. Device Sorting

Devices are automatically sorted with two levels of priority:

1. **Primary Sort**: Running devices first, stopped devices after
2. **Secondary Sort**: Alphabetical by name within each group

**Example**:
```
Running Devices:
  ●  PC1       🖥
  ●  R1        🖥
  ●  R2        🖥

Stopped Devices:
  ○  S1        🖥
  ○  Switch1   🖥
```

### 4. Click to Open Console

Clicking on any device in the sidebar:
- Opens a new console tab if not already open
- Switches to the existing tab if already open (prevents duplicates)
- Auto-focuses the xterm terminal for immediate input

### 5. Keyboard Shortcuts

**Alt+1 through Alt+9** to switch between console tabs:

| Shortcut | Action |
|----------|--------|
| Alt+1-8 | Device console tabs 1-8 |
| Alt+9 | GNS3 console (last tab) |

**Tab Order**:
- Devices: tab 0-7 (in order of opening)
- GNS3 console: always last tab

**Behavior**:
- Shortcuts only work when Console window is **activated** (clicked)
- Clicking outside Console window deactivates shortcuts
- Visual feedback (cyan glow) indicates active state
- Works even when xterm has focus (intercepts Alt+1-9)

**GNS3 Console**:
- Independent floating window (default hidden)
- Toggle with F12 or terminal icon button in header
- Draggable and resizable
- Does not occupy a tab position

**Activation States**:
```
┌─────────────────────────────┐
│ [R1] [R2] [S1]              │ ← Cyan glow = Active
├─────────────────────────────┤
│ ●  R1        🖥            │
│ ●  R2        🖥            │
│ ○  S1        🖥            │
└─────────────────────────────┘
```

### 6. Console Window

**Default Size**:
- **Width**: 848px
- **Height**: 600px
- **Initial Position**: bottom: 20px, left: 80px

**Window Features**:
- Draggable by header
- Resizable from all edges
- Minimizable (56px height bar)
- Maximizable (height only, width stays 848px)
- Boundary constrained (stays within viewport)
- Terminal icon button to toggle GNS3 console

### 7. GNS3 Console (Log Output)

**Independent Floating Window**:
- **Default State**: Hidden
- **Position**: Top-right corner (top: 100px, right: 20px)
- **Default Size**: 600px x 400px
- **Toggle Methods**:
  - F12 keyboard shortcut (global)
  - Terminal icon button in console header

**Features**:
- Draggable by header
- Resizable from all edges
- Close button to hide
- Does not interfere with device console tabs
- Shows project log events, errors, warnings, etc.

### 8. Hover Effects

**Device Items**:
- Background color change
- 4px slide to the right
- Cyan shadow effect
- Smooth 200ms transition

**Console Window** (when activated):
- 2px cyan ring (rgba(0, 151, 167, 0.6))
- Enhanced outer glow

---

## Technical Implementation

### Component Architecture

```
console-wrapper/
├── console-wrapper.component.ts           # Main container (modified)
├── console-wrapper.component.html         # Template (modified)
├── console-wrapper.component.scss         # Styles (modified)
└── console-devices-panel.component.ts     # NEW: Device sidebar
    ├── console-devices-panel.component.html   # NEW: Template
    └── console-devices-panel.component.scss   # NEW: Styles
```

### Data Flow

```
NodesDataSource (all project nodes)
    ↓
ConsoleDevicesPanelComponent
    ↓ Filters: console_type !== 'none'
    ↓ Sort: started first, then alphabetically
    ↓ Display: Device list with status indicators
    ↓ User clicks device
    ↓
ConsoleWrapperComponent.addTab()
    ↓ Check: Does tab already exist?
    ├─ Yes → Switch to existing tab
    └─ No  → Create new tab & focus xterm
```

### Key Components

#### ConsoleDevicesPanelComponent

**Responsibilities**:
- Subscribe to `NodesDataSource.changes` for node list updates
- Subscribe to `NodesDataSource.itemChanged` for individual node updates
- Filter console-capable devices (`console_type !== 'none'`)
- Sort devices (running first, alphabetical)
- Display device list with status colors
- Emit `deviceSelected` event on device click

**Key Methods**:
```typescript
ngOnInit(): Subscribe to data source changes
isDeviceStarted(node: Node): boolean: Check if node.status === 'started'
getStatusColor(status: string): string: Return color for status
onDeviceClick(node: Node): void: Emit deviceSelected event
togglePanel(): void: Toggle panel collapse/expand state
private sortNodes(): void: Sort by status and name
```

#### ConsoleWrapperComponent (Enhancements)

**New State**:
```typescript
isConsoleActive: boolean  // Tracks if console window is active for shortcuts
```

**New Methods**:
```typescript
onDeviceSelected(node: Node): void        // Handle device selection from sidebar
handleTabShortcut(event: KeyboardEvent)   // Handle Alt+1-9 shortcuts
onXtermTabShortcut(event: CustomEvent)    // Handle shortcuts from xterm
onConsoleActivate(): void                 // Activate console on click/focus
onDocumentClick(event: MouseEvent): void  // Deactivate on outside click
switchToTab(index: number): void          // Switch tab and auto-focus xterm
```

**Tab Management** (Enhanced):
```typescript
addTab(node: Node, selectAfterAdding: boolean): void {
  // Check if node already exists in tabs
  const existingIndex = this.nodes.findIndex(n => n.node_id === node.node_id);

  if (existingIndex >= 0) {
    // Switch to existing tab
    this.selected.setValue(existingIndex + 1);
  } else {
    // Create new tab
    this.nodes.push(node);
    this.selected.setValue(this.nodes.length);
    this.consoleService.openConsoles++;
  }
}
```

#### WebConsoleComponent (Enhancement)

**New Method**:
```typescript
focusTerminal(): void {
  if (this.term) {
    this.term.focus();
  }
}
```

**xterm Keyboard Interception**:
```typescript
this.term.attachCustomKeyEventHandler((key: KeyboardEvent) => {
  // Intercept Alt+1-9 shortcuts
  if (key.altKey && key.key >= '1' && key.key <= '9') {
    const customEvent = new CustomEvent('consoleTabShortcut', {
      detail: { key: key.key },
      bubbles: true
    });
    this.term.element.dispatchEvent(customEvent);
    return false; // Prevent xterm from handling
  }
  return true;
});
```

---

## Styling

### Device Panel Layout

```scss
.console-devices-panel {
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 100%;
  background-color: var(--mat-app-surface);
  border-right: 1px solid var(--mat-app-outline-variant);
  transition: width 0.2s ease;

  &.collapsed {
    width: 48px;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--mat-app-outline-variant);
  background-color: var(--mat-app-surface-container);
  flex-shrink: 0;

  &.clickable {
    cursor: pointer;
    transition: all 0.2s;
  }

  &:hover.clickable {
    background-color: var(--mat-app-surface-container-high);
  }
}

.panel-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  color: var(--mat-app-primary);
  transition: transform 0.2s;
}

.header-title.clickable:hover .panel-icon {
  transform: scale(1.08);
}

.device-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  // Custom scrollbar (8px, cyan accent)
}

.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--mat-app-surface-container-high);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 151, 167, 0.2);
  }

  &.started {
    border-left: 3px solid var(--mat-app-primary);
  }
}
```

### Console Activation State

```scss
.consoleWrapper {
  &.console-active {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2),
                0 6px 20px 0 rgba(0, 0, 0, 0.19),
                0 0 0 2px rgba(0, 151, 167, 0.6),
                0 0 12px rgba(0, 151, 167, 0.3);
  }
}
```

---

## User Experience

### Workflow Examples

#### Example 1: Open and Switch Between Device Consoles

1. **Open Console Window**
   - Console window opens with devices panel visible
   - See all devices sorted by status

2. **Click Device R1**
   - New tab "R1" appears
   - xterm terminal auto-focuses
   - Can immediately type commands

3. **Click Device R2**
   - New tab "R2" appears
   - xterm auto-focuses to R2

4. **Press Alt+2**
   - Switches back to R1 tab
   - xterm auto-focuses to R1

5. **Press Alt+3**
   - Switches to R2 tab
   - xterm auto-focuses to R2

#### Example 2: Reusing Existing Tabs

1. **Click Device R1** → Tab "R1" created
2. **Click Device R2** → Tab "R2" created
3. **Click Device R1 again** → Switches to existing "R1" tab (no duplicate)

---

## Integration Points

### Dependencies

**Existing Services/Components**:
- `NodesDataSource`: Provides project node list
- `NodeConsoleService`: Manages console connections
- `ConsoleWrapperComponent`: Main console container
- `WebConsoleComponent`: Individual device console

**New Components**:
- `ConsoleDevicesPanelComponent`: Device list sidebar

### Module Registration

```typescript
// app.module.ts
import { ConsoleDevicesPanelComponent } from '@components/project-map/console-wrapper/console-devices-panel.component';

@NgModule({
  declarations: [
    ConsoleWrapperComponent,
    ConsoleDevicesPanelComponent,
    // ...
  ]
})
```

---

## Browser Compatibility

### Keyboard Shortcut Behavior

| Browser Environment | Alt+1-9 Support |
|---------------------|-----------------|
| **Web (Chrome/Firefox/Edge)** | ✅ Fully supported |
| **Electron** | ✅ Fully supported |

**Note**: Unlike native desktop applications, web browsers reserve many keyboard shortcuts. Alt+1-9 was chosen because it doesn't conflict with common browser shortcuts (unlike Ctrl+1-9 which switches browser tabs).

---

## Performance Considerations

### Optimization Techniques

1. **Change Detection**: `ChangeDetectorRef.markForCheck()` for manual updates
2. **Subscription Cleanup**: `takeUntil(this.destroy$)` pattern
3. **Delayed Focus**: `setTimeout(100ms)` for DOM updates
4. **Efficient Filtering**: `console_type !== 'none'` before adding to array

### Memory Management

```typescript
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Known Limitations

1. **Shortcut Scope**: Alt+1-9 only works when Console window is activated
2. **Maximum Tabs**: Alt+1-9 supports up to 8 device consoles
3. **GNS3 Console**: Alt+1 switches to log console (not xterm)
4. **Web Environment**: Requires window focus (not when browser tab is inactive)

---

## Future Enhancements

### Potential Improvements

1. **Configurable Shortcuts**: Allow users to customize Alt+1-9
2. **Tab Pinning**: Pin frequently used tabs
3. **Tab Reordering**: Drag tabs to reorder
4. **Session Persistence**: Remember open tabs across page reloads
5. **Search Functionality**: Filter device list by name (removed in simplification)
6. **Resize Handle**: Drag to resize sidebar width (150px-400px)

---

## Testing Checklist

### Manual Testing

#### Device Panel Display
- [x] Panel displays on left side of Console window
- [x] Width is 200px
- [x] Scrollbar appears when devices exceed height
- [x] Scrollbar styling matches theme

#### Device List
- [x] Only console-capable devices shown
- [x] Running devices displayed first
- [x] Stopped devices displayed after
- [x] Alphabetical sort within groups
- [x] Status colors display correctly
- [x] Hover effects work smoothly

#### Device Interaction
- [x] Click device creates new tab
- [x] Click same device switches to existing tab
- [x] No duplicate tabs created
- [x] xterm auto-focuses on tab creation

#### Keyboard Shortcuts
- [x] Alt+1 switches to GNS3 console
- [x] Alt+2-9 switch to device tabs
- [x] Shortcuts work when console is active
- [x] Shortcuts don't work when console is inactive
- [x] Visual feedback shows active state
- [x] Click outside deactivates shortcuts
- [x] Shortcuts work when xterm has focus
- [x] xterm auto-focuses after shortcut

#### Visual Feedback
- [x] Cyan glow shows console is active
- [x] Glow disappears when clicking outside
- [x] Device items have hover effects
- [x] No jitter or white dots on hover

---

## Troubleshooting

### Issue: Keyboard shortcuts not working

**Possible Causes**:
1. Console window is not activated (no cyan glow)
2. Click outside console window deactivated it
3. Browser tab is not focused

**Solutions**:
1. Click anywhere in Console window to activate
2. Ensure browser window has focus
3. Check if console is minimized (expand it first)

### Issue: Duplicate tabs appearing

**Possible Cause**: Old code before fix

**Solution**: Ensure running latest version with `addTab()` duplicate check

### Issue: xterm not auto-focusing

**Possible Causes**:
1. GNS3 console tab selected (not device console)
2. DOM not updated when focus called
3. WebConsoleComponent not loaded

**Solutions**:
1. Switch to device console tab (Alt+2-9)
2. Click device directly from sidebar
3. Check browser console for errors

---

## Recent Bug Fixes (v1.7.0)

### 1. AI Chat Tool Details Dialog Light Theme Fix

**Problem**: Tool call details and execution result details dialogs displayed with dark theme colors in light mode.

**Solution**:
- Added light theme JSON syntax highlighting colors to `tool-details-dialog.component.ts`
- Injected `ThemeService` into `ChatMessageListComponent`
- Pass current theme class (`light-theme` or `dark-theme`) to dialog `panelClass`

**Files Modified**:
- `src/app/components/project-map/ai-chat/tool-details-dialog.component.ts`
- `src/app/components/project-map/ai-chat/chat-message-list.component.ts`

### 2. JSON Expansion Defaults

**Problem**: All JSON in tool details dialogs was expanded by default, making large outputs difficult to navigate.

**Solution**:
- Set `[expanded]="true"` for Tool Call Details (Arguments)
- Set `[expanded]="false"` for Execution Result Details (Output)

**Files Modified**:
- `src/app/components/project-map/ai-chat/tool-details-dialog.component.ts`

### 3. Firefox Tab Labels Covered by Xterm

**Problem**: In Firefox browser, device console tab labels were partially hidden by xterm's black background.

**Solution**:
- Added `position: relative` and `z-index: 10` to `.consoleHeader`
- Added `flex-shrink: 0` to `.mat-tab-label` to prevent compression
- Added Firefox-specific tab fixes using `@-moz-document url-prefix()`
- Added `isolation: isolate` to `.console-area` for proper stacking context

**Files Modified**:
- `src/app/components/project-map/console-wrapper/console-wrapper.component.scss`

---

## References

### Related Documentation

- [Console Devices Panel Plan](../todo/console-devices-panel-plan.md)
- [AI Chat Implementation](../ai-chat/ai-chat-implementation-plan.md)

### Code Files

- `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`
- `src/app/components/project-map/console-wrapper/console-wrapper.component.html`
- `src/app/components/project-map/console-wrapper/console-wrapper.component.scss`
- `src/app/components/project-map/console-wrapper/console-devices-panel.component.ts`
- `src/app/components/project-map/console-wrapper/console-devices-panel.component.html`
- `src/app/components/project-map/console-wrapper/console-devices-panel.component.scss`
- `src/app/components/project-map/web-console/web-console.component.ts`

---

**Document Version**: 1.7.0
**Last Updated**: 2026-03-10
**Maintainer**: Development Team
