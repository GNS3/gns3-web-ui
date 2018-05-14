import { Injectable } from "@angular/core";
import { DrawingElement } from "../../shared/models/drawings/drawing-element";
import { SvgConverter } from "./svg-to-drawing-converter/svg-converter";
import { TextConverter } from "./svg-to-drawing-converter/text-converter";


@Injectable()
export class SvgToDrawingConverter {
  private parser: DOMParser;
  private elementParsers: { [key: string]: SvgConverter };

  constructor() {
    this.parser = new DOMParser();
    this.elementParsers = {
      'text': new TextConverter()
    };
  }

  convert(svg: string): DrawingElement {
    const svgDom = this.parser.parseFromString(svg, 'text/xml');
    const roots = svgDom.getElementsByTagName('svg');
    if (roots.length !== 1) {
      throw new Error(`Cannot locate svg element root in '${svg}'`);
    }
    const svgRoot = roots[0];

    const child = svgRoot.firstChild;
    if (!child) {
      throw new Error(`Cannot find first child in '${svg}`);
    }

    const name = child.nodeName;
    if (!(name in this.elementParsers)) {
      throw new Error(`Cannot find parser for '${name}'`);
    }

    const parser = this.elementParsers[name];
    const drawing = parser.convert(child);

    drawing.width = +svgRoot.getAttribute('width');
    drawing.height = +svgRoot.getAttribute('height');

    return drawing;
  }


}
