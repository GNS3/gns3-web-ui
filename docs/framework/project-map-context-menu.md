# Project Map Context Menu

## Bring to Front Functionality

**Bring to front** moves the selected nodes and drawings to the topmost layer (above all other elements).

### Implementation Logic

1. Calculate the maximum `z` value among all selected nodes and drawings
2. Set the selected elements' `z` value to `maxZValue + 1`
3. Update both `NodesDataSource` and `DrawingsDataSource`
4. Persist changes via `nodeService.update()` and `drawingService.update()` API calls

```typescript
// bring-to-front-action.component.ts:32-54
bringToFront() {
  let maxZValueForNodes = Math.max(...this.nodes().map((n) => n.z));
  let maxZValueForDrawings = Math.max(...this.drawings().map((n) => n.z));
  let maxZValue = Math.max(maxZValueForNodes, maxZValueForDrawings);
  if (maxZValue < 100) maxZValue++;

  this.nodes().forEach((node) => {
    node.z = maxZValue;
    this.nodesDataSource.update(node);
    this.nodeService.update(this.controller(), node).subscribe();
  });

  this.drawings().forEach((drawing) => {
    drawing.z = maxZValue;
    this.drawingsDataSource.update(drawing);
    this.drawingService.update(this.controller(), drawing).subscribe();
  });
}
```

---

## Complete Node Right-Click Menu Options

| Menu Option | Function | Visibility Condition | Code Location |
|-------------|----------|----------------------|---------------|
| **Show node** | Opens node info panel, displays node details | Single node selected | `actions/show-node-action/` |
| **Config node** | Opens node configuration dialog | Single node selected | `actions/config-node-action/` |
| **Start node** | Starts the selected nodes | At least one node selected | `actions/start-node-action/` |
| **Suspend node** | Suspends the selected nodes | At least one node selected | `actions/suspend-node-action/` |
| **Stop node** | Stops the selected nodes | At least one node selected | `actions/stop-node-action/` |
| **Reload node** | Reloads the selected nodes | At least one node selected | `actions/reload-node-action/` |
| **HTTP console** | Opens console via HTTP/HTTPS/VNC protocol | Non-readonly, at least one node | `actions/http-console/` |
| **HTTP console (new tab)** | Opens HTTP console in new tab | Non-readonly, at least one node | `actions/http-console-new-tab/` |
| **Console (browser)** | Opens telnet console in embedded browser widget | Non-readonly, single node | `actions/console-device-action-browser/` |
| **Isolate node** | Isolates node (disconnects all links) | Single node selected | `actions/isolate-node-action/` |
| **Unisolate node** | Removes node isolation | Single node selected | `actions/unisolate-node-action/` |
| **Change hostname** | Modifies the node hostname | Non-readonly, single node | `actions/change-hostname/` |
| **Change symbol** | Opens symbol picker dialog to change node icon | Non-readonly, single node | `actions/change-symbol/` |
| **Duplicate** | Duplicates selected nodes or drawings | Nodes or drawings selected | `actions/duplicate-action/` |
| **Edit style** | Edits drawing style (color, border, etc.) | Non-readonly, single drawing without text capability | `actions/edit-style-action/` |
| **Edit text** | Edits text content | Non-readonly, specific selection conditions | `actions/edit-text-action/` |
| **Edit config** | Edits VPCS node configuration | Single VPCS type node | `actions/edit-config/` |
| **Export config** | Exports node configuration to file | VPCS/IOU/Dynamips node type | `actions/export-config/` |
| **Import config** | Imports node configuration from file | VPCS/IOU/Dynamips node type | `actions/import-config/` |
| **Idle PC** | Sets Dynamips idle PC value | Single Dynamips node | `actions/idle-pc-action/` |
| **Auto idle PC** | Auto-calculates Dynamips idle PC value | Single Dynamips node | `actions/auto-idle-pc-action/` |
| **Move layer up** | Moves element up one layer (z+1) | Non-readonly, nodes or drawings selected | `actions/move-layer-up-action/` |
| **Move layer down** | Moves element down one layer (z-1) | Non-readonly, nodes or drawings selected | `actions/move-layer-down-action/` |
| **Bring to front** | Moves element to topmost layer (z=max+1) | Non-readonly, nodes or drawings selected | `actions/bring-to-front-action/` |
| **Start capture** | Starts packet capture | Non-readonly, single link | `actions/start-capture/` |
| **Stop capture** | Stops packet capture | Non-readonly, single link | `actions/stop-capture/` |
| **Start capture on started link** | Starts capture on an already started link | Non-readonly, single link | `actions/start-capture-on-started-link/` |
| **Packet filters** | Configures packet capture filters | Non-readonly, single link | `actions/packet-filters-action/` |
| **Resume link** | Resumes a suspended link | Non-readonly, single link | `actions/resume-link-action/` |
| **Suspend link** | Suspends a link | Non-readonly, single link | `actions/suspend-link-action/` |
| **Reset link** | Resets a link | Non-readonly, single link | `actions/reset-link-action/` |
| **Edit link style** | Edits link style | Non-readonly, single link | `actions/edit-link-style-action/` |
| **Lock** | Locks/unlocks elements (locked elements cannot be deleted) | Non-readonly, nodes or drawings selected | `actions/lock-action/` |
| **Delete** | Deletes selected nodes, drawings, or links | Non-readonly, elements selected | `actions/delete-action/` |
| **Align horizontally** | Horizontally aligns multiple nodes | Non-readonly, at least 2 nodes | `actions/align-horizontally/` |
| **Align vertically** | Vertically aligns multiple nodes | Non-readonly, at least 2 nodes | `actions/align-vertically/` |

