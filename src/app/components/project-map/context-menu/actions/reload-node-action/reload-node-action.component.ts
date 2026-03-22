import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  selector: 'app-reload-node-action',
  templateUrl: './reload-node-action.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReloadNodeActionComponent implements OnInit {
  private nodeService = inject(NodeService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);

  filteredNodes: Node[] = [];

  ngOnInit() {
    this.nodes().forEach((node) => {
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
      this.nodeService.reload(this.controller(), node).subscribe((n: Node) => {});
    });
  }
}
