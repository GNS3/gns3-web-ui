# Angular 21 Zoneless Phased Migration Plan

> Created: 2026-03-22
> Project: gns3-web-ui
> Total Components: 253
> Migration Strategy: Phased incremental execution

---

## Execution Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Core Zoneless Migration | Pending | 0/253 components |
| Phase 2: Syntax Optimization | Pending | 0/253 components |
| Phase 3: Issue Fixes | Pending | TBD |

---

## Phase 1: Core Zoneless Migration (Required)

### Overview

Migrate all components from `ChangeDetectionStrategy.Default` to `ChangeDetectionStrategy.OnPush`, then remove zone.js dependency.

### 1.1 Component OnPush Migration

| Component | Current Status | Needs Modification | Notes |
|-----------|---------------|-------------------|-------|
| app.component.ts | Default | Change to OnPush | Root component, currently using Default strategy |
| common/progress/progress.component.ts | Default | Change to OnPush | Progress bar component, uses signal for state management |
| common/progress-dialog/progress-dialog.component.ts | Default | Change to OnPush | Progress dialog component, uses signal for progress value |
| common/uploading-processbar/uploading-processbar.component.ts | Default | Change to OnPush | Upload progress bar, uses signal for progress |
| layouts/default-layout/default-layout.component.ts | Default | Change to OnPush | Default layout component, main page framework |
| cartography/components/d3-map/d3-map.component.ts | Default | Change to OnPush | D3 map component, uses signal inputs |
| cartography/components/experimental-map/experimental-map.component.ts | ✅ OnPush | No change needed | Already using OnPush, uses signal inputs |
| cartography/components/draggable-selection/draggable-selection.component.ts | Default | Change to OnPush | Draggable selection component, handles node and drawing drag |
| cartography/components/drawing-adding/drawing-adding.component.ts | Default | Change to OnPush | Drawing add component, uses signal inputs |
| cartography/components/drawing-resizing/drawing-resizing.component.ts | Default | Change to OnPush | Drawing resize component |
| cartography/components/experimental-map/draggable/draggable.component.ts | Default | Change to OnPush | Draggable directive component, uses signal inputs |
| cartography/components/experimental-map/drawing/drawing.component.ts | Default | Change to OnPush | Drawing directive component, uses ChangeDetectorRef |
| cartography/components/experimental-map/drawing/drawings/ellipse/ellipse.component.ts | Default | Change to OnPush | Ellipse drawing component, uses signal inputs |
| cartography/components/experimental-map/drawing/drawings/image/image.component.ts | Default | Change to OnPush | Image drawing component, uses signal inputs |
| cartography/components/experimental-map/drawing/drawings/line/line.component.ts | Default | Change to OnPush | Line drawing component, uses signal inputs |
| cartography/components/experimental-map/drawing/drawings/rect/rect.component.ts | Default | Change to OnPush | Rectangle drawing component, uses signal inputs |
| cartography/components/experimental-map/drawing/drawings/text/text.component.ts | Default | Change to OnPush | Text drawing component, uses signal inputs and DoCheck |
| cartography/components/experimental-map/interface-label/interface-label.component.ts | Default | Change to OnPush | Interface label component, uses signal inputs and viewChild |
| cartography/components/experimental-map/link/link.component.ts | Default | Change to OnPush | Link component, mixed use of @Input and signal inputs |
| cartography/components/experimental-map/node/node.component.ts | ✅ OnPush | No change needed | Node component, already using OnPush, mixed use of decorators and signals |
| cartography/components/experimental-map/selection/selection.component.ts | ✅ OnPush | No change needed | Selection box component, already using OnPush, uses signal inputs |
| cartography/components/experimental-map/status/status.component.ts | Default | Change to OnPush | Status component, uses @Input setter and markForCheck |
| cartography/components/link-editing/link-editing.component.ts | Default | Change to OnPush | Link editing component, uses signal inputs |
| cartography/components/selection-control/selection-control.component.ts | ✅ OnPush | No change needed | Selection control component, already using OnPush |
| cartography/components/selection-select/selection-select.component.ts | ✅ OnPush | No change needed | Selection select component, already using OnPush |
| cartography/components/text-editor/text-editor.component.ts | Default | Change to OnPush | Text editor component, uses signals and viewChild |
| components/adbutler/adbutler.component.ts | Default | Change to OnPush | Ad component, uses signals |
| components/direct-link/direct-link.component.ts | Default | Change to OnPush | Direct link component, uses signals and forms |
| components/drawings-listeners/drawing-added/drawing-added.component.ts | Default | Change to OnPush | Drawing add listener, mixed use of @Input and signal |
| components/drawings-listeners/drawing-dragged/drawing-dragged.component.ts | Default | Change to OnPush | Drawing drag listener, uses signal inputs |
| components/drawings-listeners/drawing-resized/drawing-resized.component.ts | Default | Change to OnPush | Drawing resize listener, uses signal inputs |
| components/drawings-listeners/interface-label-dragged/interface-label-dragged.component.ts | Default | Change to OnPush | Interface label drag listener, uses signal inputs |
| components/drawings-listeners/link-created/link-created.component.ts | Default | Change to OnPush | Link create listener, mixed use of @Input and signal |
| components/drawings-listeners/node-dragged/node-dragged.component.ts | Default | Change to OnPush | Node drag listener, uses signal inputs |
| components/drawings-listeners/node-label-dragged/node-label-dragged.component.ts | Default | Change to OnPush | Node label drag listener, uses signal inputs |
| components/drawings-listeners/text-added/text-added.component.ts | Default | Change to OnPush | Text add listener, mixed use of @Input/@Output and signal |
| components/drawings-listeners/text-edited/text-edited.component.ts | Default | Change to OnPush | Text edit listener, uses signal inputs |
| components/help/help.component.ts | Default | Change to OnPush | Help component, uses signals |
| components/installed-software/install-software/install-software.component.ts | Default | Change to OnPush | Install software component, mixed use of @Input/@Output and signal |
| components/installed-software/installed-software.component.ts | Default | Change to OnPush | Installed software list component, uses signals and ChangeDetectorRef |
| components/page-not-found/page-not-found.component.ts | Default | Change to OnPush | 404 page component |
| components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component.ts | ✅ OnPush | No change needed | Cloud node add template component, already using OnPush |
| components/preferences/built-in/cloud-nodes/cloud-nodes-template-details/cloud-nodes-template-details.component.ts | ✅ OnPush | No change needed | Cloud node template details component, already using OnPush |
| components/preferences/built-in/cloud-nodes/cloud-nodes-templates/cloud-nodes-templates.component.ts | ✅ OnPush | No change needed | Cloud node template list component, already using OnPush and viewChild |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component.ts | ✅ OnPush | No change needed | Ethernet hub add template component, already using OnPush |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component.ts | ✅ OnPush | No change needed | Ethernet hub template details component, already using OnPush |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component.ts | ✅ OnPush | No change needed | Ethernet hub template list component, already using OnPush and viewChild |
| components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component.ts | ✅ OnPush | No change needed | Ethernet switch add template component, already using OnPush |
| components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component.ts | ✅ OnPush | No change needed | Ethernet switch template details component, already using OnPush, uses @ViewChild |
| components/preferences/built-in/ethernet-switches/ethernet-switches-templates/ethernet-switches-templates.component.ts | ✅ OnPush | No change needed | Ethernet switch template list component, already using OnPush and viewChild |
| components/preferences/built-in/built-in-preferences.component.ts | Default | Change to OnPush | Built-in preferences component, uses signal |
| components/preferences/common/delete-template-component/delete-template.component.ts | Default | Change to OnPush | Delete template component, mixed use of @Output and signal |
| components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component.ts | Default | Change to OnPush | Delete confirmation dialog component, uses signal |
| components/preferences/common/empty-templates-list/empty-templates-list.component.ts | Default | Change to OnPush | Empty template list component, uses signal input and computed |
| components/preferences/common/ports/ports.component.ts | Default | Change to OnPush | Port configuration component, mixed use of @Input and signal |
| components/preferences/common/symbols-menu/symbols-menu.component.ts | Default | Change to OnPush | Symbol selection menu component, mixed use of @Output and signal |
| components/preferences/common/symbols/symbols.component.ts | ✅ OnPush | No change needed | Symbol list component, already using OnPush |
| components/preferences/common/udp-tunnels/udp-tunnels.component.ts | Default | Change to OnPush | UDP tunnel configuration component, mixed use of @Input and signal |
| components/preferences/preferences.component.ts | Default | Change to OnPush | Preferences main component |
| filters/searchFilter.pipe.ts | N/A | N/A | Pipe component, no OnPush needed |
| components/controllers/controllers.component.ts | ✅ OnPush | No change needed | Controller list component, already using OnPush |
| components/controllers/add-controller-dialog/add-controller-dialog.component.ts | ✅ OnPush | No change needed | Add controller dialog component, already using OnPush |
| components/controllers/controller-discovery/controller-discovery.component.ts | Default | Change to OnPush | Controller discovery component, uses signal |
| components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component.ts | Default | Change to OnPush | Confirmation bottom sheet component, uses signal |
| components/projects/projects.component.ts | Default | Change to OnPush | Project list component, uses viewChild and ChangeDetectorRef |
| components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts | ✅ OnPush | No change needed | Add blank project dialog component, already using OnPush |
| components/projects/confirmation-dialog/confirmation-dialog.component.ts | Default | Change to OnPush | Confirmation dialog component, uses signal |
| components/projects/choose-name-dialog/choose-name-dialog.component.ts | ✅ OnPush | No change needed | Choose name dialog component, already using OnPush |
| components/projects/edit-project-dialog/edit-project-dialog.component.ts | ✅ OnPush | No change needed | Edit project dialog component, already using OnPush and viewChild |
| components/projects/import-project-dialog/import-project-dialog.component.ts | ✅ OnPush | No change needed | Import project dialog component, already using OnPush |
| components/projects/save-project-dialog/save-project-dialog.component.ts | ✅ OnPush | No change needed | Save project dialog component, already using OnPush |
| components/export-portable-project/export-portable-project.component.ts | Default | Change to OnPush | Export portable project component, uses signal |
| components/projects/edit-project-dialog/readme-editor/readme-editor.component.ts | ✅ OnPush | No change needed | README editor component, already using OnPush |
| components/projects/navigation-dialog/navigation-dialog.component.ts | ✅ OnPush | No change needed | Navigation dialog component, already using OnPush |
| components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts | Default | Change to OnPush | Delete all projects confirmation component, uses signal |
| components/template/template.component.ts | Default | Change to OnPush | Template component, uses signal inputs and @Output |
| components/template/template-list-dialog/template-list-dialog.component.ts | ✅ OnPush | No change needed | Template list dialog component, already using OnPush |
| components/settings/settings.component.ts | Default | Change to OnPush | Settings component |
| components/snapshots/list-of-snapshots/list-of-snapshots.component.ts | Default | Change to OnPush | Snapshot list component, uses signal and model |
| components/snapshots/snapshot-menu-item/snapshot-menu-item.component.ts | Default | Change to OnPush | Snapshot menu item component, uses signal inputs |
| components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component.ts | ✅ OnPush | No change needed | Create snapshot dialog component, already using OnPush |
| components/project-map/project-map.component.ts | ✅ OnPush | No change needed | Project map main component, already using OnPush, uses viewChild and MapChangeDetectorRef |
| components/project-map/change-hostname-dialog/change-hostname-dialog.component.ts | ✅ OnPush | No change needed | Change hostname dialog component, already using OnPush |
| components/project-map/change-symbol-dialog/change-symbol-dialog.component.ts | ✅ OnPush | No change needed | Change symbol dialog component, already using OnPush, uses @Input decorator |
| components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.ts | ✅ OnPush | No change needed | IdlePC dialog component, already using OnPush, uses @Input decorator |
| components/project-map/help-dialog/help-dialog.component.ts | ✅ OnPush | No change needed | Help dialog component, already using OnPush, uses @Input decorator |
| components/project-map/info-dialog/info-dialog.component.ts | ✅ OnPush | No change needed | Info dialog component, already using OnPush, uses @Input decorator |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | ✅ OnPush | No change needed | Screenshot dialog component, already using OnPush |
| components/project-map/project-map-menu/project-map-menu.component.ts | ✅ OnPush | No change needed | Project map menu component, already using OnPush, uses signal inputs and @Output |
| components/project-map/nodes-menu/nodes-menu.component.ts | ✅ OnPush | No change needed | Node menu component, already using OnPush, uses signal inputs |
| components/project-map/ai-chat/ai-chat.component.ts | ✅ OnPush | No change needed | AI chat component, already using OnPush, uses signal input and @Output/@HostListener |
| components/project-map/new-template-dialog/new-template-dialog.component.ts | ✅ OnPush | No change needed | New template dialog component, already using OnPush, uses @Input and viewChild |
| components/project-map/web-console/web-console.component.ts | Default | Change to OnPush | Web console component, uses signal inputs and viewChild |
| components/project-map/log-console/log-console.component.ts | ✅ OnPush | No change needed | Log console component, already using OnPush, uses @Input and signal input and viewChild |
| components/project-map/console-wrapper/console-wrapper.component.ts | Default | Change to OnPush | Console wrapper component, uses signal inputs, @Output and @HostListener |
| components/project-map/node-editors/configurator/ios/configurator-ios.component.ts | ✅ OnPush | No change needed | IOS config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts | ✅ OnPush | No change needed | QEMU config dialog component, already using OnPush, uses viewChild |
| components/project-map/draw-link-tool/draw-link-tool.component.ts | Default | Change to OnPush | Draw link tool component, uses signal input and viewChild |
| components/project-map/node-select-interface/node-select-interface.component.ts | Default | Change to OnPush | Node interface select component, uses signal input, @Output and viewChild |
| components/project-map/node-editors/configurator/atm_switch/configurator-atm-switch.component.ts | ✅ OnPush | No change needed | ATM switch config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/docker/configurator-docker.component.ts | ✅ OnPush | No change needed | Docker config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/iou/configurator-iou.component.ts | ✅ OnPush | No change needed | IOU config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/nat/configurator-nat.component.ts | ✅ OnPush | No change needed | NAT config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/switch/configurator-switch.component.ts | ✅ OnPush | No change needed | Switch config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component.ts | ✅ OnPush | No change needed | VPCS config dialog component, already using OnPush |
| components/project-map/node-editors/configurator/cloud/configurator-cloud.component.ts | ✅ OnPush | No change needed | Cloud config dialog component, already using OnPush, uses viewChild |
| components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component.ts | ✅ OnPush | No change needed | Ethernet switch config dialog component, already using OnPush, uses viewChild |
| components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component.ts | ✅ OnPush | No change needed | VirtualBox config dialog component, already using OnPush, uses viewChild |
| components/project-map/node-editors/configurator/vmware/configurator-vmware.component.ts | ✅ OnPush | No change needed | VMware config dialog component, already using OnPush, uses viewChild |
| components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component.ts | ✅ OnPush | No change needed | Ethernet Hub config dialog component, already using OnPush |
| components/project-map/context-menu/context-menu.component.ts | Default | Change to OnPush | Right-click menu component, uses @Input and @ViewChild |
| components/project-map/context-menu/dialogs/config-dialog/config-dialog.component.ts | Default | Change to OnPush | Config dialog component |
| components/project-map/context-console-menu/context-console-menu.component.ts | Default | Change to OnPush | Console menu component, uses signal input, @Input and viewChild |
| components/project-map/console-wrapper/console-devices-panel.component.ts | Default | Change to OnPush | Console devices panel component, uses signal input, @Output and signals |
| components/project-map/drawings-editors/text-editor/text-editor.component.ts | Default | Change to OnPush | Text editor dialog component, uses viewChild |
| components/project-map/drawings-editors/style-editor/style-editor.component.ts | Default | Change to OnPush | Style editor dialog component |
| components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts | Default | Change to OnPush | Link style editor dialog component |
| components/project-map/project-readme/project-readme.component.ts | Default | Change to OnPush | Project readme dialog component, uses viewChild |
| components/project-map/node-editors/config-editor/config-editor.component.ts | Default | Change to OnPush | Config editor dialog component |
| components/project-map/import-appliance/import-appliance.component.ts | Default | Change to OnPush | Import appliance dialog component, uses signal inputs |
| components/project-map/packet-capturing/start-capture/start-capture.component.ts | Default | Change to OnPush | Start capture dialog component |
| components/project-map/packet-capturing/packet-filters/packet-filters.component.ts | Default | Change to OnPush | Packet filter dialog component |
| components/project-map/nodes-menu/nodes-menu-confirmation-dialog/nodes-menu-confirmation-dialog.component.ts | Default | Change to OnPush | Node menu confirmation dialog component |
| components/project-map/project-map-menu/project-map-lock-confirmation-dialog/project-map-lock-confirmation-dialog.component.ts | Default | Change to OnPush | Project map lock confirmation dialog component |
| components/project-map/ai-chat/chat-message-list.component.ts | ✅ OnPush | No change needed | AI chat message list component, already using OnPush, uses signal inputs |
| components/project-map/ai-chat/chat-input-area.component.ts | Default | Change to OnPush | AI chat input area component, uses signal inputs and viewChild |
| components/project-map/ai-chat/chat-session-list.component.ts | Default | Change to OnPush | AI chat session list component, uses signal inputs and @Output |
| components/project-map/ai-chat/tool-call-display.component.ts | Default | Change to OnPush | AI chat tool call display component, uses signal inputs and @Output |
| components/project-map/ai-chat/tool-details-dialog.component.ts | Default | Change to OnPush | AI chat tool details dialog component, uses signal |
| components/project-map/context-menu/actions/console-device-action/console-device-action.component.ts | Default | Change to OnPush | Console device action component, uses signal inputs |
| components/project-map/context-menu/actions/console-device-action-browser/console-device-action-browser.component.ts | Default | Change to OnPush | Console device browser action component, uses signal inputs |
| components/project-map/context-menu/actions/http-console/http-console-action.component.ts | Default | Change to OnPush | HTTP console action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/http-console-new-tab/http-console-new-tab-action.component.ts | Default | Change to OnPush | HTTP console new tab action component, uses signal inputs |
| components/project-map/context-menu/actions/start-node-action/start-node-action.component.ts | Default | Change to OnPush | Start node action component, uses signal inputs |
| components/project-map/context-menu/actions/stop-node-action/stop-node-action.component.ts | Default | Change to OnPush | Stop node action component, uses signal inputs |
| components/project-map/context-menu/actions/suspend-node-action/suspend-node-action.component.ts | Default | Change to OnPush | Suspend node action component, uses signal inputs |
| components/project-map/context-menu/actions/reload-node-action/reload-node-action.component.ts | Default | Change to OnPush | Reload node action component, uses signal inputs |
| components/project-map/context-menu/actions/delete-action/delete-action.component.ts | Default | Change to OnPush | Delete action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/duplicate-action/duplicate-action.component.ts | Default | Change to OnPush | Duplicate action component, uses signal inputs |
| components/project-map/context-menu/actions/lock-action/lock-action.component.ts | Default | Change to OnPush | Lock action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/change-symbol/change-symbol-action.component.ts | Default | Change to OnPush | Change symbol action component, uses signal inputs |
| components/project-map/context-menu/actions/change-hostname/change-hostname-action.component.ts | Default | Change to OnPush | Change hostname action component, uses signal inputs |
| components/project-map/context-menu/actions/export-config/export-config-action.component.ts | Default | Change to OnPush | Export config action component, uses signal inputs |
| components/project-map/context-menu/actions/import-config/import-config-action.component.ts | Default | Change to OnPush | Import config action component, uses signal inputs, viewChild and markForCheck |
| components/project-map/context-menu/actions/edit-config/edit-config-action.component.ts | Default | Change to OnPush | Edit config action component, uses signal inputs |
| components/project-map/context-menu/actions/start-capture/start-capture-action.component.ts | Default | Change to OnPush | Start capture action component, uses signal inputs |
| components/project-map/context-menu/actions/stop-capture/stop-capture-action.component.ts | Default | Change to OnPush | Stop capture action component, uses signal inputs |
| components/project-map/context-menu/actions/start-capture-on-started-link/start-capture-on-started-link.component.ts | Default | Change to OnPush | Link start capture action component, uses signal inputs |
| components/project-map/context-menu/actions/packet-filters-action/packet-filters-action.component.ts | Default | Change to OnPush | Packet filter action component, uses signal inputs |
| components/project-map/context-menu/actions/show-node-action/show-node-action.component.ts | Default | Change to OnPush | Show node info action component, uses signal inputs |
| components/project-map/context-menu/actions/idle-pc-action/idle-pc-action.component.ts | Default | Change to OnPush | IdlePC action component, uses signal inputs |
| components/project-map/context-menu/actions/auto-idle-pc-action/auto-idle-pc-action.component.ts | Default | Change to OnPush | Auto IdlePC action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/config-action/config-action.component.ts | Default | Change to OnPush | Config node action component, uses signal inputs |
| components/project-map/context-menu/actions/edit-text-action/edit-text-action.component.ts | Default | Change to OnPush | Edit text action component, uses signal inputs |
| components/project-map/context-menu/actions/edit-style-action/edit-style-action.component.ts | Default | Change to OnPush | Edit style action component, uses signal inputs |
| components/project-map/context-menu/actions/edit-link-style-action/edit-link-style-action.component.ts | Default | Change to OnPush | Edit link style action component, uses signal inputs |
| components/project-map/context-menu/actions/isolate-node-action/isolate-node-action.component.ts | Default | Change to OnPush | Isolate node action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/unisolate-node-action/unisolate-node-action.component.ts | Default | Change to OnPush | Unisolate node action component, uses signal inputs |
| components/project-map/context-menu/actions/suspend-link/suspend-link-action.component.ts | Default | Change to OnPush | Suspend link action component, uses signal inputs |
| components/project-map/context-menu/actions/resume-link-action/resume-link-action.component.ts | Default | Change to OnPush | Resume link action component, uses signal inputs |
| components/project-map/context-menu/actions/reset-link/reset-link-action.component.ts | Default | Change to OnPush | Reset link action component, uses signal inputs |
| components/project-map/context-menu/actions/open-file-explorer/open-file-explorer-action.component.ts | Default | Change to OnPush | Open file explorer action component, uses signal inputs |
| components/project-map/context-menu/actions/move-layer-up-action/move-layer-up-action.component.ts | Default | Change to OnPush | Move layer up action component, uses signal inputs |
| components/project-map/context-menu/actions/move-layer-down-action/move-layer-down-action.component.ts | Default | Change to OnPush | Move layer down action component, uses signal inputs |
| components/project-map/context-menu/actions/align-horizontally/align-horizontally.component.ts | Default | Change to OnPush | Align horizontally action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/align_vertically/align-vertically.component.ts | Default | Change to OnPush | Align vertically action component, uses signal inputs and markForCheck |
| components/project-map/context-menu/actions/bring-to-front-action/bring-to-front-action.component.ts | Default | Change to OnPush | Bring to front action component, uses signal inputs and markForCheck |
| components/project-map/info-dialog/info-dialog.component.ts | ✅ OnPush | No change needed | Info dialog component, already using OnPush, uses @Input |
| components/project-map/help-dialog/help-dialog.component.ts | ✅ OnPush | No change needed | Help dialog component, already using OnPush, uses @Input |
| components/project-map/change-hostname-dialog/change-hostname-dialog.component.ts | ✅ OnPush | No change needed | Change hostname dialog component, already using OnPush |
| components/project-map/change-symbol-dialog/change-symbol-dialog.component.ts | ✅ OnPush | No change needed | Change symbol dialog component, already using OnPush |
| components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.ts | ✅ OnPush | No change needed | IdlePC dialog component, already using OnPush |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | ✅ OnPush | No change needed | Screenshot dialog component, already using OnPush |
| components/project-map/new-template-dialog/new-template-dialog.component.ts | ✅ OnPush | No change needed | New template dialog component, already using OnPush, uses @Input and viewChild |
| components/project-map/project-map.component.ts | ✅ OnPush | No change needed | Project map main component, already using OnPush, uses viewChild and MapChangeDetectorRef |
| components/project-map/web-console/web-console.component.ts | Default | Change to OnPush | Web console component, uses signal inputs and viewChild |
| components/project-map/log-console/log-console.component.ts | ✅ OnPush | No change needed | Log console component, already using OnPush, uses @Input and signal input and viewChild |
| components/project-map/console-wrapper/console-wrapper.component.ts | Default | Change to OnPush | Console wrapper component, uses signal inputs, @Output and @HostListener |
| components/project-map/draw-link-tool/draw-link-tool.component.ts | Default | Change to OnPush | Draw link tool component, uses signal input and viewChild |
| components/project-map/node-select-interface/node-select-interface.component.ts | Default | Change to OnPush | Node interface select component, uses signal input, @Output and viewChild |
| components/project-map/import-appliance/import-appliance.component.ts | Default | Change to OnPush | Import appliance dialog component, uses signal inputs |
| components/project-map/project-readme/project-readme.component.ts | Default | Change to OnPush | Project readme dialog component, uses viewChild |
| components/project-map/drawings-editors/text-editor/text-editor.component.ts | Default | Change to OnPush | Text editor dialog component, uses viewChild |
| components/project-map/drawings-editors/style-editor/style-editor.component.ts | Default | Change to OnPush | Style editor dialog component |
| components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts | Default | Change to OnPush | Link style editor dialog component |
| components/project-map/node-editors/config-editor/config-editor.component.ts | Default | Change to OnPush | Config editor dialog component |
| components/project-map/packet-capturing/start-capture/start-capture.component.ts | Default | Change to OnPush | Start capture dialog component |
| components/project-map/packet-capturing/packet-filters/packet-filters.component.ts | Default | Change to OnPush | Packet filter dialog component |
| components/project-map/nodes-menu/nodes-menu-confirmation-dialog/nodes-menu-confirmation-dialog.component.ts | Default | Change to OnPush | Node menu confirmation dialog component |
| components/project-map/project-map-menu/project-map-lock-confirmation-dialog/project-map-lock-confirmation-dialog.component.ts | Default | Change to OnPush | Project map lock confirmation dialog component |
| components/project-map/context-menu/context-menu.component.ts | Default | Change to OnPush | Right-click menu component, uses @Input and @ViewChild |
| components/project-map/context-menu/dialogs/config-dialog/config-dialog.component.ts | Default | Change to OnPush | Config dialog component |
| components/project-map/context-console-menu/context-console-menu.component.ts | Default | Change to OnPush | Console menu component, uses signal input, @Input and viewChild |
| components/project-map/console-wrapper/console-devices-panel.component.ts | Default | Change to OnPush | Console devices panel component, uses signal input, @Output and signals |
| components/project-map/node-editors/configurator/qemu/qemu-image-creator/qemu-image-creator.component.ts | Default | Change to OnPush | QEMU image creator component |
| components/topology-summary/topology-summary.component.ts | Default | Change to OnPush | Topology summary component |
| components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts | ✅ OnPush | No change needed | Add blank project dialog component, already using OnPush |
| components/projects/confirmation-dialog/confirmation-dialog.component.ts | Default | Change to OnPush | Confirmation dialog component, uses signals |
| components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component.ts | Default | Change to OnPush | Confirmation bottom sheet component, uses signals |
| components/projects/edit-project-dialog/edit-project-dialog.component.ts | ✅ OnPush | No change needed | Edit project dialog component, already using OnPush, uses viewChild |
| components/projects/import-project-dialog/import-project-dialog.component.ts | ✅ OnPush | No change needed | Import project dialog component, already using OnPush |
| components/projects/navigation-dialog/navigation-dialog.component.ts | ✅ OnPush | No change needed | Navigation dialog component, already using OnPush |
| components/projects/save-project-dialog/save-project-dialog.component.ts | ✅ OnPush | No change needed | Save project dialog component, already using OnPush |
| components/projects/edit-project-dialog/readme-editor/readme-editor.component.ts | ✅ OnPush | No change needed | README editor component, already using OnPush, uses signal inputs |
| components/snapshots/snapshot-menu-item/snapshot-menu-item.component.ts | Default | Change to OnPush | Snapshot menu item component, uses signal inputs |
| components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component.ts | ✅ OnPush | No change needed | Create snapshot dialog component, already using OnPush |
| components/template/template-list-dialog/template-list-dialog.component.ts | ✅ OnPush | No change needed | Template list dialog component, already using OnPush |
| components/template/template.component.ts | Default | Change to OnPush | Template component, uses signal input and @Output |
| common/progress-dialog/progress-dialog.component.ts | Default | Change to OnPush | Progress dialog component, uses signals |
| common/progress/progress.component.ts | Default | Change to OnPush | Progress component, uses signals |
| common/uploading-processbar/uploading-processbar.component.ts | Default | Change to OnPush | Upload progress bar component, uses signals |
| components/projects/choose-name-dialog/choose-name-dialog.component.ts | ✅ OnPush | No change needed | Choose name dialog component, already using OnPush, uses @Input |
| components/projects/projects.component.ts | Default | Change to OnPush | Project list component, uses viewChild |
| components/settings/settings.component.ts | Default | Change to OnPush | Settings component |
| components/controllers/controllers.component.ts | ✅ OnPush | No change needed | Controller list component, already using OnPush, uses @ViewChild |
| components/preferences/preferences.component.ts | Default | Change to OnPush | Preferences component |
| components/user-management/user-management.component.ts | ✅ OnPush | No change needed | User management component, already using OnPush, uses @ViewChildren |
| components/user-management/user-detail/user-detail.component.ts | Default | Change to OnPush | User detail component |
| components/export-portable-project/export-portable-project.component.ts | Default | Change to OnPush | Export portable project component, uses signals |
| components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts | Default | Change to OnPush | Confirm delete all projects component, uses signals |
| components/preferences/common/symbols/symbols.component.ts | ✅ OnPush | No change needed | Symbols component, already using OnPush, uses signal input and @Output |
| components/project-map/project-map-menu/project-map-menu.component.ts | ✅ OnPush | No change needed | Project map menu component, already using OnPush, uses signal input and @Output |
| components/project-map/ai-chat/ai-chat.component.ts | ✅ OnPush | No change needed | AI chat component, already using OnPush, uses signal input, @Input and @Output |
| components/project-map/nodes-menu/nodes-menu.component.ts | ✅ OnPush | No change needed | Node menu component, already using OnPush, uses signal inputs |
| components/preferences/built-in/cloud-nodes/cloud-nodes-templates/cloud-nodes-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/built-in/ethernet-switches/ethernet-switches-templates/ethernet-switches-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/docker/docker-templates/docker-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/dynamips/ios-templates/ios-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 18), uses viewChild |
| components/preferences/ios-on-unix/iou-templates/iou-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/qemu/qemu-vm-templates/qemu-vm-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/virtual-box/virtual-box-templates/virtual-box-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 18), uses viewChild |
| components/preferences/vmware/vmware-templates/vmware-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/preferences/vpcs/vpcs-templates/vpcs-templates.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 17), uses viewChild |
| components/acl-management/add-ace-dialog/add-ace-dialog.component.ts | ✅ OnPush | No change needed | Add ACE dialog component, already using OnPush |
| components/project-map/node-editors/configurator/atm_switch/configurator-atm-switch.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 19) |
| components/project-map/node-editors/configurator/cloud/configurator-cloud.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 31) |
| components/project-map/node-editors/configurator/docker/configurator-docker.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 25) |
| components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 19) |
| components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 28) |
| components/project-map/node-editors/configurator/ios/configurator-ios.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 22) |
| components/project-map/node-editors/configurator/iou/configurator-iou.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 22) |
| components/project-map/node-editors/configurator/nat/configurator-nat.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 18) |
| components/project-map/node-editors/configurator/switch/configurator-switch.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 18) |
| components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 21) |
| components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 34) |
| components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 30) |
| components/project-map/node-editors/configurator/vmware/configurator-vmware.component.ts | ✅ OnPush | Needs change (shared styles) | Can delete (line 30) |
| components/acl-management/delete-ace-dialog/delete-ace-dialog.component.ts | ✅ OnPush | No change needed | Delete ACE dialog component, already using OnPush |
| components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component.ts | ✅ OnPush | No change needed | Add user to group dialog component, already using OnPush, uses ChangeDetectorRef.markForCheck() |
| components/group-details/remove-to-group-dialog/remove-to-group-dialog.component.ts | ✅ OnPush | No change needed | Remove user from group dialog component, already using OnPush |
| components/group-details/remove-user-to-group-dialog/remove-user-to-group-dialog.component.ts | ✅ OnPush | No change needed | Remove specific user from group dialog component, already using OnPush |
| components/group-management/add-group-dialog/add-group-dialog.component.ts | ✅ OnPush | No change needed | Add group dialog component, already using OnPush, uses ChangeDetectorRef.markForCheck() |