---

## Layer Ordering Operations Detail

### Comparison of Three Layer Operations

| Operation | Function | z-value Change | Code Location |
|-----------|----------|----------------|---------------|
| **Move layer up** | Move up one layer | `z = z + 1` | `move-layer-up-action/` |
| **Move layer down** | Move down one layer | `z = z - 1` | `move-layer-down-action/` |
| **Bring to front** | Move to topmost layer | `z = max(z) + 1` | `bring-to-front-action/` |

**Note**: There is no "Send to back" (move to bottommost layer) functionality in the codebase.

---

## Core File Paths

### Main Component
- **Template**: `src/app/components/project-map/context-menu/context-menu.component.html`
- **Component**: `src/app/components/project-map/context-menu/context-menu.component.ts`

### Menu Trigger Sources
- `src/app/components/project-map/project-map.component.ts:619-706`
  - `nodeWidget.onContextMenu`
  - `drawingsWidget.onContextMenu`
  - `labelWidget.onContextMenu`
  - `interfaceLabelWidget.onContextMenu`
  - `linkWidget.onContextMenu`

### Actions Component Directory
```
src/app/components/project-map/context-menu/actions/
├── align-horizontally/
├── align_vertically/
├── auto-idle-pc-action/
├── bring-to-front-action/
├── change-hostname/
├── change-symbol/
├── config-node-action/
├── console-device-action/
├── console-device-action-browser/
├── delete-action/
├── duplicate-action/
├── edit-config/
├── edit-link-style-action/
├── edit-style-action/
├── edit-text-action/
├── export-config/
├── http-console/
├── http-console-new-tab/
├── idle-pc-action/
├── import-config/
├── isolate-node-action/
├── lock-action/
├── move-layer-down-action/
├── move-layer-up-action/
├── open-file-explorer/
├── packet-filters-action/
├── reload-node-action/
├── reset-link/
├── resume-link-action/
├── show-node-action/
├── start-capture/
├── start-capture-on-started-link/
├── start-node-action/
├── stop-capture/
├── stop-node-action/
├── suspend-link/
├── suspend-node-action/
└── unisolate-node-action/
```

---

## Menu Visibility Condition Examples

```html
<!-- Single node options -->
<app-show-node-action *ngIf="nodes.length === 1" ...></app-show-node-action>

<!-- Node lifecycle operations -->
<app-start-node-action *ngIf="nodes.length" ...></app-start-node-action>

<!-- Requires non-readonly permission -->
<app-change-symbol-action *ngIf="!projectService.isReadOnly(project) && nodes.length === 1" ...>

<!-- Multi-node alignment options -->
<app-align-horizontally-action *ngIf="!projectService.isReadOnly(project) && nodes.length > 1" ...>
```
