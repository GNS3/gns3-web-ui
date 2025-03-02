import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-isolate-node-action',
  templateUrl: './isolate-node-action.component.html',
})
export class IsolateNodeActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() node: Node;

  constructor(private nodeService: NodeService, private toasterService: ToasterService) {}

  ngOnInit() {}

  isolate() {
    this.nodeService.isolate(this.controller, this.node).subscribe(
        (n: Node) => {},
        (error) => {
          this.toasterService.error(error.error.message);
        }
    );
  }
}
