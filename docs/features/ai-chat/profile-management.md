# AI Profile Management - Complete Guide

**Version**: v1.3
**Last Updated**: 2026-03-30
**Status**: ✅ Implemented

---

## 1. Overview

The AI Profile Management feature allows users and groups to manage LLM (Large Language Model) configurations for GNS3's AI-powered features.

### Key Features

- User-level and group-level configuration management
- Configuration inheritance (users inherit from groups)
- Default configuration selection
- Provider presets (OpenRouter, DeepSeek, Custom)
- Custom model support with Basic/Custom mode
- API key encryption (keys never exposed after creation)
- Advanced custom parameters

---

## 2. Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Hierarchy                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   Group Configurations                                        │
│       │                                                      │
│       └── inherited ──► User Configurations                  │
│                                   │                           │
│                                   └── effective ──► Effective  │
│                                              Configurations   │
│                                                               │
│   Source: 'group' ──► Badge: "Group: {name}" (read-only)     │
│   Source: 'user'  ──► Editable                              │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Types

| Type | Owner | Editable | Description |
|------|-------|----------|-------------|
| User Config | User | Yes | User's own configurations |
| Group Config | Group | No (for members) | Group's configurations |
| Inherited Config | Group | No | Available to group members |

### Model Types

| Type | Label | Description |
|------|-------|-------------|
| `text` | Text | Text generation models |
| `vision` | Vision | Image understanding models |
| `stt` | STT | Speech-to-Text models |
| `tts` | TTS | Text-to-Speech models |
| `multimodal` | Multimodal | Multiple input types |
| `embedding` | Embedding | Text embedding models |
| `reranking` | Reranking | Reranking models |
| `other` | Other | Other model types |

---

## 3. Component Structure

### File Locations

```
src/app/
├── components/
│   ├── user-management/user-detail/ai-profile-tab/
│   │   ├── ai-profile-tab.component.*        # User config list
│   │   └── ai-profile-dialog/
│   │       └── ai-profile-dialog.component.* # Create/Edit dialog
│   ├── group-management/group-detail-dialog/
│   │   └── group-ai-profile-dialog/
│   │       └── (reuses user dialog)         # Shared dialog
│   └── group-details/group-ai-profile-tab/
│       └── group-ai-profile-tab.component.* # Group config list
├── services/
│   └── ai-profiles.service.ts              # API service
├── models/
│   └── ai-profile.ts                       # Data models
└── utils/
    └── ai-profile.util.ts                  # Display helpers
```

### Component Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| `AiProfileTabComponent` | User detail tab | Display/manage user's configs (own + inherited) |
| `GroupAiProfileTabComponent` | Group detail tab | Display/manage group's configs |
| `AiProfileDialogComponent` | Shared dialog | Create/Edit configuration form |
| `AiProfilesService` | Services | API communication layer |
| `ai-profile.util.ts` | Utils | `getModelDisplayName()`, `shortenModelName()` |

---

## 4. API Integration

### User Endpoints

```
GET    /access/users/{user_id}/llm-model-configs        # Effective configs (own + inherited)
GET    /access/users/{user_id}/llm-model-configs/own     # Own configs only
GET    /access/users/{user_id}/llm-model-configs/default # Default config
POST   /access/users/{user_id}/llm-model-configs        # Create config
PUT    /access/users/{user_id}/llm-model-configs/{id}   # Update config
DELETE /access/users/{user_id}/llm-model-configs/{id}   # Delete config
PUT    /access/users/{user_id}/llm-model-configs/default/{id}  # Set default
```

### Group Endpoints

```
GET    /access/groups/{group_id}/llm-model-configs        # Group configs
GET    /access/groups/{group_id}/llm-model-configs/default # Default config
POST   /access/groups/{group_id}/llm-model-configs        # Create config
PUT    /access/groups/{group_id}/llm-model-configs/{id}   # Update config
DELETE /access/groups/{group_id}/llm-model-configs/{id}   # Delete config
PUT    /access/groups/{group_id}/llm-model-configs/default/{id}  # Set default
```

### Response Format

```
LLMModelConfigResponse
├── config_id: string          # UUID
├── name: string               # Config name
├── model_type: ModelType      # text | vision | stt | tts | multimodal | embedding | reranking | other
├── config: {                  # Nested config object
│   ├── provider: string       # openai | anthropic | deepseek | etc.
│   ├── base_url: string      # API base URL
│   ├── model: string          # Model name
│   ├── temperature: number    # 0.0 - 2.0
│   ├── context_limit: number  # Context window in K tokens
│   ├── api_key?: string      # Hidden (null on response)
│   ├── max_tokens?: number    # Max tokens for generation
│   ├── context_strategy?:     # conservative | balanced | aggressive
│   └── copilot_mode?:         # teaching_assistant | lab_automation_assistant
│   }
├── user_id: string | null    # Owner user ID
├── group_id: string | null   # Owner group ID
├── is_default: boolean        # Default flag
├── version: number            # Optimistic locking
├── source: 'user' | 'group'   # Only in inherited responses
├── group_name: string | null # Only in inherited responses
├── created_at: string
└── updated_at: string
```

---

## 5. Dialog Modes

The configuration dialog supports two modes:

### Basic Mode (Recommended)

Select from preset providers with pre-configured models:

```
┌─────────────────────────────────────────────────────────────┐
│  Provider Presets                                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  OpenRouter  │  │   DeepSeek   │  ┌──────────────┐     │
│  │     ▼        │  │      ▼       │  │    Custom    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  Model: [deepseek/deepseek-v3.2    ▼]  (dropdown)           │
│  Temperature: 0.3   Context Limit: 128K                    │
└─────────────────────────────────────────────────────────────┘
```

### Custom Mode

