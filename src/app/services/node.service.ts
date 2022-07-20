import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { Label } from '../cartography/models/label';
import { Node } from '../cartography/models/node';
import { Project } from '../models/project';
import { Server } from '../models/server';
import { Template } from '../models/template';
import { HttpServer } from './http-server.service';

@Injectable()
export class NodeService {
  constructor(private httpServer: HttpServer) {}

  getNodeById(controller: Server, projectId: string, nodeId: string) {
    return this.httpServer.get(controller, `/projects/${projectId}/nodes/${nodeId}`);
  }

  isolate(controller: Server, node: Node) {
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/isolate`, {});
  }

  unisolate(controller: Server, node: Node) {
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/unisolate`, {});
  }

  start(controller: Server, node: Node) {
    debugger
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {});
  }

  startAll(controller: Server, project: Project) {
    return this.httpServer.post(controller, `/projects/${project.project_id}/nodes/start`, {});
  }

  stop(controller: Server, node: Node) {
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {});
  }

  stopAll(controller: Server, project: Project) {
    return this.httpServer.post(controller, `/projects/${project.project_id}/nodes/stop`, {});
  }

  suspend(controller: Server, node: Node) {
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/suspend`, {});
  }

  suspendAll(controller: Server, project: Project) {
    return this.httpServer.post(controller, `/projects/${project.project_id}/nodes/suspend`, {});
  }

  reload(controller: Server, node: Node) {
    return this.httpServer.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/reload`, {});
  }

  reloadAll(controller: Server, project: Project) {
    return this.httpServer.post(controller, `/projects/${project.project_id}/nodes/reload`, {});
  }
  resetAllNodes(controller: Server, project: Project) {
    return this.httpServer.post(controller, `/projects/${project.project_id}/nodes/console/reset`, {});
  }

  createFromTemplate(
    controller: Server,
    project: Project,
    template: Template,
    x: number,
    y: number,
    compute_id: string
  ): Observable<Node> {
    if (!compute_id) {
      return this.httpServer.post(controller, `/projects/${project.project_id}/templates/${template.template_id}`, {
        x: Math.round(x),
        y: Math.round(y),
        compute_id: 'local',
      });
    }
    return this.httpServer.post(controller, `/projects/${project.project_id}/templates/${template.template_id}`, {
      x: Math.round(x),
      y: Math.round(y),
      compute_id: compute_id,
    });
  }

  updatePosition(controller: Server, project: Project, node: Node, x: number, y: number): Observable<Node> {
    let xPosition: number = Math.round(x);
    let yPosition: number = Math.round(y);

    if (project.snap_to_grid) {
      xPosition = Math.round((xPosition + node.width / 2) / project.grid_size) * project.grid_size;
      yPosition = Math.round((yPosition + node.height / 2) / project.grid_size) * project.grid_size;

      xPosition = Math.round(xPosition - node.width / 2);
      yPosition = Math.round(yPosition - node.height / 2);
    }

    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: xPosition,
      y: yPosition,
    });
  }

  updateLabel(controller: Server, node: Node, label: Label): Observable<Node> {
    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      label: {
        rotation: label.rotation,
        style: label.style,
        text: label.text,
        x: Math.round(label.x),
        y: Math.round(label.y),
      },
    });
  }

  updateSymbol(controller: Server, node: Node, changedSymbol: string): Observable<Node> {
    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      symbol: changedSymbol,
    });
  }

  update(controller: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: Math.round(node.x),
      y: Math.round(node.y),
      z: node.z,
    });
  }

  updateNode(controller: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      console_auto_start: node.console_auto_start,
      locked: node.locked,
      name: node.name,
      properties: node.properties,
    });
  }

  updateNodeWithCustomAdapters(controller: Server, node: Node): Observable<Node> {
    return this.httpServer.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      console_auto_start: node.console_auto_start,
      custom_adapters: node.custom_adapters,
      name: node.name,
      properties: node.properties,
    });
  }

  delete(controller: Server, node: Node) {
    return this.httpServer.delete<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  duplicate(controller: Server, node: Node) {
    return this.httpServer.post(controller, `/projects/${node.project_id}/nodes/${node.node_id}/duplicate`, {
      x: node.x + 10,
      y: node.y + 10,
      z: node.z,
    });
  }

  getNode(controller: Server, node: Node) {
    return this.httpServer.get(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  getDefaultCommand(): string {
    return `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
  }

  getNetworkConfiguration(controller: Server, node: Node) {
    return this.httpServer.get(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      { responseType: 'text' as 'json' }
    );
  }

  saveNetworkConfiguration(controller: Server, node: Node, configuration: string) {
    return this.httpServer.post(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      configuration
    );
  }

  getStartupConfiguration(controller: Server, node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_startup-config.cfg`;
    }

    return this.httpServer.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  getPrivateConfiguration(controller: Server, node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_private-config.cfg`;
    }

    return this.httpServer.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  saveConfiguration(controller: Server, node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_startup-config.cfg`;
    }

    return this.httpServer.post(controller, urlPath, configuration);
  }

  savePrivateConfiguration(controller: Server, node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_private-config.cfg`;
    }

    return this.httpServer.post(controller, urlPath, configuration);
  }
}
