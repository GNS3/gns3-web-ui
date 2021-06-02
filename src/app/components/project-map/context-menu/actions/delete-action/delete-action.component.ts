import { Component, Input, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ConfirmationBottomSheetComponent } from 'app/components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { DrawingsDataSource } from '../../../../../cartography/datasources/drawings-datasource';
import { LinksDataSource } from '../../../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../../../cartography/datasources/nodes-datasource';
import { Drawing } from '../../../../../cartography/models/drawing';
import { Node } from '../../../../../cartography/models/node';
import { Link } from '../../../../../models/link';
import { Server } from '../../../../../models/server';
import { DrawingService } from '../../../../../services/drawing.service';
import { LinkService } from '../../../../../services/link.service';
import { NodeService } from '../../../../../services/node.service';

@Component({
  selector: 'app-delete-action',
  templateUrl: './delete-action.component.html',
})
export class DeleteActionComponent implements OnInit {
  @Input() server: Server;
  @Input() nodes: Node[];
  @Input() drawings: Drawing[];
  @Input() links: Link[];

  constructor(
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
      this.nodesDataSource.remove(node);

      this.nodeService.delete(this.server, node).subscribe((node: Node) => {});
    });

    this.drawings.forEach((drawing) => {
      this.drawingsDataSource.remove(drawing);

      this.drawingService.delete(this.server, drawing).subscribe((drawing: Drawing) => {});
    });

    this.links.forEach((link) => {
      this.linksDataSource.remove(link);

      this.linkService.deleteLink(this.server, link).subscribe(() => {});
    });
  }
}
