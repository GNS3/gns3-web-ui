import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-duplicate-action',
  templateUrl: './duplicate-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateActionComponent {
  private nodeService = inject(NodeService);
  private nodesDataSource = inject(NodesDataSource);
  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly drawings = input<Drawing[]>([]);
  readonly nodes = input<Node[]>([]);

  duplicate() {
    for (let node of this.nodes()) {
      this.nodeService.duplicate(this.controller(), node).subscribe({
        next: (node: Node) => {
          this.nodesDataSource.add(node);
        },
        error: (err) => {
          if (err.status === 409) {
            this.toasterService.error(`Shutdown ${node.name} before duplicating`);
          } else {
            const message = err.error?.message || err.message || 'Failed to duplicate node';
            this.toasterService.error(message);
          }
          this.cdr.markForCheck();
        },
      });
    }

    for (let drawing of this.drawings()) {
      this.drawingService.duplicate(this.controller(), drawing.project_id, drawing).subscribe({
        next: (drawing: Drawing) => {
          this.drawingsDataSource.add(drawing);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to duplicate drawing';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }
  }
}
