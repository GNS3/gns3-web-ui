# Project Map Context Menu

> Right-click context menu functionality for nodes, drawings, links, and labels

**Version**: v1.0
**Updated**: 2026-03-30
**Status**: ✅ Implemented

---

## Overview

The context menu provides quick access to operations on selected topology elements. Menu options are dynamically shown/hidden based on selection type and project permissions.

### Selection Types

```
┌─────────────────────────────────────────────────────────┐
│                  Context Menu Types                      │
├───────────────┬─────────────────────────────────────────┤
│  Single Node  │  Show, Config, Console, Isolate, etc. │
│  Multi Node   │  Start, Stop, Suspend, Align, etc.    │
│  Single Link  │  Capture, Filter, Reset, Style, etc.    │
│  Drawings     │  Edit Style, Edit Text, Duplicate, etc.  │
└───────────────┴─────────────────────────────────────────┘
```

---

## Menu Options Reference

### Node Operations

| Menu Option | Action | Condition | Layer |
|-------------|--------|----------|-------|
| Show node | Display node info panel | Single node | - |
| Config node | Open node configuration | Single node | - |
| Start node | Start selected nodes | 1+ nodes | - |
| Suspend node | Suspend selected nodes | 1+ nodes | - |
| Stop node | Stop selected nodes | 1+ nodes | - |
| Reload node | Reload selected nodes | 1+ nodes | - |
| Console (browser) | Open telnet in embedded widget | Single node | - |
| HTTP console | Open via HTTP/HTTPS/VNC protocol | 1+ nodes | - |
| HTTP console (new tab) | Open in new browser tab | 1+ nodes | - |
| Isolate node | Disconnect all links | Single node | - |
| Unisolate node | Remove isolation | Single node | - |

### Node Customization

| Menu Option | Action | Condition | Layer |
|-------------|--------|----------|-------|
| Change hostname | Modify node hostname | Single node | - |
| Change symbol | Open symbol picker | Single node | - |
| Edit config | Edit VPCS configuration | VPCS node | - |
| Export config | Export to file | VPCS/IOU/Dynamips | - |
| Import config | Import from file | VPCS/IOU/Dynamips | - |
| Idle PC | Set Dynamips idle PC | Dynamips | - |
| Auto idle PC | Auto-calculate idle PC | Dynamips | - |

### Drawing/Label Operations

| Menu Option | Action | Condition | Layer |
|-------------|--------|----------|-------|
| Edit style | Change color, border, etc. | Single drawing | - |
| Edit text | Modify text content | Text element | - |

### Layer Operations

| Menu Option | Action | z-value Change | Visual |
|-------------|--------|---------------|--------|
| Move layer up | Move up one layer | `z = z + 1` | ⬆️ |
| Move layer down | Move down one layer | `z = z - 1` | ⬇️ |
| Bring to front | Move to topmost layer | `z = max(z) + 1` | ⬆️⬆️ |

```
z-value layering (higher = on top):

    ┌─────────────────┐
    │  Bring to front │  ← z = max + 1
    ├─────────────────┤
    │  Move layer up  │  ← z = z + 1
    ├─────────────────┤
    │    Normal       │  ← original z
    ├─────────────────┤
    │ Move layer down  │  ← z = z - 1
    └─────────────────┘
```

**Note**: No "Send to back" (move to bottom) functionality exists.

### Link Operations

| Menu Option | Action | Condition |
|-------------|--------|-----------|
| Start capture | Begin packet capture | Single link |
| Stop capture | Stop packet capture | Single link |
| Start capture on started link | Capture on active link | Single link |
| Packet filters | Configure capture filters | Single link |
| Resume link | Resume suspended link | Single link |
| Suspend link | Suspend link | Single link |
| Reset link | Reset link | Single link |
| Edit link style | Change link appearance | Single link |

### Alignment Operations

