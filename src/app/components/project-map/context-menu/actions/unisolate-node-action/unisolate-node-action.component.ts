import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-unisolate-node-action',
  templateUrl: './unisolate-node-action.component.html',
})
export class UnisolateNodeActionComponent implements OnInit {
  @Input() controller: Server;
  @Input() node: Node;

  constructor(private nodeService: NodeService, private toasterService: ToasterService) {}

  ngOnInit() {}

  unisolate() {
    this.nodeService.unisolate(this.controller, this.node).subscribe(
        (n: Node) => {},
        (error) => {
          this.toasterService.error(error.error.message);
        }
    );
  }
}
