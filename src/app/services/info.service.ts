import { Injectable } from '@angular/core';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';

/** Node types that have no start/stop lifecycle. Underscore spelling per GNS3 API. */
const ALWAYS_ON_NODE_TYPES = new Set<string>([
  'cloud',
  'nat',
  'ethernet_hub',
  'ethernet_switch',
  'frame_relay_switch',
  'atm_switch',
  'dynamips',
  'iou',
]);

const NODE_TYPE_LABELS: Record<string, string> = {
  cloud: 'Cloud',
  nat: 'NAT',
  ethernet_hub: 'Ethernet hub',
  ethernet_switch: 'Ethernet switch',
  frame_relay_switch: 'Frame relay switch',
  atm_switch: 'ATM switch',
  docker: 'Docker container',
  dynamips: 'Dynamips router',
  iou: 'IOU device',
  qemu: 'QEMU VM',
  virtualbox: 'VirtualBox VM',
  vmware: 'VMware VM',
  vpcs: 'VPCS host',
};

const STATUS_LABELS: Record<string, string> = {
  started: 'Started',
  stopped: 'Stopped',
  suspended: 'Suspended',
};

export interface NodeInfoConsole {
  port: number;
  type: string;
}

export interface NodeInfoController {
  id: number | string;
  name: string;
  port: number;
}

export interface NodeInfoPort {
  name: string;
  linkType: string;
}

export interface NodeInfo {
  status: string;
  statusLabel: string;
  alwaysOn: boolean;
  nodeType: string;
  nodeTypeLabel: string;
  nodeId: string;
  console: NodeInfoConsole | null;
  controller: NodeInfoController;
  ports: NodeInfoPort[];
}

export type NodeCommandLineKind = 'available' | 'unsupported' | 'not-running';

export interface NodeCommandLineInfo {
  kind: NodeCommandLineKind;
  commandLine: string;
  message: string;
}

@Injectable()
export class InfoService {
  getInfoAboutNode(node: Node, controller: Controller): NodeInfo {
    const alwaysOn = ALWAYS_ON_NODE_TYPES.has(node.node_type);
    return {
      status: node.status,
      statusLabel: alwaysOn ? 'Always on' : STATUS_LABELS[node.status] ?? node.status,
      alwaysOn,
      nodeType: node.node_type,
      nodeTypeLabel: NODE_TYPE_LABELS[node.node_type] ?? node.node_type,
      nodeId: node.node_id,
      console:
        node.console_type && node.console_type !== 'none' && node.console_type !== 'null'
          ? { port: node.console, type: node.console_type }
          : null,
      controller: { id: controller.id, name: controller.name, port: controller.port },
      ports: node.ports.map((port) => ({ name: port.name, linkType: port.link_type ?? '' })),
    };
  }

  getCommandLine(node: Node): NodeCommandLineInfo {
    if (ALWAYS_ON_NODE_TYPES.has(node.node_type)) {
      return {
        kind: 'unsupported',
        commandLine: '',
        message: 'Command line information is not supported for this type of node.',
      };
    }
    if (node.command_line) {
      return { kind: 'available', commandLine: node.command_line, message: '' };
    }
    return {
      kind: 'not-running',
      commandLine: '',
      message: 'Please start the node in order to get the command line information.',
    };
  }
}
