import { Component, Input, OnInit } from '@angular/core';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';

@Component({
  selector: 'app-stop-node-action',
  templateUrl: './stop-node-action.component.html'
})
export class StopNodeActionComponent implements OnInit {
  @Input() server: Server;
  @Input() node: Node;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {}

  stopNode() {
    this.nodeService.stop(this.server, this.node).subscribe((n: Node) => {});
  }
}
