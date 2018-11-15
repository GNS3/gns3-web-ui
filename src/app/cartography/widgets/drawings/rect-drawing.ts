import { Injectable } from "@angular/core";

import { SVGSelection } from "../../models/types";
import { RectElement } from "../../models/drawings/rect-element";
import { DrawingShapeWidget } from "./drawing-shape-widget";
import { QtDasharrayFixer } from "../../helpers/qt-dasharray-fixer";
import { MapDrawing } from "../../models/map/map-drawing";


@Injectable()
export class RectDrawingWidget implements DrawingShapeWidget {
  constructor(
    private qtDasharrayFixer: QtDasharrayFixer
  ) {}

  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGRectElement, RectElement>('rect.rect_element')
        .data((d: MapDrawing) => {
          return (d.element && d.element instanceof RectElement) ? [d.element] : [];
        });

    const drawing_enter = drawing
      .enter()
        .append<SVGRectElement>('rect')
        .attr('class', 'rect_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('fill', (rect) => rect.fill)
      .attr('fill-opacity', (rect) => rect.fill_opacity)
      .attr('stroke', (rect) => rect.stroke)
      .attr('stroke-width', (rect) => rect.stroke_width)
      .attr('stroke-dasharray', (rect) => this.qtDasharrayFixer.fix(rect.stroke_dasharray))
      .attr('width', (rect) => rect.width)
      .attr('height', (rect) => rect.height);

    drawing
      .exit()
        .remove();

  }
}
