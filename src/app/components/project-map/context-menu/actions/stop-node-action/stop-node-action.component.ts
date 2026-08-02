import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { ProgressService } from '../../../../../common/progress/progress.service';
import { createActionCompletion } from '@utils/action-completion.util';

@Component({
  selector: 'app-stop-node-action',
  templateUrl: './stop-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopNodeActionComponent implements OnChanges {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(ProgressService);

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

  stopNodes() {
    const nodes = this.nodes() || [];
    if (nodes.length === 0) return;

    this.progressService.activate();
    const completion = createActionCompletion(nodes.length, (count) => {
      this.progressService.deactivate();
      if (count > 0) {
        this.toasterService.success(`${count} ${count === 1 ? 'node' : 'nodes'} stopped.`);
      }
    });

    nodes.forEach((node) => {
      this.nodeService.stop(this.controller(), node).subscribe({
        next: () => completion.succeed(),
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to stop node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
