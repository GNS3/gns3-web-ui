import { Injectable } from "@angular/core";

import { SVGSelection } from "../../models/types";
import { Drawing } from "../../models/drawing";
import { EllipseElement } from "../../models/drawings/ellipse-element";
import { DrawingWidget } from "./drawing-widget";
import { QtDasharrayFixer } from "../../helpers/qt-dasharray-fixer";


@Injectable()
export class EllipseDrawingWidget implements DrawingWidget {

  constructor(
    private qtDasharrayFixer: QtDasharrayFixer
  ) {}

  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGEllipseElement, EllipseElement>('ellipse.ellipse_element')
        .data((d: Drawing) => {
          return (d.element && d.element instanceof EllipseElement) ? [d.element] : [];
        });

    const drawing_enter = drawing
      .enter()
        .append<SVGEllipseElement>('ellipse')
          .attr('class', 'ellipse_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('fill', (ellipse) => ellipse.fill)
      .attr('fill-opacity', (ellipse) => ellipse.fill_opacity)
      .attr('stroke', (ellipse) => ellipse.stroke)
      .attr('stroke-width', (ellipse) => ellipse.stroke_width)
      .attr('stroke-dasharray', (ellipse) => this.qtDasharrayFixer.fix(ellipse.stroke_dasharray))
      .attr('cx', (ellipse) => ellipse.cx)
      .attr('cy', (ellipse) => ellipse.cy)
      .attr('rx', (ellipse) => ellipse.rx)
      .attr('ry', (ellipse) => ellipse.ry);

    drawing
      .exit()
        .remove();

  }
}
