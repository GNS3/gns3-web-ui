import { EventEmitter,Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Controller } from '@models/controller';
//import { node } from 'prop-types';
import { environment } from 'environments/environment';
import { Subject } from 'rxjs';
import { Node } from '../cartography/models/node';
import { MapSettingsService } from './mapsettings.service';
import { ToasterService } from './toaster.service';

@Injectable()
export class NodeConsoleService {
  public nodeConsoleTrigger = new EventEmitter<Node>();
  public closeNodeConsoleTrigger = new Subject<Node>();
  public consoleResized = new Subject<ConsoleResizedEvent>();
  public openConsoles: number = 0;

  public readonly defaultConsoleWidth = 720;
  public readonly defaultConsoleHeight = 408;

  public readonly defaultNumberOfColumns = 80;
  public readonly defaultNumberOfRows = 24;

  private lastNumberOfColumns: number;
  private lastNumberOfRows: number;

  constructor(
    private router: Router,
    private toasterService: ToasterService,
    private mapSettingsService: MapSettingsService
  ) {}

  getNumberOfColumns() {
    return this.lastNumberOfColumns;
  }

  getNumberOfRows() {
    return this.lastNumberOfRows;
  }

  setNumberOfColumns(value: number) {
    this.lastNumberOfColumns = value;
  }

  setNumberOfRows(value: number) {
    this.lastNumberOfRows = value;
  }

  openConsoleForNode(node: Node) {
    this.nodeConsoleTrigger.emit(node);
  }

  closeConsoleForNode(node: Node) {
    this.closeNodeConsoleTrigger.next(node);
  }

  resizeTerminal(event: ConsoleResizedEvent) {
    this.consoleResized.next(event);
  }

  getLineWidth() {
    return this.defaultConsoleWidth / this.defaultNumberOfColumns;
  }

  getLineHeight() {
    return this.defaultConsoleHeight / this.defaultNumberOfRows;
  }

  getUrl(controller: Controller, node: Node) {
    let protocol:string = "ws"
	  if (controller.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${node.project_id}/nodes/${node.node_id}/console/ws?token=${controller.authToken}`
  }

  openConsolesForAllNodesInWidget(nodes: Node[]) {
    let nodesToStart = 'Please start the following nodes if you want to open consoles for them: ';
    let nodesToStartCounter = 0;
    nodes.forEach((n) => {
      if (n.console_type !== "none") {
        if (n.status === 'started') {
          this.mapSettingsService.logConsoleSubject.next(true);
          // this timeout is required due to xterm.js implementation
          setTimeout(() => { this.openConsoleForNode(n); }, 500);
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' '
        }
      }
    });
    if (nodesToStartCounter > 0) {
      this.toasterService.error(nodesToStart);
    }
  }

  openConsolesForAllNodesInNewTabs(nodes: Node[]) {
    let nodesToStart = 'Please start the following nodes if you want to open consoles in tabs for them: ';
    let nodesToStartCounter = 0;
    nodes.forEach((n) => {
      // opening a console in tab is only supported for telnet type
      if (n.console_type === "telnet") {
        if (n.status === 'started') {
          let url = this.router.url.split('/');
          let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${n.node_id}`;
          window.open(urlString);
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' '
        }
      }
    });
    if (nodesToStartCounter > 0) {
      this.toasterService.error(nodesToStart);
    }
  }

  openVncConsolesForAllNodesInNewTabs(nodes: Node[], controller?: Controller) {
    let nodesToStart = 'Please start the following VNC nodes if you want to open consoles in tabs for them: ';
    let nodesToStartCounter = 0;
    let openedTabsCounter = 0;
    let supportedNodesCounter = 0;

    nodes.forEach((n) => {
      if (n.console_type === 'vnc') {
        supportedNodesCounter++;

        if (n.status === 'started' || n.status === 'running') {
          if (controller) {
            // Use controller information to build websocket URL
            // Protocol: http/https -> ws/wss
            let protocol = 'ws';
            if (controller.protocol === 'https:') {
              protocol = 'wss';
            }

            // Build path with controller host, port, and authentication token
            let path = `${protocol}://${controller.host}:${controller.port}/${environment.current_version}/projects/${n.project_id}/nodes/${n.node_id}/console/vnc`;

            // Add authentication token if available
            if (controller.authToken) {
              path += `?token=${encodeURIComponent(controller.authToken)}`;
            }

            const urlString = `/static/web-ui/novnc/vnc.html?path=${encodeURIComponent(path)}`;
            const newWindow = window.open(urlString, '_blank');
            if (newWindow) {
              openedTabsCounter++;
            }
          } else {
            this.toasterService.error('Controller information is required to open VNC console.');
          }
        } else {
          nodesToStartCounter++;
          nodesToStart += n.name + ' ';
        }
      }
    });

    if (supportedNodesCounter === 0) {
      this.toasterService.error('Selected nodes do not have a VNC console.');
      return;
    }

    if (nodesToStartCounter > 0) {
      this.toasterService.error(nodesToStart);
    }

    if (openedTabsCounter === 0 && nodesToStartCounter === 0) {
      this.toasterService.error('Unable to open a new VNC tab (popup was probably blocked by the browser).');
    }
  }
}

export interface ConsoleResizedEvent {
  width: number;
  height: number;
}
