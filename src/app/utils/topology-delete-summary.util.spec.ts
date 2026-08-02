import { describe, expect, it } from 'vitest';
import { describeTopologyItems } from './topology-delete-summary.util';

describe('describeTopologyItems', () => {
  it('names a single topology item type', () => {
    expect(describeTopologyItems({ nodes: 0, links: 1, drawings: 0 })).toBe('1 link');
    expect(describeTopologyItems({ nodes: 2, links: 0, drawings: 0 })).toBe('2 nodes');
  });

  it('names every type in a mixed selection', () => {
    expect(describeTopologyItems({ nodes: 2, links: 1, drawings: 3 })).toBe('2 nodes, 1 link, and 3 drawings');
  });

  it('provides a safe description for an empty selection', () => {
    expect(describeTopologyItems({ nodes: 0, links: 0, drawings: 0 })).toBe('0 objects');
  });
});
