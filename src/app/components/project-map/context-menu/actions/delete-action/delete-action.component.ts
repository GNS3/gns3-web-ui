import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
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
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-delete-action',
  templateUrl: './delete-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteActionComponent implements OnInit {
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

  ngOnInit() {}

  confirmDelete() {
    const bottomSheetRef = this.bottomSheet.open(ConfirmationBottomSheetComponent, {
      data: { message: 'Do you want to delete all selected objects?' }
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
        this.nodeService.delete(this.controller(), node).subscribe((node: Node) => {});
      } else {
        this.toasterService.error('Cannot delete locked node: ' + node.name);
        this.cdr.markForCheck();
        return;
      }
    });

    this.drawings().forEach((drawing) => {
      if (!drawing.locked) {
        this.drawingsDataSource.remove(drawing);
        this.drawingService.delete(this.controller(), drawing).subscribe((drawing: Drawing) => {});
      } else {
        this.toasterService.error('Cannot delete locked drawing');
        this.cdr.markForCheck();
        return;
      }
    });

    if (this.nodes().length == 0 && this.drawings().length == 0) {
      this.links().forEach((link) => {
        this.linksDataSource.remove(link);
        this.linkService.deleteLink(this.controller(), link).subscribe(() => {});
      });
    }
  }
}
