import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription, merge } from 'rxjs';
import { NodesWidget } from '../../widgets/nodes';
import { DrawingsWidget } from '../../widgets/drawings';
import { LinksWidget } from '../../widgets/links';
import { SelectionManager } from '../../managers/selection-manager';
import { NodesEventSource } from '../../events/nodes-event-source';
import { DrawingsEventSource } from '../../events/drawings-event-source';
import { GraphDataManager } from '../../managers/graph-data-manager';
import { DraggableStart, DraggableDrag, DraggableEnd } from '../../events/draggable';
import { MapNode } from '../../models/map/map-node';
import { MapDrawing } from '../../models/map/map-drawing';
import { DraggedDataEvent } from '../../events/event-source';
import { select } from 'd3-selection';
import { MapLabel } from '../../models/map/map-label';
import { LabelWidget } from '../../widgets/label';
import { InterfaceLabelWidget } from '../../widgets/interface-label';
import { MapLinkNode } from '../../models/map/map-link-node';
import { LinksEventSource } from '../../events/links-event-source';

@Component({
  selector: 'app-draggable-selection',
  templateUrl: './draggable-selection.component.html',
  styleUrls: ['./draggable-selection.component.scss']
})
export class DraggableSelectionComponent implements OnInit, OnDestroy {
  private start: Subscription;
  private drag: Subscription;
  private end: Subscription;

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
    private linksEventSource: LinksEventSource
  ) {}

  ngOnInit() {
    const svg = select(this.svg);

    this.start = merge(
      this.nodesWidget.draggable.start,
      this.drawingsWidget.draggable.start,
      this.labelWidget.draggable.start,
      this.interfaceWidget.draggable.start
    ).subscribe((evt: DraggableStart<any>) => {
      const selected = this.selectionManager.getSelected();
      if (evt.datum instanceof MapNode) {
        if (selected.filter(item => item instanceof MapNode && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapDrawing) {
        if (selected.filter(item => item instanceof MapDrawing && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapLabel) {
        if (selected.filter(item => item instanceof MapLabel && item.id === evt.datum.id).length === 0) {
          this.selectionManager.setSelected([evt.datum]);
        }
      }

      if (evt.datum instanceof MapLinkNode) {
        if (selected.filter(item => item instanceof MapLinkNode && item.id === evt.datum.id).length === 0) {
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
      const selected = this.selectionManager.getSelected();
      const selectedNodes = selected.filter(item => item instanceof MapNode);
      // update nodes
      selectedNodes.forEach((node: MapNode) => {
        node.x += evt.dx;
        node.y += evt.dy;

        this.nodesWidget.redrawNode(svg, node);

        const links = this.graphDataManager
          .getLinks()
          .filter(
            link =>
              (link.target !== undefined && link.target.id === node.id) ||
              (link.source !== undefined && link.source.id === node.id)
          );

        links.forEach(link => {
          this.linksWidget.redrawLink(svg, link);
        });
      });

      // update drawings
      selected
        .filter(item => item instanceof MapDrawing)
        .forEach((drawing: MapDrawing) => {
          drawing.x += evt.dx;
          drawing.y += evt.dy;
          this.drawingsWidget.redrawDrawing(svg, drawing);
        });

      // update labels
      selected
        .filter(item => item instanceof MapLabel)
        .forEach((label: MapLabel) => {
          const isParentNodeSelected = selectedNodes.filter(node => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          const node = this.graphDataManager.getNodes().filter(node => node.id === label.nodeId)[0];
          node.label.x += evt.dx;
          node.label.y += evt.dy;
          this.labelWidget.redrawLabel(svg, label);
        });

      // update interface labels
      selected
        .filter(item => item instanceof MapLinkNode)
        .forEach((interfaceLabel: MapLinkNode) => {
          const isParentNodeSelected = selectedNodes.filter(node => node.id === interfaceLabel.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          const link = this.graphDataManager
            .getLinks()
            .filter(link => link.nodes[0].id === interfaceLabel.id || link.nodes[1].id === interfaceLabel.id)[0];
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
    });

    this.end = merge(
      this.nodesWidget.draggable.end,
      this.drawingsWidget.draggable.end,
      this.labelWidget.draggable.end,
      this.interfaceWidget.draggable.end
    ).subscribe((evt: DraggableEnd<any>) => {
      const selected = this.selectionManager.getSelected();
      const selectedNodes = selected.filter(item => item instanceof MapNode);

      selectedNodes.forEach((item: MapNode) => {
        this.nodesEventSource.dragged.emit(new DraggedDataEvent<MapNode>(item, evt.dx, evt.dy));
      });

      selected
        .filter(item => item instanceof MapDrawing)
        .forEach((item: MapDrawing) => {
          this.drawingsEventSource.dragged.emit(new DraggedDataEvent<MapDrawing>(item, evt.dx, evt.dy));
        });

      selected
        .filter(item => item instanceof MapLabel)
        .forEach((label: MapLabel) => {
          const isParentNodeSelected = selectedNodes.filter(node => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }

          this.nodesEventSource.labelDragged.emit(new DraggedDataEvent<MapLabel>(label, evt.dx, evt.dy));
        });

      selected
        .filter(item => item instanceof MapLinkNode)
        .forEach((label: MapLinkNode) => {
          const isParentNodeSelected = selectedNodes.filter(node => node.id === label.nodeId).length > 0;
          if (isParentNodeSelected) {
            return;
          }
          this.linksEventSource.interfaceDragged.emit(new DraggedDataEvent<MapLinkNode>(label, evt.dx, evt.dy));
        });
    });
  }

  ngOnDestroy() {
    this.start.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }
}
