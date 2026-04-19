<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md). 



# Web Wireshark

## Architecture Overview

```mermaid
graph TB
    subgraph Browser["GNS3 Web UI"]
        PM["ProjectMapComponent"]
        CM["ContextMenuComponent"]
        SC["StartCaptureDialogComponent"]
        WWA["StartWebWiresharkAction"]
        WIA["StartWebWiresharkInlineAction"]
        WI["WebWiresharkInlineComponent"]
    end

    subgraph Services["Service Layer"]
        LS["LinkService"]
        XCS["XpraConsoleService"]
        WMS["WindowManagementService"]
        WBS["WindowBoundaryService"]
        PCS["PacketCaptureService"]
    end

    subgraph Backend["GNS3 Controller"]
        API["REST API"]
        WS["WebSocket Server"]
    end

    subgraph Compute["Compute Node"]
        TD["tcpdump"]
    end

    CM --> SC
    CM --> WWA
    CM --> WIA
    SC --> LS
    SC --> PCS
    WWA --> XCS
    WIA --> PM
    PM --> WI
    WI --> XCS
    WI --> LS
    WI --> WMS
    WI --> WBS
    LS --> API
    XCS -.->|builds URL| WS
    API --> TD
    TD -->|pcap stream| WS
    WS -->|binary frames| WI
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| ProjectMapComponent | Manages inline window lifecycle (open/close/z-index), tracks open windows via `Map<linkId, Link>` |
| ContextMenuComponent | Shows capture actions based on link state (capturing/not capturing) |
| StartCaptureDialogComponent | Configures capture settings (file name, link type, Web Wireshark toggle) |
| StartWebWiresharkAction | Opens Web Wireshark in new browser tab via xpra-html5 |
| StartWebWiresharkInlineAction | Emits event to ProjectMapComponent to open inline window |
| WebWiresharkInlineComponent | Draggable/resizable iframe container for xpra-html5, manages window UI state |

### Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| LinkService | HTTP communication with controller for capture start/stop/restart |
| XpraConsoleService | Builds WebSocket URLs and xpra-html5 page URLs from controller/link data |
| WindowManagementService | Tracks minimized window state via Angular signal, shared across all window types |
| WindowBoundaryService | Constrains window position/size to viewport boundaries |
| PacketCaptureService | Opens native Wireshark via `gns3+pcap://` protocol handler |

---

## Flow Description

### Capture Start with Web Wireshark

```mermaid
sequenceDiagram
    participant User
    participant ContextMenu
    participant Dialog as StartCaptureDialog
    participant LS as LinkService
    participant API as GNS3 Controller
    participant Compute

    User->>ContextMenu: Right-click link
    User->>ContextMenu: Select "Start Capture"
    ContextMenu->>Dialog: Open dialog
    User->>Dialog: Configure settings + check Web Wireshark
    Dialog->>Dialog: Validate running devices exist on link
    Dialog->>LS: startCaptureOnLink(controller, link, settings)
    LS->>API: POST /v3/projects/{pid}/links/{lid}/capture/start
    API->>Compute: Start tcpdump on link interface
    Compute-->>API: Capture started
    API-->>LS: Updated Link (with capture_file_path)
    LS-->>Dialog: Response
    Dialog->>Dialog: If "Start program" checked: PacketCaptureService.startCapture()
    Dialog->>Dialog: Close dialog
```

### Web Wireshark New Tab Mode

```mermaid
sequenceDiagram
    participant User
    participant WWA as StartWebWiresharkAction
    participant XCS as XpraConsoleService
    participant Browser

    User->>WWA: Click "Start Web Wireshark"
    WWA->>XCS: buildXpraWebSocketUrlForWebWireshark(controller, link)
    XCS-->>WWA: ws://{host}:{port}/v3/projects/{pid}/links/{lid}/capture/web-wireshark?token={token}
    WWA->>XCS: buildXpraConsolePageUrl(wsUrl)
    XCS-->>WWA: /assets/xpra-html5/index.html?server=...&port=...&path=...
    WWA->>Browser: window.open(pageUrl, '_blank')
    Browser->>Browser: Load xpra-html5, connect WebSocket, display Wireshark UI
```

### Web Wireshark Inline Mode

```mermaid
sequenceDiagram
    participant User
    participant WIA as StartWebWiresharkInlineAction
    participant PM as ProjectMapComponent
    participant WI as WebWiresharkInlineComponent
    participant XCS as XpraConsoleService
    participant WMS as WindowManagementService

    User->>WIA: Click "Open Web Wireshark (Inline)"
    WIA->>PM: emit openWebWiresharkInline(link, controller, project)
    PM->>PM: Check if window already open for link
    PM->>PM: Increment zIndexCounter, assign z-index
    PM->>PM: webWiresharkInlineWindows.set(linkId, link)
    PM->>WI: Create component with inputs (link, controller, project, zIndex)
    WI->>WBS: setConfig(minWidth:800, minHeight:600, maxWidth:1920, maxHeight:1080)
    WI->>XCS: buildXpraWebSocketUrlForWebWireshark(controller, link)
    WI->>XCS: buildXpraConsolePageUrl(wsUrl)
    WI->>WI: Set iframe src to xpra page URL
    WI->>WI: setupDragHandling() via RxJS fromEvent
```

