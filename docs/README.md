# GNS3 Web UI - Documentation Index

> This documentation is organized by AI with reference to actual code. AI can make mistakes — please verify against the source code when in doubt.

> Complete documentation index for GNS3 Web UI project

**Last Updated**: 2026-04-22

---

## License

This documentation is licensed under the **Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)**.

⚠️ **Important - ShareAlike Requirement**: If you create derivative works based on this documentation (including software that incorporates substantial portions of the documentation), your work must also be licensed under **CC BY-SA 4.0 or a compatible license** (such as GPLv3).

- 📄 **Full License Text**: See [docs/LICENSE](./LICENSE)
- 🔗 **License URL**: https://creativecommons.org/licenses/by-sa/4.0/
- 📖 **Compatibility**: https://creativecommons.org/compatiblelicenses

**Dual License Structure**:
- 📚 **Documentation**: CC BY-SA 4.0 (this directory)
- 💻 **Software Code**: GPLv3 (see root [LICENSE](../LICENSE))

---

## Documentation Structure

```
docs/
├── features/                    # Feature implementation documentation
│   ├── ai-chat/                # AI Chat feature
│   │   ├── ai-chat-guide.md    # ⭐ Complete AI Chat guide
│   │   └── profile-management.md
│   ├── compute-selector/       # Compute node selector feature
│   │   └── implementation.md    # ⭐ Technical implementation and architecture
│   ├── console/                # Console-related docs
│   │   ├── devices-panel-implementation.md
│   │   └── vnc-console-implementation.md
│   ├── context-menu.md          # Context menu documentation
│   ├── custom-adapters/         # Custom adapters feature
│   ├── symbols/                # Symbols documentation
│   │   └── symbols-guide.md
│   ├── websocket/              # WebSocket connection management
│   │   └── connection-management.md  # Simple controller connection service
│   └── web-wireshark/          # Web Wireshark feature
│       ├── overview.md         # ⭐ Complete Web Wireshark guide
│       ├── business-flow.md    # Business flow & architecture
│       └── diagrams/           # Architecture diagrams
│           └── architecture-overview.md
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
├── inventory/                   # ⭐ Codebase inventory
│   ├── services-by-domain.md   # Service catalog by functional domain (73 services)
│   └── components-by-feature.md # Component catalog by feature area (249 components)
├── known-issues/               # Known issues (won't fix)
│   └── route-transition-white-flash.md
├── testing/                     # Testing documentation
│   ├── e2e-testing-decision.md
│   └── unit-testing-best-practices.md
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
| [Compute Selector Implementation](./features/compute-selector/implementation.md) | ⭐ Compute node selector: technical implementation and architecture |
| [Context Menu](./features/context-menu.md) | Context menu implementation (38 actions) |
| [Console Devices Panel](./features/console/devices-panel-implementation.md) | Console devices panel (v2.0.0) |
| [VNC Console](./features/console/vnc-console-implementation.md) | VNC console implementation |
| [Custom Adapters](./features/custom-adapters/custom-adapters-implementation.md) | Custom adapters implementation |
| [Symbols Guide](./features/symbols/symbols-guide.md) | Node symbols support (SVG/PNG/JPG/GIF) |
| [WebSocket Connection Management](./features/websocket/connection-management.md) | Simple controller connection management service |
| [Web Wireshark Overview](./features/web-wireshark/overview.md) | ⭐ Browser-based packet capture and analysis |
| [Web Wireshark Business Flow](./features/web-wireshark/business-flow.md) | Detailed business flows and architecture |
| [Web Wireshark Architecture](./features/web-wireshark/diagrams/architecture-overview.md) | System architecture diagrams |

---

### Framework Documentation

#### Angular 21 Migration

| Document | Description |
|----------|-------------|
| [Zoneless Guide](./framework/angular-21/zoneless-guide.md) | ⭐ Angular Zoneless best practices |
| [Vitest Testing Setup](./framework/angular-21/vitest-testing-setup.md) | Vitest configuration for Angular 21 Zoneless |
| [Vitest Test Isolation Guide](./framework/angular-21/vitest-test-isolation-guide.md) | ⭐ Solving test environment pollution (Flaky Tests) |
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

### Codebase Inventory

| Document | Description |
|----------|-------------|
| [Services by Domain](./inventory/services-by-domain.md) | ⭐ Complete service catalog (73 services) by functional domain |
| [Components by Feature](./inventory/components-by-feature.md) | ⭐ Complete component catalog (249 components) by feature area |

---

### Known Issues

| Document | Description |
|----------|-------------|
| [Route Transition White Flash](./known-issues/route-transition-white-flash.md) | White flash during Projects → ProjectMap navigation |

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
- **Web Wireshark**: [features/web-wireshark/overview.md](./features/web-wireshark/overview.md) ⭐ NEW
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

### 2026-04-18

- ✅ **Compute Selector Feature**: Complete drag-and-drop node creation feature
  - Smart positioning with collision detection and ResizeObserver
  - Resource usage display with color coding (CPU/Memory/Disk)
  - Ghost icon for visual feedback during drag operations
  - Responsive design with Material Design 3 variables
  - 13 commits iterating from initial implementation to polished UX
  - Documentation: [features/compute-selector/implementation.md](./features/compute-selector/implementation.md) ⭐ NEW

- ✅ **WebSocket Connection Management**: Simple controller connection service
  - ConnectionManagerService for controller lifecycle
  - Prevents duplicate connections
  - Handles controller switching
  - Delegates to NotificationService for WebSocket
  - Documentation: [features/websocket/connection-management.md](./features/websocket/connection-management.md) ⭐ NEW

### 2026-04-06

- 📝 **Known Issues Documentation**: Added route transition white flash issue
  - Documented white flash during Projects → ProjectMap navigation
  - Root cause analysis: Layout discontinuity between DefaultLayout and ProjectMap
  - Assessment: Known issue, won't fix due to high cost/low benefit
  - Documentation: [known-issues/route-transition-white-flash.md](./known-issues/route-transition-white-flash.md)

### 2026-04-03

- ✅ **Test Environment Pollution Fix**: Resolved Flaky Tests issue
  - Implemented `forks` pool for process-level test isolation
  - Added global `TestBed.resetTestingModule()` cleanup in `afterEach`
  - Split CI/CD tests by category (services vs components)
  - Achieved 98.7% stable pass rate (from random failures)
  - Documentation: [framework/angular-21/vitest-test-isolation-guide.md](./framework/angular-21/vitest-test-isolation-guide.md) ⭐

- ✅ **Component Test Fixes**: Resolved 2 failing component tests
  - Fixed `computes.component.spec.ts` timeout with fake timers
  - Fixed `help.component.spec.ts` mock subscription issues
  - Implemented proper component lifecycle in tests

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

### 2026-04-11

- 📝 **Web Wireshark Documentation**: Complete feature documentation added
  - Comprehensive overview of browser-based packet capture and analysis
  - Detailed business flows with sequence diagrams
  - Architecture diagrams and component interactions
  - User guide and troubleshooting
  - Documentation: [features/web-wireshark/](./features/web-wireshark/) ⭐ NEW
    - [overview.md](./features/web-wireshark/overview.md) - Feature overview and guide
    - [business-flow.md](./features/web-wireshark/business-flow.md) - Business flows and architecture
    - [diagrams/architecture-overview.md](./features/web-wireshark/diagrams/architecture-overview.md) - Architecture diagrams
    - [inline-display-implementation.md](./features/web-wireshark/inline-display-implementation.md) - Implementation progress

---

*Last Updated: 2026-04-18*

---

## License

<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->
