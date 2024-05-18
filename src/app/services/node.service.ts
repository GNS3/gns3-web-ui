import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { Label } from '../cartography/models/label';
import { Node } from '../cartography/models/node';
import { Project } from '../models/project';
import { Controller } from '../models/controller';
import { Template } from '../models/template';
import { HttpController } from './http-controller.service';

@Injectable()
export class NodeService {
  constructor(private httpController: HttpController) {}

  getNodeById(controller:Controller , projectId: string, nodeId: string) {
    return this.httpController.get(controller, `/projects/${projectId}/nodes/${nodeId}`);
  }

  isolate(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/isolate`, {});
  }

  unisolate(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/unisolate`, {});
  }

  start(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {});
  }

  startAll(controller:Controller , project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/start`, {});
  }

  stop(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {});
  }

  stopAll(controller:Controller , project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/stop`, {});
  }

  suspend(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/suspend`, {});
  }

  suspendAll(controller:Controller , project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/suspend`, {});
  }

  reload(controller:Controller , node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/reload`, {});
  }

  reloadAll(controller:Controller , project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/reload`, {});
  }
  resetAllNodes(controller:Controller , project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/console/reset`, {});
  }

  createFromTemplate(
    controller:Controller ,
    project: Project,
    template: Template,
    x: number,
    y: number,
    compute_id: string
  ): Observable<Node> {
    if (!compute_id) {
      return this.httpController.post(controller, `/projects/${project.project_id}/templates/${template.template_id}`, {
        x: Math.round(x),
        y: Math.round(y),
        compute_id: 'local',
      });
    }
    return this.httpController.post(controller, `/projects/${project.project_id}/templates/${template.template_id}`, {
      x: Math.round(x),
      y: Math.round(y),
      compute_id: compute_id,
    });
  }

  updatePosition(controller:Controller , project: Project, node: Node, x: number, y: number): Observable<Node> {
    let xPosition: number = Math.round(x);
    let yPosition: number = Math.round(y);

    if (project.snap_to_grid) {
      xPosition = Math.round((xPosition + node.width / 2) / project.grid_size) * project.grid_size;
      yPosition = Math.round((yPosition + node.height / 2) / project.grid_size) * project.grid_size;

      xPosition = Math.round(xPosition - node.width / 2);
      yPosition = Math.round(yPosition - node.height / 2);
    }

    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: xPosition,
      y: yPosition,
    });
  }

  updateLabel(controller:Controller , node: Node, label: Label): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      label: {
        rotation: label.rotation,
        style: label.style,
        text: label.text,
        x: Math.round(label.x),
        y: Math.round(label.y),
      },
    });
  }

  updateSymbol(controller:Controller , node: Node, changedSymbol: string): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      symbol: changedSymbol,
    });
  }

  update(controller:Controller , node: Node): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: Math.round(node.x),
      y: Math.round(node.y),
      z: node.z,
    });
  }

  updateNode(controller:Controller , node: Node): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      console_auto_start: node.console_auto_start,
      locked: node.locked,
      name: node.name,
      properties: node.properties,
    });
  }

  updateNodeWithCustomAdapters(controller:Controller , node: Node): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      console_auto_start: node.console_auto_start,
      custom_adapters: node.custom_adapters,
      name: node.name,
      properties: node.properties,
    });
  }

  delete(controller:Controller , node: Node) {
    return this.httpController.delete<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  duplicate(controller:Controller , node: Node) {
    return this.httpController.post(controller, `/projects/${node.project_id}/nodes/${node.node_id}/duplicate`, {
      x: node.x + 10,
      y: node.y + 10,
      z: node.z,
    });
  }

  getNode(controller:Controller , node: Node) {
    return this.httpController.get(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  getDefaultCommand(): string {
    return `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
  }

  getNetworkConfiguration(controller:Controller , node: Node) {
    return this.httpController.get(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      { responseType: 'text' as 'json' }
    );
  }

  saveNetworkConfiguration(controller:Controller , node: Node, configuration: string) {
    return this.httpController.post(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      configuration
    );
  }

  getStartupConfiguration(controller:Controller , node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_startup-config.cfg`;
    }

    return this.httpController.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  getPrivateConfiguration(controller:Controller , node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_private-config.cfg`;
    }

    return this.httpController.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  saveConfiguration(controller:Controller , node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_startup-config.cfg`;
    }

    return this.httpController.post(controller, urlPath, configuration);
  }

  savePrivateConfiguration(controller:Controller , node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.node_id}_private-config.cfg`;
    }

    return this.httpController.post(controller, urlPath, configuration);
  }
}
