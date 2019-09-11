import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Node } from '../cartography/models/node';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/map';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { Template } from '../models/template';
import { Label } from '../cartography/models/label';

@Injectable()
export class NodeService {
  constructor(private httpServer: HttpServer) {}

  start(server: Server, node: Node) {
    return this.httpServer.post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {});
  }

  startAll(server: Server, project: Project) {
    return this.httpServer.post(server, `/projects/${project.project_id}/nodes/start`, {});
  }

  stop(server: Server, node: Node) {
    return this.httpServer.post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {});
  }

  stopAll(server: Server, project: Project) {
    return this.httpServer.post(server, `/projects/${project.project_id}/nodes/stop`, {});
  }

  suspend(server: Server, node: Node) {
    return this.httpServer.post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/suspend`, {});
  }

  suspendAll(server: Server, project: Project) {
    return this.httpServer.post(server, `/projects/${project.project_id}/nodes/suspend`, {});
  }

  reload(server: Server, node: Node) {
    return this.httpServer.post<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}/reload`, {});
  }

  reloadAll(server: Server, project: Project) {
    return this.httpServer.post(server, `/projects/${project.project_id}/nodes/reload`, {});
  }

  createFromTemplate(server: Server, project: Project, template: Template, x: number, y: number, compute_id: string) {
    return this.httpServer.post(server, `/projects/${project.project_id}/templates/${template.template_id}`, {
      x: Math.round(x),
      y: Math.round(y),
      compute_id: compute_id
    });
  }

  updatePosition(server: Server, node: Node, x: number, y: number): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: Math.round(x),
      y: Math.round(y)
    });
  }

  updateLabel(server: Server, node: Node, label: Label): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      label: {
        rotation: label.rotation,
        style: label.style,
        text: label.text,
        x: Math.round(label.x),
        y: Math.round(label.y)
      }
    });
  }

  updateSymbol(server: Server, node: Node, changedSymbol: string): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      symbol: changedSymbol
    });
  }

  update(server: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: Math.round(node.x),
      y: Math.round(node.y),
      z: node.z
    });
  }

  updateNode(server: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      name: node.name,
      properties: node.properties
    });
  }

  updateNodeWithCustomAdapters(server: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      console_auto_start: node.console_auto_start,
      custom_adapters: node.custom_adapters,
      name: node.name,
      properties: node.properties
    });
  }

  delete(server: Server, node: Node) {
    return this.httpServer.delete<Node>(server, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  duplicate(server: Server, node: Node) {
    return this.httpServer.post(server, `/projects/${node.project_id}/nodes/${node.node_id}/duplicate`, 
    {
      "x": node.x + 10,
      "y": node.y + 10,
      "z": node.z
    });
  }

  getNode(server: Server, node: Node) {
    return this.httpServer.get(server, `/projects/${node.project_id}/nodes/${node.node_id}`)
  }

  getConfiguration(server: Server, node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
      return this.httpServer.get(server, urlPath, { responseType: 'text' as 'json'});
    }
  }

  saveConfiguration(server: Server, node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
      return this.httpServer.post(server, urlPath, configuration);
    }
  }
}
