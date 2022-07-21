import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-stop-node-action',
  templateUrl: './stop-node-action.component.html',
})
export class StopNodeActionComponent implements OnInit, OnChanges {
  @Input() controller:Controller ;
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

  stopNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.stop(this.controller, node).subscribe((n: Node) => {});
    });
  }
}
