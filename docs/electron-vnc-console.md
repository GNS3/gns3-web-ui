# Electron VNC Console Issue and Solution

## Overview

When running the GNS3 Web UI as an Electron packaged application, opening the VNC console fails with `ERR_FILE_NOT_FOUND` error. This document describes the issue and the solution implemented.

## Problem Description

### Error Message
```
Failed to open VNC console: Failed to execute 'open' on 'Window': Unable to open a window with invalid URL 'file:///tmp/.mount_GNS3%20Wn6zhMS/resources/app.asar/dist/assets/vnc-console/index.html?...'
```

### Root Cause

- In the web application, VNC console URLs use `/assets/vnc-console/index.html` (relative to web root)
- When packaged as Electron app, the app uses `file://` protocol
- The relative path `/assets/...` doesn't resolve correctly in the Electron file:// context

## Solution

Modified `src/app/services/vnc-console.service.ts` to detect Electron environment and use the correct path:

```typescript
// Return path to standalone HTML page
// In Electron packaged app, use relative path since assets are alongside index.html
if (this.electronService.isElectron()) {
  // Use relative path: from dist/index.html to dist/assets/vnc-console/index.html
  return `assets/vnc-console/index.html?${params.toString()}`;
}
return `/assets/vnc-console/index.html?${params.toString()}`;
```

### Key Changes

1. **Added ElectronService injection** to detect Electron environment
2. **Conditional path resolution** based on runtime environment

### Modified Files

| File | Changes |
|------|---------|
| `src/app/services/vnc-console.service.ts` | Added ElectronService, path handling logic |

## Alternative Approaches Considered

### 1. Using `window.location.href`
```typescript
const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
```
- **Issue**: Returns Angular route path, not the actual HTML file location
- **Result**: Failed with `file://file://...` duplication

### 2. Using `__dirname` in renderer process
```typescript
return `file://${__dirname}/dist/assets/vnc-console/index.html`;
```
- **Issue**: `__dirname` is not available in renderer process (Angular)
- **Result**: Compilation error

### 3. Using absolute `file://` path
- **Issue**: AppImage extracts to random temp directory, path changes each time
- **Result**: Not portable

## Building for Electron

```bash
# Build for Linux
npm run build:electron && npx electron-builder -l

# Build for Windows (requires wine on Linux)
npm run electron:build

# Build for all platforms
npm run electron:build:all
```

## Known Warnings

The following warnings may appear when running the AppImage but do not affect functionality:

| Warning | Description |
|---------|-------------|
| `Gtk-Message: Failed to load module "appmenu-gtk-module"` | System-level issue, can be ignored |
| `LIBDBUSMENU-GLIB-WARNING` | Menu bar module issue |
| `MESA-LOADER: failed to open dri` | Graphics driver permission issue (common in Docker/AppImage) |

## Related Files

- `src/app/services/vnc-console.service.ts` - VNC console URL builder
- `src/app/services/electron.service.ts` - Electron environment detection
- `main.js` - Electron main process
