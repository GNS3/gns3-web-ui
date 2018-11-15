import { Injectable } from "@angular/core";

import { SVGSelection } from "../../models/types";
import { TextElement } from "../../models/drawings/text-element";
import { DrawingShapeWidget } from "./drawing-shape-widget";
import { FontFixer } from "../../helpers/font-fixer";
import { select } from "d3-selection";
import { MapDrawing } from "../../models/map/map-drawing";


@Injectable()
export class TextDrawingWidget implements DrawingShapeWidget {
  static MARGIN = 4;

  constructor(
    private fontFixer: FontFixer
  ) {}

  public draw(view: SVGSelection) {

    const drawing = view
      .selectAll<SVGTextElement, TextElement>('text.text_element')
        .data((d: MapDrawing) => {
          return (d.element && d.element instanceof TextElement) ? [d.element] : [];
        });

    const drawing_enter = drawing
      .enter()
        .append<SVGTextElement>('text')
        .attr('class', 'text_element noselect');

    const merge = drawing.merge(drawing_enter);
    merge
      .attr('style', (text: TextElement) => {
        const font = this.fontFixer.fix(text);

        const styles: string[] = [];
        if (font.font_family) {
          styles.push(`font-family: "${text.font_family}"`);
        }
        if (font.font_size) {
          styles.push(`font-size: ${text.font_size}pt`);
        }
        if (font.font_weight) {
          styles.push(`font-weight: ${text.font_weight}`);
        }
        return styles.join("; ");
      })
      .attr('fill', (text) => text.fill)
      .attr('text-decoration', (text) => text.text_decoration);

    const lines = merge.selectAll<SVGTSpanElement, string>('tspan')
      .data((text: TextElement) => {
        return text.text.split(/\r?\n/);
      });

    const lines_enter = lines
      .enter()
        .append<SVGTSpanElement>('tspan');

    const lines_merge = lines.merge(lines_enter);

    lines_merge
      .text((line) => line)
        .attr('xml:space', 'preserve')
        .attr('x', 0)
        .attr("dy", (line, i) => i === 0 ? '0em' : '1.2em');

    lines
      .exit()
        .remove();

    merge.attr('transform', function (this: SVGTextElement) {
        // SVG calculates y pos by the /bottom/ of the first tspan, hence we need to make some
        // approx and make it matching to GUI
        const tspan = select(this).selectAll<SVGTSpanElement, string>('tspan');
        const height = this.getBBox().height / tspan.size();
        return `translate(${TextDrawingWidget.MARGIN}, ${height - TextDrawingWidget.MARGIN})`;
    });

    drawing
      .exit()
        .remove();

  }
}
