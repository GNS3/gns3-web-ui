import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeConsoleService } from '@services/nodeConsole.service';

@Component({
  selector: 'app-http-console-action',
  templateUrl: './http-console-action.component.html',
})
export class HttpConsoleActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];

  constructor(private nodeConsoleService: NodeConsoleService) {}

  ngOnInit() {}

  openConsole() {
    this.nodeConsoleService.openConsolesForAllNodesInWidget(this.nodes);
  }
}
