import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { NodeService } from '../../../../../services/node.service';
import { Node } from '../../../../../cartography/models/node';

@Component({
  selector: 'app-reload-node-action',
  templateUrl: './reload-node-action.component.html'
})
export class ReloadNodeActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];

  filteredNodes: Node[] = [];

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.nodes.forEach((node) => {
        if (node.node_type === 'vpcs' || node.node_type === 'qemu' || node.node_type === 'virtualbox' || node.node_type === 'vmware') {
          this.filteredNodes.push(node);
        }
    });
  }

  reloadNodes() {
    this.filteredNodes.forEach((node) => {
        this.nodeService.reload(this.server, node).subscribe((n: Node) => {});
    });
  }
}
