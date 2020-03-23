import { Component, OnInit, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeConsoleService } from '../../../../../services/nodeConsole.service';


@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html'
})
export class HttpConsoleActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private consoleService: NodeConsoleService
  ) { }

  ngOnInit() {}

  openConsole() {
    this.consoleService.openConsoleForNode(this.nodes[0]);
  }
}
