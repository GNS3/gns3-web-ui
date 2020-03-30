import { Injectable, EventEmitter } from '@angular/core';
import { Node } from '../cartography/models/node';
import { Subject } from 'rxjs';

@Injectable()
export class NodeConsoleService {
  public nodeConsoleTrigger = new EventEmitter<Node>();
  public closeNodeConsoleTrigger = new Subject<Node>();
  public consoleResized = new Subject<boolean>();

  constructor() {}

  openConsoleForNode(node: Node) {
    this.nodeConsoleTrigger.emit(node);
  }

  closeConsoleForNode(node: Node) {
    this.closeNodeConsoleTrigger.next(node);
  }

  resizeTerminal() {
    this.consoleResized.next(true);
  }
}
