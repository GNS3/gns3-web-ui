import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { LinksEventSource } from '../../../cartography/events/links-event-source';
import { MapLinkNode } from '../../../cartography/models/map/map-link-node';
import { Link } from '@models/link';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { MapChangeDetectorRef } from '../../../cartography/services/map-change-detector-ref';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-interface-label-dragged',
  templateUrl: './interface-label-dragged.component.html',
  styleUrl: './interface-label-dragged.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceLabelDraggedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  private interfaceDragged: Subscription;

  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private linksEventSource = inject(LinksEventSource);
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.interfaceDragged = this.linksEventSource.interfaceDragged.subscribe((evt) =>
      this.onInterfaceLabelDragged(evt)
    );
  }

  onInterfaceLabelDragged(draggedEvent: DraggedDataEvent<MapLinkNode>) {
    const link = this.linksDataSource.get(draggedEvent.datum.linkId);
    const previousPositions = link.nodes.map((linkNode) => ({ x: linkNode.label.x, y: linkNode.label.y }));
    if (link.nodes[0].node_id === draggedEvent.datum.nodeId) {
      link.nodes[0].label.x += draggedEvent.dx;
      link.nodes[0].label.y += draggedEvent.dy;
    }
    if (link.nodes[1].node_id === draggedEvent.datum.nodeId) {
      link.nodes[1].label.x += draggedEvent.dx;
      link.nodes[1].label.y += draggedEvent.dy;
    }

    this.linkService
      .updateNodes(this.controller(), link, link.nodes)
      .subscribe({
        next: (controllerLink: Link) => {
          this.linksDataSource.update(controllerLink);
        },
        error: (err) => {
          // The server rejected the label move (e.g. RBAC: no Link.Modify):
          // restore the previous label positions and force an un-gated
          // redraw — the restored signature equals the last rendered one, so
          // the gated redraw would skip and leave the label at the cursor.
          link.nodes.forEach((linkNode, i) => {
            linkNode.label.x = previousPositions[i].x;
            linkNode.label.y = previousPositions[i].y;
          });
          this.linksDataSource.update(link);
          this.mapChangeDetectorRef.detectChanges();
          const message = err.error?.message || err.message || 'Failed to update interface label position';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.interfaceDragged.unsubscribe();
  }
}
