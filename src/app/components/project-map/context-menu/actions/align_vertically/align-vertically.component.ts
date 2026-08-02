import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { createActionCompletion } from '@utils/action-completion.util';

@Component({
  selector: 'app-align-vertically-action',
  templateUrl: './align-vertically.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignVerticallyActionComponent {
  private nodesDataSource = inject(NodesDataSource);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);

  alignVertically() {
    const nodes = this.nodes() || [];
    if (nodes.length === 0) return;

    let averageX: number = 0;
    nodes.forEach((node) => {
      averageX += node.x;
    });
    averageX = averageX / nodes.length;
    const completion = createActionCompletion(nodes.length, (count) => {
      if (count > 0) this.toasterService.success('Nodes aligned vertically.', { showToast: false });
    });

    nodes.forEach((node) => {
      node.x = averageX;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller(), node).subscribe({
        next: () => {
          completion.succeed();
          this.cdr.markForCheck();
        },
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to align node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
