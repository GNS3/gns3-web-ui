# GNS3 Web UI - Documentation Index

> Complete documentation index for GNS3 Web UI project

**Last Updated**: 2026-03-13

---

## 📁 Documentation Structure

```
docs/
├── ai-chat-complete-guide.md             # ⭐ Complete AI Chat implementation guide
├── ai-profile-management.md              # AI Profile / LLM Model Configuration management
├── console-devices-panel-implementation.md # Console devices panel docs (v1.7.0)
├── dialog-style-isolation-guide.md       # Dialog style isolation using panelClass
├── window-boundary-service.md            # Window boundary service documentation
└── README.md                             # This file
```

---

## 📚 Documentation Index

### Core Feature Documentation

| Document | Description |
|----------|-------------|
| [ai-chat-complete-guide.md](./ai-chat-complete-guide.md) | ⭐ Complete AI Chat implementation guide |
| [ai-profile-management.md](./ai-profile-management.md) | AI Profile / LLM Model Configuration management |
| [console-devices-panel-implementation.md](./console-devices-panel-implementation.md) | Console devices panel (v1.7.0) |
| [dialog-style-isolation-guide.md](./dialog-style-isolation-guide.md) | Dialog style isolation using panelClass |
| [window-boundary-service.md](./window-boundary-service.md) | Window boundary service |

---

## 🔑 Quick Links

### Featured Documentation

- **AI Chat Feature**: [ai-chat-complete-guide.md](./ai-chat-complete-guide.md) - Complete AI Chat implementation guide
- **AI Profile Management**: [ai-profile-management.md](./ai-profile-management.md) - LLM Model Configuration management
- **Console Devices Panel**: [console-devices-panel-implementation.md](./console-devices-panel-implementation.md) - Multi-device console management
- **Dialog Style Isolation**: [dialog-style-isolation-guide.md](./dialog-style-isolation-guide.md) - Using panelClass to prevent style pollution
- **Window Boundary Service**: [window-boundary-service.md](./window-boundary-service.md) - Window boundary management

### Getting Started

1. **New to AI Chat?** Start with [ai-chat-complete-guide.md](./ai-chat-complete-guide.md)
2. **AI Profile Management?** See [ai-profile-management.md](./ai-profile-management.md)
3. **Console Management?** See [console-devices-panel-implementation.md](./console-devices-panel-implementation.md)
4. **Dialog Styling?** Check [dialog-style-isolation-guide.md](./dialog-style-isolation-guide.md)
5. **Service Integration?** Check [window-boundary-service.md](./window-boundary-service.md)

---

## 📝 Recent Updates

### 2026-03-14
- ✅ **AI Profile Management**: New documentation for LLM Model Configuration management
  - Complete feature overview and component structure
  - API integration documentation for user and group endpoints
  - Form validation rules (conditional API key validation)
  - Provider presets (OpenRouter, DeepSeek, Custom)
  - Custom field support
  - Security considerations (API key encryption)
  - Configuration inheritance model

### 2026-03-13
- ✅ **Dialog Style Isolation Guide**: New documentation for using panelClass to scope dialog styles
  - Explains how to prevent `.mat-dialog-container` style pollution
  - Provides complete example with `tool-details-dialog` component
  - Includes theme-specific styling patterns

### 2026-03-10
- ✅ **Documentation Restructuring**: Flattened documentation structure
  - Moved `ai-chat-complete-guide.md` to root docs directory
  - Moved `window-boundary-service.md` to root docs directory
  - Removed nested `ai-chat/` and `services/` subdirectories
  - Simplified navigation and file organization
- ✅ **AI Chat v1.0**: Complete AI Chat functionality with multi-session management
- ✅ **Console Panel v1.7.0**: Enhanced device console management with window persistence

---

*Last Updated: 2026-03-14*
