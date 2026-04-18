<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
# Console Devices Panel - Implementation Documentation

## Document Information

**Created**: 2026-03-10
**Updated**: 2026-04-18
**Status**: ✅ **Completed**
**Version**: 2.2.0
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
- Excludes devices with `console_type === 'none'` (no console)
- Excludes devices with `console_type === 'vnc'` (uses standalone VNC viewer window)
- Excludes devices with `console_type.startsWith('http')` (HTTP/HTTPS browsers use popup windows)

**Specifications**:
- **Width**: 200px (expanded), 48px (collapsed)
- **Default State**: Collapsed
- **Height**: Matches Console window height
- **Position**: Left side of Console window
- **Scroll**: Custom styled scrollbar (8px width, themed accent)

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
- Embedded as the last tab in console window
- Always available as the final tab position
- Shares the console window with device consoles

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
- **Initial Position**: bottom: 100px, left: 80px

**Window Features**:
- Draggable by header
- Resizable from all edges
- Minimizable (56px height bar)
- Maximizable (height only, width stays 848px)
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
- Subtle box-shadow enhancement using Material theme variables

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
    ↓ Filters: console_type !== 'none' && !== 'vnc' && !startsWith('http')
    ↓ (Exclude VNC and HTTP/HTTPS - they use standalone windows)
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
- Filter console-capable devices (exclude `none`, `vnc`, `http` types)
- Sort devices (running first, alphabetical)
- Emit `deviceSelected` event on click

**Key Methods**: `ngOnInit()`, `isDeviceStarted()`, `getStatusColor()`, `togglePanel()`, `sortNodes()`

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

- `focusTerminal()` - Focus xterm terminal
- `attachCustomKeyEventHandler()` - Intercept Alt+1-9 for tab switching

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

### Component Imports

```typescript
// console-wrapper.component.ts (standalone)
import { ConsoleDevicesPanelComponent } from './console-devices-panel.component';

@Component({
  standalone: true,
  imports: [
    ConsoleDevicesPanelComponent,
    // ...
  ],
})
```

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
- [x] Alt+1-8 switch to device console tabs
- [x] Alt+9 switches to GNS3 console
- [x] Shortcuts work when console is active
- [x] Shortcuts don't work when console is inactive
- [x] Visual feedback shows active state
- [x] Click outside deactivates shortcuts
- [x] Shortcuts work when xterm has focus
- [x] xterm auto-focuses after shortcut

#### Visual Feedback
- [x] Console active state shows shadow enhancement
- [x] Active state disappears when clicking outside
- [x] Device items have hover effects
- [x] No jitter or white dots on hover

---

## Troubleshooting

### Issue: Keyboard shortcuts not working

**Possible Causes**:
1. Console window is not activated (no visual highlight)
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

**Document Version**: 2.2.0
**Last Updated**: 2026-04-18
**Maintainer**: Development Team

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