### Inline Window Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Normal: Create window
    Normal --> Minimized: toggleMinimize()
    Minimized --> Normal: toggleMinimize()
    Normal --> [*]: close() - emit closeWindow
    Minimized --> [*]: close() - restoreWindow + emit closeWindow

    note right of Normal
        Draggable (header)
        Resizable (800x800 min, 1920x1080 max)
        z-index managed by ProjectMapComponent
    end note

    note right of Minimized
        Collapsed to header bar
        Shown as taskbar icon
        WebSocket remains active
    end note
```

### Restart Capture Flow

```mermaid
sequenceDiagram
    participant User
    participant WI as WebWiresharkInlineComponent
    participant LS as LinkService
    participant API as GNS3 Controller

    User->>WI: Click restart button
    WI->>WI: Set isRestarting = true
    WI->>LS: restartWiresharkCapture(controller, link)
    LS->>API: POST /v3/projects/{pid}/links/{lid}/capture/wireshark/restart
    API-->>LS: { status, ws_url }
    LS-->>WI: Response
    WI->>WI: Set isRestarting = false
    WI->>WI: Rebuild xpra URL (buildWiresharkUrl)
    WI->>WI: Set isLoading = true, reload iframe
```

### Stop Capture Flow

```mermaid
sequenceDiagram
    participant User
    participant CM as ContextMenu
    participant SA as StopCaptureAction
    participant LS as LinkService
    participant API as GNS3 Controller
    participant Compute

    User->>CM: Right-click capturing link
    CM->>SA: Show "Stop Capture" option
    User->>SA: Click "Stop Capture"
    SA->>LS: stopCaptureOnLink(controller, link)
    LS->>API: POST /v3/projects/{pid}/links/{lid}/capture/stop
    API->>Compute: Stop tcpdump process
    Compute-->>API: Stopped
    API-->>LS: 200 OK
    API->>API: Close WebSocket connections
```

---

## Implementation Logic

### Z-Index Management

Z-index is managed directly by `ProjectMapComponent`, not by `WindowManagementService`. The component maintains a `zIndexCounter` starting at 0 and a `baseZIndex` of 1000. Each new window (Wireshark, console, web console) increments the counter and gets `baseZIndex + zIndexCounter` as its z-index. When a window is focused, the counter increments again and the window receives the new highest value. This ensures the most recently focused window is always on top.

The z-index state is stored in `Map<linkId, zIndex>` maps (`webWiresharkInlineZIndex`, `webConsoleInlineZIndex`) and passed to child components via signal inputs.

### Window Boundary Constraint

`WindowBoundaryService` provides reusable viewport boundary logic. `WebWiresharkInlineComponent` configures it with the actual constraints: minimum size 800x600, maximum size 1920x1080, plus a top offset equal to the toolbar height (64px desktop, 56px mobile). During drag, the component uses `Renderer2` to apply position directly to DOM for performance, bypassing Angular change detection on every mouse move. Iframe pointer events are disabled during drag/resize to prevent iframe from stealing mouse events.

### Minimized State Management

`WindowManagementService` is a signal-based service (`providedIn: 'root'`) that tracks only the minimized window list. Its `MinimizedWindow` interface stores `id` (format: `wireshark-{linkId}`), `type` (`'console' | 'wireshark'`), and optional `linkId`. The `WebWiresharkInlineComponent` uses an `effect()` to sync its local `isMinimizedSignal` with the service state. Minimized windows appear as taskbar icons at the bottom of the project map, with positions calculated by `ProjectMapComponent.getWiresharkTaskbarLeft()`.

### xpra URL Construction

`XpraConsoleService` handles the two-step URL construction:

1. **WebSocket URL**: Converts controller protocol (`http`/`https`) to WebSocket protocol (`ws`/`wss`), then builds: `{ws|wss}://{host}:{port}/v3/projects/{pid}/links/{lid}/capture/web-wireshark?token={authToken}`

2. **xpra-html5 page URL**: Parses the WebSocket URL to extract `server`, `port`, `ssl`, `path+query`, then builds: `/assets/xpra-html5/index.html?server={server}&port={port}&ssl={ssl}&path={path}?token={token}&sound=true&clipboard=true&encoding=h264`

The page URL is marked as safe via `DomSanitizer.bypassSecurityTrustResourceUrl()` before being set as iframe `src`.

### Capture Dialog Logic

`StartCaptureDialogComponent` supports two modes controlled by the `webWireshark` model signal. When Web Wireshark is checked, the dialog shows a loading spinner during the API call and provides detailed error messages for HTTP 409 (capture already running), 404 (link not found), and 403 (permission denied) status codes. The dialog also checks if at least one node on the link is running before submitting. The auto-generated file name format is `{sourceNode}_{sourcePort}_to_{targetNode}_{targetPort}` with non-alphanumeric characters stripped.

### Key Source Files

| File | Purpose |
|------|---------|
| `src/app/components/project-map/web-wireshark-inline/web-wireshark-inline.component.ts` | Inline window component |
| `src/app/components/project-map/context-menu/actions/start-web-wireshark-action/` | New tab action |
| `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/` | Inline action |
| `src/app/components/project-map/packet-capturing/start-capture/` | Capture configuration dialog |
| `src/app/services/xpra-console.service.ts` | xpra URL builder |
| `src/app/services/link.service.ts` | Capture REST API calls |
| `src/app/services/window-management.service.ts` | Minimized state tracking |
| `src/app/services/window-boundary.service.ts` | Viewport boundary constraints |
| `src/app/services/packet-capture.service.ts` | Native Wireshark launch |
| `src/app/models/capturingSettings.ts` | Capture settings model |