---

## Statistics Summary

- **Scanned Components**: 253/253 (100% ✅)
- **Needs OnPush Change**: 147 components
- **Already OnPush**: 105 components
- **Others (Pipes, etc.)**: 1 component

---

**✅ Component scanning completed!**




## Phase 2: Syntax Optimization (Optional)

### Overview

Upgrade components to Angular 21 recommended modern syntax to improve code quality and consistency.

### 2.1 Component Syntax Optimization

| Component | styleUrls → styleUrl | @HostBinding → host | Remove standalone: true |
|-----------|---------------------|-------------------|---------------------|
| app.component.ts | Needs change (plural to singular) | Needs change (to host object) | Can delete (line 14) |
| common/progress/progress.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| common/progress-dialog/progress-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| common/uploading-processbar/uploading-processbar.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 9) |
| layouts/default-layout/default-layout.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 25) |
| cartography/components/d3-map/d3-map.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 45) |
| cartography/components/experimental-map/experimental-map.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 34) |
| cartography/components/draggable-selection/draggable-selection.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 23) |
| cartography/components/drawing-adding/drawing-adding.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| cartography/components/drawing-resizing/drawing-resizing.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 10) |
| cartography/components/experimental-map/draggable/draggable.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| cartography/components/experimental-map/drawing/drawing.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| cartography/components/experimental-map/drawing/drawings/ellipse/ellipse.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| cartography/components/experimental-map/drawing/drawings/image/image.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 5) |
| cartography/components/experimental-map/drawing/drawings/line/line.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| cartography/components/experimental-map/drawing/drawings/rect/rect.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| cartography/components/experimental-map/drawing/drawings/text/text.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 7) |
| cartography/components/experimental-map/interface-label/interface-label.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| cartography/components/experimental-map/link/link.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 24) |
| cartography/components/experimental-map/node/node.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 28) |
| cartography/components/experimental-map/selection/selection.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| cartography/components/experimental-map/status/status.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 4) |
| cartography/components/link-editing/link-editing.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 9) |
| cartography/components/selection-control/selection-control.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 10) |
| cartography/components/selection-select/selection-select.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 7) |
| cartography/components/text-editor/text-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 35) |
| components/adbutler/adbutler.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| components/direct-link/direct-link.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| components/drawings-listeners/drawing-added/drawing-added.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/drawings-listeners/drawing-dragged/drawing-dragged.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/drawings-listeners/drawing-resized/drawing-resized.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/drawings-listeners/interface-label-dragged/interface-label-dragged.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| components/drawings-listeners/link-created/link-created.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 15) |
| components/drawings-listeners/node-dragged/node-dragged.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/drawings-listeners/node-label-dragged/node-label-dragged.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/drawings-listeners/text-added/text-added.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 16) |
| components/drawings-listeners/text-edited/text-edited.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/help/help.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 10) |
| components/installed-software/install-software/install-software.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| components/installed-software/installed-software.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 11) |
| components/page-not-found/page-not-found.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 4) |
| components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component.ts | Needs change (array to singular) | No change needed | Can delete (line 22) |
| components/preferences/built-in/cloud-nodes/cloud-nodes-template-details/cloud-nodes-template-details.component.ts | Needs change (array to singular) | No change needed | Can delete (line 26) |
| components/preferences/built-in/cloud-nodes/cloud-nodes-templates/cloud-nodes-templates.component.ts | Needs change (array to singular) | No change needed | Can delete (line 17) |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component.ts | Needs change (array to singular) | No change needed | Can delete (line 22) |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component.ts | Needs change (array to singular) | No change needed | Can delete (line 22) |
| components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component.ts | Needs change (array to singular) | No change needed | Can delete (line 17) |
| components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component.ts | Needs change (array to singular) | No change needed | Can delete (line 22) |
| components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component.ts | Needs change (array to singular) | No change needed | Can delete (line 24) |
| components/preferences/built-in/ethernet-switches/ethernet-switches-templates/ethernet-switches-templates.component.ts | Needs change (array to singular) | No change needed | Can delete (line 17) |
| components/preferences/built-in/built-in-preferences.component.ts | Needs change (array to singular) | No change needed | Can delete (line 9) |
| components/preferences/common/delete-template-component/delete-template.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 9) |
| components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 9) |
| components/preferences/common/empty-templates-list/empty-templates-list.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/preferences/common/ports/ports.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| components/preferences/common/symbols-menu/symbols-menu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/preferences/common/symbols/symbols.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 25) |
| components/preferences/common/udp-tunnels/udp-tunnels.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/preferences/preferences.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 9) |
| filters/searchFilter.pipe.ts | No change needed | No change needed | No change needed |
| components/controllers/controllers.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 25) |
| components/controllers/add-controller-dialog/add-controller-dialog.component.ts | No change needed | No change needed | Can delete (line 15) |
| components/controllers/controller-discovery/controller-discovery.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 16) |
| components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/projects/projects.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 34) |
| components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/projects/confirmation-dialog/confirmation-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 7) |
| components/projects/choose-name-dialog/choose-name-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/projects/edit-project-dialog/edit-project-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 36) |
| components/projects/import-project-dialog/import-project-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 24) |
| components/projects/save-project-dialog/save-project-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 16) |
| components/export-portable-project/export-portable-project.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| components/projects/edit-project-dialog/readme-editor/readme-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 20) |
| components/projects/navigation-dialog/navigation-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| components/template/template.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 26) |
| components/template/template-list-dialog/template-list-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| components/settings/settings.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 16) |
| components/snapshots/list-of-snapshots/list-of-snapshots.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| components/snapshots/snapshot-menu-item/snapshot-menu-item.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/project-map/project-map.component.ts | Needs change (plural to singular) | Needs change (@HostListener to host object) | Can delete (line 125) |
| components/project-map/change-hostname-dialog/change-hostname-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/project-map/change-symbol-dialog/change-symbol-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/help-dialog/help-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/project-map/info-dialog/info-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 11) |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/project-map-menu/project-map-menu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 41) |
| components/project-map/nodes-menu/nodes-menu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/project-map/ai-chat/ai-chat.component.ts | Needs change (plural to singular) | Needs change (@HostListener to host object) | Can delete (line 47) |
| components/project-map/new-template-dialog/new-template-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 56) |
| components/project-map/web-console/web-console.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 26) |
| components/project-map/log-console/log-console.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 40) |
| components/project-map/console-wrapper/console-wrapper.component.ts | Needs change (plural to singular) | Needs change (@HostListener to host object) | Can delete (line 37) |
| components/project-map/node-editors/configurator/ios/configurator-ios.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| components/project-map/node-editors/configurator/qemu/configurator-qemu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 34) |
| components/project-map/draw-link-tool/draw-link-tool.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 17) |
| components/project-map/node-select-interface/node-select-interface.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 11) |
| components/project-map/node-editors/configurator/atm_switch/configurator-atm-switch.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/project-map/node-editors/configurator/docker/configurator-docker.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 25) |
| components/project-map/node-editors/configurator/iou/configurator-iou.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| components/project-map/node-editors/configurator/nat/configurator-nat.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 18) |
| components/project-map/node-editors/configurator/switch/configurator-switch.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 18) |
| components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 21) |
| components/project-map/node-editors/configurator/cloud/configurator-cloud.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 31) |
| components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 28) |
| components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 30) |
| components/project-map/node-editors/configurator/vmware/configurator-vmware.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 30) |
| components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/project-map/context-menu/context-menu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 52) |
| components/project-map/context-menu/dialogs/config-dialog/config-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 6) |
| components/project-map/context-console-menu/context-console-menu.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 29) |
| components/project-map/console-wrapper/console-devices-panel.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/project-map/drawings-editors/text-editor/text-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 37) |
| components/project-map/drawings-editors/style-editor/style-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 26) |
| components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 21) |
| components/project-map/project-readme/project-readme.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| components/project-map/node-editors/config-editor/config-editor.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 12) |
| components/project-map/import-appliance/import-appliance.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 18) |
| components/project-map/packet-capturing/start-capture/start-capture.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 22) |
| components/project-map/packet-capturing/packet-filters/packet-filters.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 19) |
| components/project-map/nodes-menu/nodes-menu-confirmation-dialog/nodes-menu-confirmation-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 7) |
| components/project-map/project-map-menu/project-map-lock-confirmation-dialog/project-map-lock-confirmation-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 7) |
| components/project-map/ai-chat/chat-message-list.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 31) |
| components/project-map/ai-chat/chat-input-area.component.ts | No change needed (inline styles) | No change needed | Can delete (line 33) |
| components/project-map/ai-chat/chat-session-list.component.ts | No change needed (inline styles) | No change needed | Can delete (line 23) |
| components/project-map/ai-chat/tool-call-display.component.ts | No change needed (inline styles) | No change needed | Can delete (line 12) |
| components/project-map/ai-chat/tool-details-dialog.component.ts | No change needed (inline styles) | No change needed | Can delete (line 22) |
| components/project-map/context-menu/actions/console-device-action/console-device-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/actions/console-device-action-browser/console-device-action-browser.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 16) |
| components/project-map/context-menu/actions/http-console/http-console-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 14) |
| components/project-map/context-menu/actions/http-console-new-tab/http-console-new-tab-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/actions/start-node-action/start-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/stop-node-action/stop-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/suspend-node-action/suspend-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/reload-node-action/reload-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/delete-action/delete-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 20) |
| components/project-map/context-menu/actions/duplicate-action/duplicate-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 16) |
| components/project-map/context-menu/actions/lock-action/lock-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 16) |
| components/project-map/context-menu/actions/change-symbol/change-symbol-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/change-hostname/change-hostname-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/export-config/export-config-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/actions/import-config/import-config-action.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/actions/edit-config/edit-config-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 12) |
| components/project-map/context-menu/actions/start-capture/start-capture-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 12) |
| components/project-map/context-menu/actions/stop-capture/stop-capture-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/start-capture-on-started-link/start-capture-on-started-link.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/packet-filters-action/packet-filters-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 12) |
| components/project-map/context-menu/actions/show-node-action/show-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/idle-pc-action/idle-pc-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 13) |
| components/project-map/context-menu/actions/auto-idle-pc-action/auto-idle-pc-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 12) |
| components/project-map/context-menu/actions/config-action/config-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 23) |
| components/project-map/context-menu/actions/edit-text-action/edit-text-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 15) |
| components/project-map/context-menu/actions/edit-style-action/edit-style-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/edit-link-style-action/edit-link-style-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/isolate-node-action/isolate-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/unisolate-node-action/unisolate-node-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/suspend-link/suspend-link-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/resume-link-action/resume-link-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/reset-link/reset-link-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/actions/open-file-explorer/open-file-explorer-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 9) |
| components/project-map/context-menu/actions/move-layer-up-action/move-layer-up-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 14) |
| components/project-map/context-menu/actions/move-layer-down-action/move-layer-down-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 14) |
| components/project-map/context-menu/actions/align-horizontally/align-horizontally.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/align_vertically/align-vertically.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 11) |
| components/project-map/context-menu/actions/bring-to-front-action/bring-to-front-action.component.ts | No change needed (using templateUrl) | No change needed | Can delete (line 14) |
| components/project-map/info-dialog/info-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 11) |
| components/project-map/help-dialog/help-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 8) |
| components/project-map/change-hostname-dialog/change-hostname-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 14) |
| components/project-map/change-symbol-dialog/change-symbol-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 10) |
| components/project-map/context-menu/dialogs/idle-pc-dialog/idle-pc-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
| components/project-map/screenshot-dialog/screenshot-dialog.component.ts | Needs change (plural to singular) | No change needed | Can delete (line 13) |
