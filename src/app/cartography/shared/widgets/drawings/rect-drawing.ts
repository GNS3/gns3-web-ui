import { SVGSelection } from "../../models/types";
import { Drawing } from "../../models/drawing";
import { RectElement } from "../../models/drawings/rect-element";
import { DrawingWidget } from "./drawing-widget";


export class RectDrawingWidget implements DrawingWidget {
  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGRectElement, RectElement>('rect.rect_element')
        .data((d: Drawing) => {
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
      .attr('stroke-dasharray', (rect) => rect.stroke_dasharray)
      .attr('width', (rect) => rect.width)
      .attr('height', (rect) => rect.height);

    drawing
      .exit()
        .remove();

  }
}
