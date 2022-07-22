import { Injectable } from '@angular/core';
import { Node } from '../cartography/models/node';
import { Port } from '../models/port';
import{ Controller } from '../models/controller';

@Injectable()
export class InfoService {
  getInfoAboutNode(node: Node, controller:Controller ): string[] {
    let infoList: string[] = [];
    if (node.node_type === 'cloud') {
      infoList.push(`Cloud ${node.name} is always on.`);
    } else if (node.node_type === 'nat') {
      infoList.push(`NAT ${node.name} is always on.`);
    } else if (node.node_type === 'ethernet-hub') {
      infoList.push(`Ethernet hub ${node.name} is always on.`);
    } else if (node.node_type === 'ethernet_switch') {
      infoList.push(`Ethernet switch ${node.name} is always on.`);
    } else if (node.node_type === 'frame_relay_switch') {
      infoList.push(`Frame relay switch ${node.name} is always on.`);
    } else if (node.node_type === 'atm_switch') {
      infoList.push(`ATM switch ${node.name} is always on.`);
    } else if (node.node_type === 'docker') {
      infoList.push(`Docker ${node.name} is ${node.status}.`);
    } else if (node.node_type === 'dynamips') {
      infoList.push(`Dynamips ${node.name} is always on.`);
    } else if (node.node_type === 'virtualbox') {
      infoList.push(`VirtualBox VM ${node.name} is ${node.status}.`);
    } else if (node.node_type === 'vmware') {
      infoList.push(`VMware VM ${node.name} is ${node.status}.`);
    } else if (node.node_type === 'qemu') {
      infoList.push(`QEMU VM ${node.name} is ${node.status}.`);
    } else if (node.node_type === 'iou') {
      infoList.push(`IOU ${node.name} is always on.`);
    } else if (node.node_type === 'vpcs') {
      infoList.push(`Node ${node.name} is ${node.status}.`);
    }
    infoList.push(`Running on controller ${controller.name} with port ${controller.port}.`);
    infoList.push(`Controller ID is ${controller.id}.`);
    if (node.console_type !== 'none' && node.console_type !== 'null') {
      infoList.push(`Console is on port ${node.console} and type is ${node.console_type}.`);
    }
    infoList = infoList.concat(this.getInfoAboutPorts(node.ports));
    return infoList;
  }

  getInfoAboutPorts(ports: Port[]): string {
    let response: string = `Ports: `;
    ports.forEach((port) => {
      response += `link_type: ${port.link_type},
                        name: ${port.name}; `;
    });
    response = response.substring(0, response.length - 2);
    return response;
  }

  getCommandLine(node: Node): string {
    if (
      node.node_type === 'cloud' ||
      node.node_type === 'nat' ||
      node.node_type === 'ethernet_hub' ||
      node.node_type === 'ethernet_switch' ||
      node.node_type === 'frame_relay_switch' ||
      node.node_type === 'atm_switch' ||
      node.node_type === 'dynamips' ||
      node.node_type === 'iou'
    ) {
      return 'Command line information is not supported for this type of node.';
    } else {
      if (node.command_line) {
        return node.command_line;
      } else {
        return 'Please start the node in order to get the command line information.';
      }
    }
  }
}
