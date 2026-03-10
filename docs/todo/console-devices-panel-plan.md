# Console Devices Panel - Device List Sidebar & Keyboard Shortcut Plan

## 1. Overview

Add a device list sidebar next to the Console window to provide a SecureCRT-like multi-tab console switching experience.

### Core Features
1. **Device List Sidebar** - Display all console-capable devices in the project
2. **Status-based Display** - Different colors for device status (running/stopped/error etc.)
3. **Keyboard Shortcuts** - Use Alt+1-9 or Ctrl+1-9 to quickly switch console tabs
4. **Click to Open Console** - Click device name to open corresponding console

---

### 2.1 Sidebar Position & Layout

- **Position**: Left side of Console window (fixed)
- **Default Width**: 200px
- **Resizable**: Yes, drag handle to adjust width
- **Min Width**: 150px
- **Max Width**: 400px

```
+------------------------------------------------------------------+
|  GNS3 Topology                                                    |
+------------------------------------------------------------------+
|                    |  Console Window                              |
|                    |  +----------------------------------------+  |
|   [Device List]    |  | [Log] [R1] [R2] [S1] [PC1]      _ □ X|  |
|   +-----------+    |  +----------------------------------------+  |
|   | R1    ●   |    |  |                                        |  |
|   | R2    ●   |    |  |         Terminal Content              |  |
|   | S1    ○   |    |  |                                        |  |
|   | PC1   ●   |    |  |                                        |  |
|   | PC2   ○   |    |  +----------------------------------------+  |
|   +-----------+    |                                              |
+------------------------------------------------------------------+
```

- **Position**: Left or right of Console window (configurable)
- **Width**: Fixed 200px or resizable
- **Height**: Aligned with Console window

