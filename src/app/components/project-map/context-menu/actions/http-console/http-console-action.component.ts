import { Component, OnInit, Input } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeConsoleService } from '../../../../../services/nodeConsole.service';
import { ToasterService } from '../../../../../services/toaster.service';


@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html'
})
export class HttpConsoleActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  constructor(
    private consoleService: NodeConsoleService,
    private toasterService: ToasterService
  ) { }

  ngOnInit() {}

  openConsole() {
    this.nodes.forEach(n => {
      if (n.status === 'started') {
        this.consoleService.openConsoleForNode(n);
      } else {
        this.toasterService.error('To open console please start the node');
      }
    });
  }
}
