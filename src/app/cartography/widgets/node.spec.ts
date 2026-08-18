// @vitest-environment jsdom

import { select } from 'd3-selection';
import { describe, expect, it, vi } from 'vitest';

import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { NodeWidget } from './node';

describe('NodeWidget tooltip', () => {
  it('renders node information and refreshes port connections on hover', () => {
    const node = {
      id: 'router-id',
      name: 'router',
      nodeType: 'qemu',
      status: 'started',
      properties: {},
      ports: [
        {
          name: 'Gi0',
          shortName: 'Gi0',
          adapterNumber: 0,
          portNumber: 0,
          linkType: 'ethernet',
        },
      ],
      width: 60,
      height: 60,
      x: 0,
      y: 0,
    } as MapNode;
    const peer = {
      id: 'pc-id',
      name: 'PC1',
      ports: [
        {
          name: 'Ethernet0',
          shortName: 'e0',
          adapterNumber: 0,
          portNumber: 0,
          linkType: 'ethernet',
        },
      ],
    } as MapNode;
    const links: MapLink[] = [];
    const getLinks = vi.fn(() => links);
    const getNodes = vi.fn(() => [node, peer]);
    const widget = new NodeWidget(
      { isSelected: vi.fn().mockReturnValue(false) } as any,
      { draw: vi.fn() } as any,
      { clicked: { emit: vi.fn() } } as any,
      { isLayerNumberVisible: false, isItemLockStatusVisible: false } as any,
      { getItems: getLinks } as any,
      { getItems: getNodes } as any
    );
    const svg = select(document.body).append('svg');
    const view = svg.append('g').datum(node) as any;

    widget.draw(view);
    expect(view.select('title.node_tooltip').text()).toContain('QEMU VM router is started');
    expect(view.select('title.node_tooltip').text()).not.toContain('Gi0');
    expect(getLinks).not.toHaveBeenCalled();
    expect(getNodes).not.toHaveBeenCalled();

    links.push({
      nodes: [
        { nodeId: node.id, adapterNumber: 0, portNumber: 0 },
        { nodeId: peer.id, adapterNumber: 0, portNumber: 0 },
      ],
    } as MapLink);
    view.select('g.node_body').dispatch('mouseenter');

    expect(view.select('title.node_tooltip').text()).toContain('Gi0 connected to PC1 on port Ethernet0');
    expect(getLinks).toHaveBeenCalledOnce();
    expect(getNodes).toHaveBeenCalledOnce();
  });
});
