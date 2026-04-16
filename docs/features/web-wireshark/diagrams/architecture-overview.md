# Web Wireshark - Architecture Diagrams

## Table of Contents
- [System Architecture](#system-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Service Layer](#service-layer)
- [Data Flow](#data-flow)
- [State Management](#state-management)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Layer                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  GNS3 Web UI Application                │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           Project Map Component                   │  │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │   │
│  │  │  │  Context   │  │   Start    │  │   Inline   │  │  │   │
│  │  │  │   Menu     │  │  Capture   │  │   Window   │  │  │   │
│  │  │  └────────────┘  └────────────┘  └────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │               Services Layer                      │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │   │
│  │  │  │   Link   │  │   Xpra   │  │   Window     │   │  │   │
│  │  │  │ Service  │  │ Console  │  │ Management   │   │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────────┘   │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              │ HTTP/WebSocket                 │
│                              ▼                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      GNS3 Controller Layer                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Capture Management System                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Capture    │  │    File      │  │   WebSocket   │  │   │
│  │  │   Controller │  │   Manager    │  │   Endpoint    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              │ Compute API                    │
│                              ▼                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Compute Nodes Layer                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Node 1     │  │   Node 2     │  │   Node 3     │       │
│  │  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │       │
│  │  │ tcpdump │ │  │  │ tcpdump │ │  │  │ tcpdump │ │       │
│  │  └─────────┘ │  │  └─────────┘ │  │  └─────────┘ │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Browser Layer
- **UI Rendering**: Display project map, links, nodes
- **User Interaction**: Handle clicks, drags, context menus
- **State Management**: Track window states, capture states
- **WebSocket Client**: Receive and display packet data

#### Controller Layer
- **API Gateway**: RESTful API endpoints
- **Authentication**: Token validation
- **Authorization**: Permission checks
- **Capture Orchestration**: Start/stop tcpdump processes
- **WebSocket Server**: Stream pcap data

#### Compute Layer
- **Packet Capture**: Run tcpdump on network interfaces
- **File Management**: Store pcap files
- **Data Streaming**: Send pcap data to controller

---

## Component Hierarchy

### Project Map Component Tree

```
ProjectMapComponent
├── ContextMenuComponent
│   ├── StartCaptureAction
│   ├── StopCaptureAction
│   ├── StartWebWiresharkAction
│   │   └── (Opens new browser tab)
│   └── StartWebWiresharkInlineAction
│       └── (Opens inline window)
│
├── WebWiresharkInlineComponent (Dynamic)
│   ├── WindowHeader
│   │   ├── Title
│   │   ├── MinimizeButton
│   │   └── CloseButton
│   └── IframeContainer
│       └── xpra-html5 (External)
│
├── StartCaptureDialogComponent
│   ├── FormFields
│   │   ├── LinkTypeSelect
│   │   ├── FileNameInput
│   │   └── WebWiresharkCheckbox
│   └── ActionButtons
│       ├── StartButton
│       └── CancelButton
│
└── LinkComponent (Multiple)
    ├── LinkSvg
    ├── CapturingIndicator
    └── Label
```

### Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectMapComponent                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ContextMenuComponent                     │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         StartWebWiresharkInlineAction           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                      │                              │  │
│  │                      │ emits                        │  │
│  │                      ▼                              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         WebWiresharkInlineComponent             │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │         xpra-html5 (iframe)              │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services (Injected)                     │  │
│  │  • LinkService                                       │  │
│  │  • XpraConsoleService                               │  │
│  │  • WindowManagementService                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LinkService                              │   │
│  │  Responsibilities:                                   │   │
│  │  • Start/stop packet captures                       │   │
│  │  • Restart Wireshark capture                        │   │
│  │  • Update link settings                             │   │
│  │  • Manage capture files                             │   │
│  │                                                      │   │
│  │  Methods:                                            │   │
│  │  • startCaptureOnLink()                              │   │
│  │  • stopCaptureOnLink()                               │   │
│  │  • restartWiresharkCapture()                         │   │
│  │  • updateLink()                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ uses                             │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           XpraConsoleService                         │   │
│  │  Responsibilities:                                   │   │
│  │  • Build WebSocket URLs                             │   │
│  │  • Parse and validate URLs                          │   │
│  │  • Construct xpra-html5 page URLs                   │   │
│  │                                                      │   │
│  │  Methods:                                            │   │
│  │  • buildXpraWebSocketUrlForWebWireshark()           │   │
│  │  • buildXpraConsolePageUrl()                        │   │
│  │  • parseWebSocketUrl()                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ uses                             │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         WindowManagementService                      │   │
│  │  Responsibilities:                                   │   │
│  │  • Track inline window states                       │   │
│  │  • Manage z-index ordering                          │   │
│  │  • Handle minimize/restore                          │   │
│  │                                                      │   │
│  │  Methods:                                            │   │
│  │  • openWindow()                                      │   │
│  │  • closeWindow()                                     │   │
│  │  • toggleMinimize()                                  │   │
│  │  • bringToFront()                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ uses                             │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            HttpControllerService                     │   │
│  │  Responsibilities:                                   │   │
│  │  • Make HTTP requests to controller                 │   │
│  │  • Handle authentication tokens                     │   │
│  │  • Process responses                                │   │
│  │                                                      │   │
│  │  Methods:                                            │   │
│  │  • post()                                            │   │
│  │  • get()                                             │   │
│  │  • delete()                                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Service Interaction Flow

```
Component Request
        │
        ▼
┌───────────────────┐
│ Component Layer   │
│                   │
│ • ContextMenu     │
│ • InlineWindow    │
│ • Dialog          │
└─────────┬─────────┘
          │
          │ calls
          ▼
┌───────────────────┐
│  Service Layer    │
│                   │
│ • LinkService     │──┐
│ • XpraConsole    │  │
│ • WindowMgmt     │  │
└─────────┬─────────┘  │
          │            │
          │ uses       │
          ▼            │
┌───────────────────┐  │
│ HTTPController    │◄─┘
│                   │
│ • HTTP requests   │
│ • Token auth      │
│ • Response handle │
└─────────┬─────────┘
          │
          │ HTTP/WebSocket
          ▼
┌───────────────────┐
│  GNS3 Controller  │
│                   │
│ • REST API        │
│ • WebSocket       │
│ • Auth validation │
└───────────────────┘
```

---

## Data Flow

### Capture Start Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       │ 1. Right-click link
       │
       ▼
┌─────────────────────────────────┐
│   ContextMenuComponent         │
│   • Show menu                  │
│   • Handle selection           │
└──────┬──────────────────────────┘
       │
       │ 2. Open capture dialog
       │
       ▼
┌─────────────────────────────────┐
│  StartCaptureDialogComponent   │
│  • Display form                │
│  • Collect inputs              │
└──────┬──────────────────────────┘
       │
       │ 3. Submit form
       │    (wireshark: true)
       │
       ▼
┌─────────────────────────────────┐
│      LinkService               │
│  • Validate inputs             │
│  • Build request payload       │
└──────┬──────────────────────────┘
       │
       │ 4. POST /capture
       │
       ▼
┌─────────────────────────────────┐
│   GNS3 Controller              │
│  • Validate request            │
│  • Start tcpdump               │
│  • Create WebSocket endpoint   │
└──────┬──────────────────────────┘
       │
       │ 5. Return ws:// URL
       │
       ▼
┌─────────────────────────────────┐
│   XpraConsoleService           │
│  • Parse WebSocket URL         │
│  • Build xpra page URL         │
└──────┬──────────────────────────┘
       │
       │ 6. Open display
       │    (tab/inline)
       │
       ▼
┌─────────────────────────────────┐
│      Browser                   │
│  • Load xpra-html5             │
│  • Connect WebSocket           │
│  • Display packets             │
└─────────────────────────────────┘
```

### WebSocket Data Flow

```
┌──────────────────┐
│  Compute Node    │
│                  │
│  tcpdump process │
│  -i eth0 -w -    │
└─────────┬────────┘
          │
          │ pcap data (binary)
          │ libpcap format
          │
          ▼
┌──────────────────┐
│ GNS3 Controller  │
│                  │
│ WebSocket Server │
│ - Stream data    │
│ - Handle conn    │
└─────────┬────────┘
          │
          │ WebSocket Frame
          │ binary payload
          │
          ▼
┌──────────────────┐
│    Browser       │
│                  │
│ WebSocket Client │
│ - Receive data   │
│ - Pass to app    │
└─────────┬────────┘
          │
          │ ArrayBuffer
          │
          ▼
┌──────────────────┐
│   xpra-html5    │
│                  │
│ Wireshark UI     │
│ - Parse pcap     │
│ - Display packets│
└──────────────────┘
```

---

## State Management

### Link State Model

```
Link Entity
├── link_id: string
├── project_id: string
├── nodes: LinkNode[]
├── capturing: boolean
├── capture_file_path?: string
├── filters?: Filter[]
└── suspend?: boolean

State Transitions:
┌─────────────┐
│    IDLE     │
│capturing:   │
│    false    │
└──────┬──────┘
       │
       │ startCaptureOnLink()
       │
       ▼
┌─────────────┐
│  CAPTURING  │
│capturing:   │
│    true     │
└──────┬──────┘
       │
       │ stopCaptureOnLink()
       │
       ▼
┌─────────────┐
│    IDLE     │
│capturing:   │
│    false    │
└─────────────┘
```

### Window State Model

```
WindowState Interface
{
  id: string              // "wireshark-{link_id}"
  type: string            // "wireshark"
  linkId: string          // link.link_id
  minimized: boolean      // current state
  zIndex: number          // display order
  position: {
    left: number          // x coordinate
    top: number           // y coordinate
  }
  size: {
    width: number         // window width
    height: number        // window height
  }
}

State Lifecycle:
┌───────────┐  create()  ┌───────────┐  minimize()  ┌───────────┐
│  CREATED  │ ─────────> │  NORMAL   │ ──────────> │ MINIMIZED │
└───────────┘           └───────────┘             └───────────┘
                               ▲                        │
                               │                        │
                          restore() ◄─────────────────┘
                               │
                               │ close()
                               ▼
                        ┌───────────────┐
                        │    DESTROYED  │
                        │ state removed │
                        └───────────────┘
```

### Z-Index Management

```
Window Stack (bottom to top):
┌─────────────────────────────┐
│ Window 3 (zIndex: 1002)     │ ← Top (focused)
├─────────────────────────────┤
│ Window 2 (zIndex: 1001)     │
├─────────────────────────────┤
│ Window 1 (zIndex: 1000)     │ ← Bottom
└─────────────────────────────┘

Focus Event Flow:
1. User clicks Window 2
2. Component emits windowFocused event
3. WindowManagementService handles event:
   a. Find current max zIndex (1002)
   b. Assign new zIndex (1003) to Window 2
   c. Update component style
   d. Apply to DOM element
4. Window 2 now on top (zIndex: 1003)

Result:
┌─────────────────────────────┐
│ Window 2 (zIndex: 1003)     │ ← Top (focused)
├─────────────────────────────┤
│ Window 3 (zIndex: 1002)     │
├─────────────────────────────┤
│ Window 1 (zIndex: 1000)     │ ← Bottom
└─────────────────────────────┘
```

---

## Integration Points

### Context Menu Integration

```
ContextMenuComponent
    │
    ├── Detect link right-click
    │
    ├── Check link state
    │   ├── link.capturing === true
    │   │   ├── Show "Stop Capture"
    │   │   ├── Show "Start Web Wireshark"
    │   │   └── Show "Open Web Wireshark (Inline)"
    │   │
    │   └── link.capturing === false
    │       ├── Show "Start Capture"
    │       └── Hide Web Wireshark options
    │
    └── Render menu items
        ├── StartCaptureAction
        ├── StopCaptureAction
        ├── StartWebWiresharkAction
        └── StartWebWiresharkInlineAction
```

### Project Map Integration

```
ProjectMapComponent
    │
    ├── Manages link components
    │
    ├── Handles context menu events
    │   ├── onOpenWebWiresharkInline()
    │   │   ├── Create inline window
    │   │   ├── Track window state
    │   │   └── Add to component tree
    │   │
    │   └── onCloseWindow()
    │       ├── Remove component
    │       ├── Clean up state
    │       └── Update UI
    │
    └── Manages window z-index
        ├── Track focused window
        ├── Bring to front on click
        └── Update stacking order
```

### Service Integration

```
Component Layer
    │
    ├── Injects services
    │   ├── LinkService
    │   ├── XpraConsoleService
    │   └── WindowManagementService
    │
    ├── LinkService
    │   ├── startCaptureOnLink()
    │   ├── stopCaptureOnLink()
    │   └── restartWiresharkCapture()
    │
    ├── XpraConsoleService
    │   ├── buildXpraWebSocketUrlForWebWireshark()
    │   └── buildXpraConsolePageUrl()
    │
    └── WindowManagementService
        ├── openWindow()
        ├── closeWindow()
        ├── toggleMinimize()
        └── bringToFront()
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-04-11  
**Maintained By**: GNS3 Web UI Team

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
