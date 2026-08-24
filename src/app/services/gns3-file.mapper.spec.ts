import { describe, it, expect } from 'vitest';
import { mapGns3FileTopology } from './gns3-file.mapper';
import { Gns3ProjectFile } from '../models/gns3-file';

describe('mapGns3FileTopology', () => {
  const file: Gns3ProjectFile = {
    project_id: 'proj-1',
    name: 'Test project',
    scene_width: 2000,
    scene_height: 1000,
    topology: {
      nodes: [
        {
          node_id: 'node-1',
          name: 'R1',
          node_type: 'qemu',
          compute_id: 'local',
          x: -100,
          y: 50,
          z: 1,
          symbol: ':/symbols/router.svg',
          label: { rotation: 0, style: 'font-size: 10;', text: 'R1', x: 3, y: -8 },
        },
        {
          // No label — must be synthesized with null x/y (auto-center).
          node_id: 'node-2',
          name: 'SW1',
          node_type: 'ethernet_switch',
          compute_id: 'local',
          x: 100,
          y: 50,
          symbol: ':/symbols/ethernet_switch.svg',
        },
      ],
      links: [
        {
          link_id: 'link-1',
          link_type: 'ethernet',
          nodes: [
            { node_id: 'node-1', adapter_number: 0, port_number: 0, label: { text: 'e0', x: 10, y: 0 } },
            // No label / no port_number — defaults must be synthesized.
            { node_id: 'node-2', adapter_number: 0 },
          ],
        },
      ],
      drawings: [{ drawing_id: 'drawing-1', svg: '<rect></rect>', x: 0, y: 0 }],
    },
  };

  it('passes file node fields through and fills rendering defaults', () => {
    const { nodes } = mapGns3FileTopology(file, 'proj-1');
    const node = nodes[0] as any;

    expect(node.node_id).toBe('node-1');
    expect(node.name).toBe('R1');
    expect(node.symbol).toBe(':/symbols/router.svg');
    expect(node.x).toBe(-100);
    expect(node.label.text).toBe('R1');
    expect(node.label.x).toBe(3);
    // Runtime fields the file does not store
    expect(node.project_id).toBe('proj-1');
    expect(node.status).toBe('stopped');
    expect(node.width).toBe(0);
    expect(node.height).toBe(0);
    expect(node.ports).toEqual([]);
    expect(node.symbol_url).toBeNull();
  });

  it('synthesizes a centered label for nodes missing one', () => {
    const { nodes } = mapGns3FileTopology(file, 'proj-1');
    const label = (nodes[1] as any).label;

    expect(label.text).toBe('SW1');
    // null x/y → NodeToMapNodeConverter centers the label over the node
    expect(label.x).toBeNull();
    expect(label.y).toBeNull();
    expect(label.rotation).toBe(0);
  });

  it('applies safe link defaults and maps link nodes', () => {
    const { links } = mapGns3FileTopology(file, 'proj-1');
    const link = links[0] as any;

    expect(link.project_id).toBe('proj-1');
    expect(link.capturing).toBe(false);
    expect(link.show_filters_icon).toBe(false);
    expect(link.wireshark).toBe(false);
    expect(link.suspend).toBe(false);
    expect(link.filters).toEqual({});
    expect(link.nodes[0].label.text).toBe('e0');
    expect(link.nodes[1].node_id).toBe('node-2');
    expect(link.nodes[1].adapter_number).toBe(0);
    expect(link.nodes[1].port_number).toBe(0);
    expect(link.nodes[1].label.text).toBe('');
  });

  it('maps drawings with tolerant defaults', () => {
    const { drawings } = mapGns3FileTopology(file, 'proj-1');
    const drawing = drawings[0] as any;

    expect(drawing.drawing_id).toBe('drawing-1');
    expect(drawing.svg).toBe('<rect></rect>');
    expect(drawing.project_id).toBe('proj-1');
    expect(drawing.rotation).toBe(0);
    expect(drawing.locked).toBe(false);
    expect(drawing.z).toBe(0);
  });

  it('returns empty arrays for a file without topology', () => {
    const result = mapGns3FileTopology({ project_id: 'proj-1' }, 'proj-1');

    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
    expect(result.drawings).toEqual([]);
  });

  it('does not mutate the input file', () => {
    const snapshot = JSON.stringify(file);
    mapGns3FileTopology(file, 'proj-1');

    expect(JSON.stringify(file)).toBe(snapshot);
  });
});
