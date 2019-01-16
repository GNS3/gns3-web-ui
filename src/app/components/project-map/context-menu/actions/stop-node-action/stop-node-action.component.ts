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
  @Input() nodes: Node[];
  private isNodeWithStartedStatus: boolean;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.nodes.forEach((node) => {
      if (node.status === 'started') {
        this.isNodeWithStartedStatus = true;
      }
    });
  }

  stopNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.stop(this.server, node).subscribe((n: Node) => {});
    });
  }
}
