import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-suspend-node-action',
  templateUrl: './suspend-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspendNodeActionComponent implements OnChanges {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

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
      this.nodeService.suspend(this.controller(), node).subscribe({
        next: (n: Node) => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to suspend node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
