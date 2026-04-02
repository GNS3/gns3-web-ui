import { describe, it, expect } from 'vitest';
import { getModelDisplayName, shortenModelName } from './ai-profile.util';
import { LLMModelConfigWithSource } from '@models/ai-profile';

// ─────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────

function makeConfig(
  model: string,
  provider: string,
  base_url?: string
): LLMModelConfigWithSource {
  return {
    source: 'user',
    config: {
      model,
      provider,
      base_url,
    },
  } as LLMModelConfigWithSource;
}

// ─────────────────────────────────────────────
// getModelDisplayName
// ─────────────────────────────────────────────

describe('getModelDisplayName', () => {
  describe('when base_url is provided', () => {
    it('should extract hostname from base_url and format display name', () => {
      const config = makeConfig('gemini-2.5-flash', 'google', 'https://api.google.com/v1');
      expect(getModelDisplayName(config)).toBe('gemini-2.5-flash (api.google.com)');
    });

    it('should strip www. prefix from hostname', () => {
      const config = makeConfig('gpt-4o', 'openai', 'https://www.openai.com/v1');
      expect(getModelDisplayName(config)).toBe('gpt-4o (openai.com)');
    });

    it('should strip port number from hostname', () => {
      const config = makeConfig('llama-3', 'local', 'http://localhost:11434/api');
      expect(getModelDisplayName(config)).toBe('llama-3 (localhost)');
    });

    it('should handle openrouter base_url', () => {
      const config = makeConfig('gpt-4o', 'openrouter', 'https://openrouter.ai/api/v1');
      expect(getModelDisplayName(config)).toBe('gpt-4o (openrouter.ai)');
    });

    it('should handle base_url with subdomain', () => {
      const config = makeConfig('claude-3-5-sonnet', 'anthropic', 'https://api.anthropic.com/v1');
      expect(getModelDisplayName(config)).toBe('claude-3-5-sonnet (api.anthropic.com)');
    });

    it('should fall back to provider when base_url is invalid', () => {
      const config = makeConfig('gpt-4o', 'openai', 'not-a-valid-url');
      expect(getModelDisplayName(config)).toBe('gpt-4o (openai)');
    });
  });

  describe('when base_url is not provided', () => {
    it('should use provider as domain when base_url is undefined', () => {
      const config = makeConfig('gpt-4o', 'openai', undefined);
      expect(getModelDisplayName(config)).toBe('gpt-4o (openai)');
    });

    it('should use provider as domain when base_url is empty string', () => {
      const config = makeConfig('gemini-pro', 'google', '');
      expect(getModelDisplayName(config)).toBe('gemini-pro (google)');
    });
  });

  describe('return format', () => {
    it('should always return "model (domain)" format', () => {
      const config = makeConfig('my-model', 'my-provider', 'https://my.api.com');
      const result = getModelDisplayName(config);
      expect(result).toMatch(/^.+ \(.+\)$/);
    });
  });
});

// ─────────────────────────────────────────────
// shortenModelName
// ─────────────────────────────────────────────

describe('shortenModelName', () => {
  describe('with provider prefix', () => {
    it('should remove google/ prefix and title-case the name', () => {
      expect(shortenModelName('google/gemini-2.5-flash')).toBe('Gemini 2.5 Flash');
    });

    it('should remove meta-llama/ prefix', () => {
      expect(shortenModelName('meta-llama/llama-3.1-70b')).toBe('Llama 3.1 70b');
    });

    it('should remove openai/ prefix', () => {
      expect(shortenModelName('openai/gpt-4o')).toBe('Gpt 4o');
    });

    it('should handle nested prefix with multiple slashes', () => {
      // Only the last segment after the final / is used
      expect(shortenModelName('org/group/model-name')).toBe('Model Name');
    });
  });

  describe('without provider prefix', () => {
    it('should title-case a plain model name with dashes', () => {
      expect(shortenModelName('gemini-2.5-flash')).toBe('Gemini 2.5 Flash');
    });

    it('should replace underscores with spaces and title-case', () => {
      expect(shortenModelName('gpt_4_turbo')).toBe('Gpt 4 Turbo');
    });

    it('should handle mixed dashes and underscores', () => {
      expect(shortenModelName('llama_3-instruct')).toBe('Llama 3 Instruct');
    });

    it('should handle single word model name', () => {
      expect(shortenModelName('falcon')).toBe('Falcon');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(shortenModelName('')).toBe('');
    });

    it('should handle model name that is only a prefix slash', () => {
      expect(shortenModelName('provider/')).toBe('');
    });

    it('should preserve numbers in model name', () => {
      expect(shortenModelName('gpt-4o-mini')).toBe('Gpt 4o Mini');
    });
  });
});