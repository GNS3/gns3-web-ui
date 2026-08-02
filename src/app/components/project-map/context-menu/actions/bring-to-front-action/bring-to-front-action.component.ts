import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { createActionCompletion } from '@utils/action-completion.util';

@Component({
  selector: 'app-bring-to-front-action',
  templateUrl: './bring-to-front-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BringToFrontActionComponent {
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>([]);
  readonly drawings = input<Drawing[]>([]);

  bringToFront() {
    const operationCount = this.nodes().length + this.drawings().length;
    if (operationCount === 0) return;

    let maxZValueForNodes = Math.max(...this.nodes().map((n) => n.z));
    let maxZValueForDrawings = Math.max(...this.drawings().map((n) => n.z));
    let maxZValue = Math.max(maxZValueForNodes, maxZValueForDrawings);
    if (maxZValue < 100) maxZValue++;
    const completion = createActionCompletion(operationCount, (count) => {
      if (count > 0) this.toasterService.success('Selection brought to front.', { showToast: false });
    });

    this.nodes().forEach((node) => {
      node.z = maxZValue;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller(), node).subscribe({
        next: () => {
          completion.succeed();
          this.cdr.markForCheck();
        },
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to bring node to front';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });

    this.drawings().forEach((drawing) => {
      drawing.z = maxZValue;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.controller(), drawing).subscribe({
        next: () => {
          completion.succeed();
          this.cdr.markForCheck();
        },
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to bring drawing to front';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
