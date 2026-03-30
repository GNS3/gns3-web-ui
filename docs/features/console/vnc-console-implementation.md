# VNC Console Complete Implementation Documentation

## Document Information

**Created**: 2024-01-15
**Updated**: 2026-03-30
**Status**: ✅ **Completed**
**Version**: 1.1.0
**Author**: Development Team

---

## Version History

### v1.1.0 (2026-03-30)

**Breaking Changes**:
- ⚠️ **Electron Support Removed**: Desktop application support discontinued (since v1.8.0)
- Application is now **web-only** (browser-based)

**Documentation Updates**:
- ✅ Mark Electron-related sections as deprecated
- ✅ Update system architecture to reflect web-only nature
- ✅ Remove Electron-specific build instructions
- ✅ Clarify that VNC Console works through browser popup windows

**Technical Notes**:
- VNC Console functionality remains unchanged
- Still uses `window.open()` to create standalone browser windows
- noVNC library integration unchanged
- All features (recording, screenshot, clipboard, etc.) work as before

**Migration Impact**:
- No code changes required for VNC Console
- Users must access through web browser
- Desktop application users must switch to web interface

### v1.0.0 (2024-01-15)

**Initial Release**:
- Complete VNC Console implementation
- noVNC library integration
- Standalone window display
- Screen recording (WebM format)
- Screenshot functionality
- Clipboard synchronization
- Send special keys (Ctrl+Alt+Del, F1-F12, etc.)
- Fullscreen mode
- Scaling controls
- Status display
- Error handling

---

## Overview

The GNS3 Web UI VNC Console feature allows users to connect to VNC-type nodes through a web interface, providing a complete remote desktop control experience. This implementation uses the noVNC library and supports standalone window display, screen recording, screenshot, clipboard synchronization, and many other rich features.

**⚠️ Important**: As of v1.8.0, this application is **web-only**. Electron desktop application support has been removed. VNC Console now works exclusively through browser popup windows.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GNS3 Web UI                             │
│                    (Angular Application)                     │
├─────────────────────────────────────────────────────────────┤
│  vnc-console.service.ts (Angular Service)                   │
│  ├─ buildVncWebSocketUrl()      Build WebSocket URL        │
│  ├─ buildVncConsolePageUrl()   Build Console Page URL      │
│  └─ openVncConsole()           Open VNC Console Window      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Standalone HTML Page                                       │
│  /assets/vnc-console/index.html                            │
│  ├─ UI Interface (Toolbar, Status Bar, Modals)             │
│  └─ vnc-controller.js (ES Module) - Main Controller        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  noVNC Library (RFB Protocol Implementation)                │
│  └─ novnc/core/rfb.js                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GNS3 Controller (WebSocket Server)                         │
│  wss://host:port/v3/projects/{id}/nodes/{id}/console/vnc   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. VncConsoleService (Angular Service)

**File Location**: `src/app/services/vnc-console.service.ts`

#### 1.1 Build WebSocket URL

```typescript
buildVncWebSocketUrl(controller: Controller, node: Node): string {
  // Determine WebSocket protocol based on controller protocol
  const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';

  // Build WebSocket URL following GNS3 API specification
  // Format: {protocol}://{host}:{port}/{version}/projects/{project_id}/nodes/{node_id}/console/vnc?token={token}
  const wsUrl = `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${node.project_id}/nodes/${node.node_id}/console/vnc?token=${controller.authToken}`;

  return wsUrl;
}
```

**Key Points**:
- Automatically selects `ws://` or `wss://` protocol
- Follows GNS3 API path specification
- Includes authentication token

#### 1.2 Build Console Page URL

```typescript
buildVncConsolePageUrl(controller: Controller, node: Node): string {
  const wsUrl = this.buildVncWebSocketUrl(controller, node);

  // Build page query parameters
  const params = new URLSearchParams({
    ws_url: wsUrl,              // WebSocket connection URL
    node_name: node.name,       // Node name
    node_id: node.node_id,      // Node ID
    project_id: node.project_id,// Project ID
    autoconnect: '1'            // Auto-connect
  });

  // Web application: Use absolute path
  return `/assets/vnc-console/index.html?${params.toString()}`;
}
```

