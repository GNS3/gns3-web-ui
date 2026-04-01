import { ChatInputAreaComponent } from './chat-input-area.component';
import { describe, it, expect } from 'vitest';

describe('ChatInputAreaComponent', () => {
  it('should be defined', () => {
    expect(ChatInputAreaComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChatInputAreaComponent.name).toBe('ChatInputAreaComponent');
  });
});
