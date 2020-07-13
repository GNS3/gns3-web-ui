import { Injectable } from '@angular/core';
import { Node } from '../cartography/models/node';

import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Port } from '../models/port';
import { Link } from '../models/link';
import { LinkNode } from '../models/link-node';
import { FilterDescription } from '../models/filter-description';
import { CapturingSettings } from '../models/capturingSettings';

@Injectable()
export class LinkService {
  constructor(private httpServer: HttpServer) {}

  createLink(server: Server, source_node: Node, source_port: Port, target_node: Node, target_port: Port,
    xLabelSourceNode: number, yLabelSourceNode: number, xLabelTargetNode: number, yLabelTargetNode: number) {
    return this.httpServer.post(server, `/projects/${source_node.project_id}/links`, {
      nodes: [
        {
          node_id: source_node.node_id,
          port_number: source_port.port_number,
          adapter_number: source_port.adapter_number,
          label: {
            rotation: 0,
            style: "font-size: 10; font-style: Verdana",
            text: source_port.short_name,
            x: xLabelSourceNode,
            y: yLabelSourceNode
          }
        },
        {
          node_id: target_node.node_id,
          port_number: target_port.port_number,
          adapter_number: target_port.adapter_number,
          label: {
            rotation: 0,
            style: "font-size: 10; font-style: Verdana",
            text: target_port.short_name,
            x: xLabelTargetNode,
            y: yLabelTargetNode
          }
        }
      ]
    });
  }

  getLink(server: Server, projectId: string, linkId: string) {
    return this.httpServer.get<Link>(server, `/projects/${projectId}/links/${linkId}`);
  }

  deleteLink(server: Server, link: Link) {
    return this.httpServer.delete(server, `/projects/${link.project_id}/links/${link.link_id}`)
  }

  updateLink(server: Server, link: Link) {
    // link.x = Math.round(link.x);
    // link.y = Math.round(link.y);
    
    return this.httpServer.put<Link>(server, `/projects/${link.project_id}/links/${link.link_id}`, link);
  }

  getAvailableFilters(server: Server, link: Link) {
    return this.httpServer.get<FilterDescription[]>(server, `/projects/${link.project_id}/links/${link.link_id}/available_filters`);
  }

  updateNodes(server: Server, link: Link, nodes: LinkNode[]) {
    const requestNodes = nodes.map(linkNode => {
      return {
        node_id: linkNode.node_id,
        port_number: linkNode.port_number,
        adapter_number: linkNode.adapter_number,
        label: {
          rotation: linkNode.label.rotation,
          style: linkNode.label.style,
          text: linkNode.label.text,
          x: linkNode.label.x,
          y: linkNode.label.y
        }
      };
    });

    return this.httpServer.put(server, `/projects/${link.project_id}/links/${link.link_id}`, { nodes: requestNodes });
  }

  startCaptureOnLink(server: Server, link: Link, settings: CapturingSettings) {
    return this.httpServer.post(server, `/projects/${link.project_id}/links/${link.link_id}/start_capture`, settings);
  }

  stopCaptureOnLink(server: Server, link: Link) {
    return this.httpServer.post(server, `/projects/${link.project_id}/links/${link.link_id}/stop_capture`, {});
  }

  streamPcap(server: Server, link: Link) {
    return this.httpServer.get(server, `/projects/${link.project_id}/links/${link.link_id}/pcap`)
  }
}
