import { Injectable } from '@angular/core';
import { DrawingElement } from '../models/drawings/drawing-element';
import { SvgConverter } from './svg-to-drawing-converter/svg-converter';
import { TextConverter } from './svg-to-drawing-converter/text-converter';
import { ImageConverter } from './svg-to-drawing-converter/image-converter';
import { RectConverter } from './svg-to-drawing-converter/rect-converter';
import { LineConverter } from './svg-to-drawing-converter/line-converter';
import { EllipseConverter } from './svg-to-drawing-converter/ellipse-converter';

@Injectable()
export class SvgToDrawingConverter {
  private parser: DOMParser;
  private elementParsers: { [key: string]: SvgConverter };

  constructor() {
    this.parser = new DOMParser();
    this.elementParsers = {
      text: new TextConverter(),
      image: new ImageConverter(),
      rect: new RectConverter(),
      line: new LineConverter(),
      ellipse: new EllipseConverter()
    };
  }

  supportedTags() {
    return Object.keys(this.elementParsers);
  }

  convert(svg: string): DrawingElement {
    const svgDom = this.parser.parseFromString(svg, 'text/xml');
    const roots = svgDom.getElementsByTagName('svg');
    if (roots.length !== 1) {
      throw new Error(`Cannot locate svg element root in '${svg}'`);
    }
    const svgRoot = roots[0];

    let parser: SvgConverter = null;
    let child: any = null;

    // find matching tag
    for (const i in svgRoot.children) {
      child = svgRoot.children[i];
      const name = child.nodeName;
      if (name in this.elementParsers) {
        parser = this.elementParsers[name];
        break;
      }
    }

    if (parser === null) {
      throw new Error(`Cannot find parser for '${svg}'`);
    }

    const drawing = parser.convert(child);

    drawing.width = +svgRoot.getAttribute('width');
    drawing.height = +svgRoot.getAttribute('height');

    return drawing;
  }
}
