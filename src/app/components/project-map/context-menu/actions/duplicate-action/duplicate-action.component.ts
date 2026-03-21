import { ChangeDetectionStrategy, Component, Input, inject, input, signal } from '@angular/core';
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
  standalone: true,
  selector: 'app-duplicate-action',
  templateUrl: './duplicate-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  // TODO: This component has been partially migrated to be zoneless-compatible.
  // After testing, this should be updated to ChangeDetectionStrategy.OnPush.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DuplicateActionComponent {
  private nodeService = inject(NodeService);
  private nodesDataSource = inject(NodesDataSource);
  private drawingService = inject(DrawingService);
  private drawingsDataSource = inject(DrawingsDataSource);
  private toasterService = inject(ToasterService);

  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  readonly drawings = input<Drawing[]>([]);
  readonly nodes = input<Node[]>([]);

  duplicate() {
    for (let node of this.nodes()) {
      this.nodeService.duplicate(this.controller(), node).subscribe(
        (node: Node) => {
          this.nodesDataSource.add(node);
        },
        (error) => {
          if (error.status === 409) {
            this.toasterService.error(`Shutdown ${node.name} before duplicating`);
          } else {
            this.toasterService.error(`Cannot duplicate node ${node.name}: ${error.message || error}`);
          }
        }
      );
    }

    for (let drawing of this.drawings()) {
      this.drawingService.duplicate(this.controller(), drawing.project_id, drawing).subscribe((drawing: Drawing) => {
        this.drawingsDataSource.add(drawing);
      });
    }
  }
}
