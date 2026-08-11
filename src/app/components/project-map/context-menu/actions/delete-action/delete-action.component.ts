import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { LinkTypeCache } from '@services/link-type-cache';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { createActionCompletion } from '@utils/action-completion.util';
import { describeTopologyItems } from '@utils/topology-delete-summary.util';
import type { TopologyItemCounts } from '@utils/topology-delete-summary.util';

@Component({
  selector: 'app-delete-action',
  templateUrl: './delete-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteActionComponent {
  private toasterService = inject(ToasterService);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);
  private linkService = inject(LinkService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>([]);
  readonly drawings = input<Drawing[]>([]);
  readonly links = input<Link[]>([]);

  confirmDelete() {
    const counts = this.selectedItemCounts();
    const objectCount = counts.nodes + counts.drawings + counts.links;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'dialog-small-panel', 'confirmation-danger-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Delete selected objects?',
        message: `${describeTopologyItems(counts)} will be permanently deleted.`,
        note: 'This action cannot be undone.',
        confirmButtonText: objectCount === 1 ? 'Delete object' : 'Delete objects',
        tone: 'danger',
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.delete();
        this.cdr.markForCheck();
      }
    });
  }

  delete() {
    const deletableNodes = this.nodes().filter((node) => !node.locked);
    const deletableDrawings = this.drawings().filter((drawing) => !drawing.locked);
    const deletableLinks = this.nodes().length === 0 && this.drawings().length === 0 ? this.links() : [];
    const deletedCounts: TopologyItemCounts = { nodes: 0, links: 0, drawings: 0 };
    const completion = createActionCompletion(
      deletableNodes.length + deletableDrawings.length + deletableLinks.length,
      (count) => {
        if (count > 0) {
          this.toasterService.success(`${describeTopologyItems(deletedCounts)} deleted.`);
        }
      }
    );

    this.nodes().forEach((node) => {
      if (!node.locked) {
        // Do NOT remove locally here (optimistic): the canvas removal is driven
        // by the `node.deleted` WebSocket notification, which fires once the
        // backend has actually deleted the node. Removing optimistically made
        // nodes vanish before the backend confirmed the delete.
        this.nodeService.delete(this.controller(), node).subscribe({
          next: () => {
            deletedCounts.nodes++;
            completion.succeed();
          },
          error: (err) => {
            completion.fail();
            const message = err.error?.message || err.message || 'Failed to delete node';
            this.toasterService.error(message);
            this.cdr.markForCheck();
          },
        });
      } else {
        this.toasterService.error('Cannot delete locked node: ' + node.name);
        this.cdr.markForCheck();
        return;
      }
    });

    this.drawings().forEach((drawing) => {
      if (!drawing.locked) {
        // Removal driven by the `drawing.deleted` WS notification (see nodes above).
        this.drawingService.delete(this.controller(), drawing).subscribe({
          next: () => {
            deletedCounts.drawings++;
            completion.succeed();
          },
          error: (err) => {
            completion.fail();
            const message = err.error?.message || err.message || 'Failed to delete drawing';
            this.toasterService.error(message);
            this.cdr.markForCheck();
          },
        });
      } else {
        this.toasterService.error('Cannot delete locked drawing');
        this.cdr.markForCheck();
        return;
      }
    });

    if (this.nodes().length == 0 && this.drawings().length == 0) {
      this.links().forEach((link) => {
        // Removal driven by the `link.deleted` WS notification (see nodes above).
        this.linkService.deleteLink(this.controller(), link).subscribe({
          next: () => {
            LinkTypeCache.remove(link.project_id, link.link_id);
            deletedCounts.links++;
            completion.succeed();
          },
          error: (err) => {
            completion.fail();
            const message = err.error?.message || err.message || 'Failed to delete link';
            this.toasterService.error(message);
            this.cdr.markForCheck();
          },
        });
      });
    }
  }

  private selectedItemCounts(): TopologyItemCounts {
    const hasNodesOrDrawings = this.nodes().length > 0 || this.drawings().length > 0;
    return {
      nodes: this.nodes().length,
      drawings: this.drawings().length,
      links: hasNodesOrDrawings ? 0 : this.links().length,
    };
  }
}