**Key Points**:
- ⚠️ **Electron support removed** (v1.8.0)
- Now uses absolute path for web browser
- Opens in new browser window via `window.open()`

**Deprecated (v1.8.0)**:
~~Electron packaged app detection~~
~~Relative path for Electron environment~~

#### 1.3 Open VNC Console

```typescript
openVncConsole(controller: Controller, node: Node, inNewTab: boolean = false) {
  // Validate node status
  if (node.status !== 'started') {
    this.toasterService.error('Node must be started before opening console');
    return;
  }

  // Validate console type
  if (node.console_type !== 'vnc') {
    this.toasterService.error(`Node console type is ${node.console_type}, not vnc`);
    return;
  }

  // Parse console resolution (format: "1024x768")
  const windowPadding = 10;
  let windowWidth = 1024 + windowPadding;
  let windowHeight = 768 + windowPadding;

  if (node.properties?.console_resolution) {
    const resolution = node.properties.console_resolution;
    const parts = resolution.split('x');
    if (parts.length === 2) {
      windowWidth = parseInt(parts[0], 10) + windowPadding;
      windowHeight = parseInt(parts[1], 10) + windowPadding;
    }
  }

  // Build page URL
  const pageUrl = this.buildVncConsolePageUrl(controller, node);
  const windowName = `VNC-${node.name}`;

  // Open window
  let newWindow;
  if (inNewTab) {
    // Open in new tab
    newWindow = window.open(pageUrl, '_blank');
  } else {
    // Open in popup window with specified size
    newWindow = window.open(pageUrl, windowName,
      `width=${windowWidth},height=${windowHeight}`);
  }

  // Detect if popup was blocked
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    this.toasterService.error('Popup was blocked. Please allow popups for this site.');
  }
}
```

**Features**:
- Node status validation
- Custom resolution support
- New tab or popup window mode
- Popup blocker detection

### 2. ~~ElectronService (Environment Detection)~~ ⚠️ **DEPRECATED (v1.8.0)**

**⚠️ Deprecated**: Electron desktop application support has been removed. This section is kept for historical reference only.

~~**File Location**: `src/app/services/electron.service.ts`~~

```typescript
// This code is no longer used
isElectron(): boolean {
  // Check if running in Electron environment by testing window.electronAPI
  return !!(window && (window as any).electronAPI);
}
```

**Deprecated Functionality**:
- ~~Electron's preload.js injects `electronAPI` into the `window` object~~
- ~~Environment detection for desktop vs. web~~
- ~~Different path resolution for Electron packaged apps~~

**Current Implementation**:
- Application is web-only
- All VNC Consoles open in browser popup windows
- No desktop environment detection needed

### 3. VNC Controller (Frontend Controller)

**File Location**: `src/assets/vnc-console/vnc-controller.js`

#### 3.1 Initialization Flow

```javascript
// 1. Parse URL parameters
const params = new URLSearchParams(window.location.search);
const wsUrl = params.get('ws_url');
const nodeName = params.get('node_name') || 'VNC';
const autoconnect = params.get('autoconnect') !== '0';

// 2. Create RFB (Remote Frame Buffer) instance
rfb = new RFB(container, wsUrl, {
  resizeSession: false,  // Don't resize remote session
  scaleViewport: true,   // Scale display to fit container
});

// 3. Attach event listeners
attachRfbEventListeners(rfb);

// 4. Auto-connect
if (autoconnect) {
  rfb.connect();
}
```

#### 3.2 Connection State Management

