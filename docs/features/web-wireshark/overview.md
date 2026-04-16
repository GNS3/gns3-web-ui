# Web Wireshark - Feature Overview

## Table of Contents
- [Introduction](#introduction)
- [Architecture](#architecture)
- [Business Flow](#business-flow)
- [Components](#components)
- [API Endpoints](#api-endpoints)
- [WebSocket Communication](#websocket-communication)
- [User Interface](#user-interface)
- [Error Handling](#error-handling)

---

## Introduction

Web Wireshark is a browser-based packet capture and analysis tool integrated into GNS3 Web UI. It allows users to capture network traffic on links between nodes and analyze packets in real-time without installing native Wireshark applications.

### Key Features
- **Real-time packet capture** using WebSocket connection
- **Dual display modes**: New browser tab or inline window
- **Live packet analysis** with Wireshark-like interface
- **No native dependencies** - runs entirely in browser
- **Cross-platform compatibility** via xpra-html5 client

### Use Cases
- Network troubleshooting and debugging
- Protocol analysis and learning
- Security auditing and traffic inspection
- Network behavior verification
- Educational demonstrations

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        GNS3 Web UI                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Project Map Component                     │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Context     │  │ Start        │  │ Inline       │  │ │
│  │  │ Menu        │  │ Capture      │  │ Window       │  │ │
│  │  │ Actions     │  │ Dialog       │  │ Component    │  │ │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               Services Layer                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Link         │  │ Xpra Console │  │ Window       │ │ │
│  │  │ Service      │  │ Service      │  │ Management   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GNS3 Controller                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Capture Management                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Start/Stop   │  │ File I/O     │  │ WebSocket    │ │ │
│  │  │ Capture      │  │ Management   │  │ Endpoint     │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (pcap data)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 xpra-html5 Client                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Wireshark Display Interface                   │ │
│  │  • Packet list pane                                     │ │
│  │  • Packet details pane                                  │ │
│  │  • Packet bytes pane                                    │ │
│  │  • Real-time statistics                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Project Map Component
2. **Component** → Link Service (HTTP POST)
3. **Link Service** → GNS3 Controller API
4. **Controller** → Starts packet capture on compute node
5. **Controller** → Returns WebSocket URL
6. **Xpra Console Service** → Builds xpra-html5 URL
7. **Browser** → Opens xpra-html5 in tab/iframe
8. **xpra-html5** → Connects to WebSocket
9. **Controller** → Streams pcap data
10. **Wireshark Interface** → Displays packets in real-time

---

## Business Flow

### Flow 1: Starting Packet Capture with Web Wireshark

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│   User   │         │  Frontend│         │Controller│         │  Compute │
│          │         │          │         │          │         │   Node   │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                   │                   │                   │
     │ 1. Right-click    │                   │                   │
     │    link           │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │ 2. Select "Start  │                   │                   │
     │    Capture"       │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │ 3. Open dialog    │                   │                   │
     │<──────────────────┤                   │                   │
     │                   │                   │                   │
     │ 4. Configure      │                   │                   │
     │    capture        │                   │                   │
     │    settings       │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │ 5. Check "Web     │                   │                   │
     │    Wireshark"     │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │                   │ 6. POST /capture  │                   │
     │                   │    (wireshark:    │                   │
     │                   │     true)         │                   │
     │                   ├──────────────────>│                   │
     │                   │                   │                   │
     │                   │                   │ 7. Start tcpdump  │
     │                   │                   │    on link         │
     │                   │                   ├──────────────────>│
     │                   │                   │                   │
     │                   │                   │ 8. Return ws://    │
     │                   │                   │    URL             │
     │                   │<──────────────────┤                   │
     │                   │                   │                   │
     │ 9. Build xpra     │                   │                   │
     │    URL            │                   │                   │
     │                   │                   │                   │
     │ 10. Open display  │                   │                   │
     │    (tab/inline)   │                   │                   │
     │<──────────────────┤                   │                   │
     │                   │                   │                   │
     │ 11. Connect to    │                   │                   │
     │     WebSocket     │                   │                   │
     ├──────────────────┼───────────────────┼──────────────────>│
     │                   │                   │                   │
     │ 12. Stream pcap   │                   │                   │
     │     data          │                   │                   │
     │<══════════════════╪═══════════════════╪═══════════════════╡
     │                   │                   │                   │
     │ 13. Display       │                   │                   │
     │     packets       │                   │                   │
     │<═════════════════════════════════════════════════════════│
     │                   │                   │                   │
```

### Flow 2: Opening Web Wireshark (New Tab Mode)

```
┌────────────┐
│   User     │
└─────┬──────┘
      │
      │ 1. Right-click capturing link
      │
      ▼
┌─────────────────────────────────────┐
│      Context Menu Component         │
│  • "Start Web Wireshark" action     │
│    - Icon: open_in_full             │
│    - Visible when: link.capturing   │
└─────┬───────────────────────────────┘
      │
      │ 2. User clicks action
      │
      ▼
┌─────────────────────────────────────┐
│  StartWebWiresharkActionComponent   │
│  • Emits event to parent            │
└─────┬───────────────────────────────┘
      │
      │ 3. Build WebSocket URL
      │
      ▼
┌─────────────────────────────────────┐
│      XpraConsoleService             │
│  • buildXpraWebSocketUrlForWeb...() │
│  • Returns: ws://host/path?token=   │
└─────┬───────────────────────────────┘
      │
      │ 4. Build page URL
      │
      ▼
┌─────────────────────────────────────┐
│      XpraConsoleService             │
│  • buildXpraConsolePageUrl()        │
│  • Returns: /assets/xpra-html5/...  │
└─────┬───────────────────────────────┘
      │
      │ 5. Open new browser tab
      │
      ▼
┌─────────────────────────────────────┐
│         Browser Tab                 │
│  • Loads xpra-html5/index.html      │
│  • Connects to WebSocket            │
│  • Displays Wireshark UI            │
└─────────────────────────────────────┘
```

### Flow 3: Opening Web Wireshark (Inline Mode)

```
┌────────────┐
│   User     │
└─────┬──────┘
      │
      │ 1. Right-click capturing link
      │
      ▼
┌─────────────────────────────────────┐
│      Context Menu Component         │
│  • "Open Web Wireshark (Inline)"    │
│    - Icon: open_in_full             │
│    - Visible when: link.capturing   │
└─────┬───────────────────────────────┘
      │
      │ 2. User clicks action
      │
      ▼
┌─────────────────────────────────────┐
│ StartWebWiresharkInlineActionComp   │
│  • Emits event to ProjectMap        │
└─────┬───────────────────────────────┘
      │
      │ 3. Add window to management
      │
      ▼
┌─────────────────────────────────────┐
│    WindowManagementService          │
│  • Tracks window state              │
│  • Assigns unique ID                │
│  • Manages z-index                  │
└─────┬───────────────────────────────┘
      │
      │ 4. Create inline component
      │
      ▼
┌─────────────────────────────────────┐
│  WebWiresharkInlineComponent        │
│  • Draggable window                 │
│  • Resizable (400x300 min)          │
│  • Minimizable                      │
│  • Close button                     │
└─────┬───────────────────────────────┘
      │
      │ 5. Build xpra URL
      │
      ▼
┌─────────────────────────────────────┐
│      XpraConsoleService             │
│  • buildXpraWebSocketUrlForWeb...() │
│  • buildXpraConsolePageUrl()        │
└─────┬───────────────────────────────┘
      │
      │ 6. Render iframe
      │
      ▼
┌─────────────────────────────────────┐
│         Inline Window               │
│  ┌───────────────────────────────┐ │
│  │ ┌─────────────────────────┐   │ │
│  │ │ Header (draggable)       │   │ │
│  │ │ Title | ─ □ ✕          │   │ │
│  │ └─────────────────────────┘   │ │
│  │ ┌─────────────────────────┐   │ │
│  │ │                         │   │ │
│  │ │   xpra-html5 iframe     │   │ │
│  │ │                         │   │ │
│  │ └─────────────────────────┘   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Components

### Frontend Components

#### 1. Context Menu Actions
- **StartWebWiresharkActionComponent**
  - Opens Web Wireshark in new browser tab
  - Location: `src/app/components/project-map/context-menu/actions/start-web-wireshark-action/`
  - Triggers: When user right-clicks capturing link

- **StartWebWiresharkInlineActionComponent**
  - Opens Web Wireshark in inline window
  - Location: `src/app/components/project-map/context-menu/actions/start-web-wireshark-inline-action/`
  - Triggers: When user right-clicks capturing link

#### 2. Display Components
- **WebWiresharkInlineComponent**
  - Inline window container for xpra-html5
  - Features: Draggable, resizable, minimizable
  - Location: `src/app/components/project-map/web-wireshark-inline/`

#### 3. Dialog Components
- **StartCaptureDialogComponent**
  - Configuration dialog for packet capture
  - Options: File name, data link type, Web Wireshark checkbox
  - Location: `src/app/components/project-map/packet-capturing/start-capture/`

### Services

#### 1. LinkService
**Responsibilities:**
- Start/Stop packet capture on links
- Manage capture file settings
- Restart Wireshark capture

**Key Methods:**
```typescript
startCaptureOnLink(controller, link, settings): Observable
stopCaptureOnLink(controller, link): Observable
restartWiresharkCapture(controller, link): Observable
```

#### 2. XpraConsoleService
**Responsibilities:**
- Build WebSocket URLs for Web Wireshark
- Parse and validate WebSocket URLs
- Construct xpra-html5 page URLs

**Key Methods:**
```typescript
buildXpraWebSocketUrlForWebWireshark(controller, link): string
buildXpraConsolePageUrl(wsUrl): string
parseWebSocketUrl(wsUrl): ParsedUrl
```

#### 3. WindowManagementService
**Responsibilities:**
- Track inline window states
- Manage window z-index ordering
- Handle minimize/restore operations

**Key Methods:**
```typescript
openWindow(windowId, type, linkId): void
closeWindow(windowId): void
toggleMinimize(windowId, type, linkId): void
bringToFront(windowId): void
```

---

## API Endpoints

### Start Packet Capture
```http
POST /v3/projects/{project_id}/links/{link_id}/capture
Content-Type: application/json

{
  "capture_file_name": "node1_port1_to_node2_port2",
  "data_link_type": "DLT_EN10MB",
  "wireshark": true
}

Response: 200 OK
{
  "capture_file_path": "/path/to/capture.pcap",
  "web_socket_url": "ws://host:port/v3/projects/.../capture/web-wireshark?token=..."
}
```

### Stop Packet Capture
```http
DELETE /v3/projects/{project_id}/links/{link_id}/capture

Response: 204 No Content
```

### Stream Capture Data
```http
WebSocket: ws://host:port/v3/projects/{project_id}/links/{link_id}/capture/web-wireshark?token={auth_token}

Protocol: Binary pcap data stream
Format: Standard libpcap format
```

---

## WebSocket Communication

### Connection URL Format
```
ws://{controller_host}:{controller_port}/v3/projects/{project_id}/links/{link_id}/capture/web-wireshark?token={auth_token}
```

### For HTTPS (WSS)
```
wss://{controller_host}:{controller_port}/v3/projects/{project_id}/links/{link_id}/capture/web-wireshark?token={auth_token}
```

### Connection Flow
1. **Client** → Initiates WebSocket connection with auth token
2. **Server** → Validates token and project access
3. **Server** → Starts tcpdump on compute node if not running
4. **Server** → Streams pcap data in libpcap format
5. **Client** → Parses and displays packets in real-time

### Data Format
- **Binary Format**: Standard libpcap format
- **Byte Order**: Network byte order (big-endian)
- **Compression**: None (raw pcap data)
- **Frame Size**: Variable (depends on captured packets)

---

## User Interface

### Context Menu Integration

#### Menu Items
1. **Start Capture**
   - Opens capture configuration dialog
   - Available when: Link exists, nodes not capturing

2. **Stop Capture**
   - Stops active packet capture
   - Available when: `link.capturing === true`

3. **Start Web Wireshark** (New Tab)
   - Opens Wireshark in new browser tab
   - Icon: `open_in_full`
   - Available when: `link.capturing === true`

4. **Open Web Wireshark (Inline)**
   - Opens Wireshark in inline window
   - Icon: `open_in_full`
   - Available when: `link.capturing === true`

### Capture Configuration Dialog

#### Fields
- **Link Type** (Required)
  - Ethernet: `DLT_EN10MB`
  - Cisco HDLC: `DLT_C_HDLC`
  - Cisco PPP: `DLT_PPP_SERIAL`
  - Frame Relay: `DLT_FRELAY`
  - ATM: `DLT_ATM_RFC1483`

- **File Name** (Required)
  - Auto-generated: `{source_node}_{source_port}_to_{target_node}_{target_port}`
  - Format: Alphanumeric, underscore, hyphen only

- **Web Wireshark** (Optional)
  - Checkbox: Launch Web Wireshark after capture starts
  - Default: Unchecked

### Inline Window Features

#### Window Controls
- **Drag**: Click and drag header to move
- **Resize**: Drag edges/corners to resize (min: 400x300)
- **Minimize**: Click `-` button to collapse
- **Close**: Click `×` button to close

#### Window States
1. **Normal**: Full size, fully interactive
2. **Minimized**: Collapsed to header bar
3. **Dragging**: Pointer events disabled on iframe
4. **Resizing**: Pointer events disabled on iframe

#### Z-Index Management
- Default: 1000 (above canvas elements)
- Focus: Brings window to front
- Multiple windows: Last focused on top

---

## Error Handling

### Common Error Scenarios

#### 1. No Running Devices
**Error**: "Cannot capture because there is no running device on this link"

**Cause**: Both nodes on the link are stopped

**Solution**: Start at least one node on the link

---

#### 2. Capture Already Running
**Error**: "A packet capture is already running on this link"

**Status Code**: 409 Conflict

**Solution**: Stop existing capture first

---

#### 3. Link Not Found
**Error**: "The link or controller could not be found"

**Status Code**: 404 Not Found

**Solution**: Refresh the page and verify link exists

---

#### 4. Permission Denied
**Error**: "You do not have permission to start packet capture"

**Status Code**: 403 Forbidden

**Solution**: Check user permissions on project

---

#### 5. Popup Blocked
**Error**: "Popup was blocked. Please allow popups for this site"

**Cause**: Browser popup blocker

**Solution**: Allow popups for GNS3 Web UI domain

---

#### 6. WebSocket Connection Failed
**Error**: "Failed to connect to WebSocket"

**Causes**:
- Invalid auth token
- Controller not reachable
- Firewall blocking WebSocket
- Capture not started on backend

**Solution**:
- Verify controller URL and token
- Check network connectivity
- Review browser console for details

---

#### 7. xpra-html5 Load Failed
**Error**: "Failed to load xpra-html5"

**Causes**:
- Missing xpra-html5 assets
- Invalid URL parameters
- CORS restrictions

**Solution**:
- Verify `/assets/xpra-html5/` exists
- Check browser console for errors
- Ensure same-origin policy satisfied

---

### Loading States

#### Starting Web Wireshark
1. **Spinner**: "Starting Web Wireshark, please wait..."
2. **Success**: Opens display (tab/inline)
3. **Error**: Toast notification with error message

#### Restarting Capture
1. **Spinner**: "Restarting Web Wireshark..."
2. **Success**: Reloads iframe with new URL
3. **Error**: Toast notification with error details

---

## Best Practices

### For Users

1. **Start Capture First**
   - Always start packet capture before opening Web Wireshark
   - Use "Web Wireshark" checkbox in capture dialog for convenience

2. **Check Link Status**
   - Verify link is capturing (green indicator)
   - Ensure at least one node is running

3. **Display Mode Selection**
   - **New Tab**: Better for full-screen analysis
   - **Inline**: Better for multi-link comparison

4. **Performance Considerations**
   - Limit concurrent captures to 3-4 links
   - Close unused Web Wireshark windows
   - Use packet filters to reduce traffic

5. **File Management**
   - Use descriptive capture file names
   - Stop captures when no longer needed
   - Download captures for long-term storage

### For Developers

1. **Window Management**
   - Always clean up window state on close
   - Track windows by unique ID (link_id)
   - Handle minimize/restore state sync

2. **URL Construction**
   - Use XpraConsoleService for URL building
   - Validate WebSocket URLs before use
   - Include auth tokens in all requests

3. **Error Handling**
   - Provide user-friendly error messages
   - Handle HTTP status codes appropriately
   - Show loading states for long operations

4. **Performance**
   - Disable iframe events during drag/resize
   - Use RxJS takeUntil for cleanup
   - Implement proper OnDestroy lifecycle

---

## Troubleshooting

### Issue: Web Wireshark Shows No Packets

**Symptoms**: Wireshark opens but no packets displayed

**Possible Causes**:
1. Capture not actually started on backend
2. No traffic on link
3. WebSocket connection failed silently
4. Packet filters blocking all traffic

**Solutions**:
1. Check link capturing indicator (green = active)
2. Verify nodes are running and generating traffic
3. Open browser console for WebSocket errors
4. Review capture filters in Wireshark

---

### Issue: Inline Window Not Draggable

**Symptoms**: Cannot move inline window

**Possible Causes**:
1. Z-index conflict with other elements
2. Pointer events not disabled on iframe
3. Window state corrupted

**Solutions**:
1. Close and reopen window
2. Check browser console for errors
3. Refresh page if problem persists

---

### Issue: Multiple Windows for Same Link

**Symptoms**: Opening Web Wireshark creates duplicate windows

**Possible Causes**:
1. Window state not tracked properly
2. Window ID collision
3. Close event not handled

**Solutions**:
1. Use "Close" button, don't refresh page
2. Check WindowManagementService state
3. Report bug if issue persists

---

## Security Considerations

### Authentication
- All WebSocket connections require auth token
- Tokens are passed via query parameters
- Tokens expire per controller session

### Authorization
- Users can only capture on links in their projects
- Project-level permissions enforced
- Controller validates all requests

### Data Privacy
- Capture data transmitted via encrypted WebSocket (WSS)
- pcap files stored on compute nodes
- Capture files accessible via download API

### Cross-Origin Restrictions
- xpra-html5 must be same-origin
- CORS headers must be configured
- WebSocket same-origin policy enforced

---

## Future Enhancements

### Planned Features
1. **Packet Filters**
   - BPF filter input in capture dialog
   - Pre-defined common filters
   - Filter syntax validation

2. **Capture Statistics**
   - Real-time packet count
   - Bandwidth utilization
   - Protocol distribution

3. **Multiple Capture Files**
   - Rotate capture files by size
   - Time-based capture splitting
   - Automatic file management

4. **Export Options**
   - Download pcap directly
   - Share capture via URL
   - Export to cloud storage

5. **Advanced Display**
   - Custom colorization rules
   - Column configuration
   - Saved display filters

---

## References

### Related Documentation
- [Packet Capturing Guide](./packet-capturing.md)
- [Context Menu System](../context-menu.md)
- [Business Flow & Architecture](./business-flow.md)
- [Architecture Diagrams](./diagrams/architecture-overview.md)

### External Resources
- [Wireshark Documentation](https://www.wireshark.org/docs/)
- [xpra-html5 GitHub](https://github.com/Xpra-org/xpra-html5)
- [libpcap Format](https://wiki.wireshark.org/Development/LibpcapFileFormat)

### GNS3 API
- [Controller API Reference](https://api.gns3.net/)
- [WebSocket Endpoints](https://api.gns3.net/en/latest/ws.html)

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-04-11  
**Maintained By**: GNS3 Web UI Team

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
