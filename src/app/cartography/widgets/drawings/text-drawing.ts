import { Injectable } from '@angular/core';
import { FontFixer } from '../../helpers/font-fixer';
import { TextElement } from '../../models/drawings/text-element';
import { MapDrawing } from '../../models/map/map-drawing';
import { SVGSelection } from '../../models/types';
import { DrawingShapeWidget } from './drawing-shape-widget';

@Injectable()
export class TextDrawingWidget implements DrawingShapeWidget {
  static MARGIN = 4;

  constructor(private fontFixer: FontFixer) {}

  public draw(view: SVGSelection) {
    const drawing = view.selectAll<SVGTextElement, TextElement>('text.text_element').data((d: MapDrawing) => {
      return d.element && d.element instanceof TextElement ? [d.element] : [];
    });

    const drawing_enter = drawing.enter().append<SVGTextElement>('text').attr('class', 'text_element noselect');

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
        return styles.join('; ');
      })
      .attr('dominant-baseline', 'text-before-edge')
      .attr('fill', (text) => text.fill)
      .attr('text-decoration', (text) => text.text_decoration);

    const lines = merge.selectAll<SVGTSpanElement, string>('tspan').data((text: TextElement) => {
      return text.text.split(/\r?\n/);
    });

    const lines_enter = lines.enter().append<SVGTSpanElement>('tspan');

    const lines_merge = lines.merge(lines_enter);

    lines_merge
      .text((line) => line)
      .attr('xml:space', 'preserve')
      .attr('x', 0)
      .attr('dy', (line, i) => (i === 0 ? '0em' : '1.4em'));

    lines.exit().remove();

    // Center glyphs inside the text drawing box so GUI/WebUI look consistent.
    merge.attr('transform', function (this: SVGTextElement, text: TextElement) {
      const bbox = this.getBBox();
      const expectedHeight = Number(text.height);
      const fillRatio = expectedHeight > 0 ? bbox.height / expectedHeight : 0;
      const yOffset =
        isFinite(expectedHeight) && fillRatio > 0.5 ? expectedHeight / 2 - (bbox.y + bbox.height / 2) : 0;
      return `translate(0, ${yOffset})`;
    });

    drawing.exit().remove();
  }
}
