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
import { createActionCompletion } from '@utils/action-completion.util';

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
    // A locked node cannot be cloned (the server refuses it): clone the
    // unlocked ones and say which were skipped.
    const locked = this.nodes().filter((node) => node.locked);
    const duplicable = this.nodes().filter((node) => !node.locked);
    if (locked.length > 0) {
      this.toasterService.warning(
        `${locked.length === 1 ? 'A locked node' : `${locked.length} locked nodes`} cannot be duplicated: ${locked
          .map((node) => node.name)
          .join(', ')}`
      );
    }
    if (duplicable.length === 0 && this.drawings().length === 0) {
      return;
    }

    const completion = createActionCompletion(duplicable.length + this.drawings().length, (count) => {
      if (count > 0) {
        this.toasterService.success(`${count} selected ${count === 1 ? 'object' : 'objects'} duplicated.`);
      }
    });

    for (let node of duplicable) {
      this.nodeService.duplicate(this.controller(), node).subscribe({
        next: (node: Node) => {
          this.nodesDataSource.add(node);
          completion.succeed();
        },
        error: (err) => {
          completion.fail();
          // 409 is either "node must be stopped" or "node is locked": the
          // server message says which, so relay it instead of guessing.
          const message = err.error?.message || err.message || 'Failed to duplicate node';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }

    for (let drawing of this.drawings()) {
      this.drawingService.duplicate(this.controller(), drawing.project_id, drawing).subscribe({
        next: (drawing: Drawing) => {
          this.drawingsDataSource.add(drawing);
          completion.succeed();
        },
        error: (err) => {
          completion.fail();
          const message = err.error?.message || err.message || 'Failed to duplicate drawing';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
    }
  }
}
