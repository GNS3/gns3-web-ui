import { Component, Input, OnInit } from '@angular/core';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-reload-node-action',
  templateUrl: './reload-node-action.component.html',
})
export class ReloadNodeActionComponent implements OnInit {
  @Input() controller:Controller ;
  @Input() nodes: Node[];

  filteredNodes: Node[] = [];

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.nodes.forEach((node) => {
      if (
        node.node_type === 'vpcs' ||
        node.node_type === 'qemu' ||
        node.node_type === 'virtualbox' ||
        node.node_type === 'vmware'
      ) {
        this.filteredNodes.push(node);
      }
    });
  }

  reloadNodes() {
    this.filteredNodes.forEach((node) => {
      this.nodeService.reload(this.controller, node).subscribe((n: Node) => {});
    });
  }
}
