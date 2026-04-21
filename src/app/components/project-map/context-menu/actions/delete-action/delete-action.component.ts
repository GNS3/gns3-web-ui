import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ConfirmationBottomSheetComponent } from 'app/components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { DrawingService } from '@services/drawing.service';
import { LinkService } from '@services/link.service';
import { LinkTypeCache } from '@services/link-type-cache';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-delete-action',
  templateUrl: './delete-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteActionComponent {
  private toasterService = inject(ToasterService);
  private nodesDataSource = inject(NodesDataSource);
  private drawingsDataSource = inject(DrawingsDataSource);
  private linksDataSource = inject(LinksDataSource);
  private nodeService = inject(NodeService);
  private drawingService = inject(DrawingService);
  private linkService = inject(LinkService);
  private bottomSheet = inject(MatBottomSheet);
  private cdr = inject(ChangeDetectorRef);

  readonly controller = input<Controller>(undefined);
  readonly nodes = input<Node[]>([]);
  readonly drawings = input<Drawing[]>([]);
  readonly links = input<Link[]>([]);

  confirmDelete() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete all selected objects?' },
      panelClass: 'confirmation-bottom-sheet',
    });
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.delete();
        this.cdr.markForCheck();
      }
    });
  }

  delete() {
    this.nodes().forEach((node) => {
      if (!node.locked) {
        this.nodesDataSource.remove(node);
        this.nodeService.delete(this.controller(), node).subscribe({
          next: (node: Node) => {},
          error: (err) => {
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
        this.drawingsDataSource.remove(drawing);
        this.drawingService.delete(this.controller(), drawing).subscribe({
          next: (drawing: Drawing) => {},
          error: (err) => {
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
        this.linksDataSource.remove(link);
        this.linkService.deleteLink(this.controller(), link).subscribe({
          next: () => {
            LinkTypeCache.remove(link.project_id, link.link_id);
          },
          error: (err) => {
            const message = err.error?.message || err.message || 'Failed to delete link';
            this.toasterService.error(message);
            this.cdr.markForCheck();
          },
        });
      });
    }
  }
}
