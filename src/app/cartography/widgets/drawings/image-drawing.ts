import { Injectable } from '@angular/core';

import { ImageElement } from '../../models/drawings/image-element';
import { MapDrawing } from '../../models/map/map-drawing';
import { SVGSelection } from '../../models/types';
import { DrawingShapeWidget } from './drawing-shape-widget';

@Injectable()
export class ImageDrawingWidget implements DrawingShapeWidget {
  public draw(view: SVGSelection) {
    const drawing = view.selectAll<SVGImageElement, ImageElement>('image.image_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof ImageElement ? [d.element] : [];
    });

    const drawing_enter = drawing
      .enter()
      .append<SVGImageElement>('image')
      .attr('class', 'image_element noselect');

    const merge = drawing.merge(drawing_enter);

    merge
      .attr('xlink:href', (image: ImageElement) => image.data)
      .attr('width', image => image.width)
      .attr('height', image => image.height);

    drawing.exit().remove();
  }
}