| Menu Option | Action | Visual |
|-------------|--------|--------|
| Align horizontally | Align nodes horizontally | ═══ |
| Align vertically | Align nodes vertically | ║║║ |

### Multi-Select Operations

| Menu Option | Action | Condition |
|-------------|--------|-----------|
| Duplicate | Copy nodes/drawings | Selection exists |
| Lock/Unlock | Prevent deletion | Selection exists |
| Delete | Remove elements | Selection exists |

---

## Architecture

### Component Structure

```
context-menu/
├── context-menu.component.ts      # Main component, handles positioning
├── context-menu.component.html    # Template with conditional menu items
└── actions/                       # Individual action components
    ├── show-node-action/
    ├── config-node-action/
    ├── start-node-action/
    ├── stop-node-action/
    ├── move-layer-up-action/
    ├── bring-to-front-action/
    └── ... (38 total actions)
```

### Menu Trigger Sources

```
project-map.component.ts
    │
    ├── nodeWidget.onContextMenu      → Node selected
    ├── drawingsWidget.onContextMenu  → Drawing selected
    ├── labelWidget.onContextMenu     → Label selected
    ├── interfaceLabelWidget...        → Interface label selected
    └── linkWidget.onContextMenu       → Link selected
```

### Dynamic Visibility Pattern

```html
<!-- Angular 17+ @if syntax for conditional display -->
@if (nodes.length === 1) {
  <app-show-node-action ... />
}

@if (!projectService.isReadOnly(project) && nodes.length === 1) {
  <app-change-symbol-action ... />
}
```

---

## Layer Management

### Z-Value System

```
Visual Stack (top to bottom):

┌────────────────────────────────┐
│  Highest z                      │  ← bringToFront()
├────────────────────────────────┤
│                                 │
├────────────────────────────────┤
│                                 │
├────────────────────────────────┤
│  Lowest z                       │
└────────────────────────────────┘
```

### Bring to Front Logic

```
1. Get max z from all selected nodes/drawings
2. Set selected elements to maxZ + 1
3. Update NodesDataSource + DrawingsDataSource
4. Persist via API
```

---

## File Structure

### Core Files

| File | Purpose |
|------|---------|
| `context-menu.component.ts` | Menu positioning, trigger handling |
| `context-menu.component.html` | Menu template with conditional items |
| `actions/*/` | Individual action components |

### Actions Directory (38 actions)

```
actions/
├── align-horizontally/      align-vertically/
├── auto-idle-pc-action/     bring-to-front-action/
├── change-hostname/         change-symbol/
├── config-action/           console-device-action/
├── console-device-action-browser/
├── delete-action/           duplicate-action/
├── edit-config/             edit-link-style-action/
├── edit-style-action/       edit-text-action/
├── export-config/          http-console/
├── http-console-new-tab/    idle-pc-action/
├── import-config/           isolate-node-action/
├── lock-action/            move-layer-down-action/
├── move-layer-up-action/    open-file-explorer/
├── packet-filters-action/   reload-node-action/
├── reset-link/             resume-link-action/
├── show-node-action/        start-capture/
├── start-capture-on-started-link/
├── start-node-action/       stop-capture/
├── stop-node-action/        suspend-link/
├── suspend-node-action/     unisolate-node-action/
└── ... (38 total)
```

---

## Visibility Conditions Summary

| Condition | Shown When |
|-----------|------------|
| `nodes.length === 1` | Single node selected |
| `nodes.length` | 1+ nodes selected |
| `nodes.length > 1` | 2+ nodes selected |
| `links.length === 1` | Single link selected |
| `drawings.length === 1` | Single drawing selected |
| `!isReadOnly && ...` | Project is editable |
| `nodes[0].node_type === 'vpcs'` | VPCS node type |
| `nodes[0].node_type === 'dynamips'` | Dynamips node type |

---

**Last Updated**: 2026-03-30
**Document Version**: 1.0

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
