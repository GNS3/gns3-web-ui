<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md). 



# Console Devices Panel - Implementation Documentation

## Document Information

**Created**: 2026-03-10
**Updated**: 2026-04-18
**Status**: ✅ **Completed**
**Version**: 2.3.0
**Author**: Development Team

---


## Overview

The Console Devices Panel is a sidebar feature added to the GNS3 Console window, providing users with a SecureCRT-like experience for managing multiple device consoles. This enhancement allows users to quickly view device status, open consoles, and switch between tabs using keyboard shortcuts.

---

## Features

### 1. Device List Sidebar

A sidebar displayed on the left side of the Console window showing all console-capable devices in the current project.

**Device Filtering**:
- Only shows devices with embedded console support
- Excludes devices with `console_type === 'none'` or falsy/undefined `console_type` (no console)
- Excludes devices with `console_type === 'vnc'` (uses standalone VNC viewer window)
- Excludes devices with `console_type.startsWith('http')` (HTTP/HTTPS browsers use popup windows)

**Specifications**:
- **Width**: 200px (expanded), 48px (collapsed)
- **Default State**: Collapsed
- **Height**: Matches Console window height
- **Position**: Left side of Console window
- **Scroll**: Native scrollbar via `overflow-y: auto`

**Collapse/Expand**:
- Click the panel header to toggle between collapsed and expanded states
- Collapsed: Shows only the "devices" icon
- Expanded: Shows full device list with names and status indicators
- Smooth transition animation (100ms)

### 2. Device Status Indicators

Each device displays a colored status indicator dot. Colors use Material Design 3 CSS variables for theme consistency:

| Status | CSS Variable | Description |
|--------|---------------|-------------|
| `started` | `--mat-sys-primary` | Device is running and console can be opened |
| `starting` | `--mat-sys-tertiary` | Device is starting up |
| `stopped` | `--mat-sys-outline` | Device is stopped |
| `suspended` | `--mat-sys-secondary` | Device is suspended |
| `errored` | `--mat-sys-error` | Device has an error |

**Implementation Note**: Status colors use CSS variables (`var(--mat-sys-*)`) instead of hardcoded hex values to ensure proper theme adaptation and accessibility compliance per Material Design 3 guidelines.

**Visual Representation**:
```
●  R1        🖥  ← Running device (green dot)
○  S1        🖥  ← Stopped device (gray dot)
```

### 3. Device Sorting

Devices are automatically sorted with two levels of priority:

1. **Primary Sort**: Started devices (`status === 'started'`) first, all non-started statuses after
2. **Secondary Sort**: Alphabetical by name within each group

**Example**:
```
Started Devices:
  ●  PC1       🖥
  ●  R1        🖥
  ●  R2        🖥

Non-Started Devices (stopped/starting/suspended/errored):
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
- Visual feedback via `console-active` CSS class (currently no visual styling applied — pending implementation)
- Works even when xterm has focus (intercepts Alt+1-9 via `consoleTabShortcut` custom event)

**GNS3 Console**:
- Embedded as the last tab in console window
- Always available as the final tab position
- Shares the console window with device consoles

**Activation States**:
```
┌─────────────────────────────┐
│ [R1] [R2] [S1]              │ ← console-active class toggled
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
- **Initial Position**: bottom: 100px, left: 80px

**Window Features**:
- Draggable by header
- Resizable from all edges
- Minimizable (window hidden via `display: none`, taskbar icon shown at 48px height)
- Maximizable (height only, width stays at current resized width)
- Boundary constrained (stays within viewport)
- Maximize/restore buttons (fullscreen/fullscreen_exit icons)

### 7. GNS3 Console (Log Output)

**Embedded Tab Panel**:
- **Position**: Last tab in console window tab group
- **Behavior**: Always available as the final tab
- **Access**: Click "GNS3 console" tab or press Alt+9

**Features**:
- Shows project log events, errors, warnings, etc.
- Filterable log output (all, errors, warnings, info, etc.)
- Command input for project-level operations
- Does not interfere with device console tabs

### 8. Hover Effects

**Device Items**:
- Background color change (`--mat-sys-surface-container`)
- Smooth 100ms transition

**Console Window** (when activated):
- `console-active` CSS class toggled (visual styling pending implementation)

---

## Technical Implementation

### Component Architecture

```
console-wrapper/
├── console-wrapper.component.ts           # Main container (modified)
├── console-wrapper.component.html         # Template (modified)
├── console-wrapper.component.scss         # Styles (modified)
├── console-devices-panel.component.ts     # NEW: Device sidebar
├── console-devices-panel.component.html   # NEW: Template
└── console-devices-panel.component.scss   # NEW: Styles
```

### Data Flow

