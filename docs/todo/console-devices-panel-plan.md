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

- [ ] Create ConsoleDevicesPanelComponent
- [ ] Get device list from NodesDataSource
- [ ] Filter and display console-capable devices
- [ ] Display device name and status
- [ ] Click device name to open console
- [ ] Sidebar positioned on left side of Console window

### Phase 2: Search & Grouping

- [ ] Add search input to filter devices by name
- [ ] Group devices by project (when multiple projects loaded)
- [ ] Show group headers with expand/collapse
- [ ] Clear search button

### Phase 3: Keyboard Shortcut Features (Electron Only)

- [ ] Implement custom shortcut configuration for Electron
- [ ] Default: Alt+1-9 to switch console
- [ ] User can customize shortcuts in settings
- [ ] Display current shortcuts in sidebar
- [ ] NO shortcuts in Web browser mode

### Phase 4: UI Optimization

- [ ] Device status color differentiation
- [ ] Drag handle to resize sidebar width (150px-400px)
- [ ] Theme adaptation (dark/light mode)
- [ ] Smooth expand/collapse animation

### Phase 5: Enhanced Features

- [ ] Recently used devices on top
- [ ] Right-click menu (open/close/copy name)
- [ ] Drag devices to reorder tabs
- [ ] Double-click to rename device in list

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
| Sidebar Position | Left side of Console window |
| Sidebar Width | 200px default, resizable (150px-400px) |
| Search | Simple text search filter |
| Grouping | Group by project (for multi-project scenarios) |
| Shortcuts | Electron ONLY - customizable shortcuts |
| Web Mode | No keyboard shortcuts |

---

## 7. Implementation Order

1. **Step 1**: Create basic component, integrate into ConsoleWrapper
2. **Step 2**: Implement device list display with status colors
3. **Step 3**: Implement click to open console
4. **Step 4**: Add search and grouping functionality
5. **Step 5**: Add sidebar resize functionality
6. **Step 6**: Add keyboard shortcuts (Electron only)
7. **Step 7**: Theme adaptation and UI polish