Manually configure provider and model:

```
┌─────────────────────────────────────────────────────────────┐
│  Supported Providers                                         │
├─────────────────────────────────────────────────────────────┤
│  openai | anthropic | google | aws | ollama | deepseek | xai│
│                                                               │
│  Provider: [OpenAI        ▼]  Base URL: [https://api...   ]  │
│  Model:   [gpt-4o                                          ]  │
│  Temperature: 0.7   Context Limit: 128K                      │
└─────────────────────────────────────────────────────────────┘
```

### Provider Presets

| Preset | Provider | Base URL | Models |
|--------|----------|----------|--------|
| OpenRouter | openai | `https://openrouter.ai/api/v1` | deepseek-v3.2, grok-3, claude-sonnet-4, glm-4.7, gpt-4o, gemini-2.5-flash |
| DeepSeek | deepseek | `https://api.deepseek.com/v1` | deepseek-chat |
| Custom | - | User defined | User defined |

---

## 6. Form Validation

### Validation Rules

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1-100 chars, alphanumeric with underscores/hyphens |
| `model_type` | Yes | Must be a valid ModelType |
| `provider` | Yes | Must be from supported list |
| `model` | Yes | Non-empty string |
| `api_key` | Create: Yes / Edit: No | Min 10 chars if provided |
| `base_url` | No | Valid URL format |
| `temperature` | Yes | 0.0 - 2.0 |
| `context_limit` | Yes | 1 - 10000 (K tokens) |

### Conditional Validation

```
Create Mode:
  └── api_key: Required, min 10 characters

Edit Mode:
  └── api_key: Optional (empty = keep existing, new value = update)
```

### Name Uniqueness

Configuration names must be unique within the same scope (user or group). The dialog validates this during creation and editing.

---

## 7. Advanced Settings

### Context Strategy

Controls how the AI manages context window usage when approaching token limits.

| Strategy | Context Usage | Description |
|----------|---------------|-------------|
| `conservative` | 60% | Truncates earlier, safer for long conversations |
| `balanced` | 75% | Default balance between context and safety |
| `aggressive` | 85% | Maximizes context at risk of hitting limits |

### Copilot Mode

Configures the AI assistant's operational mode in GNS3 AI Chat.

| Mode | Description |
|------|-------------|
| `teaching_assistant` | Diagnostics only - Provides guidance without making changes |
| `lab_automation_assistant` | Full access - Can analyze and modify GNS3 configurations |

### Custom Fields

Users can add unlimited key-value pairs for provider-specific parameters. The following are intentionally hidden from custom fields:

- `max_tokens` - Standard optional parameter

---

## 8. Conflict Resolution

### Optimistic Locking

The `version` field in responses is used for optimistic locking to prevent concurrent modification conflicts.

```
┌─────────────────────────────────────────────────────────────┐
│                    Update Flow with Versioning                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Fetch config (version: 5)                                │
│         │                                                    │
│         ▼                                                    │
│  2. User A edits ──► PUT /configs/123 {version: 5}         │
│         │                                                    │
│         ▼                                                    │
│  3. User B edits ──► PUT /configs/123 {version: 5}         │
│                        │                                     │
│                        └── 409 Conflict!                     │
│                                                               │
│  4. Auto-refresh data, notify User B                       │
└─────────────────────────────────────────────────────────────┘
```

### HTTP 409 Conflict Handling

When a version mismatch occurs:
1. Server returns `409 Conflict`
2. Client automatically reloads configuration list
3. User sees: "Data has been modified by another user, auto-refreshed"

---

## 9. Security

### API Key Handling

```
┌─────────────────────────────────────────────────────────────┐
│                     API Key Security                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Server:                                                      │
│    ├── Keys encrypted on server                              │
│    └── Responses return api_key: null                        │
│                                                               │
│  Client:                                                      │
│    ├── Create: API key required                              │
│    └── Edit: API key optional (empty = keep existing)        │
│                                                               │
│  ⚠️ Existing keys are NEVER exposed to the client           │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Inheritance

- Users can view and use inherited group configurations
- Users cannot edit or delete inherited group configurations
- Inherited configs are visually marked with a group badge

---

## 10. Feature Summary

| Feature | Description |
|---------|-------------|
| User Config Management | Create, edit, delete own configurations |
| Group Config Management | Create, edit, delete group configurations |
| Configuration Inheritance | Users see group configs with source badge |
| Default Config | Set/unset default for quick access |
| Provider Presets | OpenRouter, DeepSeek with pre-configured models |
| Custom Mode | Manual provider configuration |
| Form Validation | Client-side validation with error messages |
| Name Uniqueness | Prevent duplicate names within scope |
| Optimistic Locking | Prevent concurrent edit conflicts |
| Custom Fields | Add provider-specific parameters |
| Context Strategy | Control context window usage |
| Copilot Mode | Teaching vs Lab Automation modes |

---

## 11. Changelog

### v1.3 (2026-03-30)

**Documentation Updates**:
- Removed code blocks, used text diagrams instead
- Fixed API paths (removed `/v3` prefix)
- Fixed DeepSeek models list
- Added Custom Mode provider list
- Added utility functions documentation
- Simplified overall structure

### v1.2 (2026-03-18)

- Removed legacy `/profiles` API endpoints
- Removed legacy type definitions
- Code cleanup completed

### v1.1 (2026-03-18)

- Added Advanced Implementation Details section
- Documented optimistic locking with `expected_version`
- Documented HTTP 409 conflict resolution

### v1.0 (2026-03-14)

- Initial release with user/group configuration management
- Provider presets, custom model support
- Conditional API key validation
- Default configuration management

---

**Maintained By**: Development Team
**Last Updated**: 2026-03-30 (v1.3)
