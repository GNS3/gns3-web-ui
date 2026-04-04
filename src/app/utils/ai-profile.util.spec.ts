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
    it.each([
      // [model, provider, base_url, expected]
      [
        'gemini-2.5-flash',
        'google',
        'https://api.google.com/v1',
        'gemini-2.5-flash (api.google.com)',
        'extracts hostname from base_url',
      ],
      [
        'gpt-4o',
        'openai',
        'https://www.openai.com/v1',
        'gpt-4o (openai.com)',
        'strips www. prefix from hostname',
      ],
      [
        'llama-3',
        'local',
        'http://localhost:11434/api',
        'llama-3 (localhost)',
        'strips port number from hostname',
      ],
      [
        'gpt-4o',
        'openrouter',
        'https://openrouter.ai/api/v1',
        'gpt-4o (openrouter.ai)',
        'handles openrouter base_url',
      ],
      [
        'claude-3-5-sonnet',
        'anthropic',
        'https://api.anthropic.com/v1',
        'claude-3-5-sonnet (api.anthropic.com)',
        'handles base_url with subdomain',
      ],
      [
        'gpt-4o',
        'openai',
        'not-a-valid-url',
        'gpt-4o (openai)',
        'falls back to provider when base_url is invalid',
      ],
      [
        'model',
        'provider',
        'http://192.168.1.1:8080/v1',
        'model (192.168.1.1)',
        'handles IP address with port',
      ],
      [
        'model',
        'provider',
        'https://user:pass@api.com/v1',
        'model (api.com)',
        'strips authentication from URL',
      ],
    ])(
      'should %s for "%s" (%s)',
      (model: string, provider: string, baseUrl: string, expected: string, _description: string) => {
        // Arrange
        const config = makeConfig(model, provider, baseUrl);

        // Act
        const result = getModelDisplayName(config);

        // Assert
        expect(result).toBe(expected);
      }
    );
  });

  describe('when base_url is not provided', () => {
    it.each([
      // [model, provider, base_url, expected]
      ['gpt-4o', 'openai', undefined, 'gpt-4o (openai)', 'base_url is undefined'],
      ['gemini-pro', 'google', '', 'gemini-pro (google)', 'base_url is empty string'],
      ['model', 'provider', null, 'model (provider)', 'base_url is null'],
    ])(
      'should use provider as domain when %s',
      (model: string, provider: string, baseUrl: any, expected: string, _description: string) => {
        // Arrange
        const config = makeConfig(model, provider, baseUrl);

        // Act
        const result = getModelDisplayName(config);

        // Assert
        expect(result).toBe(expected);
      }
    );
  });

  describe('return format', () => {
    it('should always return "model (domain)" format', () => {
      // Arrange
      const config = makeConfig('my-model', 'my-provider', 'https://my.api.com');

      // Act
      const result = getModelDisplayName(config);

      // Assert
      expect(result).toMatch(/^.+ \(.+\)$/);
    });
  });
});

// ─────────────────────────────────────────────
// shortenModelName
// ─────────────────────────────────────────────

describe('shortenModelName', () => {
  describe('with provider prefix', () => {
    it.each([
      // [input, expected, description]
      ['google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'google/ prefix'],
      ['meta-llama/llama-3.1-70b', 'Llama 3.1 70b', 'meta-llama/ prefix'],
      ['openai/gpt-4o', 'Gpt 4o', 'openai/ prefix'],
      ['org/group/model-name', 'Model Name', 'nested prefix with multiple slashes'],
    ])('should remove %s and title-case the name', (input: string, expected: string, _description: string) => {
      // Act
      const result = shortenModelName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('without provider prefix', () => {
    it.each([
      // [input, expected, description]
      ['gemini-2.5-flash', 'Gemini 2.5 Flash', 'plain model name with dashes'],
      ['gpt_4_turbo', 'Gpt 4 Turbo', 'underscores replaced with spaces'],
      ['llama_3-instruct', 'Llama 3 Instruct', 'mixed dashes and underscores'],
      ['falcon', 'Falcon', 'single word model name'],
    ])('should %s', (input: string, expected: string, _description: string) => {
      // Act
      const result = shortenModelName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('numbers and special characters', () => {
    it.each([
      // [input, expected, description]
      ['gpt-4o-mini', 'Gpt 4o Mini', 'numbers with letter suffix'],
      ['llama-3.1-70b', 'Llama 3.1 70b', 'decimal numbers and size suffix'],
      ['mixtral-8x7b', 'Mixtral 8x7b', 'multiplier notation'],
      ['claude-3-5-sonnet', 'Claude 3 5 Sonnet', 'multiple consecutive numbers'],
      ['qwen-72b-chat', 'Qwen 72b Chat', 'size suffix with model type'],
    ])('should handle %s', (input: string, expected: string, _description: string) => {
      // Act
      const result = shortenModelName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it.each([
      // [input, expected, description]
      ['', '', 'empty string'],
      ['provider/', '', 'only prefix slash'],
      ['Chinese Model', 'Chinese Model', 'unicode characters'],
      ['model+name', 'Model+Name', 'special characters preserved'],
      ['model-name-with-+-sign', 'Model Name With + Sign', 'plus sign with word separators'],
    ])('should handle %s', (input: string, expected: string, _description: string) => {
      // Act
      const result = shortenModelName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