### 2.2 Device Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Running | Green (#22c55e) | Device is running, console can be opened |
| Starting | Yellow (#eab308) | Device is starting |
| Stopped | Gray (#6b7280) | Device is stopped |
| Errored | Red (#ef4444) | Device has error |
| Suspended | Orange (#f97316) | Device is suspended |
| No Console | Transparent/Gray | No console support |

### 2.3 Device Item Display

```
+------------------------------------------+
| [Search icon] Search devices...    [X]   |
+------------------------------------------+
| ▼ Project: Lab-1                         |
|   ● R1                    ● Running     |
|   ● R2                    ● Running     |
|   ○ S1                    ○ Stopped     |
| ▼ Project: Lab-2                         |
|   ● PC1                   ● Running     |
+------------------------------------------+
```

- Search bar at top with clear button
- Group headers show project name with expand/collapse
- Device status shown as colored badge
- Running devices: green, Stopped: gray, Error: red

### 2.4 Sidebar Resize

```
+--------+========+------------------------+
| Devices|  ||    |    Console Window      |
|   List |  ||    |                        |
|        |  ||    |  [Log] [R1] [R2]      |
+--------+  ||    +------------------------+
           ^^
      Drag handle
      (min: 150px, max: 400px)
```

---

## 3. Technical Implementation

### 3.1 Component Structure

```
console-wrapper/
├── console-wrapper.component.ts       # Main container (existing)
├── console-wrapper.component.html     # Main template (existing)
├── console-wrapper.component.scss     # Main styles (existing)
├── console-devices-panel.component.ts# NEW: Device list sidebar
├── console-devices-panel.component.html# NEW: Device list template
├── console-devices-panel.component.scss# NEW: Device list styles
└── console-shortcut.service.ts        # NEW: Shortcut management service
```

### 3.2 Data Flow

```
NodesDataSource (all nodes)
    ↓
ConsoleDevicesPanelComponent (filter: console-capable only)
    ↓
NodeConsoleService.openConsoleForNode() (open console)
    ↓
ConsoleWrapperComponent.addTab() (add to tab)
```

### 3.3 Component Communication

| Component | Input | Output | Description |
|-----------|-------|--------|-------------|
| ConsoleDevicesPanelComponent | nodes: Node[] | deviceSelected: Node | Receive nodes, emit selected device |
| ConsoleWrapperComponent | - | - | Manage tabs and console window |

### 3.4 Keyboard Shortcut Implementation

#### Electron Environment (Global Shortcuts)
```typescript
// Use Electron globalShortcut - only in Electron mode
import { globalShortcut } from 'electron';
import { ElectronService } from 'ngx-electron';

constructor(private electronService: ElectronService) {
  if (this.electronService.isElectronApp) {
    // Register global shortcuts
    globalShortcut.register('Alt+1', () => {
      switchToConsole(0);
    });
  }
}
```

#### Web Environment
**No keyboard shortcuts** - Web browser has too many restrictions on keyboard shortcuts.

#### Shortcut Configuration (Electron Only)
- Default: `Alt+1` through `Alt+9` to switch to console tabs 1-9
- User can customize shortcuts in settings
- Shortcuts stored in local storage or user preferences
- Display current shortcuts as hints in the sidebar

---

## 4. Feature Checklist

### Phase 1: Basic Features

- [x] Create ConsoleDevicesPanelComponent
- [x] Get device list from NodesDataSource
- [x] Filter and display console-capable devices
- [x] Display device name and status
- [x] Click device name to open console
- [x] Sidebar positioned on left side of Console window

### Phase 2: Search & Grouping

- [ ] Add search input to filter devices by name (Removed - simplified UI)
- [ ] Group devices by project (when multiple projects loaded)
- [ ] Show group headers with expand/collapse
- [ ] Clear search button

### Phase 3: Keyboard Shortcut Features

- [x] Implement Alt+1-9 to switch console (Web & Electron)
- [x] Shortcuts work when console is activated (clicked)
- [x] Visual feedback for active state (cyan glow)
- [x] Intercept Alt+1-9 in xterm to prevent capture
- [x] Auto-focus xterm when switching tabs
- [ ] User customizable shortcuts in settings (Future)
- [ ] Display current shortcuts in sidebar (Future)

### Phase 4: UI Optimization

- [x] Device status color differentiation
- [x] Device sorting (running first, alphabetical)
- [x] Custom scrollbar styling (cyan accent)
- [x] Theme adaptation (dark/light mode)
- [x] Hover effects (slide, shadow, no jitter)
- [ ] Drag handle to resize sidebar width (150px-400px) (Future)
- [ ] Smooth expand/collapse animation (Future)

### Phase 5: Enhanced Features

- [ ] Recently used devices on top (Future)
- [ ] Right-click menu (open/close/copy name) (Future)
- [ ] Drag devices to reorder tabs (Future)
- [ ] Double-click to rename device in list (Future)

---

## 5. Dependency Analysis

### 5.1 Existing Dependencies

| Service/Module | Purpose |
|----------------|---------|
| NodesDataSource | Get project node list |
| NodeConsoleService | Open/close console |
| ConsoleWrapperComponent | Console window container |
| ElectronService | Detect Electron environment |

### 5.2 New Dependencies

| Component/Service | Description |
|-------------------|-------------|
| ConsoleDevicesPanelComponent | Device list sidebar component |
| ConsoleShortcutService | Shortcut management (optional, if logic is complex) |

---

## 5.3 Device Status Technical Details

### 5.3.1 Node Status Field

Device status is obtained from the `Node` model's `status` field:

```typescript
// src/app/cartography/models/node.ts
export class Node {
  // ... other fields
  status: string;      // Device status field
  console_type: string; // Console type (telnet, vnc, none, etc.)
  console: number;      // Console port
  // ...
}
```

### 5.3.2 Status Values

| Status | Description | Color (Hex) |
|--------|-------------|-------------|
| `started` | Device is running and console can be opened | `#22c55e` (green) |
| `starting` | Device is starting up | `#eab308` (yellow) |
| `stopped` | Device is stopped | `#6b7280` (gray) |
| `suspended` | Device is suspended | `#f97316` (orange) |
| `errored` | Device has an error | `#ef4444` (red) |

### 5.3.3 Data Subscription Pattern

Subscribe to node updates via `NodesDataSource`:

```typescript
import { NodesDataSource } from '@cartography/datasources/nodes-datasource';
import { Node } from '@cartography/models/node';

export class ConsoleDevicesPanelComponent implements OnInit, OnDestroy {
  private nodes: Node[] = [];
  private destroy$ = new Subject<void>();

  constructor(private nodesDataSource: NodesDataSource) {}

  ngOnInit() {
    // Subscribe to all nodes changes
    this.nodesDataSource.changes.pipe(
      takeUntil(this.destroy$)
    ).subscribe((nodes: Node[]) => {
      // Filter console-capable devices
      this.nodes = nodes.filter(n => n.console_type !== 'none');
      this.cdr.markForCheck();
    });

    // Subscribe to individual node updates
    this.nodesDataSource.itemChanged.pipe(
      takeUntil(this.destroy$)
    ).subscribe((node: Node) => {
      // Update specific node status
      const index = this.nodes.findIndex(n => n.node_id === node.node_id);
      if (index >= 0) {
        this.nodes[index] = node;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Check if device is started
  isDeviceStarted(node: Node): boolean {
    return node.status === 'started';
  }

  // Get status color class
  getStatusColor(status: string): string {
    const colorMap = {
      started: '#22c55e',
      starting: '#eab308',
      stopped: '#6b7280',
      suspended: '#f97316',
      errored: '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }
}
```

### 5.3.4 Usage Examples

```typescript
// Filter console-capable devices
const consoleNodes = nodes.filter(n => n.console_type !== 'none');

// Check if device can open console
if (node.status === 'started' && node.console_type !== 'none') {
  // Enable console button
  consoleButton.disabled = false;
}

// Display status indicator
<div class="status-indicator" [style.backgroundColor]="getStatusColor(node.status)"></div>
```

### 5.3.5 Related Services

| Service | Method | Description |
|---------|--------|-------------|
| NodeService | `getNodes()` | Get all nodes for a project |
| NodesDataSource | `changes` Observable | Subscribe to node list changes |
| NodesDataSource | `itemChanged` Observable | Subscribe to individual node updates |
| NodeConsoleService | `openConsoleForNode(node)` | Open console for a specific node |

---

## 6. Confirmed Design Decisions

| Feature | Decision |
|---------|----------|
| Sidebar Position | Left side of Console window ✅ |
| Sidebar Width | 200px fixed ✅ |
| Search | Removed (simplified UI) |
| Grouping | Not implemented |
| Shortcuts | Alt+1-9 works in both Web & Electron ✅ |
| Web Mode | Keyboard shortcuts enabled ✅ |

---

## 8. Implementation Progress

### Completed (2026-03-10)

**Branch**: `feat/console-devices-panel`

**Implemented Features**:

#### Core Functionality
- ✅ ConsoleDevicesPanelComponent created
- ✅ Device list from NodesDataSource
- ✅ Filter console-capable devices
- ✅ Status indicators with colors
- ✅ Click to open console
- ✅ Sidebar on left side of Console window

#### Device Management
- ✅ Device sorting (running first, alphabetical)
- ✅ Prevent duplicate tabs on repeated clicks
- ✅ Real-time device status updates
- ✅ Auto-sort when device status changes

#### Keyboard Shortcuts
- ✅ Alt+1-9 to switch console tabs
- ✅ Activation state (console must be clicked first)
- ✅ Visual feedback (cyan glow) when active
- ✅ xterm interception (shortcuts work in terminal)
- ✅ Auto-focus xterm on tab switch

#### User Interface
- ✅ Status color differentiation (5 colors)
- ✅ Custom scrollbar (8px, cyan accent)
- ✅ Hover effects (slide + shadow)
- ✅ No jitter or visual artifacts
- ✅ Theme adaptation (dark/light)
- ✅ 200px fixed width sidebar

#### Optimizations
- ✅ Removed search box (simplified UI)
- ✅ Removed status text labels (cleaner look)
- ✅ Enhanced scrollbar visibility
- ✅ Smooth transitions (200ms)

### Git Commit History

| Commit ID | Description |
|-----------|-------------|
| `a6738dcb` | Initial implementation of devices panel |
| `f4f4e845` | Remove status text labels |
| `a4aeaea4` | Remove search box |
| `3c4f5013` | Add device sorting (running first) |
| `60cab490` | Enhance scrollbar visibility |
| `533d9c2e` | Fix hover jitter (remove scale) |
| `000dfc2e` | Prevent duplicate tabs |
| `e4898154` | Add Alt+1-9 keyboard shortcuts |
| `79de131b` | Auto-focus xterm on tab switch |
| `ed9ab655` | Adjust hover scale to 1.15 (reverted) |
| `fd4974b2` | Initial documentation |

### Files Created

```
src/app/components/project-map/console-wrapper/
├── console-devices-panel.component.ts         (New)
├── console-devices-panel.component.html       (New)
└── console-devices-panel.component.scss       (New)
```

### Files Modified

```
src/app/components/project-map/console-wrapper/
├── console-wrapper.component.ts                (Enhanced)
├── console-wrapper.component.html              (Enhanced)
└── console-wrapper.component.scss              (Enhanced)

src/app/components/project-map/web-console/
└── web-console.component.ts                   (Enhanced)

src/app/
└── app.module.ts                               (Updated)
```

### Documentation

- ✅ [Console Devices Panel Implementation](./console-devices-panel-implementation.md) - Complete technical documentation
- ✅ [Console Devices Panel Plan](./console-devices-panel-plan.md) - This file (updated)

---

## 7. Implementation Order

1. **Step 1**: Create basic component, integrate into ConsoleWrapper
2. **Step 2**: Implement device list display with status colors
3. **Step 3**: Implement click to open console
4. **Step 4**: Add search and grouping functionality
5. **Step 5**: Add sidebar resize functionality
6. **Step 6**: Add keyboard shortcuts (Electron only)
7. **Step 7**: Theme adaptation and UI polish
