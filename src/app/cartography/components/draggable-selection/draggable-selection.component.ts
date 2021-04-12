import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { select } from 'd3-selection';
import { merge, Subscription } from 'rxjs';
import { MapSettingsService } from '../../../services/mapsettings.service';
import { DraggableDrag, DraggableEnd, DraggableStart } from '../../events/draggable';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { DraggedDataEvent } from '../../events/event-source';
import { LinksEventSource } from '../../events/links-event-source';
import { NodesEventSource } from '../../events/nodes-event-source';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { SelectionManager } from '../../managers/selection-manager';
import { MapDrawing } from '../../models/map/map-drawing';
import { MapLabel } from '../../models/map/map-label';
import { MapLinkNode } from '../../models/map/map-link-node';
import { MapNode } from '../../models/map/map-node';
import { DrawingsWidget } from '../../widgets/drawings';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { LabelWidget } from '../../widgets/label';
import { LinksWidget } from '../../widgets/links';
import { NodesWidget } from '../../widgets/nodes';

@Component({
  selector: 'app-draggable-selection',
  templateUrl: './draggable-selection.component.html',
  styleUrls: ['./draggable-selection.component.scss'],
})
export class DraggableSelectionComponent implements OnInit, OnDestroy {
  private start: Subscription;
  private drag: Subscription;
  private end: Subscription;
  private mapSettingsSubscription: Subscription;
  private isMapLocked: boolean = false;

  @Input('svg') svg: SVGSVGElement;

  constructor(
    private nodesWidget: NodesWidget,
    private drawingsWidget: DrawingsWidget,
    private linksWidget: LinksWidget,
    private labelWidget: LabelWidget,
    private interfaceWidget: InterfaceLabelWidget,
    private selectionManager: SelectionManager,
    private nodesEventSource: NodesEventSource,
    private drawingsEventSource: DrawingsEventSource,
    private graphDataManager: GraphDataManager,
    private linksEventSource: LinksEventSource,
    private mapSettingsService: MapSettingsService
  ) {}

