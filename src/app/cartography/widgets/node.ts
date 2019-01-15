import { Injectable, EventEmitter } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { NodeContextMenu, NodeClicked } from '../events/nodes';
import { select, event } from 'd3-selection';
import { MapNode } from '../models/map/map-node';
import { GraphDataManager } from '../managers/graph-data-manager';
import { SelectionManager } from '../managers/selection-manager';
import { LabelWidget } from './label';
import { NodesEventSource } from '../events/nodes-event-source';
import { ClickedDataEvent } from '../events/event-source';

@Injectable()
export class NodeWidget implements Widget {
  public onContextMenu = new EventEmitter<NodeContextMenu>();
  public onNodeClicked = new EventEmitter<NodeClicked>();

  constructor(
    private graphDataManager: GraphDataManager,
    private selectionManager: SelectionManager,
    private labelWidget: LabelWidget,
    private nodesEventSource: NodesEventSource
  ) {}

  public draw(view: SVGSelection) {
    const self = this;

    const node_body = view.selectAll<SVGGElement, MapNode>('g.node_body').data(n => [n]);

    const node_body_enter = node_body
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'node_body');

    node_body_enter.append<SVGImageElement>('image');

    const node_body_merge = node_body
      .merge(node_body_enter)
      .classed('selected', (n: MapNode) => this.selectionManager.isSelected(n))
      .on('contextmenu', function(n: MapNode, i: number) {
        event.preventDefault();
        self.onContextMenu.emit(new NodeContextMenu(event, n));
      })
      .on('click', (node: MapNode) => {
        this.nodesEventSource.clicked.emit(new ClickedDataEvent<MapNode>(node, event.clientX, event.clientY));
      });

    // update image of node
    node_body_merge
      .select<SVGImageElement>('image')
      .attr('xnode:href', (n: MapNode) => n.symbolUrl)
      .attr('width', (n: MapNode) => n.width)
      .attr('height', (n: MapNode) => n.height)
      .attr('x', (n: MapNode) => 0)
      .attr('y', (n: MapNode) => 0)
      .on('mouseover', function(this, n: MapNode) {
        select(this).attr('class', 'over');
      })
      .on('mouseout', function(this, n: MapNode) {
        select(this).attr('class', '');
      });

    node_body_merge.attr('transform', (n: MapNode) => {
      return `translate(${n.x},${n.y})`;
    });

    this.labelWidget.draw(node_body_merge);
  }
}
