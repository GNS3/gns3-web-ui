import { Component, Input, OnInit } from '@angular/core';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';

@Component({
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html'
})
export class StartNodeActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {}

  startNode() {
    this.nodeService.start(this.server, this.node).subscribe((n: Node) => {});
  }
}
