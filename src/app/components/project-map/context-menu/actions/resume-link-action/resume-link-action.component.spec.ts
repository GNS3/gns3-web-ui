import { ResumeLinkActionComponent } from './resume-link-action.component';
import { describe, it, expect } from 'vitest';

describe('ResumeLinkActionComponent', () => {
  it('should be defined', () => {
    expect(ResumeLinkActionComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(ResumeLinkActionComponent.name).toBe('ResumeLinkActionComponent');
  });
});
