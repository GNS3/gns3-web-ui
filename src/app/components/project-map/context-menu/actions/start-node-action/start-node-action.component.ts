import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html',
})
export class StartNodeActionComponent implements OnInit, OnChanges {
  @Input() controller: Controller;
  @Input() nodes: Node[];
  isNodeWithStoppedStatus: boolean;

  constructor(private nodeService: NodeService, private toasterService: ToasterService) {}

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.nodes) {
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
      this.nodeService.start(this.controller, node).subscribe(
        (n: Node) => {},
        (error) => {
          this.toasterService.error(error.error.message);
        }
      );
    });
  }
}