```javascript
// Connecting
rfb.addEventListener('connecting', () => {
  updateStatus('Connecting...', 'info');
  updateConnectionStatus('Connecting...', '#ffa500');
});

// Connected
rfb.addEventListener('connect', () => {
  clearTimeout(connectionTimeout);
  isConnected = true;
  hideLoading();
  updateStatus('Connected', 'success');
  updateConnectionStatus('Connected', '#4caf50');

  // Force initial scale
  setTimeout(() => {
    rfb.scaleViewport = true;
    rfb.sendScaleConfig();
  }, 500);
});

// Disconnected
rfb.addEventListener('disconnect', (e) => {
  isConnected = false;
  const clean = e.detail && e.detail.clean;

  if (clean) {
    // Normal disconnect
    updateStatus('Disconnected', 'warning');
  } else {
    // Abnormal disconnect
    const reason = e.detail ? e.detail.reason : 'Unknown error';
    showError('Connection Lost', reason);
  }
});

// Credentials required
rfb.addEventListener('credentialsrequired', () => {
  const password = prompt('Enter VNC password:');
  if (password) {
    rfb.sendCredentials({ password: password });
  } else {
    rfb.disconnect();
  }
});

// Security failure
rfb.addEventListener('securityfailure', () => {
  showError('Security Error', 'Security negotiation failed');
});
```

#### 3.3 Send Key Functions

**Send Ctrl+Alt+Del**:
```javascript
function sendCtrlAltDel() {
  if (rfb && isConnected) {
    rfb.sendCtrlAltDel();
  }
}
```

**Send Ctrl+Alt+Backspace**:
```javascript
function sendCtrlAltBackspace() {
  if (rfb && isConnected) {
    rfb.sendKey(0xFFE3, 'ControlLeft', true);  // Ctrl down
    rfb.sendKey(0xFFE9, 'AltLeft', true);      // Alt down
    rfb.sendKey(0xFF08, 'BackSpace', true);    // Backspace down
    rfb.sendKey(0xFF08, 'BackSpace', false);   // Backspace up
    rfb.sendKey(0xFFE9, 'AltLeft', false);     // Alt up
    rfb.sendKey(0xFFE3, 'ControlLeft', false); // Ctrl up
  }
}
```

**Send Function Keys with Modifiers (F1-F12)**:
```javascript
function sendKeyCombination(fNum) {
  const modifiers = getSelectedModifiers(); // ['ctrl', 'alt', 'shift']
  const keysym = 0xFFBE + fNum - 1; // F1-F12 keysyms

  // Press modifiers
  const modifierKeys = {
    'ctrl': { code: 0xFFE3, name: 'ControlLeft' },
    'alt': { code: 0xFFE9, name: 'AltLeft' },
    'shift': { code: 0xFFE1, name: 'ShiftLeft' }
  };

  modifiers.forEach(mod => {
    rfb.sendKey(modifierKeys[mod].code, modifierKeys[mod].name, true);
  });

  // Send function key
  rfb.sendKey(keysym, `F${fNum}`, true);
  rfb.sendKey(keysym, `F${fNum}`, false);

  // Release modifiers
  modifiers.reverse().forEach(mod => {
    rfb.sendKey(modifierKeys[mod].code, modifierKeys[mod].name, false);
  });
}
```

#### 3.4 Screen Recording Feature

**Recording Modes**:
- `vnc`: VNC screen only
- `vnc-camera`: VNC screen + camera (picture-in-picture)
- `camera`: Camera only

