import { EventEmitter, Injectable } from '@angular/core';
import { Server } from '../models/server';
import { Subject } from 'rxjs';
import { Node } from '../cartography/models/node';

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

  constructor() {}

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

    return `${protocol}://${server.host}:${server.port}/v3/projects/${node.project_id}/nodes/${node.node_id}/console/ws`
  }
}

export interface ConsoleResizedEvent {
  width: number;
  height: number;
}
