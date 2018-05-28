import { SvgConverter } from "./svg-converter";
import { EllipseElement } from "../../models/drawings/ellipse-element";


export class EllipseConverter implements SvgConverter {
  convert(node: Node): EllipseElement {
    const drawing = new EllipseElement();

    const fill = node.attributes.getNamedItem("fill");
    if (fill) {
      drawing.fill = fill.value;
    }

    const fill_opacity = node.attributes.getNamedItem("fill-opacity");
    if (fill) {
      drawing.fill_opacity = parseFloat(fill_opacity.value);
    }

    const stroke = node.attributes.getNamedItem("stroke");
    if (stroke) {
      drawing.stroke = stroke.value;
    }

    const stroke_width = node.attributes.getNamedItem("stroke-width");
    if (stroke) {
      drawing.stroke_width = parseInt(stroke_width.value, 10);
    }

    const stroke_dasharray = node.attributes.getNamedItem("stroke-dasharray");
    if (stroke_dasharray) {
      drawing.stroke_dasharray = stroke_dasharray.value;
    }

    const cx = node.attributes.getNamedItem('cx');
    if (cx) {
      drawing.cx = parseInt(cx.value, 10);
    }

    const cy = node.attributes.getNamedItem('cy');
    if (cy) {
      drawing.cy = parseInt(cy.value, 10);
    }

    const rx = node.attributes.getNamedItem('rx');
    if (rx) {
      drawing.rx = parseInt(rx.value, 10);
    }

    const ry = node.attributes.getNamedItem('ry');
    if (ry) {
      drawing.ry = parseInt(ry.value, 10);
    }

    return drawing;
  }
}
