import { Component, Input } from '@angular/core';
import { Server } from '../../../models/server';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { LinkService } from '../../../services/link.service';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLinkNode } from '../../../cartography/models/map/map-link-node';
import { Link } from '../../../models/link';
import { Subscription } from 'rxjs';
import { LinksEventSource } from '../../../cartography/events/links-event-source';

@Component({
  selector: 'app-interface-label-dragged',
  templateUrl: './interface-label-dragged.component.html',
  styleUrls: ['./interface-label-dragged.component.css']
})
export class InterfaceLabelDraggedComponent {
  @Input() server: Server;
  private interfaceDragged: Subscription;

  constructor(
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private linksEventSource: LinksEventSource
  ) {}

  ngOnInit() {
    this.interfaceDragged = this.linksEventSource.interfaceDragged.subscribe(evt => this.onInterfaceLabelDragged(evt));
  }

  onInterfaceLabelDragged(draggedEvent: DraggedDataEvent<MapLinkNode>) {
    const link = this.linksDataSource.get(draggedEvent.datum.linkId);
    if (link.nodes[0].node_id === draggedEvent.datum.nodeId) {
      link.nodes[0].label.x += draggedEvent.dx;
      link.nodes[0].label.y += draggedEvent.dy;
    }
    if (link.nodes[1].node_id === draggedEvent.datum.nodeId) {
      link.nodes[1].label.x += draggedEvent.dx;
      link.nodes[1].label.y += draggedEvent.dy;
    }

    this.linkService.updateNodes(this.server, link, link.nodes).subscribe((serverLink: Link) => {
      this.linksDataSource.update(serverLink);
    });
  }

  ngOnDestroy() {
    this.interfaceDragged.unsubscribe();
  }
}
