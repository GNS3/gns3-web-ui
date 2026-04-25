import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapNode } from '../../../cartography/models/map/map-node';
import { Node } from '../../../cartography/models/node';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-node-dragged',
  templateUrl: './node-dragged.component.html',
  styleUrl: './node-dragged.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDraggedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  readonly project = input<Project>(undefined);
  private nodeDragged: Subscription;

  private nodesDataSource = inject(NodesDataSource);
  private nodeService = inject(NodeService);
  private nodesEventSource = inject(NodesEventSource);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.nodeDragged = this.nodesEventSource.dragged.subscribe((evt) => this.onNodeDragged(evt));
  }

  onNodeDragged(draggedEvent: DraggedDataEvent<MapNode>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.id);
    node.x += draggedEvent.dx;
    node.y += draggedEvent.dy;

    this.nodeService
      .updatePosition(this.controller(), this.project(), node, node.x, node.y)
      .subscribe({
        next: (controllerNode: Node) => {
          this.nodesDataSource.update(controllerNode);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update node position';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.nodeDragged.unsubscribe();
  }
}
