import {Widget} from "./widget";
import {Drawing} from "../models/drawing";
import {SVGSelection} from "../models/types";
import {Layer} from "../models/layer";
import { TextDrawingWidget } from "./drawings/text-drawing";
import { SvgToDrawingConverter } from "../../map/helpers/svg-to-drawing-converter";


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

    // const parser = new DOMParser();

    // const drawing_image = drawing_enter.append<SVGImageElement>('image')
    //     .attr('xlink:href', (d: Drawing) => {
    //       let svg = d.svg;
    //       if (svg.indexOf("xmlns") < 0) {
    //         svg = svg.replace('svg', 'svg xmlns="http://www.w3.org/2000/svg"');
    //       }
    //
    //       return 'data:image/svg+xml;base64,' + btoa(svg);
    //     })
    //     .attr('width', (d: Drawing) => {
    //       const svg_dom = parser.parseFromString(d.svg, 'text/xml');
    //       const roots = svg_dom.getElementsByTagName('svg');
    //       if (roots.length > 0) {
    //         if (roots[0].hasAttribute('width')) {
    //           return roots[0].getAttribute('width');
    //         }
    //       }
    //       return 0;
    //     })
    //     .attr('height', (d: Drawing) => {
    //       const svg_dom = parser.parseFromString(d.svg, 'text/xml');
    //       const roots = svg_dom.getElementsByTagName('svg');
    //       if (roots.length > 0) {
    //         if (roots[0].hasAttribute('height')) {
    //           return roots[0].getAttribute('height');
    //         }
    //       }
    //       return 0;
    //     });

    const drawing_merge = drawing.merge(drawing_enter)
      .attr('transform', (d: Drawing) => {
        return `translate(${d.x},${d.y})`;
      });

    const text_drawing = new TextDrawingWidget();
    text_drawing.draw(drawing_merge);

    drawing
      .exit()
        .remove();

  }
}