**Core Implementation**:
```javascript
async function startRecording() {
  // 1. Get recording mode
  const modeSelect = document.getElementById('record-mode');
  recordingMode = modeSelect ? modeSelect.value : 'vnc';

  // 2. Initialize camera (if needed)
  if (recordingMode === 'vnc-camera' || recordingMode === 'camera') {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false
      });
      cameraVideo.srcObject = cameraStream;
      await cameraVideo.play();
    } catch (err) {
      // Camera not available, fallback to VNC mode
      recordingMode = 'vnc';
    }
  }

  // 3. Create recording canvas
  const recordingCanvas = document.createElement('canvas');
  recordingCanvas.width = vncCanvas.width;
  recordingCanvas.height = vncCanvas.height;
  const recordingCtx = recordingCanvas.getContext('2d');

  // 4. Get microphone audio
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
  } catch (err) {
    // Microphone not available, continue recording (no audio)
  }

  // 5. Create video stream
  const refreshRate = window.screen.refreshRate || 30;
  const videoStream = recordingCanvas.captureStream(Math.min(refreshRate, 60));

  // Add audio track
  if (audioStream) {
    videoStream.addTrack(audioStream.getAudioTracks()[0]);
  }

  // 6. Create MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  mediaRecorder = new MediaRecorder(videoStream, { mimeType });
  recordedChunks = [];

  // 7. Continuous draw loop
  function continuousDraw() {
    // Clear canvas
    recordingCtx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);

    // Draw content based on mode
    if (recordingMode === 'vnc-camera') {
      // Draw VNC screen
      recordingCtx.drawImage(vncCanvas, 0, 0);

      // Draw camera (bottom-right picture-in-picture)
      const pipWidth = 200;
      const pipHeight = 150;
      const pipX = recordingCanvas.width - pipWidth - 10;
      const pipY = recordingCanvas.height - pipHeight - 10;

      // Draw semi-transparent background
      recordingCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      recordingCtx.fillRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);

      // Draw camera feed
      recordingCtx.drawImage(cameraVideo, pipX, pipY, pipWidth, pipHeight);
    } else if (recordingMode === 'vnc') {
      // VNC only
      recordingCtx.drawImage(vncCanvas, 0, 0);
    } else if (recordingMode === 'camera') {
      // Camera only
      recordingCtx.drawImage(cameraVideo, 0, 0,
        recordingCanvas.width, recordingCanvas.height);
    }

    // Draw recording timestamp
    const timestamp = `${minutes}:${secs}`;
    recordingCtx.font = 'bold 32px monospace';
    recordingCtx.fillStyle = '#f44336';
    recordingCtx.textAlign = 'center';
    recordingCtx.fillText(`⏺ ${timestamp}`,
      recordingCanvas.width / 2, 20);

    // Draw GNS3 watermark
    recordingCtx.font = 'bold italic 40px serif';
    recordingCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    recordingCtx.fillText('GNS3',
      recordingCanvas.width - 20, recordingCanvas.height - 20);

    // Draw mouse cursor
    if (currentMousePos) {
      drawCursor(recordingCtx, currentMousePos);
    }

    // Draw click ripple effects
    drawClickEffects(recordingCtx, clickEffects);

    // Request next frame
    if (isRecording) {
      drawAnimationFrame = requestAnimationFrame(continuousDraw);
    }
  }

  // 8. Handle recording data
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // Save video file
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vnc-recording-${timestamp}.webm`;
    a.click();
  };

  // 9. Start recording
  mediaRecorder.start();
  continuousDraw();
  updateRecordingTimer();
}
```

**Pause/Resume/Stop**:
```javascript
function pauseRecording() {
  if (mediaRecorder && isRecording && !isPaused) {
    mediaRecorder.pause();
    isPaused = true;
    pausedStartTime = Date.now();
    updateRecordingUI();
  }
}

function resumeRecording() {
  if (mediaRecorder && isRecording && isPaused) {
    mediaRecorder.resume();
    isPaused = false;
    totalPausedTime += Date.now() - pausedStartTime;
    updateRecordingUI();
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    // If paused, resume first
    if (isPaused) {
      mediaRecorder.resume();
      totalPausedTime += Date.now() - pausedStartTime;
    }

    mediaRecorder.stop();
    isRecording = false;
    isPaused = false;
  }
}
```

#### 3.5 Screenshot Feature

```javascript
function takeScreenshot() {
  // Get VNC Canvas
  let canvas = rfb.get_canvas() || rfb.canvas ||
               container.querySelector('canvas');

  if (!canvas) {
    log('Cannot get VNC canvas', 'error');
    return;
  }

  // Convert to PNG data URL
  const dataUrl = canvas.toDataURL('image/png');

  // Create download link
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `vnc-screenshot-${timestamp}.png`;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);

  // Trigger download
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}
```

#### 3.6 Clipboard Synchronization

```javascript
// Open clipboard modal
function openClipboard() {
  clipboardModal.style.display = 'block';
  modalOverlay.style.display = 'block';
  clipboardText.value = '';
  clipboardText.focus();
}

