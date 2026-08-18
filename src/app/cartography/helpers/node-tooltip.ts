import { Controller } from '@models/controller';
import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { MapPort } from '../models/map/map-port';

const NODE_TYPE_LABELS: Record<string, string> = {
  atm_switch: 'ATM switch',
  cloud: 'Cloud',
  docker: 'Docker container',
  dynamips: 'Dynamips node',
  ethernet_hub: 'Ethernet hub',
  ethernet_switch: 'Ethernet switch',
  frame_relay_switch: 'Frame Relay switch',
  iou: 'IOU node',
  nat: 'NAT node',
  qemu: 'QEMU VM',
  virtualbox: 'VirtualBox VM',
  vmware: 'VMware VM',
  vpcs: 'VPCS node',
};

function matchesPort(
  endpoint: { nodeId: string; adapterNumber: number; portNumber: number },
  node: MapNode,
  port: MapPort
) {
  return (
    endpoint.nodeId === node.id &&
    endpoint.adapterNumber === port.adapterNumber &&
    endpoint.portNumber === port.portNumber
  );
}

function portKey(port: { adapterNumber: number; portNumber: number }): string {
  return `${port.adapterNumber}:${port.portNumber}`;
}

function portInformation(port: MapPort, node: MapNode, link: MapLink, nodesById: Map<string, MapNode>): string[] {
  const lines: string[] = [];
  const peerEndpoint = link.nodes.find((endpoint) => !matchesPort(endpoint, node, port));
  const peer = peerEndpoint ? nodesById.get(peerEndpoint.nodeId) : undefined;
  const peerPort = peerEndpoint
    ? peer?.ports?.find(
        (candidate) =>
          candidate.adapterNumber === peerEndpoint.adapterNumber && candidate.portNumber === peerEndpoint.portNumber
      )
    : undefined;

  if (peerEndpoint) {
    lines.push(
      `${port.name} connected to ${peer?.name || peerEndpoint.nodeId} on port ${
        peerPort?.name || peerEndpoint.portNumber
      }`
    );
  } else {
    lines.push(`${port.name} is connected`);
  }

  if (port.macAddress) {
    lines.push(`  MAC address is ${port.macAddress}`);
  }

  return lines;
}

export function buildNodeSummary(node: MapNode, controller?: Controller): string {
  const lines = [`${NODE_TYPE_LABELS[node.nodeType] || 'Node'} ${node.name} is ${node.status}`];

  if (controller && (!node.computeId || node.computeId === 'local')) {
    lines.push(`Running on server ${controller.name} (controller) with port ${controller.port}`);
  } else if (node.computeId) {
    lines.push(`Running on compute ${node.computeId}`);
  }
  lines.push(`Node ID is ${node.id}`);

  const cpus = node.properties?.cpus;
  const ram = node.properties?.ram;
  if (cpus != null && ram != null) {
    lines.push(`Number of processors is ${cpus} and amount of memory is ${ram}MB`);
  }

  if (node.consoleType && node.consoleType !== 'none' && node.console != null) {
    lines.push(`Console is on port ${node.console} and type is ${node.consoleType}`);
  }
  if (node.auxType && node.auxType !== 'none' && node.aux != null) {
    lines.push(`Auxiliary console is on port ${node.aux} and type is ${node.auxType}`);
  }

  return lines.join('\n');
}

export function buildNodeTooltip(node: MapNode, links: MapLink[], nodes: MapNode[], controller?: Controller): string {
  const lines = [buildNodeSummary(node, controller)];
  const nodesById = new Map(nodes.map((candidate) => [candidate.id, candidate]));
  const linksByPort = new Map<string, MapLink>();

  for (const link of links) {
    for (const endpoint of link.nodes || []) {
      if (endpoint.nodeId === node.id) {
        linksByPort.set(portKey(endpoint), link);
      }
    }
  }

  for (const port of node.ports || []) {
    const link = linksByPort.get(portKey(port));
    if (link) {
      lines.push(...portInformation(port, node, link, nodesById));
    }
  }

  return lines.join('\n');
}
