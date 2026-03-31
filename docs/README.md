# GNS3 Web UI - Documentation Index

> Complete documentation index for GNS3 Web UI project

**Last Updated**: 2026-03-31

---

## Documentation Structure

```
docs/
├── features/                    # Feature implementation documentation
│   ├── ai-chat/                # AI Chat feature
│   │   ├── ai-chat-guide.md    # ⭐ Complete AI Chat guide
│   │   └── profile-management.md
│   ├── console/                # Console-related docs
│   │   ├── devices-panel-implementation.md
│   │   └── vnc-console-implementation.md
│   ├── context-menu.md          # Context menu documentation
│   ├── custom-adapters/         # Custom adapters feature
│   └── symbols/                # Symbols documentation
│       └── symbols-guide.md
├── framework/                   # Framework migration & architecture
│   └── angular-21/             # Angular 21 Zoneless migration
│       ├── zoneless-guide.md
│       ├── dialog-migration-record.md
│       └── migration-progress.md
├── guides/                      # Development standards & best practices
│   ├── css/
│   │   ├── 02-material3-variables.md
│   │   ├── hardcoded-colors-inventory.md
│   │   ├── hardcoded-color-protection.md
│   │   └── map-backgrounds.md
│   ├── dialog-style-isolation.md
│   └── window-boundary-service.md
├── todo/                        # Optimization tasks
│   └── optimization-todos.md
└── archive/                     # Historical & deprecated docs
    ├── bugs/                   # Fixed bug reports
    └── deprecated/             # Outdated documentation
```

---

## Documentation Index

### Features Documentation

| Document | Description |
|----------|-------------|
| [AI Chat Guide](./features/ai-chat/ai-chat-guide.md) | ⭐ Complete AI Chat implementation guide |
| [AI Profile Management](./features/ai-chat/profile-management.md) | AI Profile / LLM Model Configuration |
| [Context Menu](./features/context-menu.md) | Context menu implementation (38 actions) |
| [Console Devices Panel](./features/console/devices-panel-implementation.md) | Console devices panel (v2.0.0) |
| [VNC Console](./features/console/vnc-console-implementation.md) | VNC console implementation |
| [Custom Adapters](./features/custom-adapters/custom-adapters-implementation.md) | Custom adapters implementation |
| [Symbols Guide](./features/symbols/symbols-guide.md) | Node symbols support (SVG/PNG/JPG/GIF) |

---

### Framework Documentation

#### Angular 21 Migration

| Document | Description |
|----------|-------------|
| [Zoneless Guide](./framework/angular-21/zoneless-guide.md) | ⭐ Angular Zoneless best practices |
| [Migration Progress](./framework/angular-21/migration-progress.md) | Migration status tracking |
| [Dialog Migration Record](./framework/angular-21/dialog-migration-record.md) | Dialog style migration (42 dialogs) |

---

### Development Guides

| Document | Description |
|----------|-------------|
| [Dialog Style Isolation](./guides/dialog-style-isolation.md) | ⭐ Dialog styling with panelClass |
| [Material 3 Variables](./guides/css/02-material3-variables.md) | Material Design 3 CSS variables |
| [Hardcoded Color Inventory](./guides/css/hardcoded-colors-inventory.md) | All hardcoded color violations in codebase |
| [Hardcoded Color Protection](./guides/css/hardcoded-color-protection.md) | ⭐ Multi-layer protection mechanism for code quality |
| [Map Backgrounds](./guides/css/map-backgrounds.md) | Project map background & screenshot export |
| [Window Boundary Service](./guides/window-boundary-service.md) | Window boundary management |

---

### Archive

#### Bug Fixes

| Document | Description |
|----------|-------------|
| [Console Position Fix](./archive/bugs/console-window-position-after-resize.md) | Console window position after resize |
| [Web Console Resize Fix](./archive/bugs/web-console-resize-fix.md) | Web console resize issue |
| [Dialog Max Width Issue](./archive/bugs/dialog-max-width-issue.md) | Dialog max-width CSS variable fix |

#### Deprecated

| Document | Description |
|----------|-------------|
| [Topology Highlight](./archive/deprecated/topology-highlight.md) | Feature never implemented (deprecated) |

---

## Quick Links

### Featured Documentation

- **AI Chat**: [features/ai-chat/ai-chat-guide.md](./features/ai-chat/ai-chat-guide.md)
- **Angular Zoneless**: [framework/angular-21/zoneless-guide.md](./framework/angular-21/zoneless-guide.md)
- **Dialog Styling**: [guides/dialog-style-isolation.md](./guides/dialog-style-isolation.md)
- **CSS Variables**: [guides/css/02-material3-variables.md](./guides/css/02-material3-variables.md)
- **Color Protection**: [guides/css/hardcoded-color-protection.md](./guides/css/hardcoded-color-protection.md) ⭐
- **Map Backgrounds**: [guides/css/map-backgrounds.md](./guides/css/map-backgrounds.md)

### Getting Started

1. **New to the project?** Start with [CLAUDE.md](../CLAUDE.md) for development standards
2. **AI Chat Feature?** See [features/ai-chat/ai-chat-guide.md](./features/ai-chat/ai-chat-guide.md)
3. **Angular Zoneless?** See [framework/angular-21/zoneless-guide.md](./framework/angular-21/zoneless-guide.md)
4. **Dialog Styling?** See [guides/dialog-style-isolation.md](./guides/dialog-style-isolation.md)
5. **Code Quality?** See [guides/css/hardcoded-color-protection.md](./guides/css/hardcoded-color-protection.md)

---

## Recent Changes

### 2026-03-31

- ✅ **Hardcoded Color Protection**: Added comprehensive protection mechanism
  - Multi-layer security: SHA256 self-check, pre-commit warning, CI label check
  - Configuration separated to JSON file for maintainability
  - Prevents AI and developers from bypassing code quality standards
  - Documentation: [guides/css/hardcoded-color-protection.md](./guides/css/hardcoded-color-protection.md)

- ✅ **AI Chat CSS Standards**: Complete refactoring of AI Chat components
  - Fixed 27 hardcoded color violations across 6 components
  - Applied BEM naming convention with `gns3-` prefix
  - Extracted inline templates and styles to separate files
  - All components now use Material Design 3 CSS variables

### 2026-03-30

- ✅ **Map Backgrounds Guide**: Added comprehensive documentation
  - CSS variable architecture and data flow diagrams
  - Reactive pattern with computed signals
  - Screenshot export implementation (background capture + embedded images)
  - Common pitfalls and best practices

- ✅ **Documentation Cleanup**: Consolidated guides directory
  - Archived duplicate docs (css-coding-standards, angular-material-usage, etc.)
  - Reduced code blocks, added diagrams
  - 3 core guides retained with improved formatting

- ✅ **Documentation Translation**: dialog-migration-record.md translated to English

- ✅ **Documentation Renaming**: complete-guide.md files renamed
  - `ai-chat/complete-guide.md` → `ai-chat/ai-chat-guide.md`
  - `symbols/complete-guide.md` → `symbols/symbols-guide.md`

### 2026-03-29

- ✅ **Dialog Migration**: 42 dialogs migrated to centralized styles
  - All dialog sizes now in `src/styles/_dialogs.scss`
  - ~360 lines SCSS added, ~70 lines TS removed

---

*Last Updated: 2026-03-31*
