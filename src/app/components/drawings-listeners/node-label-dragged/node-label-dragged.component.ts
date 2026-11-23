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
import { MapChangeDetectorRef } from '../../../cartography/services/map-change-detector-ref';
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
  private mapChangeDetectorRef = inject(MapChangeDetectorRef);
  private toasterService = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.nodeLabelDragged = this.nodesEventSource.labelDragged.subscribe((evt) => this.onNodeLabelDragged(evt));
  }

  onNodeLabelDragged(draggedEvent: DraggedDataEvent<MapLabel>) {
    const node = this.nodesDataSource.get(draggedEvent.datum.nodeId);
    const mapLabel = draggedEvent.datum;
    const previousLabel = node.label;
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
          // The server rejected the label move (e.g. RBAC: no Node.Modify):
          // restore the previous label and force an un-gated redraw — the
          // restored signature equals the last rendered one, so the gated
          // redraw would skip and leave the label at the cursor.
          node.label = previousLabel;
          this.nodesDataSource.update(node);
          this.mapChangeDetectorRef.detectChanges();
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
