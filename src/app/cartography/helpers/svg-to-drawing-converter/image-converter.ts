import { SvgConverter } from './svg-converter';
import { ImageElement } from '../../models/drawings/image-element';

export class ImageConverter implements SvgConverter {
  convert(element: Element): ImageElement {
    const drawing = new ImageElement();

    const data = element.attributes.getNamedItem('xlink:href');
    if (data) {
      drawing.data = data.value;
    }

    const width = element.attributes.getNamedItem('width');
    if (width) {
      drawing.width = parseInt(width.value, 10);
    }

    const height = element.attributes.getNamedItem('height');
    if (height) {
      drawing.height = parseInt(height.value, 10);
    }

    return drawing;
  }
}
