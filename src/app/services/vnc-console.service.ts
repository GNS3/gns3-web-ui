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
   * @returns WebSocket URL (e.g., wss://host:port/v3/projects/{id}/nodes/{id}/console/vnc?token=xxx)
   */
  buildVncWebSocketUrl(controller: Controller, node: Node): string {
    // Determine protocol (ws or wss)
    const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';

    // Build WebSocket URL following GNS3 API pattern
    // Format: {protocol}://{controller.host}:{controller.port}/{version}/projects/{project_id}/nodes/{node_id}/console/vnc?token={token}
    const wsUrl = `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${node.project_id}/nodes/${node.node_id}/console/vnc?token=${controller.authToken}`;

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
      autoconnect: '1',
    });

    // Return path to standalone HTML page
    return `/assets/vnc-console/index.html?${params.toString()}`;
  }

  /**
   * Open VNC console in a new browser window/tab
   *
   * @param controller GNS3 controller
   * @param node Node with VNC console type
   * @param inNewTab If true, open in new tab; if false, open in popup window with specified size
   */
  openVncConsole(controller: Controller, node: Node, inNewTab: boolean = false) {
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
      // Build URL
      const pageUrl = this.buildVncConsolePageUrl(controller, node);

      // Parse console_resolution if available (format: "1024x768")
      // Add padding for browser chrome (title bar, borders, etc.)
      const windowPadding = 10;
      let windowWidth = 1024 + windowPadding;
      let windowHeight = 768 + windowPadding;

      if (node.properties) {
        const props = node.properties as any;
        if (props.console_resolution) {
          const resolution = props.console_resolution;
          const parts = resolution.split('x');
          if (parts.length === 2) {
            windowWidth = parseInt(parts[0], 10) + windowPadding;
            windowHeight = parseInt(parts[1], 10) + windowPadding;
          }
        }
      }

      // Open window
      let newWindow;
      if (inNewTab) {
        // Open in new tab
        newWindow = window.open(pageUrl, '_blank');
      } else {
        // Open in popup window with specified size
        const windowName = `VNC-${node.name}`;
        newWindow = window.open(pageUrl, windowName, `width=${windowWidth},height=${windowHeight}`);
      }

      // Detect if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        this.toasterService.error('Popup was blocked. Please allow popups for this site.');
      }
    } catch (error) {
      this.toasterService.error(`Failed to open VNC console: ${error.message}`);
    }
  }
}
