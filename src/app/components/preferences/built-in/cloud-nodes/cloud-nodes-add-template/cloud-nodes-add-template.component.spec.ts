import { CloudNodesAddTemplateComponent } from './cloud-nodes-add-template.component';
import { describe, it, expect } from 'vitest';

describe('CloudNodesAddTemplateComponent', () => {
  it('should be defined', () => {
    expect(CloudNodesAddTemplateComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(CloudNodesAddTemplateComponent.name).toBe('CloudNodesAddTemplateComponent');
  });
});
