import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { Node } from '../cartography/models/node';
import { ToasterService } from './toaster.service';
import { environment } from 'environments/environment';

/**
 * Service for managing VNC console connections via standalone HTML page
 */
@Injectable()
export class VncConsoleService {
  constructor(private toasterService: ToasterService) {}

  /**
   * Build WebSocket URL for VNC console connection
   * Follows the same pattern as NodeConsoleService.getUrl() but for VNC endpoint
   *
   * @param controller GNS3 controller
   * @param node Node with VNC console type
   * @returns WebSocket URL (e.g., wss://host:port/v3/controller/projects/{id}/qemu/nodes/{id}/console/vnc?ticket=xxx)
   */
  buildVncWebSocketUrl(controller: Controller, node: Node): string {
    // Determine protocol (ws or wss)
    const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';

    // Build WebSocket URL following GNS3 API pattern
    // Format: {protocol}://{controller.host}:{controller.port}/{version}/controller/projects/{project_id}/{node_type}/nodes/{node_id}/console/vnc?ticket={token}
    const wsUrl = `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/controller/projects/${node.project_id}/${node.node_type}/nodes/${node.node_id}/console/vnc?ticket=${controller.authToken}`;

    return wsUrl;
  }

  /**
   * Build URL for standalone VNC console HTML page
   *
   * @param controller GNS3 controller
   * @param node Node with VNC console type
   * @returns URL to open in new window
   */
  buildVncConsolePageUrl(controller: Controller, node: Node): string {
    // Get WebSocket URL (already includes token)
    const wsUrl = this.buildVncWebSocketUrl(controller, node);

    // Build page parameters
    const params = new URLSearchParams({
      ws_url: wsUrl,
      node_name: node.name,
      node_id: node.node_id,
      project_id: node.project_id,
      autoconnect: '1'
    });

    // Return path to standalone HTML page
    return `/assets/vnc-console/index.html?${params.toString()}`;
  }

  /**
   * Open VNC console in a new browser window/tab
   *
   * @param controller GNS3 controller
   * @param node Node with VNC console type
   */
  openVncConsole(controller: Controller, node: Node) {
    // Validate node status
    if (node.status !== 'started') {
      this.toasterService.error('Node must be started before opening console');
      return;
    }

    // Validate console type
    if (node.console_type !== 'vnc') {
      this.toasterService.error(`Node console type is ${node.console_type}, not vnc`);
      return;
    }

    try {
      // Build and open URL
      const pageUrl = this.buildVncConsolePageUrl(controller, node);
      const newWindow = window.open(pageUrl, '_blank');

      // Detect if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        this.toasterService.error('Popup was blocked. Please allow popups for this site.');
      }
    } catch (error) {
      this.toasterService.error(`Failed to open VNC console: ${error.message}`);
    }
  }
}
