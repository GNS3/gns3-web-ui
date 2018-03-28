import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { GraphLayout } from "./graph-layout";
import { Layer } from "../models/layer";


export class LayersWidget implements Widget {
  public graphLayout: GraphLayout;

  public draw(view: SVGSelection, layers: Layer[]) {

    const layers_selection = view
      .selectAll<SVGGElement, Layer>('g.layer')
        .data(layers);

    layers_selection
      .enter()
        .append<SVGGElement>('g')
        .attr('class', 'layer')
        .attr('data-index', (layer: Layer) => layer.index);

    layers_selection
      .exit()
        .remove();

    this.graphLayout
      .getLinksWidget()
      .draw(layers_selection);

    this.graphLayout
      .getNodesWidget()
      .draw(layers_selection);

    this.graphLayout
      .getDrawingsWidget()
      .draw(layers_selection);

  }
}
