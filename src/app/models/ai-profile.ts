/**
 * Model type enumeration
 */
export type ModelType =
  | 'text'        // Text generation models
  | 'vision'      // Vision/image understanding models
  | 'stt'         // Speech-to-Text models
  | 'tts'         // Text-to-Speech models
  | 'multimodal'  // Multimodal models supporting multiple input types
  | 'embedding'   // Text embedding models
  | 'reranking'   // Reranking models
  | 'other';      // Other model types

/**
 * Context strategy enumeration
 */
export type ContextStrategy =
  | 'conservative'  // 60% of limit
  | 'balanced'      // 75% of limit (default)
  | 'aggressive';   // 85% of limit

/**
 * Copilot mode enumeration
 */
export type CopilotMode =
  | 'teaching_assistant'         // Diagnostics only (default)
  | 'lab_automation_assistant';  // Full configuration access

/**
 * LLM Model Configuration Data (nested in config object)
 */
export interface LLMModelConfigData {
  provider: string;              // LLM provider (e.g., "openai", "anthropic", "ollama")
  base_url: string;              // API base URL
  model: string;                 // Model name
  temperature: number;           // Temperature (0.0-2.0)
  context_limit: number;         // Model context window limit in K tokens (e.g., 128 = 128K)
  api_key?: string;              // API key (auto-encrypted, may be hidden for inherited configs)
  max_tokens?: number;           // Max tokens for generation
  context_strategy?: ContextStrategy;  // Context trimming strategy
  copilot_mode?: CopilotMode;    // GNS3-Copilot mode
  [key: string]: any;            // Support for custom fields
}

/**
 * LLM Model Configuration Response
 */
export interface LLMModelConfigResponse {
  config_id: string;             // Configuration ID (UUID)
  name: string;                  // Configuration name
  model_type: ModelType;         // Model type
  config: LLMModelConfigData;    // Configuration data (nested)
  user_id: string | null;        // Owner user ID
  group_id: string | null;       // Owner group ID
  is_default: boolean;           // Default configuration flag
  version: number;               // Optimistic locking version
  created_at: string;            // Creation time
  updated_at: string;            // Last update time
}

/**
 * LLM Model Configuration with Source (for inherited configs)
 */
export interface LLMModelConfigWithSource extends LLMModelConfigResponse {
  source: 'user' | 'group';      // Source of the configuration
  group_name: string | null;     // Group name if source is "group"
}

/**
 * LLM Model Configurations List Response (for user endpoints with inheritance)
 */
export interface LLMModelConfigInheritedResponse {
  configs: LLMModelConfigWithSource[];  // Effective configurations (own + inherited)
  default_config: LLMModelConfigWithSource | null;  // Default configuration
  total: number;                        // Total count
}

/**
 * LLM Model Configurations List Response (for group endpoints)
 */
export interface LLMModelConfigListResponse {
  configs: LLMModelConfigResponse[];    // Configuration list
  default_config: LLMModelConfigResponse | null;  // Default configuration
  total: number;                        // Total count
}

/**
 * Create LLM Model Configuration Request
 */
export interface CreateLLMModelConfigRequest {
  name: string;                         // Configuration name (1-100 chars)
  model_type: ModelType;                // Model type
  provider: string;                     // LLM provider
  base_url: string;                     // API base URL
  model: string;                        // Model name
  temperature: number;                  // Temperature (0.0-2.0, default: 0.7)
  context_limit: number;                // Model context window limit in K tokens (required)
  api_key?: string;                     // API key (auto-encrypted)
  max_tokens?: number;                  // Max tokens for generation
  context_strategy?: ContextStrategy;   // Context trimming strategy
  copilot_mode?: CopilotMode;           // GNS3-Copilot mode
  is_default?: boolean;                 // Set as default (default: false)
  [key: string]: any;                   // Support for custom fields
}

/**
 * Update LLM Model Configuration Request
 */
export interface UpdateLLMModelConfigRequest {
  name?: string;                        // Configuration name
  model_type?: ModelType;               // Model type
  provider?: string;                    // LLM provider
  base_url?: string;                    // API base URL
  model?: string;                       // Model name
  temperature?: number;                 // Temperature
  context_limit?: number;               // Model context window limit in K tokens
  api_key?: string;                     // API key
  max_tokens?: number;                  // Max tokens
  context_strategy?: ContextStrategy;   // Context trimming strategy
  copilot_mode?: CopilotMode;           // GNS3-Copilot mode
  is_default?: boolean;                 // Default flag
  expected_version?: number;            // Optimistic locking version
  [key: string]: any;                   // Support for custom fields
}

/**
 * API Error response
 */
export interface ApiError {
  detail: string;
  status?: number;
}
