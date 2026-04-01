import { CloudNodesTemplatesComponent } from './cloud-nodes-templates.component';
import { describe, it, expect } from 'vitest';

describe('CloudNodesTemplatesComponent', () => {
  it('should be defined', () => {
    expect(CloudNodesTemplatesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CloudNodesTemplatesComponent.name).toBe('CloudNodesTemplatesComponent');
  });
});
