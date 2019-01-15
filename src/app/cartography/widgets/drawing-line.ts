import { Injectable } from '@angular/core';

import { line } from 'd3-shape';
import { mouse } from 'd3-selection';

import { DrawingLine } from '../models/drawing-line';
import { SVGSelection } from '../models/types';
import { Point } from '../models/point';
import { Context } from '../models/context';

@Injectable()
export class DrawingLineWidget {
  private drawingLine: DrawingLine = new DrawingLine();
  private selection: SVGSelection;
  private drawing = false;
  private data = {};

  public start(x: number, y: number, data: {}) {
    const self = this;

    this.drawing = true;
    this.data = data;
    this.drawingLine.start = new Point(x, y);
    this.drawingLine.end = new Point(x, y);

    const over = function(this, d, i) {
      const node = self.selection.select<SVGGElement>('g.canvas').node();
      const coordinates = mouse(node);
      self.drawingLine.end.x = coordinates[0];
      self.drawingLine.end.y = coordinates[1];
      self.draw(null, null);
    };

    this.selection.on('mousemove', over);
    this.draw(null, null);
  }

  public isDrawing() {
    return this.drawing;
  }

  public stop() {
    this.drawing = false;
    this.selection.on('mousemove', null);
    this.draw(null, null);
    return this.data;
  }

  public connect(selection: SVGSelection, context: Context) {
    this.selection = selection;
  }

  public draw(selection: SVGSelection, context: Context) {
    const canvas = this.selection.select<SVGGElement>('g.canvas');
    if (!canvas.select<SVGGElement>('g.drawing-line-tool').node()) {
      canvas.append<SVGGElement>('g').attr('class', 'drawing-line-tool');
    }

    let link_data = [];

    if (this.drawing) {
      link_data = [
        [[this.drawingLine.start.x, this.drawingLine.start.y], [this.drawingLine.end.x, this.drawingLine.end.y]]
      ];
    }

    const value_line = line();

    const drawing_line_tool = this.selection.select<SVGGElement>('g.drawing-line-tool');

    const tool = drawing_line_tool.selectAll<SVGGElement, DrawingLine>('path').data(link_data);

    const enter = tool.enter().append<SVGPathElement>('path');

    tool
      .merge(enter)
      .attr('d', value_line)
      .attr('stroke', '#000')
      .attr('stroke-width', '2');

    tool.exit().remove();
  }
}
