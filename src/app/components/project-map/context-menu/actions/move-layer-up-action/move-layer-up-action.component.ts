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

@Component({
  selector: 'app-move-layer-up-action',
  templateUrl: './move-layer-up-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveLayerUpActionComponent {
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>(undefined);
  readonly drawings = input<Drawing[]>(undefined);

  moveLayerUp() {
    this.nodes().forEach((node) => {
      node.z++;
      this.nodesDataSource.update(node);

      this.nodeService.update(this.controller(), node).subscribe({
        next: (node: Node) => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to move layer up';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });

    this.drawings().forEach((drawing) => {
      drawing.z++;
      this.drawingsDataSource.update(drawing);

      this.drawingService.update(this.controller(), drawing).subscribe({
        next: (drawing: Drawing) => {},
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to move layer up';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