// Send clipboard content to remote
function sendClipboard() {
  const text = clipboardText.value;
  if (rfb && isConnected && text) {
    rfb.clipboardPasteFrom(text);
    closeClipboard();
    updateStatus('Clipboard sent', 'success');
  }
}

// Receive remote clipboard content
rfb.addEventListener('clipboard', (e) => {
  if (e.detail && e.detail.text) {
    // Can handle received clipboard content here
    // For example: auto-copy to local clipboard
  }
});
```

#### 3.7 Mouse Click Tracking (Recording Effects)

```javascript
// Listen for mouse click events
document.addEventListener('mousedown', (e) => {
  if (!isRecording || isPaused) return;

  // Check if click is within VNC container
  const containerRect = container.getBoundingClientRect();
  if (e.clientX < containerRect.left ||
      e.clientX > containerRect.right ||
      e.clientY < containerRect.top ||
      e.clientY > containerRect.bottom) {
    return;
  }

  // Get VNC Canvas
  const vncCanvas = rfb.get_canvas();
  const rect = vncCanvas.getBoundingClientRect();

  // Calculate click position (relative to Canvas)
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Scale coordinates to Canvas internal resolution
  const scaleX = vncCanvas.width / rect.width;
  const scaleY = vncCanvas.height / rect.height;
  const canvasX = x * scaleX;
  const canvasY = y * scaleY;

  // Add click effect
  clickEffects.push({
    x: canvasX,
    y: canvasY,
    startTime: Date.now()
  });
});

