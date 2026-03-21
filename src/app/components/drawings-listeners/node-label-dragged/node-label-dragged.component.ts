import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';

@Component({
  standalone: true,
  selector: 'app-node-label-dragged',
  templateUrl: './node-label-dragged.component.html',
  styleUrls: ['./node-label-dragged.component.scss'],
  imports: [],
})
export class NodeLabelDraggedComponent implements OnInit, OnDestroy {
  @Input() controller: Controller;
  private nodeLabelDragged: Subscription;

  private nodesDataSource = inject(NodesDataSource);
  private nodeService = inject(NodeService);
  private nodesEventSource = inject(NodesEventSource);
  private mapLabelToLabel = inject(MapLabelToLabelConverter);

  ngOnInit() {
    this.nodeLabelDragged = this.nodesEventSource.labelDragged.subscribe((evt) => this.onNodeLabelDragged(evt));
  }

  onNodeLabelDragged(draggedEvent: DraggedDataEvent<MapLabel>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.nodeId);
    const mapLabel = draggedEvent.datum;
    mapLabel.x += draggedEvent.dx;
    mapLabel.y += draggedEvent.dy;

    const label = this.mapLabelToLabel.convert(mapLabel);
    node.label = label;

    this.nodeService.updateLabel(this.controller, node, node.label).subscribe((controllerNode: Node) => {
      this.nodesDataSource.update(controllerNode);
    });
  }

  ngOnDestroy() {
    this.nodeLabelDragged.unsubscribe();
  }
}
