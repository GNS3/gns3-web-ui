import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapLabelToLabelConverter } from '../../../cartography/converters/map/map-label-to-label-converter';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DraggedDataEvent } from '../../../cartography/events/event-source';
import { NodesEventSource } from '../../../cartography/events/nodes-event-source';
import { MapLabel } from '../../../cartography/models/map/map-label';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-node-label-dragged',
  templateUrl: './node-label-dragged.component.html',
  styleUrl: './node-label-dragged.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeLabelDraggedComponent implements OnInit, OnDestroy {
  readonly controller = input<Controller>(undefined);
  private nodeLabelDragged: Subscription;

  private nodesDataSource = inject(NodesDataSource);
  private nodeService = inject(NodeService);
  private nodesEventSource = inject(NodesEventSource);
  private mapLabelToLabel = inject(MapLabelToLabelConverter);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.nodeLabelDragged = this.nodesEventSource.labelDragged.subscribe((evt) => this.onNodeLabelDragged(evt));
  }

  onNodeLabelDragged(draggedEvent: DraggedDataEvent<MapLabel>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.nodeId);
    const mapLabel = draggedEvent.datum;
    // Position already updated during drag, datum contains the final position
    const label = this.mapLabelToLabel.convert(mapLabel);
    node.label = label;

    this.nodeService
      .updateLabel(this.controller(), node, node.label)
      .subscribe({
        next: (controllerNode: Node) => {
          this.nodesDataSource.update(controllerNode);
        },
        error: (err) => {
          const message = err.error?.message || err.message || 'Failed to update node label position';
          this.toasterService.error(message);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.nodeLabelDragged.unsubscribe();
  }
}