// Draw click ripple effects
function drawClickEffects(ctx) {
  const currentTime = Date.now();

  clickEffects = clickEffects.filter(effect => {
    const age = currentTime - effect.startTime;
    if (age > 600) return false; // Remove effects older than 600ms

    const progress = age / 600; // 0 to 1
    const maxRadius = 40;
    const currentRadius = progress * maxRadius;
    const alpha = 1 - progress; // Fade out

    // Draw expanding circle
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(244, 67, 54, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 67, 54, ${alpha})`;
    ctx.fill();

    return true;
  });
}
```

#### 3.8 Scale Control

```javascript
function scaleUp() {
  if (rfb && isConnected) {
    scale = Math.min(scale + 0.1, 3.0);
    rfb.scaleViewport = false;
    rfb.scale = scale;
    rfb.sendScaleConfig();
  }
}

function scaleDown() {
  if (rfb && isConnected) {
    scale = Math.max(scale - 0.1, 0.3);
    rfb.scaleViewport = false;
    rfb.scale = scale;
    rfb.sendScaleConfig();
  }
}

function scaleToFit() {
  if (rfb && isConnected) {
    scale = 1.0;
    rfb.scaleViewport = true;
    rfb.sendScaleConfig();
  }
}
```

## UI Components

### 1. Toolbar

**Location**: `index.html` lines 634-729

**Components**:
- **Connection Controls**: Fullscreen, Connect, Disconnect
- **Send Keys**: Function keys, Shortcuts (dropdown menu)
- **Scale Controls**: Scale up, Scale down, Fit to window
- **Screen Capture**: Recording mode selector, Microphone, Screenshot, Recording controls
- **Clipboard**: Open clipboard

### 2. Status Bar

Displays current operation status (Connecting, Connected, Error, etc.)

### 3. Recording Indicator

Displays recording time and status (Recording/Paused)

### 4. Error Dialog

Displays connection errors, authentication failures, etc.

## Solved Issues

### 1. ~~Electron Packaged Application Path Issue~~ ⚠️ **DEPRECATED (v1.8.0)**

**⚠️ Deprecated**: Electron desktop application support has been removed. This issue is no longer applicable.

**Historical Problem** (v1.0.0 - v1.7.0):
- VNC console cannot open in Electron packaged application
- Error Code: `ERR_FILE_NOT_FOUND`
- Absolute path `/assets/...` doesn't resolve in Electron's `file://` context

**Historical Solution** (No longer used):
~~Electron environment detection with conditional path resolution~~

**Current Status** (v1.8.0+):
- ✅ **Issue Resolved**: Application is now web-only
- ✅ All VNC Consoles open in browser popup windows
- ✅ Uses consistent absolute path: `/assets/vnc-console/index.html`
- ✅ No `file://` protocol complications
- ✅ No environment detection needed

**Alternative Approaches (Evaluated but not adopted)**:

**Approach 1: Using `window.location.href`**
```typescript
const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
```
- **Issue**: Returns Angular route path, not actual HTML file location
- **Result**: Failed with `file://file://...` duplication

**Approach 2: Using `__dirname` in renderer process**
```typescript
return `file://${__dirname}/dist/assets/vnc-console/index.html`;
```
- **Issue**: `__dirname` is not available in renderer process (Angular)
- **Result**: Compilation error

**Approach 3: Using absolute `file://` path**
- **Issue**: AppImage extracts to random temporary directory, path changes each time
- **Result**: Not portable

### 2. Video Duration Issue During Recording

**Problem**:
- When recording using `canvas.captureStream()`, video duration becomes shorter if the screen is static
- MediaRecorder only records data when the screen changes

**Solution**:
Use `requestAnimationFrame` to continuously redraw the Canvas, ensuring actual video duration:
```javascript
function continuousDraw() {
  // Always redraw, even if screen is static
  recordingCtx.drawImage(vncCanvas, 0, 0);
  // ... draw other elements

  requestAnimationFrame(continuousDraw);
}
```

### 3. Stop Recording When VNC Disconnects

**Problem**:
- VNC disconnection causes recording to stop
- Users may want to record the complete session, including connection interruptions

**Solution**:
Decouple recording from VNC connection state:
```javascript
rfb.addEventListener('disconnect', (e) => {
  isConnected = false;
  // Note: Don't stop recording
  // Recording continues locally, may include black screen periods
});
```

### 4. Browser Shortcut Key Conflicts

**Problem**:
- Some browser shortcuts (e.g., Ctrl+S save, Ctrl+P print) interfere with VNC operations

**Solution**:
Prevent default behavior for specific shortcuts:
```javascript
document.addEventListener('keydown', (e) => {
  // Prevent Ctrl+S (save)
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
  }

  // Prevent Ctrl+P (print)
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
  }

  // Allow F5 and F11 browser default behavior
  if (e.key === 'F5' || e.key === 'F11') {
    return;
  }
});
```

### 5. Graceful Degradation When Microphone/Camera Unavailable

**Problem**:
- User devices may not have a microphone or camera
- Need to gracefully degrade without affecting core functionality

**Solution**:
```javascript
try {
  audioStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
} catch (err) {
  log('Microphone not available', 'warn');
  audioStream = null; // Continue recording, just no audio
}

try {
  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 320, height: 240 },
    audio: false
  });
} catch (err) {
  log('Camera not available', 'warn');
  recordingMode = 'vnc'; // Fallback to VNC mode
}
```

### 6. Recording Pause Time Calculation

**Problem**:
- Pause time should not count towards total duration
- Need to accurately calculate actual recording duration

**Solution**:
```javascript
let totalPausedTime = 0;
let pausedStartTime = null;

function pauseRecording() {
  mediaRecorder.pause();
  isPaused = true;
  pausedStartTime = Date.now();
}

function resumeRecording() {
  mediaRecorder.resume();
  isPaused = false;
  // Accumulate pause duration
  totalPausedTime += Date.now() - pausedStartTime;
  pausedStartTime = null;
}

function updateRecordingTimer() {
  let elapsed = Date.now() - recordingStartTime - totalPausedTime;

  // If currently paused, exclude current pause period
  if (isPaused && pausedStartTime) {
    elapsed -= (Date.now() - pausedStartTime);
  }

  // ... update display
}
```

### 7. Click Coordinate Scaling

**Problem**:
- VNC Canvas display size differs from internal resolution
- Click coordinates need correct scaling

**Solution**:
```javascript
// Get Canvas display size on screen
const rect = vncCanvas.getBoundingClientRect();

// Calculate scaling ratio
const scaleX = vncCanvas.width / rect.width;
const scaleY = vncCanvas.height / rect.height;

// Scale click coordinates
const canvasX = (e.clientX - rect.left) * scaleX;
const canvasY = (e.clientY - rect.top) * scaleY;
```

### 8. noVNC Canvas Retrieval

**Problem**:
- Different noVNC versions have different Canvas retrieval methods
- Need to be compatible with multiple methods

**Solution**:
```javascript
let canvas = null;

// Method 1: rfb.get_canvas()
if (typeof rfb.get_canvas === 'function') {
  canvas = rfb.get_canvas();
}

// Method 2: rfb.canvas
if (!canvas && rfb.canvas) {
  canvas = rfb.canvas;
}

// Method 3: Query from container
if (!canvas) {
  canvas = container.querySelector('canvas');
}
```

## Feature List

| Feature | Description | Code Location |
|---------|-------------|---------------|
| **Connection Management** | Connect/Disconnect/Reconnect to VNC server | vnc-controller.js:123-180, 1300-1349 |
| **Auto Connect** | Automatically connect on page load | URL parameter `autoconnect=1` |
| **Connection Timeout** | 15-second timeout protection | vnc-controller.js:1512-1529 |
| **Authentication Support** | VNC password authentication | vnc-controller.js:182-197 |
| **Send Keys** | F1-F12, Tab, Esc, Print Screen | vnc-controller.js:362-462 |
| **Shortcuts** | Ctrl+Alt+Del, Ctrl+Alt+Backspace | vnc-controller.js:362-399 |
| **Modifier Combinations** | Ctrl/Alt/Shift + F1-F12 | vnc-controller.js:401-454 |
| **Screen Scaling** | Scale up/Scale down/Fit to window | vnc-controller.js:1261-1297 |
| **Fullscreen Mode** | F11 or button toggle fullscreen | vnc-controller.js:352-361 |
| **Screenshot** | PNG format screenshot download | vnc-controller.js:485-545 |
| **Screen Recording** | WebM format video recording | vnc-controller.js:547-1149 |
| **Multi-mode Recording** | VNC/VNC+Camera/Camera | vnc-controller.js:569-641 |
| **Recording Pause** | Pause/Resume recording | vnc-controller.js:1028-1073 |
| **Audio Recording** | Microphone audio capture | vnc-controller.js:655-668 |
| **Mute Control** | Mute microphone during recording | vnc-controller.js:464-483 |
| **Mouse Tracking** | Show mouse cursor during recording | vnc-controller.js:1622-1668 |
| **Click Effects** | Click ripple animation | vnc-controller.js:1554-1620 |
| **Timestamp** | Recording time display | vnc-controller.js:302-334 |
| **Watermark** | Invisible GNS3 watermark | vnc-controller.js:815-853 |
| **Clipboard** | Send/Receive clipboard content | vnc-controller.js:1357-1382 |
| **Toolbar** | Collapsible toolbar | vnc-controller.js:224-254 |
| **Status Display** | Connection status/operation hints | vnc-controller.js:74-101 |
| **Error Handling** | Friendly error messages | vnc-controller.js:89-101 |
| **Keyboard Shortcuts** | Prevent browser shortcut conflicts | vnc-controller.js:1670-1707 |
| **Window Adaptive** | Rescale on window resize | vnc-controller.js:1709-1719 |
| **Electron Compatible** | Auto-detect Electron environment | vnc-console.service.ts:59-61 |

## Technical Highlights

1. **Standalone HTML Page**
   - Completely independent from Angular application
   - Can run in new window/tab
   - Uses ES Module for dependencies

2. **Canvas Composition**
   - Supports multi-video source composition (VNC + Camera)
   - Picture-in-Picture (PiP) layout
   - Real-time effect rendering

3. **Real-time Animation Effects**
   - Click ripple animations
   - Mouse cursor tracking
   - Recording timestamp display

4. **Invisible Watermark**
   - Uses steganography to embed copyright information in video
   - Multi-position redundant encoding
   - Doesn't affect viewing experience

5. **Cross-platform Compatibility**
   - Supports Web application
   - Supports Electron packaged application
   - Automatic environment detection

6. **Graceful Degradation**
   - Automatically degrades when camera/microphone unavailable
   - Doesn't affect core VNC functionality

7. **Performance Optimization**
   - Uses `requestAnimationFrame` for smooth animations
   - Adaptive refresh rate
   - Canvas double buffering

8. **User Experience**
   - Collapsible toolbar
   - Intuitive recording indicator
   - Detailed error messages
   - Keyboard shortcut support

## Build and Deployment

### Development Environment

```bash
# Start Angular development server
ng serve

# VNC console will use: http://localhost:4200/assets/vnc-console/index.html
```

### Production Build

```bash
# Build production version
ng build --configuration=production

# VNC console will be copied to: dist/assets/vnc-console/
```

### ~~Electron Build~~ ⚠️ **DEPRECATED (v1.8.0)**

**⚠️ Deprecated**: Electron desktop application support has been removed.

~~**Build Linux version**~~:
```bash
~~npm run build:electron && npx electron-builder -l~~
```

~~**Build Windows version**~~ (requires wine on Linux):
```bash
~~npm run electron:build~~
```

~~**Build all platforms**~~:
```bash
~~npm run electron:build:all~~
```

**Historical package.json scripts** (No longer used):
```json
{
  "scripts": {
    "build:electron": "ng build --configuration=electronProd --base-href ./",
    "electron:build": "npm run build:electron && electron-builder -w",
    "electron:build:all": "npm run build:electron && electron-builder -wml"
  }
}
```

### Known Warnings

~~**Electron AppImage Warnings**~~ (v1.8.0: No longer applicable):
| ~~Warning~~ | ~~Description~~ |
|-------------|-----------------|
| ~~`Gtk-Message: Failed to load module "appmenu-gtk-module"`~~ | ~~System-level issue~~ |
| ~~`LIBDBUSMENU-GLIB-WARNING`~~ | ~~Menu bar module issue~~ |
| ~~`MESA-LOADER: failed to open dri`~~ | ~~Graphics driver permission issue~~ |

**Current Notes**:
- Application is web-only
- VNC Console runs in browser popup windows
- No desktop application warnings

## Dependencies

### Frontend Dependencies
- **noVNC**: VNC client library (`src/assets/vnc-console/novnc/`)

### Browser APIs
- **WebSocket**: Communication with GNS3 Controller
- **Canvas API**: Video recording and screenshots
- **MediaDevices API**: Camera and microphone access
- **MediaRecorder API**: Video recording
- **Fullscreen API**: Fullscreen mode

### Angular Services
- **VncConsoleService**: VNC console management
- ~~**ElectronService**: Environment detection~~ ⚠️ **Removed (v1.8.0)**
- **ToasterService**: Notification alerts

## Related Files

| File | Description |
|------|-------------|
| `src/app/services/vnc-console.service.ts` | Angular service, builds URLs and opens windows |
| `src/app/services/electron.service.ts` | Electron environment detection |
| `src/assets/vnc-console/index.html` | VNC console main page |
| `src/assets/vnc-console/vnc-controller.js` | VNC console main controller |
| `src/assets/vnc-console/novnc/` | noVNC library |
| `main.js` | Electron main process |

## References

- [noVNC Documentation](https://github.com/novnc/noVNC)
- [RFB Protocol](https://github.com/rfbproto/rfbproto)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## Changelog

### 2025-03-17
- Added screen recording feature (VNC/VNC+Camera/Camera modes)
- Added microphone audio recording
- Added click ripple effects
- Added mouse cursor tracking
- Added invisible watermark embedding
- Improved Electron path handling

### 2025-03-18
- Created complete implementation documentation
- Consolidated solved issues
- Added technical highlights
- Translated documentation to English
