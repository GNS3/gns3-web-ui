import { AiChatComponent } from './ai-chat.component';
import { describe, it, expect } from 'vitest';

describe('AiChatComponent', () => {
  it('should be defined', () => {
    expect(AiChatComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(AiChatComponent.name).toBe('AiChatComponent');
  });
});
