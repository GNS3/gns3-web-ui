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
  selector: 'app-start-node-action',
  templateUrl: './start-node-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartNodeActionComponent implements OnChanges {
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(ProgressService);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  isNodeWithStoppedStatus: boolean;

  ngOnChanges(changes) {
    if (changes.nodes) {
      this.isNodeWithStoppedStatus = false;
      this.nodes().forEach((node) => {
        if (node.status === 'stopped' || node.status === 'suspended') {
          this.isNodeWithStoppedStatus = true;
        }
      });
    }
  }

  startNodes() {
    const nodes = this.nodes() || [];
    if (nodes.length === 0) return;

    this.progressService.activate();
    const completion = createActionCompletion(nodes.length, (count) => {
      this.progressService.deactivate();
      if (count > 0) {
        this.toasterService.success(`${count} ${count === 1 ? 'node' : 'nodes'} started.`);
      }
    });

    nodes.forEach((node) => {
      this.nodeService.start(this.controller(), node).subscribe({
        next: () => completion.succeed(),
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to start node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
