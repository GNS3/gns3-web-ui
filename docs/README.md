# GNS3 Web UI - Documentation Index

> Complete documentation index for GNS3 Web UI project

**Last Updated**: 2026-03-27

---

## 📁 Documentation Structure

```
docs/
├── features/              # Feature implementation documentation
│   ├── ai-chat/          # AI Chat feature docs
│   ├── console/          # Console-related docs
│   └── template-settings/
├── framework/            # Framework migration & architecture
│   └── angular-21/       # Angular 21 Zoneless migration
├── guides/               # Development standards & best practices
│   ├── css/              # CSS coding standards
│   └── dialog-style-isolation.md
└── archive/              # Historical & deprecated docs
    ├── bugs/             # Fixed bug reports
    └── deprecated/       # Outdated documentation
```

---

## 📚 Documentation Index

### 🎯 Features Documentation

| Document | Description |
|----------|-------------|
| [AI Chat Complete Guide](./features/ai-chat/complete-guide.md) | ⭐ Complete AI Chat implementation guide |
| [AI Chat Optimization Todos](./features/ai-chat/optimization-todos.md) | AI Chat optimization tasks |
| [AI Profile Management](./features/ai-chat/profile-management.md) | AI Profile / LLM Model Configuration management |
| [Console Devices Panel](./features/console/devices-panel-implementation.md) | Console devices panel (v1.9.0) |
| [Console Topology Highlight](./features/console/topology-highlight.md) | Console topology highlighting |
| [VNC Console Implementation](./features/console/vnc-console-implementation.md) | VNC console implementation docs |

---

### 🏗️ Framework Documentation

#### Angular 21 Migration

| Document | Description |
|----------|-------------|
| [Migration Plan](./framework/angular-21/migration-plan.md) | ⭐ Angular 21 Zoneless phased migration plan |
| [Component Tracker](./framework/angular-21/component-tracker.md) | Component migration progress tracking |
| [Model Input Signals](./framework/angular-21/model-input-signals.md) | Signal input patterns guide |
| [ngModel Migration Tracker](./framework/angular-21/ngmodel-migration-tracker.md) | 🆙 ngModel to signals migration progress (40 files) |

#### Zoneless Issues

| Document | Description |
|----------|-------------|
| [Dynamic Component Loading](./framework/angular-21/zoneless-issues/dynamic-component-loading.md) | Zoneless dynamic component issues |
| [Routing Issues](./framework/angular-21/zoneless-issues/routing-issues.md) | Zoneless routing issues |

#### Known Issues

| Document | Description |
|----------|-------------|
| [MatCheckbox FormsModule](./framework/angular-21/known-issues/mat-checkbox-forms-module.md) | Checkbox ngModel requirements |
| [MatMenu Module](./framework/angular-21/known-issues/mat-menu-module.md) | Menu module requirements |

#### Other Framework Docs

| Document | Description |
|----------|-------------|
| [Web Console Resize Fix](./framework/web-console-resize-fix.md) | Web console resize issue fix |
| [Project Map Context Menu](./framework/project-map-context-menu.md) | Context menu implementation |
| [Custom Adapters](./framework/custom-adapters-implementation.md) | Custom adapters implementation |

---

### 📖 Development Guides

#### CSS Standards

| Document | Description |
|----------|-------------|
| [CSS Coding Standards](./guides/css/01-coding-standards.md) | ⭐ CSS coding standards (no !important, no ::ng-deep) |
| [Material 3 Variables](./guides/css/02-material3-variables.md) | Material Design 3 CSS variables reference |
| [Dialog Styles Guide](./guides/css/03-dialog-styles.md) | Dialog styling patterns |
| [Icon Buttons Guide](./guides/css/icon-buttons-guide.md) | Material Design 3 icon buttons |

#### General Guides

| Document | Description |
|----------|-------------|
| [Dialog Style Isolation](./guides/dialog-style-isolation.md) | ⭐ Dialog style isolation using panelClass |
| [Angular Material Usage](./guides/angular-material-usage.md) | Angular Material usage guidelines |
| [Window Boundary Service](./guides/window-boundary-service.md) | Window boundary management |

---

### 🗄️ Archive

#### Bug Fixes

| Document | Description |
|----------|-------------|
| [AI Chat Theme Fix](./archive/bugs/2026-03-19-ai-chat-theme-fix.md) | Fixed menu theme switching issue |
| [Console Position Fix](./archive/bugs/console-window-position-after-resize.md) | Console window position after resize |

#### Deprecated

| Document | Description |
|----------|-------------|
| [Dialog Max Width Issue](./archive/deprecated/dialog-max-width-issue.md) | Dialog max-width issue (resolved) |
| [xterm CSS](./archive/deprecated/xterm-css-and-view-encapsulation.md) | xterm.js CSS (deprecated) |
| [Configurator Migration](./archive/deprecated/configurator-migration-status.md) | Old configurator migration status |

---

## 🔑 Quick Links

### Featured Documentation

- **AI Chat Feature**: [features/ai-chat/complete-guide.md](./features/ai-chat/complete-guide.md)
- **Angular 21 Migration**: [framework/angular-21/migration-plan.md](./framework/angular-21/migration-plan.md)
- **CSS Standards**: [guides/css/01-coding-standards.md](./guides/css/01-coding-standards.md)
- **Dialog Style Isolation**: [guides/dialog-style-isolation.md](./guides/dialog-style-isolation.md)

### Getting Started

1. **New to AI Chat?** Start with [features/ai-chat/complete-guide.md](./features/ai-chat/complete-guide.md)
2. **Angular 21 Migration?** See [framework/angular-21/migration-plan.md](./framework/angular-21/migration-plan.md)
3. **CSS Styling?** Check [guides/css/01-coding-standards.md](./guides/css/01-coding-standards.md)
4. **Dialog Styling?** See [guides/dialog-style-isolation.md](./guides/dialog-style-isolation.md)

---

## 📝 Recent Changes

### 2026-03-27

- ✅ **Documentation**: Angular 21 Zoneless migration Phase 1 complete
  - Updated migration plan status to reflect 100% component compatibility
  - All 253 components verified Zoneless compatible
  - Phase 2 (Syntax Optimization) in progress (~42% complete)

- ✅ **Documentation**: ngModel migration tracker created
  - Comprehensive inventory of 40 files using ngModel
  - Migration patterns and progress tracking
  - First migration completed: project-map.component.html (8 checkboxes)

- ✅ **Documentation**: Updated mat-checkbox best practices
  - Revised to recommend `[checked]` pattern for Zoneless
  - Deprecated `[ngModel]` with FormsModule for display-only checkboxes
  - Real-world example from GNS3 Web UI migration

- ✅ **Documentation**: Version number corrections
  - Updated AI Chat guide: Angular 14.3.0 → 21.0.0
  - Updated Material Design version references to 21.0.0

### 2026-03-26
- ✅ **Documentation Restructuring**: Complete docs reorganization
  - Created new directory structure (features/, framework/, guides/, archive/)
  - Moved all feature docs to `features/` (ai-chat/, console/)
  - Moved all Angular 21 docs to `framework/angular-21/`
  - Moved CSS standards to `guides/css/`
  - Moved fixed bugs to `archive/bugs/`
  - Updated README with correct file paths

---

*Last Updated: 2026-03-27*
