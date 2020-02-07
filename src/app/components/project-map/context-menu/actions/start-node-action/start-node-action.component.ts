import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html'
})
export class StartNodeActionComponent implements OnInit, OnChanges {
  @Input() server: Server;
  @Input() nodes: Node[];
  isNodeWithStoppedStatus: boolean;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
  }

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStoppedStatus = false;
      this.nodes.forEach((node) => {
        if (node.status === 'stopped') {
          this.isNodeWithStoppedStatus = true;
        }
      });
    }
  }

  startNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.start(this.server, node).subscribe((n: Node) => {});
    });
  }
}
