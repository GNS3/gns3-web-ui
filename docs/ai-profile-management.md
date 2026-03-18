# AI Profile Management - Complete Guide

> Complete documentation for LLM Model Configuration management in GNS3 Web UI

**Version**: v1.2
**Last Updated**: 2026-03-18
**Status**: ✅ Implemented

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature Description](#2-feature-description)
3. [Component Structure](#3-component-structure)
4. [API Integration](#4-api-integration)
5. [Form Validation](#5-form-validation)
6. [Provider Presets](#6-provider-presets)
7. [Custom Fields](#7-custom-fields)
8. [Advanced Implementation Details](#8-advanced-implementation-details)
9. [Security Considerations](#9-security-considerations)
10. [Changelog](#10-changelog)
11. [Future Enhancements](#11-future-enhancements)

---

## 1. Overview

### 1.1 Purpose

The AI Profile Management feature allows users and groups to manage LLM (Large Language Model) configurations for use with GNS3's AI-powered features.

### 1.2 Key Features

- ✅ User-level configuration management
- ✅ Group-level configuration management
- ✅ Configuration inheritance (users inherit from groups)
- ✅ Default configuration selection
- ✅ Provider presets (OpenRouter, DeepSeek, etc.)
- ✅ Custom model support
- ✅ API key encryption
- ✅ Advanced custom parameters

---

## 2. Feature Description

### 2.1 Configuration Hierarchy

```
Group Configurations
    ↓ (inherited)
User Configurations
    ↓ (effective)
Effective Configurations (user's own + inherited)
```

### 2.2 Configuration Types

| Type | Description | Owner |
|------|-------------|-------|
| **User Config** | Created and owned by a specific user | User |
| **Group Config** | Created and owned by a group | Group |
| **Inherited Config** | Group config available to group members | Group |

### 2.3 Model Types

- `text` - Text generation models
- `vision` - Image understanding models
- `stt` - Speech-to-Text models
- `tts` - Text-to-Speech models
- `multimodal` - Multiple input types
- `embedding` - Text embedding models
- `reranking` - Reranking models
- `other` - Other model types

---

## 3. Component Structure

### 3.1 File Locations

```
src/app/
├── components/
│   ├── user-management/user-detail/
│   │   └── ai-profile-tab/
│   │       ├── ai-profile-tab.component.*         # User config list
│   │       └── ai-profile-dialog/
│   │           └── ai-profile-dialog.component.*   # Create/Edit dialog
│   └── group-details/
│       └── group-ai-profile-tab/
│           ├── group-ai-profile-tab.component.*   # Group config list
│           └── ai-profile-dialog/
│               └── (shared with user)
├── services/
│   └── ai-profiles.service.ts                     # API service
└── models/
    └── ai-profile.ts                              # Data models
```

### 3.2 Components

#### AiProfileTabComponent
- **Location**: `src/app/components/user-management/user-detail/ai-profile-tab/`
- **Purpose**: Display and manage user's LLM model configurations
- **Features**:
  - List all configurations (own + inherited from groups)
  - Create new configuration
  - Edit existing configuration
  - Delete configuration
  - Set/unset default configuration
  - Visual indicators for inherited configs

#### GroupAiProfileTabComponent
- **Location**: `src/app/components/group-details/group-ai-profile-tab/`
- **Purpose**: Display and manage group's LLM model configurations
- **Features**: Same as user tab, but without inheritance

#### AiProfileDialogComponent
- **Location**: `src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-dialog/`
- **Purpose**: Create or edit LLM model configuration
- **Features**:
  - Provider presets with auto-configuration
  - Custom model support
  - Conditional validation (API key required for create, optional for edit)
  - Advanced custom parameters
  - Default configuration toggle

---

## 4. API Integration

### 4.1 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/access/users/{user_id}/llm-model-configs` | Get effective configs (own + inherited) |
| GET | `/v3/access/users/{user_id}/llm-model-configs/own` | Get own configs only |
| GET | `/v3/access/users/{user_id}/llm-model-configs/default` | Get default config |
| POST | `/v3/access/users/{user_id}/llm-model-configs` | Create new config |
| PUT | `/v3/access/users/{user_id}/llm-model-configs/{config_id}` | Update config |
| DELETE | `/v3/access/users/{user_id}/llm-model-configs/{config_id}` | Delete config |
| PUT | `/v3/access/users/{user_id}/llm-model-configs/default/{config_id}` | Set as default |
| PUT | `/v3/access/users/{user_id}/llm-model-configs/{config_id}` with `is_default: false` | Unset default |

### 4.2 Group Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/access/groups/{group_id}/llm-model-configs` | Get group configs |
| GET | `/v3/access/groups/{group_id}/llm-model-configs/default` | Get default config |
| POST | `/v3/access/groups/{group_id}/llm-model-configs` | Create new config |
| PUT | `/v3/access/groups/{group_id}/llm-model-configs/{config_id}` | Update config |
| DELETE | `/v3/access/groups/{group_id}/llm-model-configs/{config_id}` | Delete config |
| PUT | `/v3/access/groups/{group_id}/llm-model-configs/default/{config_id}` | Set as default |

### 4.3 API Response Format

```typescript
interface LLMModelConfigResponse {
  config_id: string;           // Configuration ID (UUID)
  name: string;                // Configuration name
  model_type: ModelType;       // Model type
  config: {
    provider: string;          // LLM provider
    base_url: string;          // API base URL
    model: string;             // Model name
    temperature: number;       // Temperature (0.0-2.0)
    context_limit: number;     // Context window limit in K tokens
    api_key?: string;          // API key (null for security)
    max_tokens?: number;       // Max tokens for generation
    context_strategy?: ContextStrategy;
    copilot_mode?: CopilotMode;
    [key: string]: any;        // Custom fields
  };
  user_id: string | null;      // Owner user ID
  group_id: string | null;     // Owner group ID
  is_default: boolean;         // Default configuration flag
  version: number;             // Optimistic locking version
  created_at: string;          // Creation time
  updated_at: string;          // Last update time
}
```

---

## 5. Form Validation

### 5.1 Conditional Validation

**Create Mode**:
- `api_key`: Required, min length 10 characters
- All other fields as per their validators

**Edit Mode**:
- `api_key`: Optional (empty = keep existing, new value = update)
- All other fields as per their validators

### 5.2 Field Validators

| Field | Validators |
|-------|------------|
| `name` | Required, 1-100 chars, alphanumeric with underscores/hyphens only |
| `model_type` | Required |
| `provider` | Required |
| `model` | Required |
| `api_key` | Required (create), Optional (edit), min 10 chars |
| `base_url` | Optional |
| `temperature` | Required, 0.0-2.0 |
| `context_limit` | Required, 1-10000 |
| `context_strategy` | Optional |
| `copilot_mode` | Optional |

### 5.3 Name Uniqueness

Configuration names must be unique within the same scope (user or group). The dialog validates this during creation and editing.

---

## 6. Provider Presets

### 6.1 Available Presets

| Preset ID | Label | Provider | Base URL |
|-----------|-------|----------|----------|
| `custom` | Custom (User Defined) | openai | (user defined) |
| `openrouter` | OpenRouter | openai | https://openrouter.ai/api/v1 |
| `deepseek` | DeepSeek | deepseek | https://api.deepseek.com/v1 |

### 6.2 Preset Models

**OpenRouter**:
- deepseek/deepseek-v3.2
- x-ai/grok-3
- anthropic/claude-sonnet-4
- z-ai/glm-4.7
- openai/gpt-4o
- google/gemini-2.5-flash

**DeepSeek**:
- deepseek-chat
- deepseek-coder

### 6.3 Custom Model Support

Users can select "Custom model name..." from the preset dropdown to manually enter any model name.

---

## 7. Custom Fields

### 7.1 Purpose

Custom fields allow users to add additional parameters not included in the standard form, such as:
- `max_tokens` - Maximum tokens for generation
- Provider-specific parameters
- Experimental features

### 7.2 Hidden Fields

The following fields are intentionally hidden from the custom fields list to avoid confusion:
- `max_tokens` - Standard optional parameter

### 7.3 Custom Field Management

Users can:
- Add unlimited custom key-value pairs
- Delete custom fields
- Custom fields are sent directly in the API request

---

## 8. Advanced Implementation Details

### 8.1 Optimistic Locking

**Purpose**: Prevent concurrent modification conflicts when multiple users edit the same configuration.

**Implementation**:
- `UpdateLLMModelConfigRequest` includes an optional `expected_version` field
- Server validates the version before applying updates
- Returns `409 Conflict` if version mismatch occurs
- Clients automatically refresh data and notify users

**Usage**:
```typescript
// Include expected_version when updating
const updateRequest: UpdateLLMModelConfigRequest = {
  name: 'Updated Name',
  expected_version: config.version  // Current version from fetch
};
```

### 8.2 Conflict Resolution

**HTTP 409 Conflict Handling**:

**Scenarios**:
- Concurrent edits to the same configuration
- Version mismatch during update operations
- Default configuration conflicts

**Client Behavior**:
1. Detect `409` status code in error response
2. Automatically reload configuration list
3. Display warning message: "Data has been modified by another user, auto-refreshed"
4. User can retry operation with fresh data

**Implementation Location**:
- `AiProfileTabComponent.handleConflict()` (src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts)
- `GroupAiProfileTabComponent.handleConflict()` (src/app/components/group-details/group-ai-profile-tab/group-ai-profile-tab.component.ts)

---

## 9. Security Considerations

### 9.1 API Key Handling

**Server Behavior**:
- API keys are encrypted on the server
- API responses return `api_key: null` for security
- Existing keys are never exposed to the client

**Client Behavior**:
- Create mode: API key is required
- Edit mode: API key is optional (empty = keep existing)
- Clear visual indication when a key exists but is hidden

### 9.2 Configuration Inheritance

**User Access**:
- Users can view and use inherited group configurations
- Users cannot edit or delete inherited group configurations
- Users can create their own configurations that override group configs

**Group Access**:
- Group admins manage group configurations
- Group members inherit configurations automatically
- Inherited configs are visually marked with a group badge

---

## 10. Changelog

### v1.2 (2026-03-18)

**Code Cleanup**:
- ✅ Removed all legacy API methods from `AiProfilesService`
  - Removed `/profiles` endpoints (user and group)
  - Removed legacy methods: `getProfiles`, `createProfile`, `updateProfile`, etc.
- ✅ Removed legacy type definitions from `ai-profile.ts`
  - Removed `AiProfile`, `AiProfilesResponse`, `CreateProfileRequest`, etc.
- ✅ Cleaned up unused imports in component files
- ✅ Updated documentation to remove legacy API references

**Breaking Change**: Legacy `/profiles` API endpoints no longer supported in frontend code.

### v1.1 (2026-03-18)

**Documentation Updates**:
- ✅ Added Section 8: Advanced Implementation Details
- ✅ Documented optimistic locking mechanism with `expected_version`
- ✅ Documented legacy API compatibility layer (later removed in v1.2)
- ✅ Documented HTTP 409 conflict resolution handling
- ✅ Updated table of contents and section numbering

### v1.0 (2026-03-14)

**Initial Release**:
- ✅ User-level configuration management
- ✅ Group-level configuration management
- ✅ Configuration inheritance
- ✅ Provider presets (OpenRouter, DeepSeek, Custom)
- ✅ Custom model support
- ✅ Conditional API key validation
- ✅ Default configuration management
- ✅ Custom field support
- ✅ Visual indicators for inherited configs

**Bug Fixes**:
- ✅ API key not returned from server (handled as optional in edit mode)
- ✅ max_tokens hidden from custom fields list
- ✅ Tooltip removed from "Set as default" button

**UI Improvements**:
- ✅ Clear indication when existing API key is saved
- ✅ Contextual help text for create vs edit modes
- ✅ Group badge for inherited configurations

---

## 11. Future Enhancements

**Potential Features**:
- [ ] Configuration templates
- [ ] Configuration import/export
- [ ] Configuration validation (test connection)
- [ ] Usage statistics per configuration
- [ ] Configuration versioning
- [ ] Bulk operations

---

**Maintained By**: Development Team
**Last Updated**: 2026-03-18 (v1.2)
