import { Injectable } from "@angular/core";

import { Widget } from "./widget";
import { SVGSelection } from "../models/types";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";
import { select } from "d3-selection";
import { MapNode } from "../models/map/map-node";
import { SelectionManager } from "../managers/selection-manager";
import { Draggable } from "../events/draggable";
import { MapLabel } from "../models/map/map-label";


@Injectable()
export class LabelWidget implements Widget {
  public draggable = new Draggable<SVGGElement, MapLabel>();
  
  static NODE_LABEL_MARGIN = 3;

  constructor(
    private cssFixer: CssFixer,
    private fontFixer: FontFixer,
    private selectionManager: SelectionManager
  ) {}

  public redrawLabel(view: SVGSelection, label: MapLabel) {
    this.drawLabel(this.selectLabel(view, label));
  }

  public draw(view: SVGSelection) {
    const label_view = view
      .selectAll<SVGGElement, MapLabel>("g.label_container")
      .data((node: MapNode) => {
        return [node.label];
      });

    const label_enter = label_view.enter()
      .append<SVGGElement>('g')
        .attr('class', 'label_container')
        .attr('label_id', (l: MapLabel) => l.id)

    const merge = label_view.merge(label_enter);

    this.drawLabel(merge);

    label_view
      .exit()
        .remove();

    this.draggable.call(label_view);
  }


  private drawLabel(view: SVGSelection) {
    const label_body = view.selectAll<SVGGElement, MapLabel>("g.label_body")
      .data((label) => [label]);

    const label_body_enter = label_body.enter()
      .append<SVGGElement>('g')
        .attr("class", "label_body");

    // add label of node
    label_body_enter
      .append<SVGTextElement>('text')
        .attr('class', 'label');

    label_body_enter
      .append<SVGRectElement>('rect')
        .attr('class', 'label_selection');

    const label_body_merge = label_body.merge(label_body_enter)

    label_body_merge
      .select<SVGTextElement>('text.label')
        .attr('label_id', (l: MapLabel) => l.id)
        // .attr('y', (n: Node) => n.label.y - n.height / 2. + 10)  // @todo: server computes y in auto way
        .attr('style', (l: MapLabel) => {
          let styles = this.cssFixer.fix(l.style);
          styles = this.fontFixer.fixStyles(styles);
          return styles;
        })
        .text((l: MapLabel) => l.text)
        .attr('x', function (this: SVGTextElement, l: MapLabel) {
          // if (l.x === null) {
          //   // center
          //   const bbox = this.getBBox();
          //   return -bbox.width / 2.;
          // }
          return l.x + LabelWidget.NODE_LABEL_MARGIN;
        })
        .attr('y', function (this: SVGTextElement, l: MapLabel) {
          let bbox = this.getBBox();

          // if (n.label.x === null) {
          //   // center
          //   bbox = this.getBBox();
          //   return - n.height / 2. - bbox.height ;
      // selected.filter((item) => item instanceof MapLabel).forEach((label: MapLabel) => {
      //   label.x += evt.dx;
      //   label.y += evt.dy;
      //   console.log("test");
      //   // this.drawingsWidget.redrawDrawing(svg, label);
      // });
          // }
          return l.y + bbox.height - LabelWidget.NODE_LABEL_MARGIN;
        })
        .attr('transform', (l: MapLabel) => {
          return `rotate(${l.rotation}, ${l.x}, ${l.y})`;
        })

  label_body_merge
    .select<SVGRectElement>('rect.label_selection')
    .attr('visibility', (l: MapLabel) => this.selectionManager.isSelected(l) ? 'visible' : 'hidden')
      .attr('stroke', 'black')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', '0.5')
      .attr('fill', 'none')
      .each(function (this: SVGRectElement, l: MapLabel) {
        const current = select(this);
        const textLabel = label_body_merge.select<SVGTextElement>(`text[label_id="${l.id}"]`);
        const bbox = textLabel.node().getBBox();
        const border = 2;

        current.attr('width', bbox.width + border * 2);
        current.attr('height', bbox.height + border * 2);
        current.attr('x', bbox.x - border);
        current.attr('y', bbox.y - border);
      });
  }

  private selectLabel(view: SVGSelection, label: MapLabel) {
    return view.selectAll<SVGGElement, MapLabel>(`g.label_container[label_id="${label.id}"]`);
  }

}
