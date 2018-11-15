import { Injectable } from "@angular/core";

import { SVGSelection } from "../../models/types";
import { Drawing } from "../../models/drawing";
import { ImageElement } from "../../models/drawings/image-element";
import { DrawingWidget } from "./drawing-widget";


@Injectable()
export class ImageDrawingWidget implements DrawingWidget {
  public draw(view: SVGSelection) {
    const drawing = view
      .selectAll<SVGImageElement, ImageElement>('image.image_element')
        .data((d: Drawing) => {
          return (d.element && d.element instanceof ImageElement) ? [d.element] : [];
        });

    const drawing_enter = drawing
      .enter()
        .append<SVGImageElement>('image')
        .attr('class', 'image_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('xlink:href', (image: ImageElement) => image.data)
      .attr('width', (image) => image.width)
      .attr('height', (image) => image.height);

    drawing
      .exit()
        .remove();

  }
}
