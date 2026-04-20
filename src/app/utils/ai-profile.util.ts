import { LLMModelConfigWithSource } from '@models/ai-profile';

/**
 * AI Profile Utility Functions
 * Helper functions for processing and displaying AI model configurations
 */

/**
 * Get model display name with domain
 * Extracts domain from base_url and formats as "model (domain)"
 *
 * @param config Model configuration
 * @returns Display name in format "model (domain)"
 *
 * @example
 * getModelDisplayName(config) // "gemini-2.5-flash (api.google.com)"
 * getModelDisplayName(config) // "gpt-4o (openrouter.com)"
 */
export function getModelDisplayName(config: LLMModelConfigWithSource): string {
  const model = config.config.model;
  const baseUrl = config.config.base_url;
  const provider = config.config.provider;

  // Extract domain from base_url
  let domain = provider;
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      // Get hostname and remove 'www.' prefix
      domain = url.hostname.replace(/^www\./, '');
      // Remove port number if present
      domain = domain.replace(/:\d+$/, '');
    } catch (e) {
      // If URL parsing fails, use provider as fallback
      domain = provider;
    }
  }

  // Format: "GPT-4o (openrouter.com)" or "Claude 3.5 (api.openai.com)"
  return `${model} (${domain})`;
}

/**
 * Shorten model name for display in UI
 * Removes provider prefix and formats to title case
 *
 * @param model Full model name (e.g., "google/gemini-2.5-flash")
 * @returns Shortened model name (e.g., "Gemini 2.5 Flash")
 *
 * @example
 * shortenModelName("google/gemini-2.5-flash") // "Gemini 2.5 Flash"
 * shortenModelName("meta-llama/llama-3.1-70b") // "Llama 3.1 70b"
 * shortenModelName("openai/gpt-4o") // "Gpt 4o"
 */
export function shortenModelName(model: string): string {
  // Remove provider prefix if present (e.g., "google/gemini-2.5-flash" -> "gemini-2.5-flash")
  const parts = model.split('/');
  const modelName = parts[parts.length - 1]; // Get last part after /

  // Convert to title case and format
  // Replace - and _ with spaces, then capitalize first letter of each word
  return modelName
    .replace(/[-_]/g, ' ') // Replace - and _ with space
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word
}
