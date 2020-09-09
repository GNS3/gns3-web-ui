import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html'
})
export class StartNodeActionComponent implements OnInit, OnChanges {
  @Input() server: Server;
  @Input() nodes: Node[];
  isNodeWithStoppedStatus: boolean;

  constructor(
    private nodeService: NodeService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
  }

  ngOnChanges(changes) {
    if(changes.nodes) {
      this.isNodeWithStoppedStatus = false;
      this.nodes.forEach((node) => {
        if (node.status === 'stopped' || node.status === 'suspended') {
          this.isNodeWithStoppedStatus = true;
        }
      });
    }
  }

  startNodes() {
    this.nodes.forEach((node) => {
      this.nodeService.start(this.server, node).subscribe(
        (n: Node) => {},
        error => {
          this.toasterService.error(error.error.message)
        }
      );
    });
  }
}
