import { Injectable, EventEmitter } from '@angular/core';
import { Node } from '../cartography/models/node';

@Injectable()
export class NodeConsoleService {
  public nodeConsoleTrigger = new EventEmitter<Node>();

  constructor() {}

  openConsoleForNode(node: Node) {
    this.nodeConsoleTrigger.emit(node);
  }
}
