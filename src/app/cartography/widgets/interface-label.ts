import { Injectable } from '@angular/core';

import { SVGSelection } from '../models/types';
import { CssFixer } from '../helpers/css-fixer';
import { select } from 'd3-selection';
import { MapLink } from '../models/map/map-link';
import { FontFixer } from '../helpers/font-fixer';
import { SelectionManager } from '../managers/selection-manager';
import { MapLinkNode } from '../models/map/map-link-node';
import { MapNode } from '../models/map/map-node';
import { Draggable } from '../events/draggable';
import { MapSettingsManager } from '../managers/map-settings-manager';

@Injectable()
export class InterfaceLabelWidget {
  public draggable = new Draggable<SVGGElement, MapLinkNode>();

  static SURROUNDING_TEXT_BORDER = 5;
  private enabled = true;

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
    private selectionManager: SelectionManager,
    private mapSettings: MapSettingsManager
  ) {}

  public setEnabled(enabled) {
    this.enabled = enabled;
  }

  draw(selection: SVGSelection) {
    const link_node_position = selection
      .selectAll<SVGGElement, MapLinkNode>('g.link_node_position')
      .data((link: MapLink) => [[link.source, link.nodes[0]], [link.target, link.nodes[1]]]);

    const enter_link_node_position = link_node_position
      .enter()
      .append<SVGGElement>('g')
      .classed('link_node_position', true);

    const merge_link_node_position = link_node_position.merge(enter_link_node_position);

    merge_link_node_position.attr('transform', (nodeAndMapLinkNode: [MapNode, MapLinkNode]) => {
      return `translate(${nodeAndMapLinkNode[0].x}, ${nodeAndMapLinkNode[0].y})`;
    });

    const labels = merge_link_node_position
      .selectAll<SVGGElement, [MapNode, MapLinkNode]>('g.interface_label_container')
      .data((nodeAndMapLinkNode: [MapNode, MapLinkNode]) => {
        if (this.enabled) {
          return [nodeAndMapLinkNode[1]];
        }
        return [];
      });

    const enter = labels
      .enter()
      .append<SVGGElement>('g')
      .classed('interface_label_container', true);

    // create surrounding rect
    enter.append<SVGRectElement>('rect').attr('class', 'interface_label_selection');

    // create label
    enter
      .append<SVGTextElement>('text')
      .attr('class', 'interface_label noselect')
      .attr('interface_label_id', (i: MapLinkNode) => `${i.id}`);

    const merge = labels.merge(enter);

    // update label
    merge
      .select<SVGTextElement>('text.interface_label')
      .text((l: MapLinkNode) => l.label.text)
      .attr('style', (l: MapLinkNode) => {
        let styles = this.cssFixer.fix(l.label.style);
        styles = this.fontFixer.fixStyles(styles);
        return styles;
      })
      .attr('x', (l: MapLinkNode) => l.label.x)
      .attr('y', (l: MapLinkNode) => l.label.y)
      .attr('transform', (l: MapLinkNode) => {
        return `rotate(${l.label.rotation}, ${l.label.x}, ${l.label.y})`;
      });

    // update surrounding rect
    merge
      .select<SVGRectElement>('rect.interface_label_selection')
      .attr('visibility', (l: MapLinkNode) => (this.selectionManager.isSelected(l) ? 'visible' : 'hidden'))
      .attr('stroke', 'black')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', '0.5')
      .attr('fill', 'none')
      .each(function(this: SVGRectElement, l: MapLinkNode) {
        const current = select(this);
        const textLabel = merge.select<SVGTextElement>(`text[interface_label_id="${l.id}"]`);
        const bbox = textLabel.node().getBBox();
        const border = 2;

        current.attr('width', bbox.width + border * 2);
        current.attr('height', bbox.height + border * 2);
        current.attr('x', bbox.x - border);
        current.attr('y', bbox.y - border);
        current.attr('transform', `rotate(${l.label.rotation}, ${bbox.x - border}, ${bbox.y - border})`);
      });

    labels.exit().remove();

    if (!this.mapSettings.isReadOnly) {
      this.draggable.call(merge);
    }
  }
}
