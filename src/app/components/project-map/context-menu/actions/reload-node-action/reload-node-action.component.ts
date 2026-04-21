import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-reload-node-action',
  templateUrl: './reload-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReloadNodeActionComponent implements OnInit {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

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
      this.nodeService.reload(this.controller(), node).subscribe({
        next: (n: Node) => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to reload node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
