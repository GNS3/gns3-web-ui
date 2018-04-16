import { SVGSelection } from "../models/types";
import { Link } from "../models/link";
import { InterfaceLabel } from "../models/interface-label";
import { CssFixer } from "../helpers/css-fixer";
import { select } from "d3-selection";


export class InterfaceLabelWidget {
  private cssFixer: CssFixer;

  constructor() {
    this.cssFixer = new CssFixer();
  }

  draw(selection: SVGSelection) {

    const labels = selection
      .selectAll<SVGTextElement, InterfaceLabel>('text.interface_label')
      .data((l: Link) => {
        const sourceInterface = new InterfaceLabel(
          Math.round( l.source.x + l.nodes[0].label.x),
          Math.round(l.source.y + l.nodes[0].label.y),
          l.nodes[0].label.text,
          l.nodes[0].label.style,
          l.nodes[0].label.rotation,
          'source'
        );

        const targetInterface = new InterfaceLabel(
          Math.round(  l.target.x + l.nodes[1].label.x),
          Math.round( l.target.y + l.nodes[1].label.y),
          l.nodes[1].label.text,
          l.nodes[1].label.style,
          l.nodes[1].label.rotation,
          'target'
        );

        return [sourceInterface, targetInterface];
      });

    const enter = labels
      .enter()
        .append<SVGTextElement>('text')
          .attr('class', 'interface_label noselect');

    const merge = labels
      .merge(enter);

    merge
      .text((l: InterfaceLabel) => l.text)
      .attr('x', function(this: SVGTextElement, l: InterfaceLabel) {
        /* @todo: in GUI probably it should be calculated based on the line; for now we keep it the same */
        // const link = select(this.parentElement);
        // const path = link.select<SVGPathElement>('path');
        // let point;
        // if (l.type === 'source') {
        //   point = path.node().getPointAtLength(40);
        // } else {
        //   point = path.node().getPointAtLength(path.node().getTotalLength() - 40);
        // }
        // return point.x + l.x;
        const bbox = this.getBBox();
        return l.x;
      })
      .attr('y', function(this: SVGTextElement, l: InterfaceLabel)  {
        /* @todo: in GUI probably it should be calculated based on the line; for now we keep it the same */
        // const link = select(this.parentElement);
        // const path = link.select<SVGPathElement>('path');
        // let point;
        // if (l.type === 'source') {
        //   point = path.node().getPointAtLength(40);
        // } else {
        //   point = path.node().getPointAtLength(path.node().getTotalLength() - 40);
        // }
        // return point.y + l.y;
        const bbox = this.getBBox();
        return l.y + bbox.height;
      })
      .attr('style', (l: InterfaceLabel) => this.cssFixer.fix(l.style))
      .attr('transform', (l: InterfaceLabel) => `rotate(${l.rotation}, ${l.x}, ${l.y})`);

    labels
      .exit()
      .remove();

  }
}
