# GNS3 Symbols - Complete Guide

## Overview

GNS3 Web UI supports multiple image formats for node symbols, rendered on the project map using SVG `<image>` elements.

**Supported Formats:**
- ✅ SVG (vector graphics, scalable)
- ✅ PNG (transparency support)
- ✅ JPG/JPEG (photographic images)
- ✅ GIF (including animated GIFs)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supported Formats](#supported-formats)
3. [Upload Process](#upload-process)
4. [Rendering Architecture](#rendering-architecture)
5. [Animation Support](#animation-support)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Upload a Symbol

1. **Web UI** → **Preferences** → **Symbols**
2. Click **Symbols Manager**
3. Go to **Add Symbol** tab
4. Click **Choose File to Upload**
5. Select file (SVG/PNG/JPG/GIF)
6. Symbol appears in list

### Use a Symbol

1. Right-click node on canvas
2. Select **Change symbol**
3. Choose from list

### Delete Symbols

1. **Web UI** → **Preferences** → **Symbols**
2. Click **Symbols Manager**
3. Go to **Manage Symbols** tab for instructions
4. Or use the delete mode in the main symbols view:
   - Click **Delete symbols** button
   - Click on symbols to select them (red border indicates selection)
   - Click **Delete** button to remove selected symbols
   - Only custom symbols can be deleted

---

## Supported Formats

| Format | Extension | Animation | Best For | Max Size |
|--------|-----------|-----------|----------|----------|
| **SVG** | `.svg` | Yes (SMIL) | Icons, diagrams | 50 KB |
| **PNG** | `.png` | No | Transparency | 500 KB |
| **JPG** | `.jpg` | No | Photos | 200 KB |
| **GIF** | `.gif` | Yes | Simple animations | 1 MB |

**Recommended Dimensions:** 128×128 pixels (GNS3 scales to max 80px)

---

## Symbols Manager

The Symbols Manager is a centralized dialog for managing your symbol library.

### Access

- **Web UI** → **Preferences** → **Symbols** → **Symbols Manager** button

### Features

#### Add Symbol Tab

- Upload new symbols in SVG, PNG, JPG, JPEG, or GIF format
- Shows upload status with success/error messages
- Automatically refreshes the symbols list after successful upload

#### Manage Symbols Tab

- Displays all custom symbols in a grid view
- Click symbols to select them for deletion (red border indicates selection)
- Use "Select all" / "Clear" buttons for batch operations
- Click "Delete" button to remove selected symbols
- Only custom symbols can be deleted (built-in symbols are excluded)

### Benefits

- **Centralized Interface**: All symbol management in one place
- **Visual Selection**: See all custom symbols at once with grid layout
- **Clear Feedback**: Upload status shows success or errors
- **Easy Selection**: Red border highlights selected symbols for deletion
- **Consistent**: Follows Material Design guidelines

---

## Upload Process

### SVG Files (Text-based)

```
SVG File → readAsText() → POST as text → Server
```

### PNG/JPG/GIF Files (Binary)

```
Image File → Create Blob → POST as binary → Server
```

**❌ Previous (Wrong) Approach:**
```typescript
fileReader.readAsDataURL(file);  // Converts to Base64 text
```

**✅ Current (Correct) Approach:**
```typescript
const blob = new Blob([file], { type: file.type });
this.symbolService.addFile(controller, fileName, blob);
```

**Why Binary?**
- Smaller file size (no Base64 overhead)
- Correct MIME type
- Server can process properly

---

## Rendering Architecture

### Data Flow

```
1. Node needs symbol
   ↓
2. GET /v3/symbols/{symbol_id}/raw
   ↓
3. GNS3 server returns binary data
   ↓
4. Create Blob → URL.createObjectURL(blob)
   ↓
5. blob:http://localhost:4200/xxx-xxx-xxx
   ↓
6. SVG <image href="blob:..." width="80" height="80"/>
```

### Symbol URL Format

```
node.symbol = ':/symbols/my-symbol.png'

Request URL:
/v3/symbols/:/symbols/my-symbol.png/raw

Note: The :/symbols/ prefix is intentional (built-in symbol marker)
```

---

## Animation Support

### GIF Animation

**✅ Yes, GIFs animate on canvas!**

When you upload an animated GIF, it plays continuously.

**Use Cases:**
- Blinking warning lights
- Status indicators
- Rotating devices
- Visual alerts

**Best Practices:**
- Keep animations short (2-4 frames)
- Frame delay ≥ 500ms
- File size < 200 KB
- Don't overuse

### SVG Animation

Use SMIL in SVG:

```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="20" fill="red">
    <animate attributeName="opacity"
             values="0;1;0"
             dur="1s"
             repeatCount="indefinite"/>
  </circle>
</svg>
```

---

## Troubleshooting

### Symbol Not Rendering

**Check:**

1. **Symbol URL**
   ```javascript
   const img = document.querySelector('g.node_body image');
   console.log('URL:', img?.getAttribute('href'));
   ```
   Should be: `blob:http://...`

2. **Direct Access**
   ```
   http://localhost:3080/v3/symbols/{your-symbol}/raw
   ```
   Should display image

3. **Dimensions**
   ```bash
   curl http://localhost:3080/v3/symbols/{your-symbol}/dimensions
   ```
   Should return: `{"width": 128, "height": 128}`

---

### CORS Errors

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**Solution 1: Use localhost**

When adding controller:
```
Host: localhost  ← Not 127.0.0.1
Port: 3080
```

**Solution 2: Configure GNS3 Server**

```bash
# Create config
mkdir -p ~/.config/GNS3
cat > ~/.config/GNS3/gns3_server.conf << 'EOF'
[Server]
access_control_allow_origin = *
EOF

# Restart server
gns3server
```

---

### Upload Failed (413)

**Error:**
```
POST /v3/symbols/...
Status: 413 Payload Too Large
```

**Solution:**
```bash
# Compress image
convert input.png -quality 85 -resize 50% output.png

# Or use pngquant
pngquant --quality=65-80 input.png
```

---

### Symbol Too Small/Large

**Cause:** GNS3 scales to max 80px, keeps aspect ratio.

**Example:**
- Original: 2000×500 (4:1)
- Scaled: 80×20 (very narrow!)

**Solution:**
```bash
# Crop to square first
convert input.png -gravity center -crop 1:1 -resize 128x128 output.png
```

---

### GIF Not Animating

**Cause:** Uploaded as drawing (static) instead of symbol (animated).

**Solution:**
Upload via **Preferences → Symbols**, not as drawing.

---

## Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/app/services/http-controller.service.ts` | Added `postBlob()` for binary upload |
| `src/app/services/symbol.service.ts` | Symbol list caching with `listBuiltinSymbols()` / `listCustomSymbols()` |
| `src/app/services/dialog-config.service.ts` | Centralized dialog configuration |
| `src/app/components/preferences/common/symbols/symbols.component.ts` | Main symbols browsing and selection interface |
| `src/app/components/preferences/common/symbols/symbols-manager-dialog/` | Symbols Manager dialog for adding/managing symbols |
| `src/app/components/project-map/template-symbol-dialog/` | Template symbol selection dialog |
| `src/app/cartography/widgets/node.ts` | Renders symbols on canvas |
| `src/app/cartography/widgets/drawings/image-drawing.ts` | Renders drawing images |
| `src/styles/_dialogs.scss` | Centralized dialog styles |

### Caching Mechanism

The `SymbolService` implements a caching strategy to reduce network requests:

| Method | Description | Cache |
|--------|-------------|-------|
| `list(controller)` | Full symbol list | Cached, invalidated on add/delete |
| `listBuiltinSymbols(controller)` | Built-in symbols only | **Permanently cached** |
| `listCustomSymbols(controller)` | Custom symbols only | No cache (always fresh) |
| `getSymbolBlobUrl(controller, url)` | Symbol image blob URL | Cached with `shareReplay(1)` |
| `getDimensions(controller, id)` | Symbol dimensions | Cached with `shareReplay(1)` |

**Benefits:**
- Built-in symbols load once per session
- Custom symbols always show latest data
- Blob URLs cached to avoid re-fetching images

### Upload Code

```typescript
// SVG (text)
if (extension === 'svg') {
  fileReader.readAsText(file);
  fileReader.onloadend = () => {
    const content = fileReader.result as string;
    this.symbolService.add(controller, filename, content);
  };
}
// PNG/JPG/GIF (binary)
else {
  const blob = new Blob([file], { type: file.type });
  this.symbolService.addFile(controller, filename, blob);
}
```

---

## Best Practices

### File Preparation

1. **Resize to 128×128** (or 256×256 max)
2. **Compress PNGs** with pngquant
3. **Use square aspect ratio** for best results
4. **Test GIF animations** before upload
5. **Keep file sizes small** (< 500 KB recommended)

### Performance

- Limit animated GIFs (they use CPU)
- Optimize images before upload
- Use SVG for icons (smaller, scalable)
- Use PNG/JPG for photos

---

## API Endpoints

| Operation | Endpoint | Type |
|-----------|----------|------|
| List symbols | `GET /v3/symbols` | JSON |
| Upload symbol | `POST /v3/symbols/{name}/raw` | Binary/Text |
| Get symbol | `GET /v3/symbols/{name}/raw` | Binary |
| Get dimensions | `GET /v3/symbols/{name}/dimensions` | JSON |
| Delete symbol | `DELETE /v3/symbols/{name}` | - |

---

## FAQ

**Q: Can I use animated GIFs?**
A: Yes! They animate automatically on canvas.

**Q: What's the max file size?**
A: No hard limit, but recommend < 500 KB for performance.

**Q: Why use binary instead of Base64?**
A: Binary is smaller (no 33% overhead) and correct format.

**Q: Do symbols scale?**
A: Yes, GNS3 auto-scales to max 80px.

**Q: Can I delete built-in symbols?**
A: No, only custom symbols can be deleted.

**Q: Where is the Symbols Manager?**
A: In the Symbols preferences page, click the "Symbols Manager" button to access upload and management functions.

**Q: What's the difference between "Delete symbols" and Symbols Manager?**
A: "Delete symbols" in the main view enters delete mode for batch deletion. Symbols Manager provides a dedicated "Manage Symbols" tab with a visual grid of custom symbols for easier selection and deletion.

---

**Last Updated:** 2026-03-28 (updated with caching docs)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
