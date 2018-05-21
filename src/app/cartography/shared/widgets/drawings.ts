import { Widget } from "./widget";
import { Drawing } from "../models/drawing";
import { SVGSelection } from "../models/types";
import { Layer } from "../models/layer";
import { TextDrawingWidget } from "./drawings/text-drawing";
import { SvgToDrawingConverter } from "../helpers/svg-to-drawing-converter";
import { ImageDrawingWidget } from "./drawings/image-drawing";
import { RectDrawingWidget } from "./drawings/rect-drawing";
import { LineDrawingWidget } from "./drawings/line-drawing";
import { EllipseDrawingWidget } from "./drawings/ellipse-drawing";


export class DrawingsWidget implements Widget {
  private svgToDrawingConverter: SvgToDrawingConverter;

  constructor() {
    this.svgToDrawingConverter = new SvgToDrawingConverter();
  }

  public draw(view: SVGSelection, drawings?: Drawing[]) {
    const drawing = view
      .selectAll<SVGGElement, Drawing>('g.drawing')
      .data((l: Layer) => {
        l.drawings.forEach((d: Drawing) => {
          try {
            d.element = this.svgToDrawingConverter.convert(d.svg);
          } catch (error) {
            console.log(`Cannot convert due to Error: '${error}'`);
          }
        });
        return l.drawings;
      }, (d: Drawing) => {
        return d.drawing_id;
      });

    const drawing_enter = drawing.enter()
      .append<SVGGElement>('g')
      .attr('class', 'drawing');

    const drawing_merge = drawing.merge(drawing_enter)
      .attr('transform', (d: Drawing) => {
        return `translate(${d.x},${d.y})`;
      });

    const text_drawing = new TextDrawingWidget();
    text_drawing.draw(drawing_merge);

    const image_drawing = new ImageDrawingWidget();
    image_drawing.draw(drawing_merge);

    const rect_drawing = new RectDrawingWidget();
    rect_drawing.draw(drawing_merge);

    const line_drawing = new LineDrawingWidget();
    line_drawing.draw(drawing_merge);

    const ellipse_drawing = new EllipseDrawingWidget();
    ellipse_drawing.draw(drawing_merge);

    drawing
      .exit()
        .remove();

  }
}
