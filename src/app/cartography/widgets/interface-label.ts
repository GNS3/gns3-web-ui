import { SVGSelection } from "../models/types";
import { Link } from "../../models/link";
import { InterfaceLabel } from "../models/interface-label";
import { CssFixer } from "../helpers/css-fixer";
import { select } from "d3-selection";
import { Inject } from "@angular/core";


export class InterfaceLabelWidget {
  static SURROUNDING_TEXT_BORDER = 5;

  private enabled = true;

  constructor(
    @Inject(CssFixer) private cssFixer: CssFixer
  ) {
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  draw(selection: SVGSelection) {

    const labels = selection
      .selectAll<SVGGElement, InterfaceLabel>('g.interface_label_container')
      .data((l: Link) => {
        const sourceInterface = new InterfaceLabel(
          l.link_id,
          'source',
          Math.round(l.source.x + l.nodes[0].label.x),
          Math.round(l.source.y + l.nodes[0].label.y),
          l.nodes[0].label.text,
          l.nodes[0].label.style,
          l.nodes[0].label.rotation,
          l.nodes[0].label.is_selected
        );

        const targetInterface = new InterfaceLabel(
          l.link_id,
          'target',
          Math.round(  l.target.x + l.nodes[1].label.x),
          Math.round( l.target.y + l.nodes[1].label.y),
          l.nodes[1].label.text,
          l.nodes[1].label.style,
          l.nodes[1].label.rotation,
          l.nodes[1].label.is_selected
        );

        if (this.enabled) {
          return [sourceInterface, targetInterface];
        }
        return [];
      });

    const enter = labels
      .enter()
        .append<SVGGElement>('g')
        .classed('interface_label_container', true);

    // create surrounding rect
    enter
      .append<SVGRectElement>('rect')
        .attr('class', 'interface_label_border');

    // create label
    enter
      .append<SVGTextElement>('text')
        .attr('class', 'interface_label noselect');

    const merge = labels
      .merge(enter);

    merge
      .attr('width', 100)
      .attr('height', 100)
      .attr('transform', function(this: SVGGElement, l: InterfaceLabel) {
        const bbox = this.getBBox();
        const x = l.x;
        const y = l.y + bbox.height;
        return `translate(${x}, ${y}) rotate(${l.rotation}, ${x}, ${y})`;
      })
      .classed('selected', (l: InterfaceLabel) => l.is_selected);

    // update label
    merge
      .select<SVGTextElement>('text.interface_label')
        .text((l: InterfaceLabel) => l.text)
        .attr('style', (l: InterfaceLabel) => this.cssFixer.fix(l.style))
        .attr('x', -InterfaceLabelWidget.SURROUNDING_TEXT_BORDER)
        .attr('y', -InterfaceLabelWidget.SURROUNDING_TEXT_BORDER);


    // update surrounding rect
    merge
      .select<SVGRectElement>('rect.interface_label_border')
        .attr('visibility', (l: InterfaceLabel) => l.is_selected ? 'visible' : 'hidden')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', '0.5')
        .each(function (this: SVGRectElement, l: InterfaceLabel) {
          const current = select(this);
          const parent = select(this.parentElement);
          const text = parent.select<SVGTextElement>('text');
          const bbox = text.node().getBBox();

          const border = InterfaceLabelWidget.SURROUNDING_TEXT_BORDER;

          current.attr('width', bbox.width + border*2);
          current.attr('height', bbox.height + border);
          current.attr('x', - border);
          current.attr('y', - bbox.height);
        });

    labels
      .exit()
      .remove();

  }
}
