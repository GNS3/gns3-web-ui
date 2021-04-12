import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';

@Component({
  selector: 'app-suspend-node-action',
  templateUrl: './suspend-node-action.component.html',
})
export class SuspendNodeActionComponent implements OnInit, OnChanges {
  @Input() server: Server;
  @Input() nodes: Node[];
  isNodeWithStartedStatus: boolean;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStartedStatus = false;
      this.nodes.forEach((node) => {
        if (node.status === 'started') {
          this.isNodeWithStartedStatus = true;
        }
      });
    }
  }

  suspendNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.suspend(this.server, node).subscribe((n: Node) => {});
    });
  }
}
