<!--
SPDX-License-Identifier: CC-BY-SA-4.0
See LICENSE file for licensing information.
-->

  > AI-assisted documentation. [See disclaimer](../../README.md). 



# AI Profile Management - Complete Guide

**Version**: v1.4
**Last Updated**: 2026-04-18
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

> **Note**: Although `model_type` supports multiple values, the UI table currently hides the `model_type` column
> because only `text` type is actively supported in this phase.

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
│   ├── user-management/
│   │   ├── ai-profile-dialog/
│   │   │   └── ai-profile-dialog.component.*        # Wrapper dialog (embeds tab)
│   │   └── user-detail/ai-profile-tab/
│   │       ├── ai-profile-tab.component.*            # User config list
│   │       └── ai-profile-dialog/
│   │           ├── ai-profile-dialog.component.*     # Create/Edit form dialog
│   │           ├── confirm-dialog/                    # Delete confirmation dialog
│   │           │   └── confirm-dialog.component.*
│   │           └── model-type-help-dialog/            # Model type help dialog
│   │               └── model-type-help-dialog.component.*
│   ├── group-management/group-detail-dialog/
│   │   └── group-ai-profile-dialog/
│   │       └── group-ai-profile-dialog.component.*   # Wrapper dialog (embeds tab)
│   └── group-details/group-ai-profile-tab/
│       └── group-ai-profile-tab.component.*          # Group config list
├── services/
│   └── ai-profiles.service.ts                        # API service
├── models/
│   └── ai-profile.ts                                 # Data models
└── utils/
    └── ai-profile.util.ts                            # Display helpers
```

### Component Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| `AiProfileTabComponent` | User detail tab | Display/manage user's configs (own + inherited) |
| `GroupAiProfileTabComponent` | Group detail tab | Display/manage group's configs |
| `AiProfileDialogComponent` (form) | User detail sub-dialog | Create/Edit configuration form (shared by both tabs) |
| `AiProfileDialogComponent` (wrapper) | User management | MatDialog wrapper embedding `AiProfileTabComponent` |
| `GroupAiProfileDialogComponent` | Group detail dialog | MatDialog wrapper embedding `GroupAiProfileTabComponent` |
| `ConfirmDialogComponent` | User detail sub-dialog | Delete confirmation dialog (shared by both tabs) |
| `AiProfilesService` | Services | API communication layer |
| `ai-profile.util.ts` | Utils | `getModelDisplayName()`, `shortenModelName()` |

---

## 4. API Integration

> **Note**: All API paths below are relative. The `HttpController` service automatically prepends
> `/{current_version}` (configured as `v3` in `environment.ts`) to all requests.
> The paths shown here omit that prefix for clarity.

### User Endpoints

```
GET    /access/users/{user_id}/llm-model-configs        # Effective configs (own + inherited)
GET    /access/users/{user_id}/llm-model-configs/own     # Own configs only
GET    /access/users/{user_id}/llm-model-configs/default # Default config
POST   /access/users/{user_id}/llm-model-configs        # Create config
PUT    /access/users/{user_id}/llm-model-configs/{id}   # Update config
DELETE /access/users/{user_id}/llm-model-configs/{id}   # Delete config
PUT    /access/users/{user_id}/llm-model-configs/default/{id}  # Set default
PUT    /access/users/{user_id}/llm-model-configs/{id}   # Unset default (body: {is_default: false})
```

### Group Endpoints

```
GET    /access/groups/{group_id}/llm-model-configs        # Group configs
GET    /access/groups/{group_id}/llm-model-configs/default # Default config
POST   /access/groups/{group_id}/llm-model-configs        # Create config
PUT    /access/groups/{group_id}/llm-model-configs/{id}   # Update config
DELETE /access/groups/{group_id}/llm-model-configs/{id}   # Delete config
PUT    /access/groups/{group_id}/llm-model-configs/default/{id}  # Set default
PUT    /access/groups/{group_id}/llm-model-configs/{id}   # Unset default (body: {is_default: false})
```

### Response Format

#### LLMModelConfigResponse (single config)

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
├── created_at: string
└── updated_at: string
```

