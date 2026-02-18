import { Component, Input, OnInit } from '@angular/core';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-http-vnc-console-new-tab-action',
  templateUrl: './http-vnc-console-new-tab-action.component.html',
})
export class HttpVNCConsoleNewTabActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];

  constructor(private nodeConsoleService: NodeConsoleService) {}

  ngOnInit() {}

  openVNCConsole() {
    this.nodeConsoleService.openVncConsolesForAllNodesInNewTabs(this.nodes, this.controller);
  }
}
