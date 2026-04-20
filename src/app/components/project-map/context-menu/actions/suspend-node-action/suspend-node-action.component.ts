import { ChangeDetectionStrategy, Component, OnChanges, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  selector: 'app-suspend-node-action',
  templateUrl: './suspend-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspendNodeActionComponent implements OnChanges {
  private nodeService = inject(NodeService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  isNodeWithStartedStatus: boolean;

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStartedStatus = false;
      this.nodes().forEach((node) => {
        if (node.status === 'started') {
          this.isNodeWithStartedStatus = true;
        }
      });
    }
  }

  suspendNodes() {
    this.nodes().forEach((node) => {
      this.nodeService.suspend(this.controller(), node).subscribe((n: Node) => {});
    });
  }
}
