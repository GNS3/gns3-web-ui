import { ChatMessageListComponent } from './chat-message-list.component';
import { describe, it, expect } from 'vitest';

describe('ChatMessageListComponent', () => {
  it('should be defined', () => {
    expect(ChatMessageListComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChatMessageListComponent.name).toBe('ChatMessageListComponent');
  });
});
