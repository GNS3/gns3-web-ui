import { describe, expect, it } from 'vitest';

import { Port } from '@models/port';
import { Node } from '../../models/node';
import { MapNodeToNodeConverter } from './map-node-to-node-converter';
import { MapPortToPortConverter } from './map-port-to-port-converter';
import { NodeToMapNodeConverter } from './node-to-map-node-converter';
import { PortToMapPortConverter } from './port-to-map-port-converter';

describe('node tooltip fields', () => {
  it('preserves auxiliary console and MAC address data through map conversion', () => {
    const port = {
      adapter_number: 0,
      link_type: 'ethernet',
      mac_address: '0c:6e:ca:44:00:00',
      name: 'Gi0',
      port_number: 0,
      short_name: 'Gi0',
    } as Port;
    const node = {
      node_id: 'node-1',
      aux: 5015,
      aux_type: 'telnet',
      label: undefined,
      ports: [port],
      properties: {},
    } as Node;
    const portToMapPort = new PortToMapPortConverter();
    const mapPortToPort = new MapPortToPortConverter();
    const nodeToMapNode = new NodeToMapNodeConverter(undefined, portToMapPort, undefined, undefined, undefined);
    const mapNodeToNode = new MapNodeToNodeConverter(undefined, mapPortToPort);

    const mapNode = nodeToMapNode.convert(node);
    const convertedNode = mapNodeToNode.convert(mapNode);

    expect(mapNode.aux).toBe(5015);
    expect(mapNode.auxType).toBe('telnet');
    expect(mapNode.ports[0].macAddress).toBe('0c:6e:ca:44:00:00');
    expect(convertedNode.aux).toBe(5015);
    expect(convertedNode.aux_type).toBe('telnet');
    expect(convertedNode.ports[0].mac_address).toBe('0c:6e:ca:44:00:00');
  });
});
