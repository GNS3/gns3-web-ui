import { SVGSelection } from "../../models/types";
import { Drawing } from "../../models/drawing";
import { ImageElement } from "../../models/drawings/image-element";


export class ImageDrawingWidget {
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
      .attr('xlink:href', (image: ImageElement) => {
        let svg = image.data;
        if (svg.indexOf("xmlns") < 0) {
          svg = svg.replace('svg', 'svg xmlns="http://www.w3.org/2000/svg"');
        }
        return 'data:image/svg+xml;base64,' + btoa(svg);
      })
      .attr('width', (image) => image.width)
      .attr('height', (image) => image.height);


    drawing
      .exit()
        .remove();

  }
}
