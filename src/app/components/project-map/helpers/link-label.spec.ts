import { describe, it, expect } from 'vitest';

import { linkLabel } from './link-label';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';

/**
 * The join is a pure read over the two cartography datasources — stub the
 * `get` lookups (cast: the datasources' construction pulls in the whole map
 * data layer, irrelevant to the naming rules under test).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stub = (get: (id: string) => any) => ({ get }) as unknown as LinksDataSource & NodesDataSource;

const LINK_ID = '11111111-2222-3333-4444-555555555555';

describe('linkLabel', () => {
  const nodes = stub((id) => ({ name: id === 'n1' ? 'iou-r-1' : 'iou-r-2' }));
  const link = stub((id) =>
    id === LINK_ID
      ? {
          nodes: [
            { node_id: 'n1', label: { text: 'Ethernet0/0' } },
            { node_id: 'n2', label: { text: 'Ethernet0/1' } },
          ],
        }
      : undefined
  );

  it('joins the two endpoint node names ("A → B")', () => {
    expect(linkLabel(LINK_ID, link, nodes)).toBe('iou-r-1 → iou-r-2');
  });

  it('withEndpoints appends the interface labels and collapses the spacing', () => {
    expect(linkLabel(LINK_ID, link, nodes, true)).toBe('iou-r-1 Ethernet0/0 → iou-r-2 Ethernet0/1');
  });

  it('falls back to the link-id prefix when the link is gone', () => {
    expect(linkLabel('deadbeef-0000', link, nodes)).toBe('deadbeef');
  });

  it('falls back when an endpoint node cannot be resolved', () => {
    const halfLink = stub(() => ({ nodes: [{ node_id: 'n1' }, { node_id: 'gone' }] }));
    const partialNodes = stub((id) => (id === 'n1' ? { name: 'iou-r-1' } : undefined));
    expect(linkLabel(LINK_ID, halfLink, partialNodes)).toBe('11111111');
  });
});
