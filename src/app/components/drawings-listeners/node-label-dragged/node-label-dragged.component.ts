import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { NodeService } from '../../../services/node.service';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { Node } from '../../../cartography/models/node';
import { Server } from '../../../models/server';
import { Subscription } from 'rxjs';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';

@Component({
  selector: 'app-node-label-dragged',
  templateUrl: './node-label-dragged.component.html',
  styleUrls: ['./node-label-dragged.component.css']
})
export class NodeLabelDraggedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  private nodeLabelDragged: Subscription;

  constructor(
    private nodesDataSource: NodesDataSource,
    private nodeService: NodeService,
    private nodesEventSource: NodesEventSource,
    private mapLabelToLabel: MapLabelToLabelConverter
  ) {}

  ngOnInit() {
    this.nodeLabelDragged = this.nodesEventSource.labelDragged.subscribe(evt => this.onNodeLabelDragged(evt));
  }

  onNodeLabelDragged(draggedEvent: DraggedDataEvent<MapLabel>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.nodeId);
    const mapLabel = draggedEvent.datum;
    mapLabel.x += draggedEvent.dx;
    mapLabel.y += draggedEvent.dy;

    const label = this.mapLabelToLabel.convert(mapLabel);
    node.label = label;

    this.nodeService.updateLabel(this.server, node, node.label).subscribe((serverNode: Node) => {
      this.nodesDataSource.update(serverNode);
    });
  }

  ngOnDestroy() {
    this.nodeLabelDragged.unsubscribe();
  }
}
