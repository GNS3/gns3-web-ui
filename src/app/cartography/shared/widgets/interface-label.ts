import { SVGSelection } from "../models/types";
import { Link } from "../models/link";


export class InterfaceLabelWidget {
  draw(selection: SVGSelection) {

    const labels = selection
      .selectAll<SVGTextElement, Link>('text.interface_label')
      .data((l: Link) => [l]);

    const enter = labels
      .enter()
        .append<SVGTextElement>('text')
          .attr('class', 'interface_label');

    const merge = labels
      .merge(enter);

    merge
      .text((l: Link) => l.nodes[0].label.text)
      .attr('x', (l: Link) => Math.round(l.source.x + l.nodes[0].label.x))
      .attr('y', (l: Link) => Math.round(l.source.y + l.nodes[0].label.y));

    labels
      .exit()
      .remove();

  }
}