#### LLMModelConfigWithSource (inherited configs)

Extends `LLMModelConfigResponse` with inheritance metadata:

```
LLMModelConfigWithSource extends LLMModelConfigResponse
├── source: 'user' | 'group'   # Origin of the configuration
└── group_name: string | null  # Group name if source is "group"
```

#### API Response Wrappers

List endpoints return wrapper objects, not bare arrays:

```
# User effective configs (GET /access/users/{user_id}/llm-model-configs)
LLMModelConfigInheritedResponse
├── configs: LLMModelConfigWithSource[]  # Effective configurations (own + inherited)
├── default_config: LLMModelConfigWithSource | null
└── total: number

# Group configs (GET /access/groups/{group_id}/llm-model-configs)
# User own configs (GET /access/users/{user_id}/llm-model-configs/own)
LLMModelConfigListResponse
├── configs: LLMModelConfigResponse[]
├── default_config: LLMModelConfigResponse | null
└── total: number
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

| Preset | Provider | Base URL | Models (full ID) |
|--------|----------|----------|--------|
| OpenRouter | openai | `https://openrouter.ai/api/v1` | `deepseek/deepseek-v3.2`, `x-ai/grok-3`, `anthropic/claude-sonnet-4`, `z-ai/glm-4.7`, `openai/gpt-4o`, `google/gemini-2.5-flash` |
| DeepSeek | deepseek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Custom | openai (default) | User defined | User defined |

> **Note**: OpenRouter models use provider-prefixed IDs (e.g., `deepseek/deepseek-v3.2`). The `shortenModelName()` utility function strips the prefix for display (e.g., "Deepseek V3.2").

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

### Optimistic UI Updates (Default Toggle)

The default config toggle uses an optimistic update pattern to avoid UI lag:

1. UI updates immediately when user clicks the toggle
2. API request is sent in the background
3. On success: a silent background refresh ensures server state is in sync
4. On error: UI rolls back to the previous state, then shows the error message

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
| Default Config | Set/unset default (toggle) for quick access |
| Provider Presets | OpenRouter, DeepSeek with pre-configured models |
| Custom Mode | Manual provider configuration |
| Form Validation | Client-side validation with error messages |
| Name Uniqueness | Prevent duplicate names within scope |
| Optimistic Locking | Prevent concurrent edit conflicts via `version` field |
| Optimistic UI Updates | Default toggle updates UI immediately, rolls back on error |
| Custom Fields | Add provider-specific parameters |
| Context Strategy | Control context window usage |
| Copilot Mode | Teaching vs Lab Automation modes |
| Delete Confirmation | `ConfirmDialogComponent` for destructive actions |
| Provider Display | `getProviderDisplay()` extracts clean domain from `base_url` |

---

## 11. Changelog

### v1.4 (2026-04-18)

**Documentation Fixes (based on code review)**:
- Fixed file structure: added wrapper dialog components (`AiProfileDialogComponent`, `GroupAiProfileDialogComponent`)
- Fixed file structure: added `ConfirmDialogComponent` and `ModelTypeHelpDialogComponent`
- Fixed group dialog description: it embeds `GroupAiProfileTabComponent`, not the user dialog
- Fixed provider preset model IDs: added provider prefixes (e.g., `deepseek/deepseek-v3.2` instead of `deepseek-v3.2`)
- Added note about `/v3` prefix being auto-prepended by `HttpController`
- Added `unsetDefault` API endpoints documentation
- Added `LLMModelConfigInheritedResponse` and `LLMModelConfigListResponse` wrapper formats
- Added note about `model_type` column hidden in UI (only `text` supported)
- Added optimistic UI update pattern for default config toggle
- Added `getProviderDisplay()` and delete confirmation to feature summary

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
**Last Updated**: 2026-04-18 (v1.4)

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
