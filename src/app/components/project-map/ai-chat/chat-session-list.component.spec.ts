import { ChatSessionListComponent } from './chat-session-list.component';
import { describe, it, expect } from 'vitest';

describe('ChatSessionListComponent', () => {
  it('should be defined', () => {
    expect(ChatSessionListComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ChatSessionListComponent.name).toBe('ChatSessionListComponent');
  });
});
