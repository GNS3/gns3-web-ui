import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Label } from '../cartography/models/label';
import { Node } from '../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { Template } from '@models/template';
import { HttpController } from './http-controller.service';
import { environment } from 'environments/environment';

@Injectable()
export class NodeService {
  constructor(
    private httpController: HttpController,
    private http: HttpClient
  ) {}

  getNodeById(controller: Controller, projectId: string, nodeId: string) {
    return this.httpController.get(controller, `/projects/${projectId}/nodes/${nodeId}`);
  }

  isolate(controller: Controller, node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/isolate`, {});
  }

  unisolate(controller: Controller, node: Node) {
    return this.httpController.post<Node>(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/unisolate`,
      {}
    );
  }

  start(controller: Controller, node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/start`, {});
  }

  startAll(controller: Controller, project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/start`, {});
  }

  stop(controller: Controller, node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/stop`, {});
  }

  stopAll(controller: Controller, project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/stop`, {});
  }

  suspend(controller: Controller, node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/suspend`, {});
  }

  suspendAll(controller: Controller, project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/suspend`, {});
  }

  reload(controller: Controller, node: Node) {
    return this.httpController.post<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}/reload`, {});
  }

  reloadAll(controller: Controller, project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/reload`, {});
  }
  resetAllNodes(controller: Controller, project: Project) {
    return this.httpController.post(controller, `/projects/${project.project_id}/nodes/console/reset`, {});
  }

  createFromTemplate(
    controller: Controller,
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

  updatePosition(controller: Controller, project: Project, node: Node, x: number, y: number): Observable<Node> {
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

  updateLabel(controller: Controller, node: Node, label: Label): Observable<Node> {
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

  updateSymbol(controller: Controller, node: Node, changedSymbol: string): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      symbol: changedSymbol,
    });
  }

  update(controller: Controller, node: Node): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      x: Math.round(node.x),
      y: Math.round(node.y),
      z: node.z,
    });
  }

  updateNode(controller: Controller, node: Node): Observable<Node> {
    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      aux_type: node.aux_type,
      console_auto_start: node.console_auto_start,
      locked: node.locked,
      name: node.name,
      properties: node.properties,
      tags: node.tags,
      netmiko_device_type: node.netmiko_device_type,
      default_username: node.default_username,
      default_password: node.default_password,
    });
  }

  updateNodeWithCustomAdapters(controller: Controller, node: Node): Observable<Node> {
    // Filter out null values from custom_adapters for QEMU nodes
    const filtered_custom_adapters = node.custom_adapters
      ? node.custom_adapters.map((adapter) => {
          const filteredAdapter: any = {
            adapter_number: adapter.adapter_number,
            adapter_type: adapter.adapter_type,
          };

          // Only include port_name if it's not null
          if (adapter.port_name !== null && adapter.port_name !== undefined) {
            filteredAdapter.port_name = adapter.port_name;
          }

          // Only include mac_address if it's not null
          if (adapter.mac_address !== null && adapter.mac_address !== undefined) {
            filteredAdapter.mac_address = adapter.mac_address;
          }

          return filteredAdapter;
        })
      : [];

    return this.httpController.put<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`, {
      console_type: node.console_type,
      aux_type: node.aux_type,
      console_auto_start: node.console_auto_start,
      custom_adapters: filtered_custom_adapters,
      name: node.name,
      properties: node.properties,
      tags: node.tags,
      netmiko_device_type: node.netmiko_device_type,
      default_username: node.default_username,
      default_password: node.default_password,
    });
  }

  delete(controller: Controller, node: Node) {
    return this.httpController.delete<Node>(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  duplicate(controller: Controller, node: Node) {
    return this.httpController.post(controller, `/projects/${node.project_id}/nodes/${node.node_id}/duplicate`, {
      x: node.x + 10,
      y: node.y + 10,
      z: node.z,
    });
  }

  getNode(controller: Controller, node: Node) {
    return this.httpController.get(controller, `/projects/${node.project_id}/nodes/${node.node_id}`);
  }

  getDefaultCommand(): string {
    return `putty.exe -telnet \%h \%p -wt \"\%d\" -gns3 5 -skin 4`;
  }

  uploadNodeFile(controller: Controller, projectId: string, nodeId: string, filePath: string, file: File): Observable<any> {
    return this.httpController.post(controller, `/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`, file);
  }

  uploadNodeFileWithProgress(controller: Controller, projectId: string, nodeId: string, filePath: string, file: File): Observable<number> {
    const protocol = controller.protocol || (location.protocol as any);
    const url = `${protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`;
    const headers: any = {};

    if (controller.authToken && !controller.tokenExpired) {
      headers['Authorization'] = `Bearer ${controller.authToken}`;
    }

    return this.http.post(url, file, {
      headers,
      reportProgress: true,
      observe: 'events',
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          return Math.round(100 * event.loaded / (event.total || 1));
        }
        if (event.type === HttpEventType.Response) {
          return 100;
        }
        return 0;
      }),
      catchError((err) => {
        const message = err.error?.message || err.message || 'Failed to upload file';
        return throwError(() => new Error(message));
      })
    );
  }

  getNodeFiles(controller: Controller, projectId: string, nodeId: string, path?: string): Observable<any[]> {
    const base = `/projects/${projectId}/nodes/${nodeId}/files`;
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.httpController.get(controller, `${base}${params}`);
  }

  getNodeFilesRecursive(controller: Controller, projectId: string, nodeId: string): Observable<any[]> {
    return this.httpController.get(controller, `/projects/${projectId}/nodes/${nodeId}/files?recursive=true`);
  }

  deleteNodeFile(controller: Controller, projectId: string, nodeId: string, filePath: string): Observable<any> {
    return this.httpController.delete(controller, `/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`);
  }

  getNodeFileContent(controller: Controller, projectId: string, nodeId: string, filePath: string): Observable<string> {
    return this.httpController.get(controller, `/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`, {
      responseType: 'text' as 'json',
    });
  }

  saveNodeFileContent(controller: Controller, projectId: string, nodeId: string, filePath: string, content: string): Observable<any> {
    return this.httpController.post(controller, `/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`, content);
  }

  downloadNodeFile(controller: Controller, projectId: string, nodeId: string, filePath: string): Observable<Blob> {
    return this.httpController.getBlob(controller, `/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`);
  }

  async streamNodeFileToFile(controller: Controller, projectId: string, nodeId: string, filePath: string, fileHandle: any, onProgress?: (downloaded: number) => void): Promise<void> {
    const protocol = controller.protocol || (location.protocol as any);
    const url = `${protocol}//${controller.host}:${controller.port}/${environment.current_version}/projects/${projectId}/nodes/${nodeId}/files/${encodeURIComponent(filePath)}`;
    const headers: Record<string, string> = {};

    if (controller.authToken && !controller.tokenExpired) {
      headers['Authorization'] = `Bearer ${controller.authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const writable = await fileHandle.createWritable();
    let downloaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
        downloaded += value.length;
        onProgress?.(downloaded);
      }
    } finally {
      await writable.close();
    }
  }

  getNetworkConfiguration(controller: Controller, node: Node) {
    return this.httpController.get(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      { responseType: 'text' as 'json' }
    );
  }

  saveNetworkConfiguration(controller: Controller, node: Node, configuration: string) {
    return this.httpController.post(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/files/etc/network/interfaces`,
      configuration
    );
  }

  getStartupConfiguration(controller: Controller, node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.properties.dynamips_id}_startup-config.cfg`;
    }

    return this.httpController.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  getPrivateConfiguration(controller: Controller, node: Node) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.properties.dynamips_id}_private-config.cfg`;
    }

    return this.httpController.get(controller, urlPath, { responseType: 'text' as 'json' });
  }

  saveConfiguration(controller: Controller, node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'vpcs') {
      urlPath += '/files/startup.vpc';
    } else if (node.node_type === 'iou') {
      urlPath += '/files/startup-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.properties.dynamips_id}_startup-config.cfg`;
    }

    return this.httpController.post(controller, urlPath, configuration);
  }

  savePrivateConfiguration(controller: Controller, node: Node, configuration: string) {
    let urlPath: string = `/projects/${node.project_id}/nodes/${node.node_id}`;

    if (node.node_type === 'iou') {
      urlPath += '/files/private-config.cfg';
    } else if (node.node_type === 'dynamips') {
      urlPath += `/files/configs/i${node.properties.dynamips_id}_private-config.cfg`;
    }

    return this.httpController.post(controller, urlPath, configuration);
  }

  getIdlePCProposals(controller: Controller, node: Node) {
    return this.httpController.get(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/dynamips/idlepc_proposals`
    );
  }

  getAutoIdlePC(controller: Controller, node: Node) {
    return this.httpController.get(
      controller,
      `/projects/${node.project_id}/nodes/${node.node_id}/dynamips/auto_idlepc`
    );
  }
}
