import { Injectable } from '@angular/core';
import { pointer } from 'd3-selection';
import { line, curveCatmullRom } from 'd3-shape';
import { Context } from '../models/context';
import { DrawingLine } from '../models/drawing-line';
import { Point } from '../models/point';
import { SVGSelection } from '../models/types';

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
    this.drawingLine.points = [new Point(x, y)];

    const over = function (this: SVGGElement, event: MouseEvent, d: unknown) {
      const node = self.selection.select<SVGGElement>('g.canvas').node();
      const coordinates = pointer(event, node);
      // Add point on mousemove during drawing
      if (self.drawing) {
        self.drawingLine.points.push(new Point(coordinates[0], coordinates[1]));
      }
      self.draw(null, null);
    };

    const keydown = function (this: SVGGElement, event: KeyboardEvent, d: unknown) {
      if (event.key === 'Escape') {
        self.cancel();
      }
    };

    // In zoneless mode, mousemove events run without Angular CD
    this.selection.on('mousemove', over);
    this.selection.on('keydown', keydown);
    this.draw(null, null);
  }

  public isDrawing() {
    return this.drawing;
  }

  public cancel() {
    this.drawing = false;
    this.drawingLine.points = [];
    this.selection.on('mousemove', null);
    this.selection.on('keydown', null);
    this.draw(null, null);
  }

  public stop() {
    this.drawing = false;
    this.selection.on('mousemove', null);
    this.selection.on('keydown', null);
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

    const drawing_line_tool = this.selection.select<SVGGElement>('g.drawing-line-tool');

    let link_data: [number, number][][] = [];

    if (this.drawing && this.drawingLine.points.length > 0) {
      // Convert points to array format for d3
      link_data = [
        this.drawingLine.points.map((p) => [p.x, p.y] as [number, number]),
      ];
    }

    // Use d3.line with curveCatmullRom for smooth curves
    const value_line = line<[number, number]>().curve(curveCatmullRom);

    const tool = drawing_line_tool.selectAll<SVGPathElement, [number, number][]>('path').data(link_data);

    tool.exit().remove();

    const enter = tool.enter().append<SVGPathElement>('path');

    tool.merge(enter).attr('d', value_line).attr('stroke', '#000').attr('stroke-width', '2').attr('fill', 'none');
  }
}
