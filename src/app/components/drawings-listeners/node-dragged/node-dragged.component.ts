import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { Node } from '../../../cartography/models/node';
import { Project } from '../../../models/project';
import { Server } from '../../../models/server';
import { NodeService } from '../../../services/node.service';

@Component({
  selector: 'app-node-dragged',
  templateUrl: './node-dragged.component.html',
  styleUrls: ['./node-dragged.component.css']
})
export class NodeDraggedComponent implements OnInit, OnDestroy {
  @Input() server: Server;
  @Input() project: Project;
  private nodeDragged: Subscription;

  constructor(
    private nodesDataSource: NodesDataSource,
    private nodeService: NodeService,
    private nodesEventSource: NodesEventSource
  ) {}

  ngOnInit() {
    this.nodeDragged = this.nodesEventSource.dragged.subscribe(evt => this.onNodeDragged(evt));
  }

  onNodeDragged(draggedEvent: DraggedDataEvent<MapNode>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.id);
    node.x += draggedEvent.dx;
    node.y += draggedEvent.dy;

    this.nodeService.updatePosition(this.server, this.project, node, node.x, node.y).subscribe((serverNode: Node) => {
      this.nodesDataSource.update(serverNode);
    });
  }

  ngOnDestroy() {
    this.nodeDragged.unsubscribe();
  }
}
