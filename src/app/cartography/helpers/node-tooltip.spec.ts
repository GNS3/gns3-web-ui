import { describe, expect, it } from 'vitest';

import { Controller } from '@models/controller';
import { MapLink } from '../models/map/map-link';
import { MapLinkNode } from '../models/map/map-link-node';
import { MapNode } from '../models/map/map-node';
import { MapPort } from '../models/map/map-port';
import { buildNodeSummary, buildNodeTooltip } from './node-tooltip';

function makePort(name: string, adapterNumber: number, macAddress?: string): MapPort {
  return {
    name,
    shortName: name,
    adapterNumber,
    portNumber: 0,
    linkType: 'ethernet',
    macAddress,
  };
}

function makeNode(id: string, name: string, ports: MapPort[]): MapNode {
  return {
    id,
    name,
    nodeType: 'qemu',
    status: 'started',
    computeId: 'local',
    console: 5014,
    consoleType: 'ssh',
    aux: 5015,
    auxType: 'telnet',
    properties: { cpus: 1, ram: 4096 } as any,
    ports,
  } as MapNode;
}

describe('buildNodeTooltip', () => {
  it('includes node runtime and console information', () => {
    const node = makeNode('node-1', 'router', []);
    const controller = { name: 'ARCH-DESKTOP', port: 3080 } as Controller;

    expect(buildNodeTooltip(node, [], [node], controller)).toBe(
      [
        'QEMU VM router is started',
        'Running on server ARCH-DESKTOP (controller) with port 3080',
        'Node ID is node-1',
        'Number of processors is 1 and amount of memory is 4096MB',
        'Console is on port 5014 and type is ssh',
        'Auxiliary console is on port 5015 and type is telnet',
      ].join('\n')
    );
  });

  it('falls back to the compute ID without controller context', () => {
    const node = makeNode('node-1', 'router', []);

    expect(buildNodeTooltip(node, [], [node])).toContain('Running on compute local');
  });

  it('does not describe a remote compute as the controller', () => {
    const node = makeNode('node-1', 'router', []);
    node.computeId = 'remote-compute';
    const controller = { name: 'ARCH-DESKTOP', port: 3080 } as Controller;

    const summary = buildNodeSummary(node, controller);

    expect(summary).toContain('Running on compute remote-compute');
    expect(summary).not.toContain('ARCH-DESKTOP');
  });

  it('describes connected ports and omits empty ports', () => {
    const gi0 = makePort('Gi0', 0, '0c:6e:ca:44:00:00');
    const gi1 = makePort('Gi1', 1, '0c:6e:ca:44:00:01');
    const router = makeNode('router-id', 'router', [gi0, gi1]);
    const ethernet0 = makePort('Ethernet0', 0);
    const pc = makeNode('pc-id', 'PC1', [ethernet0]);
    pc.nodeType = 'vpcs';
    pc.status = 'stopped';

    const link = {
      nodes: [
        { nodeId: router.id, adapterNumber: 0, portNumber: 0 } as MapLinkNode,
        { nodeId: pc.id, adapterNumber: 0, portNumber: 0 } as MapLinkNode,
      ],
    } as MapLink;

    const tooltip = buildNodeTooltip(router, [link], [router, pc]);

    expect(tooltip).toContain('Gi0 connected to PC1 on port Ethernet0');
    expect(tooltip).toContain('  MAC address is 0c:6e:ca:44:00:00');
    expect(tooltip).not.toContain('Gi1');
    expect(tooltip).not.toContain('0c:6e:ca:44:00:01');
  });

  it('handles incomplete peer data without throwing', () => {
    const port = makePort('Gi0', 0);
    const node = makeNode('node-1', 'router', [port]);
    const link = {
      nodes: [
        { nodeId: node.id, adapterNumber: 0, portNumber: 0 } as MapLinkNode,
        { nodeId: 'missing-peer', adapterNumber: 2, portNumber: 3 } as MapLinkNode,
      ],
    } as MapLink;

    expect(buildNodeTooltip(node, [link], [node])).toContain('Gi0 connected to missing-peer on port 3');
  });

  it('handles a link between two ports on the same node', () => {
    const gi0 = makePort('Gi0', 0);
    const gi1 = makePort('Gi1', 1);
    const node = makeNode('node-1', 'router', [gi0, gi1]);
    const link = {
      nodes: [
        { nodeId: node.id, adapterNumber: 0, portNumber: 0 } as MapLinkNode,
        { nodeId: node.id, adapterNumber: 1, portNumber: 0 } as MapLinkNode,
      ],
    } as MapLink;

    const tooltip = buildNodeTooltip(node, [link], [node]);

    expect(tooltip).toContain('Gi0 connected to router on port Gi1');
    expect(tooltip).toContain('Gi1 connected to router on port Gi0');
  });
});
