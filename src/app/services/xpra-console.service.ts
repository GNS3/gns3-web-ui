import { Injectable } from '@angular/core';
import { Controller } from '@models/controller';
import { Link } from '@models/link';
import { Node } from '../cartography/models/node';
import { ToasterService } from './toaster.service';

/**
 * Service for managing Xpra console connections via standalone HTML page
 */
@Injectable()
export class XpraConsoleService {
  constructor(
    private toasterService: ToasterService,
  ) {}

  /**
   * Parse WebSocket URL and extract components for xpra-html5
   *
   * @param wsUrl WebSocket URL (e.g., wss://host:port/path?token=xxx)
   * @returns Parsed components (server, port, ssl, path, token)
   */
  private parseWebSocketUrl(wsUrl: string): {
    server: string;
    port: string;
    ssl: boolean;
    path: string;
    token?: string;
  } {
    try {
      const url = new URL(wsUrl);

      // Extract protocol (ws:// or wss://)
      const ssl = url.protocol === 'wss:';

      // Extract server (hostname)
      const server = url.hostname;

      // Extract port
      const port = url.port || (ssl ? '443' : '80');

      // Extract path (remove leading slash for xpra)
      const path = url.pathname;

      // Extract token from query params
      const token = url.searchParams.get('token') || undefined;

      return { server, port, ssl, path, token };
    } catch (error) {
      this.toasterService.error(`Invalid WebSocket URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build WebSocket URL for Xpra console connection
   * Follows the same pattern as NodeConsoleService but for Xpra endpoint
   *
   * @param controller GNS3 controller
   * @param node Node with Xpra console type
   * @returns WebSocket URL (e.g., wss://host:port/v3/projects/{id}/nodes/{id}/console/xpra?token=xxx)
   */
  buildXpraWebSocketUrl(controller: Controller, node: Node): string {
    // Determine protocol (ws or wss)
    const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';

    // Build WebSocket URL following GNS3 API pattern
    // Format: {protocol}://{controller.host}:{controller.port}/{version}/projects/{project_id}/nodes/{node_id}/console/xpra?token={token}
    const wsUrl = `${protocol}://${controller.host}:${controller.port}/v3/projects/${node.project_id}/nodes/${node.node_id}/console/xpra?token=${controller.authToken}`;

    return wsUrl;
  }

  /**
   * Build URL for standalone Xpra console HTML page
   *
   * @param wsUrl Complete WebSocket URL
   * @returns URL to open in new window
   */
  buildXpraConsolePageUrl(wsUrl: string): string {
    // Parse WebSocket URL
    const { server, port, ssl } = this.parseWebSocketUrl(wsUrl);

    // Build xpra-html5 parameters
    const params = new URLSearchParams();
    params.set('server', server);
    params.set('port', port);
    params.set('ssl', ssl ? 'true' : 'false');

    // Extract the path and query string from the WebSocket URL
    // The xpra-html5 client will use this path directly when building the WebSocket URI
    const url = new URL(wsUrl);
    const fullPath = url.pathname + url.search; // includes path and query string (with token)
    params.set('path', fullPath);

    // Optional: enable features
    params.set('sound', 'true');
    params.set('clipboard', 'true');
    params.set('encoding', 'h264');

    // Return path to standalone HTML page using relative path
    return `assets/xpra-html5/index.html?${params.toString()}`;
  }

  /**
   * Build Xpra console page URL from controller and node
   *
   * @param controller GNS3 controller
   * @param node Node with Xpra console type
   * @returns URL to open in new window
   */
  buildXpraConsolePageUrlFromNode(controller: Controller, node: Node): string {
    const wsUrl = this.buildXpraWebSocketUrl(controller, node);
    return this.buildXpraConsolePageUrl(wsUrl);
  }

  /**
   * Build WebSocket URL for Web Wireshark connection on a link
   *
   * @param controller GNS3 controller
   * @param link Link to capture
   * @returns WebSocket URL (e.g., ws://host:port/v3/projects/{id}/links/{id}/capture/web-wireshark?token=xxx)
   */
  buildXpraWebSocketUrlForWebWireshark(controller: Controller, link: Link): string {
    const protocol = controller.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${controller.host}:${controller.port}/v3/projects/${link.project_id}/links/${link.link_id}/capture/web-wireshark?token=${controller.authToken}`;
  }

  /**
   * Open Xpra console in a new browser window/tab
   *
   * @param controller GNS3 controller
   * @param node Node with Xpra console type
   * @param inNewTab If true, open in new tab; if false, open in popup window with specified size
   */
  openXpraConsole(controller: Controller, node: Node, inNewTab: boolean = false) {
    // Validate node status
    if (node.status !== 'started') {
      this.toasterService.error('Node must be started before opening console');
      return;
    }

    try {
      // Build URL
      const pageUrl = this.buildXpraConsolePageUrlFromNode(controller, node);

      // Default window size for Xpra (larger than VNC)
      const windowPadding = 10;
      const windowWidth = 1280 + windowPadding;
      const windowHeight = 720 + windowPadding;

      // Open window
      let newWindow;
      if (inNewTab) {
        // Open in new tab
        newWindow = window.open(pageUrl, '_blank');
      } else {
        // Open in popup window with specified size
        const windowName = `Xpra-${node.name}`;
        newWindow = window.open(pageUrl, windowName, `width=${windowWidth},height=${windowHeight}`);
      }

      // Detect if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        this.toasterService.error('Popup was blocked. Please allow popups for this site.');
      }
    } catch (error) {
      this.toasterService.error(`Failed to open Xpra console: ${error.message}`);
    }
  }
}
