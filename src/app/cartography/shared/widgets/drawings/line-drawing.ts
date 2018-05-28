import { SVGSelection } from "../../models/types";
import { Drawing } from "../../models/drawing";
import { LineElement } from "../../models/drawings/line-element";
import { DrawingWidget } from "./drawing-widget";


export class LineDrawingWidget implements DrawingWidget {
  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGLineElement, LineElement>('line.line_element')
        .data((d: Drawing) => {
          return (d.element && d.element instanceof LineElement) ? [d.element] : [];
        });

    const drawing_enter = drawing
      .enter()
        .append<SVGLineElement>('line')
        .attr('class', 'line_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('stroke', (line) => line.stroke)
      .attr('stroke-width', (line) => line.stroke_width)
      .attr('stroke-dasharray', (line) => line.stroke_dasharray)
      .attr('x1', (line) => line.x1)
      .attr('x2', (line) => line.x2)
      .attr('y1', (line) => line.y1)
      .attr('y2', (line) => line.y2);

    drawing
      .exit()
        .remove();

  }
}
