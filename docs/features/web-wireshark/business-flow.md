# Web Wireshark - Business Flow & Architecture

## Table of Contents
- [Executive Summary](#executive-summary)
- [Core Business Scenarios](#core-business-scenarios)
- [Detailed Business Flows](#detailed-business-flows)
- [State Management](#state-management)
- [Component Interactions](#component-interactions)
- [Data Flow Diagrams](#data-flow-diagrams)

---

## Executive Summary

Web Wireshark enables browser-based packet capture and analysis for GNS3 network simulations. The system integrates a packet capture backend (tcpdump) with a web-based Wireshark interface (xpra-html5) through WebSocket communication.

### Business Value
- **Accessibility**: No native software installation required
- **Cross-platform**: Works on any modern browser
- **Real-time**: Live packet analysis during simulation
- **Integration**: Seamless integration with GNS3 project map

### Key Capabilities
1. Start/stop packet captures on network links
2. View captured packets in real-time
3. Display in new tab or inline window
4. Support multiple concurrent captures
5. Manage window states (drag, resize, minimize)

---

## Core Business Scenarios

### Scenario 1: Start Capture with Web Wireshark

**Actor**: Network Engineer  
**Goal**: Analyze traffic between two VMs in real-time

**Preconditions**:
- User has GNS3 project open
- Project has at least one link with running nodes
- User has project write permissions

**Flow**:
1. User right-clicks on a link in project map
2. Context menu appears with "Start Capture" option
3. User selects "Start Capture"
4. Capture configuration dialog opens
5. User enters capture file name (auto-filled)
6. User selects data link type (default: Ethernet)
7. User checks "Web Wireshark" checkbox
8. User clicks "Start" button
9. System shows loading spinner
10. Backend starts tcpdump on compute node
11. Web Wireshark opens in new browser tab
12. Real-time packet capture begins
13. Packets display in Wireshark interface

**Postconditions**:
- Link shows "capturing" indicator (green)
- Capture file created on server
- WebSocket connection established
- Packets streaming to browser

---

### Scenario 2: Open Web Wireshark (Inline Mode)

**Actor**: Network Engineer  
**Goal**: Monitor multiple links simultaneously in same view

**Preconditions**:
- At least one link has active capture
- Inline window not already open for link

**Flow**:
1. User right-clicks on capturing link
2. Context menu shows "Open Web Wireshark (Inline)" option
3. User selects inline option
4. Inline window appears on project map (100px, 100px)
5. Window shows loading animation
6. xpra-html5 loads in iframe
7. WebSocket connection established
8. Packet capture displays in window
9. User can drag window to reposition
10. User can resize window (min: 400x300)
11. User can minimize window to header
12. User can close window with × button

**Postconditions**:
- Inline window state tracked by service
- Window z-index managed (1000+)
- Window linked to capture by link_id
- Close event cleans up state

---

### Scenario 3: Restart Web Wireshark

**Actor**: Network Engineer  
**Goal**: Refresh Wireshark connection after backend changes

**Preconditions**:
- Web Wireshark window open (tab or inline)
- Capture still active on link

**Flow**:
1. User clicks restart button in inline window header
2. System shows restart spinner
3. Frontend calls restart API
4. Backend restarts tcpdump process
5. Backend returns new WebSocket URL
6. Frontend rebuilds xpra URL
7. Iframe reloads with new URL
8. WebSocket re-establishes
9. Packet capture resumes

**Postconditions**:
- Previous WebSocket closed
- New WebSocket active
- No duplicate capture processes
- Window remains open

---

### Scenario 4: Stop Packet Capture

**Actor**: Network Engineer  
**Goal**: Stop capturing and save results

**Preconditions**:
- Link has active capture
- Web Wireshark may or may not be open

**Flow**:
1. User right-clicks on capturing link
2. Context menu shows "Stop Capture" option
3. User selects "Stop Capture"
4. Frontend sends DELETE request to backend
5. Backend stops tcpdump process
6. Backend finalizes pcap file
7. Backend closes WebSocket connection
8. Frontend updates link state (not capturing)
9. If Web Wireshark open, shows connection lost

**Postconditions**:
- tcpdump process terminated
- pcap file saved on server
- WebSocket connection closed
- Link capture indicator removed
- Web Wireshark window may remain open (disconnected)

---

## Detailed Business Flows

### Flow 1: Complete Packet Capture Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     Phase 1: Initiation                         │
└─────────────────────────────────────────────────────────────────┘
     User              Frontend            Controller        Compute
      │                  │                   │                 │
      │ 1. Right-click   │                   │                 │
      │    link          │                   │                 │
      ├─────────────────>│                   │                 │
      │                  │                   │                 │
      │ 2. Show context  │                   │                 │
      │    menu          │                   │                 │
      │<─────────────────┤                   │                 │
      │                  │                   │                 │
      │ 3. Select "Start │                   │                 │
      │    Capture"      │                   │                 │
      ├─────────────────>│                   │                 │
      │                  │                   │                 │
      │ 4. Open config   │                   │                 │
      │    dialog        │                   │                 │
      │<─────────────────┤                   │                 │
      │                  │                   │                 │
      │ 5. Configure &   │                   │                 │
      │    submit        │                   │                 │
      ├─────────────────>│                   │                 │
      │                  │                   │                 │

┌─────────────────────────────────────────────────────────────────┐
│                     Phase 2: Backend Processing                 │
└─────────────────────────────────────────────────────────────────┘
      │                  │                   │                 │
      │                  │ 6. POST /capture  │                 │
      │                  │    (wireshark:    │                 │
      │                  │     true)         │                 │
      │                  ├──────────────────>│                 │
      │                  │                   │                 │
      │                  │                   │ 7. Start        │
      │                  │                   │    tcpdump      │
      │                  │                   ├────────────────>│
      │                  │                   │                 │
      │                  │                   │ 8. Return       │
      │                  │                   │    ws:// URL    │
      │                  │<──────────────────┤                 │
      │                  │                   │                 │

┌─────────────────────────────────────────────────────────────────┐
│                     Phase 3: Display Initialization              │
└─────────────────────────────────────────────────────────────────┘
      │                  │                   │                 │
      │                  │ 9. Build xpra     │                 │
      │                  │    URL            │                 │
      │                  │                   │                 │
      │ 10. Open display │                   │                 │
      │    (tab/inline)  │                   │                 │
      │<─────────────────┤                   │                 │
      │                  │                   │                 │

┌─────────────────────────────────────────────────────────────────┐
│                     Phase 4: Active Capture                     │
└─────────────────────────────────────────────────────────────────┘
      │                  │                   │                 │
      │ 11. Connect to   │                   │                 │
      │     WebSocket    │                   │                 │
      ├──────────────────┼───────────────────┼────────────────>│
      │                  │                   │                 │
      │ 12. Stream pcap  │                   │                 │
      │     data         │                   │                 │
      │<═════════════════╪═══════════════════╪═════════════════╡
      │                  │                   │                 │
      │ 13. Display      │                   │                 │
      │     packets      │                   │                 │
      │<═══════════════════════════════════════════════════════│
      │                  │                   │                 │

┌─────────────────────────────────────────────────────────────────┐
│                     Phase 5: Termination                        │
└─────────────────────────────────────────────────────────────────┘
      │                  │                   │                 │
      │ 14. Select "Stop │                   │                 │
      │     Capture"     │                   │                 │
      ├─────────────────>│                   │                 │
      │                  │                   │                 │
      │                  │ 15. DELETE        │                 │
      │                  │    /capture       │                 │
      │                  ├──────────────────>│                 │
      │                  │                   │                 │
      │                  │                   │ 16. Stop        │
      │                  │                   │    tcpdump      │
      │                  │                   ├────────────────>│
      │                  │                   │                 │
      │                  │                   │ 17. Close       │
      │                  │                   │    WebSocket    │
      │                  │<══════════════════╪═════════════════╡
      │                  │                   │                 │
      │ 18. Update state │                   │                 │
      │<─────────────────┤                   │                 │
      │                  │                   │                 │
```

---

### Flow 2: Inline Window Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Creation Phase                               │
└─────────────────────────────────────────────────────────────────┘
   User          ProjectMap      WindowMgmt      Component
    │                │                │               │
    │ 1. Click       │                │               │
    │    "Open       │                │               │
    │     Inline"    │                │               │
    ├───────────────>│                │               │
    │                │                │               │
    │                │ 2. Generate    │               │
    │                │    window ID    │               │
    │                ├───────────────>│               │
    │                │                │               │
    │                │ 3. Return ID   │               │
    │                │<───────────────┤               │
    │                │                │               │
    │                │ 4. Create      │               │
    │                │    component   │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │                │ 5. Initialize  │               │
    │                │    state       │               │
    │                │<──────────────────────────────┤
    │                │                │               │
    │ 6. Render      │                │               │
    │    window      │                │               │
    │<───────────────┤                │               │
    │                │                │               │

┌─────────────────────────────────────────────────────────────────┐
│                    Active Phase                                 │
└─────────────────────────────────────────────────────────────────┘
    │                │                │               │
    │ 7. User        │                │               │
    │    interacts   │                │               │
    │    (drag/      │                │               │
    │     resize)    │                │               │
    ├───────────────>│                │               │
    │                │                │               │
    │                │ 8. Update      │               │
    │                │    position/   │               │
    │                │    size        │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │                │ 9. Apply to    │               │
    │                │    DOM         │               │
    │                │<──────────────────────────────┤
    │                │                │               │
    │                │ 10. Track      │               │
    │                │     state      │               │
    │                ├───────────────>│               │
    │                │                │               │

┌─────────────────────────────────────────────────────────────────┐
│                    Minimize Phase                               │
└─────────────────────────────────────────────────────────────────┘
    │                │                │               │
    │ 11. Click -    │                │               │
    │     button     │                │               │
    ├───────────────>│                │               │
    │                │                │               │
    │                │ 12. Toggle     │               │
    │                │     minimize   │               │
    │                ├───────────────>│               │
    │                │                │               │
    │                │ 13. Update     │               │
    │                │     list       │               │
    │                │<───────────────┤               │
    │                │                │               │
    │                │ 14. Collapse   │               │
    │                │     window     │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │ 15. Show       │                │               │
    │     minimized  │                │               │
    │<───────────────┤                │               │
    │                │                │               │

┌─────────────────────────────────────────────────────────────────┐
│                    Restore Phase                                │
└─────────────────────────────────────────────────────────────────┘
    │                │                │               │
    │ 16. Click      │                │               │
    │     minimized  │                │               │
    │     header     │                │               │
    ├───────────────>│                │               │
    │                │                │               │
    │                │ 17. Toggle     │               │
    │                │     restore    │               │
    │                ├───────────────>│               │
    │                │                │               │
    │                │ 18. Remove     │               │
    │                │     from list  │               │
    │                │<───────────────┤               │
    │                │                │               │
    │                │ 19. Expand     │               │
    │                │     window     │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │ 20. Show       │                │               │
    │     restored   │                │               │
    │<───────────────┤                │               │
    │                │                │               │

┌─────────────────────────────────────────────────────────────────┐
│                    Termination Phase                            │
└─────────────────────────────────────────────────────────────────┘
    │                │                │               │
    │ 21. Click ×   │                │               │
    ├───────────────>│                │               │
    │                │                │               │
    │                │ 22. Emit      │               │
    │                │     close      │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │                │ 23. Cleanup   │               │
    │                │     state     │               │
    │                │<──────────────────────────────┤
    │                │                │               │
    │                │ 24. Remove    │               │
    │                │     from list │               │
    │                ├───────────────>│               │
    │                │                │               │
    │                │ 25. Remove    │               │
    │                │     component │               │
    │                ├──────────────────────────────>│
    │                │                │               │
    │ 26. Hide       │                │               │
    │     window     │                │               │
    │<───────────────┤                │               │
    │                │                │               │
```

---

## State Management

### Link Capture State

```
Link State Model:
{
  link_id: string
  capturing: boolean
  capture_file_path?: string
  web_socket_url?: string
  capture_file_name?: string
  data_link_type?: string
}

State Transitions:
┌──────────────┐  start_capture()  ┌──────────────┐
│   IDLE       │ ──────────────────>│  CAPTURING   │
│ (capturing:  │                   │ (capturing:  │
│     false)   │ <────────────────── │     true)    │
└──────────────┘   stop_capture()   └──────────────┘
```

### Inline Window State

```
Window State Model:
{
  id: string              // "wireshark-{link_id}"
  type: string            // "wireshark"
  linkId: string          // link.link_id
  minimized: boolean
  zIndex: number
  position: { left: number, top: number }
  size: { width: number, height: number }
}

State Transitions:
┌──────────┐  create()  ┌──────────┐  minimize()  ┌──────────┐
│ CREATED  │ ──────────>│  NORMAL  │ ────────────>│MINIMIZED │
└──────────┘           └──────────┘              └──────────┘
                           ▲                        │
                           │                        │
                      restore() ◄──────────────────┘
                           │
                           │ close()
                           ▼
┌─────────────────────────────────────────────┐
│            DESTROYED                        │
│  (removed from DOM, state cleaned up)       │
└─────────────────────────────────────────────┘
```

### Window Management State

```
WindowManagementService State:
{
  windows: WindowState[]
  minimizedWindows: WindowState[]
  topZIndex: number
}

Multi-Window Z-Index Management:
┌────────────┐
│ Window 1   │ zIndex: 1000 (initial)
├────────────┤
│ Window 2   │ zIndex: 1001 (focused)
├────────────┤
│ Window 3   │ zIndex: 1002 (focused)
└────────────┘

Focus Event:
1. User clicks Window 2
2. onWindowFocus() emits
3. WindowManagementService.bringToFront("wireshark-link-2")
4. Update zIndex to 1003 (topZIndex + 1)
5. Apply to DOM
6. Window 2 now on top
```

---

## Component Interactions

### Interaction 1: Context Menu → Capture Dialog

```
ContextMenuComponent
    │
    ├── User right-clicks link
    │
    ├── Shows menu (if link exists)
    │
    ├── "Start Capture" clicked
    │
    └── StartCaptureDialogComponent.open()
            │
            ├── Dialog opens
            │
            ├── User configures capture
            │
            └── onYesClick()
                    │
                    ├── Validate form
                    │
                    ├── Check device status
                    │
                    ├── LinkService.startCaptureOnLink()
                    │
                    ├── Show loading (if Web Wireshark)
                    │
                    ├── PacketCaptureService.startCapture()
                    │     (if "Start program" checked)
                    │
                    └── Close dialog
```

### Interaction 2: Context Menu → Inline Window

```
ContextMenuComponent
    │
    ├── User right-clicks capturing link
    │
    ├── Shows menu (if link.capturing === true)
    │
    ├── "Open Web Wireshark (Inline)" clicked
    │
    └── StartWebWiresharkInlineActionComponent
            │
            ├── onOpenWebWiresharkInline()
            │
            └── Emit openWebWiresharkInline event
                    │
                    └──> ProjectMapComponent
                            │
                            ├── handleOpenWebWiresharkInline()
                            │
                            ├── WindowManagementService.openWindow()
                            │
                            └── Create WebWiresharkInlineComponent
                                    │
                                    ├── ngOnInit()
                                    │   ├── Build WebSocket URL
                                    │   ├── Build xpra page URL
                                    │   └── Setup drag handling
                                    │
                                    └── Render in DOM
```

### Interaction 3: Inline Window → Close

```
WebWiresharkInlineComponent
    │
    ├── User clicks × button
    │
    ├── close()
    │
    ├── WindowManagementService.restoreWindow()
    │
    └── Emit closeWindow event
            │
            └──> ProjectMapComponent
                    │
                    ├── Remove component from DOM
                    │
                    ├── WindowManagementService.closeWindow()
                    │
                    └── Cleanup state
```

### Interaction 4: Restart Wireshark

```
WebWiresharkInlineComponent
    │
    ├── User clicks restart button
    │
    ├── restartWireshark()
    │
    ├── Set isRestarting = true
    │
    ├── LinkService.restartWiresharkCapture()
    │       │
    │       └──> HTTP POST /restart
    │               │
    │               └──> Controller
    │                       │
    │                       ├── Stop tcpdump
    │                       ├── Start tcpdump
    │                       └── Return new ws:// URL
    │
    ├── Build new xpra URL
    │
    ├── Reload iframe
    │
    └── Set isRestarting = false
```

---

## Data Flow Diagrams

### Data Flow 1: Capture Start Request

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Input: capture_file_name, data_link_type, wireshark
       │
       ▼
┌─────────────────────────────────┐
│  StartCaptureDialogComponent    │
│  Inputs:                        │
│  - fileName: string             │
│  - linkType: enum               │
│  - webWireshark: boolean        │
└──────┬──────────────────────────┘
       │
       │ 2. Create CapturingSettings
       │
       ▼
┌─────────────────────────────────┐
│  CapturingSettings Model        │
│  {                              │
│    capture_file_name: string,   │
│    data_link_type: string,      │
│    wireshark: boolean           │
│  }                              │
└──────┬──────────────────────────┘
       │
       │ 3. POST /capture
       │
       ▼
┌─────────────────────────────────┐
│  LinkService                    │
│  startCaptureOnLink()           │
└──────┬──────────────────────────┘
       │
       │ 4. HTTP Request
       │    POST /v3/projects/{id}/links/{id}/capture
       │    Body: CapturingSettings
       │
       ▼
┌─────────────────────────────────┐
│  GNS3 Controller                │
│  - Validate request             │
│  - Start tcpdump                │
│  - Create capture file          │
└──────┬──────────────────────────┘
       │
       │ 5. Response
       │    { capture_file_path, web_socket_url }
       │
       ▼
┌─────────────────────────────────┐
│  Frontend                       │
│  - Update link state            │
│  - If wireshark: open display   │
└─────────────────────────────────┘
```

### Data Flow 2: WebSocket URL Construction

```
┌─────────────────────────────────┐
│  XpraConsoleService             │
│                                 │
│  Input:                         │
│  - controller: Controller       │
│  - link: Link                   │
│                                 │
│  Process:                       │
│  1. Extract protocol           │
│     - https → wss              │
│     - http → ws                │
│                                 │
│  2. Build WebSocket URL         │
│     ws://{host}:{port}/         │
│     v3/projects/{pid}/          │
│     links/{lid}/capture/        │
│     web-wireshark?token={tok}   │
│                                 │
│  3. Parse WebSocket URL         │
│     - server: hostname          │
│     - port: port number         │
│     - ssl: boolean              │
│     - path: pathname            │
│     - token: query param        │
│                                 │
│  4. Build xpra page URL         │
│     /assets/xpra-html5/         │
│     index.html?                 │
│     server={server}             │
│     port={port}                 │
│     ssl={ssl}                   │
│     path={path}?token={token}   │
│     sound=true                  │
│     clipboard=true              │
│     encoding=h264               │
└──────┬──────────────────────────┘
       │
       │ Output: SafeResourceUrl
       │
       ▼
┌─────────────────────────────────┐
│  Browser                        │
│  - Open tab or set iframe src   │
│  - Load xpra-html5              │
│  - Connect to WebSocket         │
└─────────────────────────────────┘
```

### Data Flow 3: Packet Data Stream

```
┌─────────────────────────────────┐
│  Compute Node                   │
│                                 │
│  tcpdump process:               │
│  $ tcpdump -i {interface}       │
│    -w {file}.pcap              │
│    -U -w - (stdout)            │
└──────┬──────────────────────────┘
       │
       │ pcap data (binary)
       │ libpcap format
       │
       ▼
┌─────────────────────────────────┐
│  GNS3 Controller               │
│                                 │
│  WebSocket Handler:             │
│  - Read from tcpdump stdout    │
│  - Forward to WebSocket        │
│  - Stream continuously         │
└──────┬──────────────────────────┘
       │
       │ WebSocket Frame (binary)
       │
       ▼
┌─────────────────────────────────┐
│  Browser                        │
│                                 │
│  WebSocket.onmessage:           │
│  - Receive binary data         │
│  - Pass to xpra-html5          │
└──────┬──────────────────────────┘
       │
       │ ArrayBuffer
       │
       ▼
┌─────────────────────────────────┐
│  xpra-html5                     │
│                                 │
│  Wireshark Interface:           │
│  - Parse pcap format           │
│  - Extract packet headers      │
│  - Display packet list         │
│  - Show packet details         │
│  - Render packet bytes         │
└─────────────────────────────────┘
```

---

## Error Handling Flows

### Error Flow 1: Capture Start Failure

```
User clicks "Start"
        │
        ▼
Frontend validates form
        │
        ├─ Invalid → Show error toast
        │
        ▼
Check device status
        │
        ├─ No running devices → Show error
        │
        ▼
Call LinkService.startCaptureOnLink()
        │
        │
        ▼
Backend processing...
        │
        ├─ 409 Conflict → "Capture already running"
        │
        ├─ 404 Not Found → "Link not found"
        │
        ├─ 403 Forbidden → "Permission denied"
        │
        ├─ 500 Error → "Server error"
        │
        ▼
Frontend handles error
        │
        ├─ Show user-friendly message
        │
        ├─ Log technical details
        │
        └─ Keep dialog open
```

### Error Flow 2: WebSocket Connection Failure

```
xpra-html5 loads
        │
        ▼
Attempt WebSocket connection
        │
        │
        ▼
Connection timeout/failure
        │
        ├─ Invalid token → "Authentication failed"
        │
        ├─ Network error → "Cannot reach server"
        │
        ├─ Capture stopped → "Connection closed"
        │
        ▼
xpra-html5 shows error
        │
        ├─ Display error message
        │
        ├─ Show reconnect button
        │
        └─ Log to console
```

---

## Performance Considerations

### Resource Management

1. **Concurrent Captures**
   - Limit: 3-4 simultaneous captures recommended
   - Each capture: ~50-100 MB memory
   - Bandwidth: ~1-5 Mbps per active capture

2. **Inline Windows**
   - Each window: ~20-30 MB memory
   - Iframe overhead: ~10 MB
   - Total per window: ~30-40 MB

3. **WebSocket Connections**
   - Persistent connection per capture
   - Auto-reconnect on disconnect
   - Connection timeout: 30 seconds

### Optimization Strategies

1. **Lazy Loading**
   - Load xpra-html5 only when needed
   - Defer iframe initialization
   - Pause rendering when minimized

2. **Cleanup**
   - Close WebSocket on window close
   - Remove event listeners on destroy
   - Clear timeouts/intervals

3. **State Sync**
   - Use signals for reactive updates
   - Batch DOM updates
   - Throttle drag/resize events

---

## Security Flow

### Authentication Flow

```
User Request
        │
        ▼
Frontend checks auth token
        │
        ├─ Missing → Redirect to login
        │
        ▼
Include token in request
        │
        ├─ Header: Authorization
        ├─ Query: token=xxx
        └─ Body: auth_token
        │
        ▼
Backend validates token
        │
        ├─ Invalid → 401 Unauthorized
        ├─ Expired → 401 Unauthorized
        ├─ Insufficient → 403 Forbidden
        │
        ▼
Process request
        │
        ▼
Return response
```

### Authorization Flow

```
User attempts capture start
        │
        ▼
Backend checks permissions
        │
        ├─ Project read-only → 403 Forbidden
        ├─ Not project member → 403 Forbidden
        │
        ▼
Check link ownership
        │
        ├─ Link not in project → 404 Not Found
        │
        ▼
Authorize capture
        │
        ├─ Check compute node access
        ├─ Validate capture settings
        │
        ▼
Start capture
```

---

## Testing Scenarios

### Scenario 1: Happy Path

**Given**: User has project with running link  
**When**: User starts capture with Web Wireshark  
**Then**: 
- Capture starts successfully
- Web Wireshark opens in selected mode
- Packets display in real-time
- No errors in console

### Scenario 2: Multiple Links

**Given**: User has 3 capturing links  
**When**: User opens Web Wireshark for all links (inline)  
**Then**:
- 3 inline windows open
- Each window shows different capture
- Windows can be repositioned
- Z-index managed correctly

### Scenario 3: Minimize/Restore

**Given**: Inline window open  
**When**: User minimizes, then restores  
**Then**:
- Window collapses to header
- State preserved
- Window expands to original size
- WebSocket remains active

### Scenario 4: Restart Capture

**Given**: Web Wireshark open, capture active  
**When**: User clicks restart  
**Then**:
- Spinner shows "Restarting..."
- Backend restarts tcpdump
- New WebSocket URL generated
- Iframe reloads
- Packets resume streaming

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-04-11  
**Maintained By**: GNS3 Web UI Team
