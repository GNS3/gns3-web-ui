import { Component, Input, OnInit } from '@angular/core';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';

@Component({
  selector: 'app-http-console-new-tab-action',
  templateUrl: './http-console-new-tab-action.component.html',
})
export class HttpConsoleNewTabActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];

  constructor(private nodeConsoleService: NodeConsoleService) {}

  ngOnInit() {}

  openConsole() {
    this.nodeConsoleService.openConsolesForAllNodesInNewTabs(this.nodes);
  }
}
