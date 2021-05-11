import { EventEmitter, Injectable } from '@angular/core';
import { Server } from '../models/server';
import { Subject } from 'rxjs';
import { Node } from '../cartography/models/node';
import { Router } from '@angular/router';
import { ToasterService } from './toaster.service';
import { MapSettingsService } from './mapsettings.service';
import { node } from 'prop-types';

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

  getUrl(server: Server, node: Node) {
    let protocol:string = "ws"
	  if (server.protocol === "https:") {
		  protocol = "wss"
	  }

    return `${protocol}://${server.host}:${server.port}/v2/projects/${node.project_id}/nodes/${node.node_id}/console/ws`
  }

  openConsolesForAllNodesInWidget(nodes: Node[]) {
    let nodesToStart = 'Please start the following nodes if you want to open consoles for them: ';
    let nodesToStartCounter = 0;
    nodes.forEach((n) => {
      if (n.status === 'started') {
        this.mapSettingsService.logConsoleSubject.next(true);
        // this timeout is required due to xterm.js implementation
        setTimeout(() => { this.openConsoleForNode(n); }, 500);
      } else {
        nodesToStartCounter++;
        nodesToStart += n.name + ' '
      }
    });
    if (nodesToStartCounter > 0) {
      this.toasterService.error(nodesToStart);
    }
  }

  openConsolesForAllNodesInNewTabs(nodes: Node[]) {
    let nodesToStart = 'Please start the following nodes if you want to open consoles for them: ';
    let nodesToStartCounter = 0;
    nodes.forEach((n) => {
      if (n.status === 'started') {
        let url = this.router.url.split('/');
        let urlString = `/static/web-ui/${url[1]}/${url[2]}/${url[3]}/${url[4]}/nodes/${n.node_id}`;
        window.open(urlString);
      } else {
        nodesToStartCounter++;
        nodesToStart += n.name + ' '
      }
    });
    if (nodesToStartCounter > 0) {
      this.toasterService.error(nodesToStart);
    }
  }
}

export interface ConsoleResizedEvent {
  width: number;
  height: number;
}
