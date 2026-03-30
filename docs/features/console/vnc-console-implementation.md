# VNC Console Implementation Documentation

**Version**: 1.1.0 | **Updated**: 2026-03-30 | **Status**: ✅ Completed

---

## Overview

The VNC Console allows users to connect to VNC-type nodes through a web interface using the noVNC library. It supports standalone window display, screen recording, screenshot, clipboard synchronization, and more.

**Important**: This is a **web-only** application. VNC Console works exclusively through browser popup windows.

## System Architecture

```
GNS3 Web UI (Angular)
    │
    ▼
VncConsoleService ──► /assets/vnc-console/index.html
    │                    │
    │                    ▼
    │               vnc-controller.js (ES Module)
    │                    │
    │                    ▼
    │               noVNC Library (rfb.js)
    │                    │
    └──────────────────► WebSocket ──► GNS3 Controller
```

## Core Components

### 1. VncConsoleService

**File**: `src/app/services/vnc-console.service.ts`

| Method | Description |
|--------|-------------|
| `buildVncWebSocketUrl()` | Builds WebSocket URL: `wss://host:port/v3/projects/{id}/nodes/{id}/console/vnc?token=xxx` |
| `buildVncConsolePageUrl()` | Builds console page URL with query params (`ws_url`, `node_name`, `autoconnect=1`) |
| `openVncConsole()` | Opens VNC console via `window.open()` with popup blocker detection |

**Key Features**:
- Node status validation before opening
- Custom window size from `console_resolution` property
- Supports popup window or new tab mode

### 2. VNC Controller

**File**: `src/assets/vnc-console/vnc-controller.js`

| Feature | Description |
|---------|-------------|
| **Initialization** | Parses URL params, creates RFB instance, auto-connects |
| **Connection States** | connecting → connected → disconnected, with 15s timeout |
| **Authentication** | VNC password prompt via `rfb.sendCredentials()` |
| **Send Keys** | Ctrl+Alt+Del, Ctrl+Alt+Backspace, F1-F12, Tab, Esc, PrintScreen |
| **Modifier Support** | Ctrl/Alt/Shift combinations with function keys |
| **Screen Scaling** | Scale up/down (0.3x-3.0x), fit to window |
| **Fullscreen** | F11 or button toggle |
| **Screenshot** | PNG download via canvas `toDataURL()` |
| **Recording** | WebM capture via `MediaRecorder` with 3 modes: VNC, VNC+Camera, Camera |
| **Recording Effects** | Timestamp overlay, mouse cursor, click ripples, GNS3 watermark |
| **Clipboard** | Send/receive via `rfb.clipboardPasteFrom()` |
| **Keyboard Handling** | Blocks Ctrl+S, Ctrl+P, allows F5, F11 |

## UI Components

### Toolbar
- **Connection**: Fullscreen, Connect, Disconnect
- **Send Keys**: Function keys (F1-F12), Shortcuts (Ctrl+Alt+Del, Ctrl+Alt+Backspace, Tab, Esc, PrintScreen)
- **Scale Controls**: Scale up, Scale down, Fit to window
- **Screen Capture**: Recording mode selector, Microphone mute, Screenshot, Record/Pause/Stop
- **Clipboard**: Open clipboard modal

### Status Bar
Displays connection status (Connecting, Connected, Disconnected, Error)

### Recording Indicator
Shows recording time and state (Recording/Paused)

### Error Dialog
Displays connection errors, authentication failures

## Recording Modes

| Mode | Description |
|------|-------------|
| `vnc` | VNC screen only |
| `vnc-camera` | VNC screen with camera picture-in-picture (bottom-right) |
| `camera` | Camera only |

**Pause Behavior**: Recording continues locally during VNC disconnection (may show black screen)

## Feature List

| Feature | Description |
|---------|-------------|
| Connection Management | Connect/Disconnect/Reconnect |
| Auto Connect | Automatically connect via `autoconnect=1` URL param |
| Connection Timeout | 15-second timeout protection |
| Authentication | VNC password authentication |
| Send Keys | F1-F12, Tab, Esc, PrintScreen, Ctrl+Alt+Del |
| Modifier Combinations | Ctrl/Alt/Shift + F1-F12 |
| Screen Scaling | Scale up/down/fit |
| Fullscreen Mode | F11 or button |
| Screenshot | PNG format |
| Screen Recording | WebM format (VNC/VNC+Camera/Camera) |
| Recording Pause | Pause/Resume |
| Audio Recording | Microphone with mute |
| Mouse Tracking | Cursor visible in recording |
| Click Effects | Ripple animation in recording |
| Timestamp | Recording time overlay |
| Watermark | Invisible GNS3 watermark (steganography) |
| Clipboard | Send/Receive |
| Toolbar | Collapsible |
| Keyboard Shortcuts | Browser shortcut handling |

## Technical Highlights

1. **Standalone HTML Page** - Runs independently in new window, uses ES Module
2. **Canvas Composition** - Multi-source PiP layout with real-time effects
3. **Real-time Animation** - Click ripples, cursor tracking, timestamp
4. **Invisible Watermark** - Steganography for copyright embedding
5. **Cross-platform** - Works on all modern browsers (Windows, macOS, Linux)
6. **Graceful Degradation** - Camera/mic unavailable falls back gracefully
7. **Performance** - Uses `requestAnimationFrame`, adaptive refresh rate
8. **User Experience** - Collapsible toolbar, recording indicator, detailed errors

## Solved Issues

| # | Issue | Solution |
|---|-------|----------|
| 1 | Video duration shorter if screen static | Use `requestAnimationFrame` for continuous canvas redraw |
| 2 | Recording stops on VNC disconnect | Decouple recording from VNC state |
| 3 | Browser shortcuts conflict (Ctrl+S/P) | Prevent default for conflicting shortcuts |
| 4 | Camera/mic unavailable | Try/catch with fallback to VNC-only mode |
| 5 | Pause time counted in duration | Track paused time separately, exclude from elapsed |
| 6 | Click coordinates off on scaled display | Scale click position to canvas resolution |
| 7 | noVNC canvas retrieval compatibility | Try `rfb.get_canvas()`, `rfb.canvas`, then `querySelector()` |

## Build and Deployment

```bash
# Development
ng serve

# Production
ng build --configuration=production
# Output: dist/assets/vnc-console/
```

## Dependencies

**Library**: noVNC (`src/assets/vnc-console/novnc/`)

**Browser APIs**: WebSocket, Canvas API, MediaDevices API, MediaRecorder API, Fullscreen API

**Angular Services**: VncConsoleService, ToasterService

## Related Files

| File | Description |
|------|-------------|
| `src/app/services/vnc-console.service.ts` | Angular service, URL building, window opening |
| `src/assets/vnc-console/index.html` | Console page |
| `src/assets/vnc-console/vnc-controller.js` | Main controller |
| `src/assets/vnc-console/novnc/` | noVNC library |

## References

- [noVNC Documentation](https://github.com/novnc/noVNC)
- [RFB Protocol](https://github.com/rfbproto/rfbproto)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