```
NodesDataSource (all project nodes)
    ↓
ConsoleDevicesPanelComponent
    ↓ Filters: console_type !== 'none' && !== undefined && !== 'vnc' && !startsWith('http')
    ↓ (Exclude VNC, HTTP/HTTPS, and undefined console types - they use standalone windows)
    ↓ Sort: started first, then alphabetically
    ↓ Display: Device list with status indicators
    ↓ User clicks device
    ↓
ConsoleWrapperComponent.addTab()
    ↓ Check: Is VNC node?
    ├─ Yes → Skip (VNC uses standalone popup windows)
    └─ No  → Continue
    ↓ Check: Does tab already exist?
    ├─ Yes → Switch to existing tab
    └─ No  → Create new tab & focus xterm
```

### Key Components

#### ConsoleDevicesPanelComponent

**Responsibilities**:
- Subscribe to `NodesDataSource.changes` and `itemChanged` for node updates
- Filter console-capable devices (exclude `none`, undefined, `vnc`, `http` types)
- Sort devices (started first, alphabetical)
- Emit `deviceSelected` event on click

**Key Methods**: `ngOnInit()`, `isDeviceStarted()`, `getStatusColor()`, `getStatusLabel()`, `onDeviceClick()`, `togglePanel()`, `sortNodes()`

#### ConsoleWrapperComponent (Enhancements)

**New State**: Uses signals for `isDragging`, `isMinimized`, `isMaximized`, `isConsoleActive`, `isLightThemeEnabled`

**New Methods**:
- `onDeviceSelected()` - Handle device selection from sidebar
- `handleTabShortcut()` / `onXtermTabShortcut()` - Alt+1-9 keyboard handling
- `onConsoleActivate()` / `onDocumentClick()` - Console activation tracking
- `switchToTab()` - Tab switching with auto-focus
- `setupDragHandling()` - RxJS-based drag with `auditTime(animationFrameScheduler)`

**Tab Management**: `addTab()` checks for duplicates, skips VNC nodes, creates/selects tabs

#### WebConsoleComponent (Enhancement)

- `focusTerminal()` - Public method to focus xterm terminal, called by parent after tab switch
- xterm `attachCustomKeyEventHandler()` - Called in `ngAfterViewInit()` to intercept Alt+1-9 and dispatch `consoleTabShortcut` custom event to parent

---

## Styling

### Design Principles

All styles follow Material Design 3 guidelines using CSS custom properties (`--mat-sys-*`) for theme consistency and accessibility.

**Key Styling Files**:
- `console-wrapper.component.scss` - Console window styles
- `console-devices-panel.component.scss` - Device sidebar panel styles

**Key Design Decisions**:

| Element | Styling Approach |
|---------|------------------|
| Colors | CSS variables (`--mat-sys-*`) for automatic theme adaptation |
| Transitions | 100ms for micro-interactions, 200ms for box-shadow |
| Shadows | `color-mix()` with theme shadow color for depth |
| GPU Acceleration | `will-change` and `contain:layout style` for drag performance |
| Status Indicators | 4px circles using `--mat-sys-primary` (running) or `--mat-sys-outline` (stopped) |

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

---

## Browser Compatibility

### Keyboard Shortcut Behavior

| Browser Environment | Alt+1-9 Support |
|---------------------|-----------------|
| **Web (Chrome/Firefox/Edge)** | ✅ Fully supported |

**Note**: Unlike native desktop applications, web browsers reserve many keyboard shortcuts. Alt+1-9 was chosen because it doesn't conflict with common browser shortcuts (unlike Ctrl+1-9 which switches browser tabs).

---

## Performance Considerations

### Optimization Techniques

1. **Change Detection**: `ChangeDetectorRef.markForCheck()` for manual updates
2. **Subscription Cleanup**: `takeUntil(this.destroy$)` pattern
3. **Delayed Focus**: Double-nested `requestAnimationFrame` to wait for Angular rendering cycle
4. **Efficient Filtering**: `console_type` checks before adding to array

### Memory Management

All components use the `takeUntil(this.destroy$)` pattern with `Subject<void>` for subscription cleanup on destroy.

---

## Known Limitations

1. **Shortcut Scope**: Alt+1-9 only works when Console window is activated
2. **Maximum Tabs**: Alt+1-9 supports up to 8 device consoles
3. **GNS3 Console**: Alt+9 switches to log console (not xterm)
4. **Web Environment**: Requires window focus (not when browser tab is inactive)
5. **VNC/HTTP Devices**: Devices with VNC or HTTP console types are not shown in the devices panel as they use standalone popup windows

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

**Document Version**: 2.3.0
**Last Updated**: 2026-04-18
**Maintainer**: Development Team

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
