import { Component, Input, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ConfirmationBottomSheetComponent } from 'app/components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '../../../../../models/link';
import { Controller } from '../../../../../models/controller';
import { DrawingService } from '../../../../../services/drawing.service';
import { LinkService } from '../../../../../services/link.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-delete-action',
  templateUrl: './delete-action.component.html',
})
export class DeleteActionComponent implements OnInit {
  @Input() controller: Controller;
  @Input() nodes: Node[];
  @Input() drawings: Drawing[];
  @Input() links: Link[];

  constructor(
    private toasterService: ToasterService,
    private nodesDataSource: NodesDataSource,
    private drawingsDataSource: DrawingsDataSource,
    private linksDataSource: LinksDataSource,
    private nodeService: NodeService,
    private drawingService: DrawingService,
    private linkService: LinkService,
    private bottomSheet: MatBottomSheet
  ) {}

  ngOnInit() {}

  confirmDelete() {
    this.bottomSheet.open(ConfirmationBottomSheetComponent);
    let bottomSheetRef = this.bottomSheet._openedBottomSheetRef;
    bottomSheetRef.instance.message = 'Do you want to delete all selected objects?';
    const bottomSheetSubscription = bottomSheetRef.afterDismissed().subscribe((result: boolean) => {
      if (result) {
        this.delete();
      }
    });
  }

  delete() {

    this.nodes.forEach((node) => {
      if (!node.locked) {
        this.nodesDataSource.remove(node);
        this.nodeService.delete(this.controller, node).subscribe((node: Node) => {});
      }
      else {
        this.toasterService.error('Cannot delete locked node: ' + node.name);
        return;
      }
    });

    this.drawings.forEach((drawing) => {
      if (!drawing.locked) {
        this.drawingsDataSource.remove(drawing);
        this.drawingService.delete(this.controller, drawing).subscribe((drawing: Drawing) => {});
      }
      else {
        this.toasterService.error('Cannot delete locked drawing');
        return;
      }
    });

    if (this.nodes.length == 0 && this.drawings.length == 0) {
      this.links.forEach((link) => {
        this.linksDataSource.remove(link);
        this.linkService.deleteLink(this.controller, link).subscribe(() => {});
      });
    }
  }
}
