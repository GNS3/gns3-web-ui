import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Node } from '../cartography/models/node';
import { CapturingSettings } from '../models/capturingSettings';
import { FilterDescription } from '../models/filter-description';
import { Link } from '../models/link';
import { LinkNode } from '../models/link-node';
import { Port } from '../models/port';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class LinkService {
  constructor(private httpServer: HttpServer) {}

  createLink(
    controller: Server,
    source_node: Node,
    source_port: Port,
    target_node: Node,
    target_port: Port,
    xLabelSourceNode: number,
    yLabelSourceNode: number,
    xLabelTargetNode: number,
    yLabelTargetNode: number
  ) {
    return this.httpServer.post(controller, `/projects/${source_node.project_id}/links`, {
      nodes: [
        {
          node_id: source_node.node_id,
          port_number: source_port.port_number,
          adapter_number: source_port.adapter_number,
          label: {
            rotation: 0,
            style: 'font-size: 10; font-style: Verdana',
            text: source_port.short_name,
            x: xLabelSourceNode,
            y: yLabelSourceNode,
          },
        },
        {
          node_id: target_node.node_id,
          port_number: target_port.port_number,
          adapter_number: target_port.adapter_number,
          label: {
            rotation: 0,
            style: 'font-size: 10; font-style: Verdana',
            text: target_port.short_name,
            x: xLabelTargetNode,
            y: yLabelTargetNode,
          },
        },
      ],
    });
  }

  getLink(controller: Server, projectId: string, linkId: string) {
    return this.httpServer.get<Link>(controller, `/projects/${projectId}/links/${linkId}`);
  }

  deleteLink(controller: Server, link: Link) {
    return this.httpServer.delete(controller, `/projects/${link.project_id}/links/${link.link_id}`);
  }

  updateLink(controller: Server, link: Link) {
    link.x = Math.round(link.x);
    link.y = Math.round(link.y);

    return this.httpServer.put<Link>(controller, `/projects/${link.project_id}/links/${link.link_id}`, link);
  }

  updateLinkStyle(controller: Server, link: Link) {
    return this.httpServer.put<Link>(controller, `/projects/${link.project_id}/links/${link.link_id}`, link);
  }

  getAvailableFilters(controller: Server, link: Link) {
    return this.httpServer.get<FilterDescription[]>(
      controller,
      `/projects/${link.project_id}/links/${link.link_id}/available_filters`
    );
  }

  updateNodes(controller: Server, link: Link, nodes: LinkNode[]) {
    const requestNodes = nodes.map((linkNode) => {
      return {
        node_id: linkNode.node_id,
        port_number: linkNode.port_number,
        adapter_number: linkNode.adapter_number,
        label: {
          rotation: linkNode.label.rotation,
          style: linkNode.label.style,
          text: linkNode.label.text,
          x: linkNode.label.x,
          y: linkNode.label.y,
        },
      };
    });

    return this.httpServer.put(controller, `/projects/${link.project_id}/links/${link.link_id}`, { nodes: requestNodes });
  }

  startCaptureOnLink(controller: Server, link: Link, settings: CapturingSettings) {
    return this.httpServer.post(controller, `/projects/${link.project_id}/links/${link.link_id}/capture/start`, settings);
  }

  stopCaptureOnLink(controller: Server, link: Link) {
    return this.httpServer.post(controller, `/projects/${link.project_id}/links/${link.link_id}/capture/stop`, {});
  }

  resetLink(controller: Server, link: Link) {
    return this.httpServer.post(controller, `/projects/${link.project_id}/links/${link.link_id}/reset`, {});
  }

  streamPcap(controller: Server, link: Link) {
    return this.httpServer.get(controller, `/projects/${link.project_id}/links/${link.link_id}/capture/stream`);
  }
}