  ngOnInit() {
    const svg = select(this.svg);

    this.mapSettingsSubscription = this.mapSettingsService.isMapLocked.subscribe((value) => {
      this.isMapLocked = value;
    });

    this.start = merge(
      this.nodesWidget.draggable.start,
      this.drawingsWidget.draggable.start,
      this.labelWidget.draggable.start,
      this.interfaceWidget.draggable.start
    ).subscribe((evt: DraggableStart<any>) => {
      const selected = this.selectionManager.getSelected();
      if (evt.datum instanceof MapNode) {
        if (selected.filter((item) => item instanceof MapNode && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapDrawing) {
        if (selected.filter((item) => item instanceof MapDrawing && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapLabel) {
        if (selected.filter((item) => item instanceof MapLabel && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapLinkNode) {
        if (selected.filter((item) => item instanceof MapLinkNode && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }
    });

    this.drag = merge(
      this.nodesWidget.draggable.drag,
      this.drawingsWidget.draggable.drag,
      this.labelWidget.draggable.drag,
      this.interfaceWidget.draggable.drag
    ).subscribe((evt: DraggableDrag<any>) => {
      if (!this.isMapLocked) {
        const selected = this.selectionManager.getSelected();
        // update nodes
        let mapNodes = selected.filter((item) => item instanceof MapNode);
        const lockedNodes = mapNodes.filter((item: MapNode) => item.locked);
        const selectedNodes = mapNodes.filter((item: MapNode) => !item.locked);
        selectedNodes.forEach((node: MapNode) => {
          node.x += evt.dx;
          node.y += evt.dy;

          this.nodesWidget.redrawNode(svg, node);

          const links = this.graphDataManager
            .getLinks()
            .filter(
              (link) =>
                (link.target !== undefined && link.target.id === node.id) ||
                (link.source !== undefined && link.source.id === node.id)
            );

          links.forEach((link) => {
            this.linksWidget.redrawLink(svg, link);
          });
        });

        // update drawings
        let mapDrawings = selected.filter((item) => item instanceof MapDrawing);
        const selectedDrawings = mapDrawings.filter((item: MapDrawing) => !item.locked);
        selectedDrawings.forEach((drawing: MapDrawing) => {
          drawing.x += evt.dx;
          drawing.y += evt.dy;
          this.drawingsWidget.redrawDrawing(svg, drawing);
        });

        // update labels
        let mapLabels = selected.filter((item) => item instanceof MapLabel);
        const selectedLabels = mapLabels.filter(
          (item: MapLabel) => lockedNodes.filter((node) => node.id === item.nodeId).length === 0
        );
        selectedLabels.forEach((label: MapLabel) => {
          const isParentNodeSelected = selectedNodes.filter((node) => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          const node = this.graphDataManager.getNodes().filter((node) => node.id === label.nodeId)[0];
          node.label.x += evt.dx;
          node.label.y += evt.dy;
          this.labelWidget.redrawLabel(svg, label);
        });

        // update interface labels
        let mapLinkNodes = selected.filter((item) => item instanceof MapLinkNode);
        const selectedLinkNodes = mapLinkNodes.filter(
          (item: MapLinkNode) => lockedNodes.filter((node) => node.id === item.nodeId).length === 0
        );
        selectedLinkNodes.forEach((interfaceLabel: MapLinkNode) => {
          const isParentNodeSelected = selectedNodes.filter((node) => node.id === interfaceLabel.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          const link = this.graphDataManager
            .getLinks()
            .filter((link) => link.nodes[0].id === interfaceLabel.id || link.nodes[1].id === interfaceLabel.id)[0];
          if (link.nodes[0].id === interfaceLabel.id) {
            link.nodes[0].label.x += evt.dx;
            link.nodes[0].label.y += evt.dy;
          }
          if (link.nodes[1].id === interfaceLabel.id) {
            link.nodes[1].label.x += evt.dx;
            link.nodes[1].label.y += evt.dy;
          }

          this.linksWidget.redrawLink(svg, link);
        });
      }
    });

    this.end = merge(
      this.nodesWidget.draggable.end,
      this.drawingsWidget.draggable.end,
      this.labelWidget.draggable.end,
      this.interfaceWidget.draggable.end
    ).subscribe((evt: DraggableEnd<any>) => {
      if (!this.isMapLocked) {
        const selected = this.selectionManager.getSelected();

        let mapNodes = selected.filter((item) => item instanceof MapNode);
        const lockedNodes = mapNodes.filter((item: MapNode) => item.locked);
        const selectedNodes = mapNodes.filter((item: MapNode) => !item.locked);
        selectedNodes.forEach((item: MapNode) => {
          this.nodesEventSource.dragged.emit(new DraggedDataEvent<MapNode>(item, evt.dx, evt.dy));
        });

        let mapDrawings = selected.filter((item) => item instanceof MapDrawing);
        const selectedDrawings = mapDrawings.filter((item: MapDrawing) => !item.locked);
        selectedDrawings.forEach((item: MapDrawing) => {
          this.drawingsEventSource.dragged.emit(new DraggedDataEvent<MapDrawing>(item, evt.dx, evt.dy));
        });

        let mapLabels = selected.filter((item) => item instanceof MapLabel);
        const selectedLabels = mapLabels.filter(
          (item: MapLabel) => lockedNodes.filter((node) => node.id === item.nodeId).length === 0
        );
        selectedLabels.forEach((label: MapLabel) => {
          const isParentNodeSelected = selectedNodes.filter((node) => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          this.nodesEventSource.labelDragged.emit(new DraggedDataEvent<MapLabel>(label, evt.dx, evt.dy));
        });

        let mapLinkNodes = selected.filter((item) => item instanceof MapLinkNode);
        const selectedLinkNodes = mapLinkNodes.filter(
          (item: MapLinkNode) => lockedNodes.filter((node) => node.id === item.nodeId).length === 0
        );
        selectedLinkNodes.forEach((label: MapLinkNode) => {
          const isParentNodeSelected = selectedNodes.filter((node) => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }
          this.linksEventSource.interfaceDragged.emit(new DraggedDataEvent<MapLinkNode>(label, evt.dx, evt.dy));
        });
      }
    });
  }

  ngOnDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
    this.mapSettingsSubscription.unsubscribe();
  }
}
