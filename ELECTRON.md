# Electron 22 Integration

## Overview

This branch integrates Electron 22 with the existing GNS3 Web UI application to enable local tool integration (Wireshark, RDP, etc.) while maintaining full compatibility with the existing Angular 14 + TypeScript 4.6 + xterm 4.18 stack.

## Technical Stack

| Component | Version | Status |
|-----------|---------|--------|
| Electron | 22.3.27 | ✅ Latest 22.x (LTS until 2025-07) |
| Node.js (builtin) | 16.17.4 | ✅ Compatible with @types/node 17 |
| Chrome (builtin) | 108 | ✅ Modern browser engine |
| Angular | 14.3.0 | ✅ Unchanged |
| TypeScript | 4.6.4 | ✅ Unchanged |
| @types/node | 17.0.31 | ✅ Unchanged |
| xterm | 4.18.0 | ✅ Unchanged |

## Key Features

- ✅ **Zero Breaking Changes**: All existing dependencies remain unchanged
- ✅ **Local Tool Integration**: Support for Wireshark, RDP client
- ✅ **Dual Mode**: Works in both browser and Electron environments
- ✅ **Secure IPC**: Context isolation enabled, node integration disabled
- ✅ **Cross-Platform**: Windows, macOS, Linux support

## Development

### Prerequisites

```bash
# Install dependencies
yarn install
```

### Running the Application

#### Web Mode (Standard)
```bash
npm start
# Access at http://localhost:4200
```

#### Electron Mode (Development)
```bash
npm run electron:dev
# This will:
# 1. Start Angular dev server (http://localhost:4200)
# 2. Wait for Angular to be ready
# 3. Launch Electron window
```

#### Electron Mode (Production)
```bash
# Build Angular for production
npm run buildforproduction

# Launch Electron
npm run electron
```

## Building for Distribution

### Windows
```bash
npm run electron:build
# Output: dist-electron/GNS3-Web-UI-3.1.0.dev1.exe
```

### macOS
```bash
npm run electron:build -- -m
# Output: dist-electron/GNS3 Web UI-3.1.0.dev1.dmg
```

### Linux
```bash
npm run electron:build -- -l
# Output: dist-electron/GNS3-Web-UI-3.1.0.dev1.AppImage
```

### All Platforms
```bash
npm run electron:build:all
```

## Usage

### Using ElectronService in Components

```typescript
import { Component } from '@angular/core';
import { ElectronService } from '@services/electron.service';

@Component({
  selector: 'app-example',
  template: `
    <button (click)="openWireshark()">Open Wireshark</button>
    <button (click)="openRDP()">Open RDP</button>
  `
})
export class ExampleComponent {
  constructor(
    private electronService: ElectronService
  ) {}

  openWireshark() {
    this.electronService.openWireshark('/path/to/capture.pcapng').subscribe(success => {
      if (success) {
        console.log('Wireshark opened successfully');
      } else {
        console.error('Failed to open Wireshark');
      }
    });
  }

  openRDP() {
    this.electronService.openRDP({
      host: '192.168.1.100',
      port: 3389,
      username: 'admin'
    }).subscribe(success => {
      if (success) {
        console.log('RDP opened successfully');
      }
    });
  }
}
```

### Environment Detection

```typescript
// Check if running in Electron
if (this.electronService.isElectron()) {
  // Electron-specific code
}

// Get platform information
this.electronService.getPlatformInfo().subscribe(info => {
  console.log('Platform:', info.platform);
  console.log('Electron version:', info.versions.electron);
});

// Platform-specific checks
if (this.electronService.isWindows()) {
  // Windows-specific code
}
```

## File Structure

```
gns3-web-ui/
├── main.js                      # Electron main process
├── preload.js                   # Preload script (IPC bridge)
├── package.json                 # Updated with Electron scripts
├── src/
│   ├── types/
│   │   └── electron.d.ts        # TypeScript definitions
│   └── app/
│       └── services/
│           └── electron.service.ts  # Angular service
└── ELECTRON.md                  # This file
```

## IPC API

### Available Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `openWireshark` | `captureFilePath: string` | `Promise<{success: boolean}>` | Open Wireshark with capture file |
| `openRDP` | `config: {host, port, username?}` | `Promise<{success: boolean}>` | Open RDP connection |
| `checkSoftware` | `softwareName: string` | `Promise<{installed: boolean}>` | Check if software is installed |
| `getPlatformInfo` | - | `Promise<PlatformInfo>` | Get platform information |

## Security Considerations

1. **Context Isolation**: Enabled (default in Electron 12+)
2. **Node Integration**: Disabled in renderer process
3. **IPC Communication**: All communication through contextBridge
4. **Content Security**: No remote code loading

## Troubleshooting

### Issue: Electron window opens but shows blank screen

**Solution**: Make sure Angular dev server is running on http://localhost:4200

```bash
# Start Angular first
npm start

# Then in another terminal
npm run electron
```

### Issue: Wireshark not found

**Solution**: Ensure Wireshark is installed in standard location:
- Windows: `C:\Program Files\Wireshark\Wireshark.exe`
- macOS: `/Applications/Wireshark.app/Contents/MacOS/Wireshark`
- Linux: `/usr/bin/wireshark`

### Issue: Build fails with "Cannot find module"

**Solution**: Clean and reinstall dependencies

```bash
rm -rf node_modules yarn.lock
yarn install
```

## Future Enhancements

- [ ] Add auto-update support
- [ ] Add crash reporting (Sentry)
- [ ] Add application signing
- [ ] Add portable build option
- [ ] Add more local tools (e.g., packet tracer)

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder Documentation](https://www.electron.build/)
- [Context Isolation Guide](https://www.electronjs.org/docs/tutorial/context-isolation)
