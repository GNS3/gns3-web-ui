/**
 * AI Profile Model
 * Represents an AI model configuration profile
 */
export interface AiProfile {
  name: string;           // Profile name (unique per user)
  provider: string;       // Provider name (openai, qwen, anthropic, etc.)
  model: string;          // Model name (gpt-4, qwen-max, etc.)
  api_key: string;        // API key (encrypted on server)
  base_url: string;       // API endpoint URL
  temperature: string;    // Temperature parameter
  // Extended fields (optional)
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  [key: string]: any;     // Support for custom fields
}

/**
 * Profiles list response
 */
export interface AiProfilesResponse {
  profiles: AiProfile[];
  active: string;         // Currently active profile name
  version: number;        // Optimistic locking version
}

/**
 * Set active profile request
 */
export interface SetActiveProfileRequest {
  profile_name: string;
  expected_version?: number;  // Optional, for optimistic locking
}

/**
 * Create profile request
 */
export interface CreateProfileRequest extends Partial<AiProfile> {
  name: string;
  provider: string;
  model: string;
  api_key: string;
  base_url?: string;
  temperature?: string;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  expected_version?: number;
  [key: string]: any;
}

/**
 * API Error response
 */
export interface ApiError {
  detail: string;
  status?: number;
}
