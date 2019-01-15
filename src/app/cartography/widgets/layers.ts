import { Injectable } from '@angular/core';

import { Widget } from './widget';
import { SVGSelection } from '../models/types';
import { GraphLayout } from './graph-layout';
import { Layer } from '../models/layer';
import { LinksWidget } from './links';
import { NodesWidget } from './nodes';
import { DrawingsWidget } from './drawings';

@Injectable()
export class LayersWidget implements Widget {
  constructor(
    private linksWidget: LinksWidget,
    private nodesWidget: NodesWidget,
    private drawingsWidget: DrawingsWidget
  ) {}

  public draw(view: SVGSelection, layers: Layer[]) {
    const layers_selection = view.selectAll<SVGGElement, Layer>('g.layer').data(layers, (layer: Layer) => {
      return layer.index.toString();
    });

    const layers_enter = layers_selection
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'layer');

    // add container for links
    layers_enter.append<SVGGElement>('g').attr('class', 'links');

    // add container for nodes
    layers_enter.append<SVGGElement>('g').attr('class', 'nodes');

    // add container for drawings
    layers_enter.append<SVGGElement>('g').attr('class', 'drawings');

    const merge = layers_selection.merge(layers_enter);

    merge.attr('data-index', (layer: Layer) => layer.index);

    const links_container = merge.select<SVGGElement>('g.links');

    const nodes_container = merge.select<SVGGElement>('g.nodes');

    const drawings_container = merge.select<SVGGElement>('g.drawings');

    layers_selection.exit().remove();

    this.linksWidget.draw(links_container);
    this.nodesWidget.draw(nodes_container);
    this.drawingsWidget.draw(drawings_container);
  }
}
