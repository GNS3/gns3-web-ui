import {DrawingLine} from "../models/drawing-line.model";
import {SVGSelection} from "../../../map/models/types";
import {Point} from "../models/point.model";
import {line} from "d3-shape";
import {event, mouse, select} from "d3-selection";

export class DrawingLineWidget {
  private drawingLine: DrawingLine = new DrawingLine();
  private selection: SVGSelection;

  public start(x: number, y: number) {
    const self = this;

    console.log("Start", x, y);
    this.drawingLine.start = new Point(x, y);
    this.drawingLine.end = new Point(x, y);

    const over = function(this, d, i) {
      const node = self.selection.select<SVGGElement>('g.canvas').node();
      const coordinates = mouse(node);
      self.drawingLine.end.x = coordinates[0];
      self.drawingLine.end.y = coordinates[1];
      self.draw();
    };

    this.selection.on('mousemove', over);
    this.draw();
  }

  public update(x: number, y: number) {
    this.drawingLine.end = new Point(x, y);
  }

  public stop() {

  }

  public connect(selection: SVGSelection) {
    this.selection = selection;
    const canvas = this.selection.select<SVGGElement>("g.canvas");
    if (!canvas.select<SVGGElement>("g.drawing-line-tool").node()) {
      canvas.append<SVGGElement>('g').attr("class", "drawing-line-tool");
    }
  }

  public draw() {
    const link_data = [[
      [this.drawingLine.start.x, this.drawingLine.start.y],
      [this.drawingLine.end.x, this.drawingLine.end.y]
    ]];

    const value_line = line();

    const drawing_line_tool = this.selection.select<SVGGElement>('g.drawing-line-tool');

    const tool = drawing_line_tool
        .selectAll<SVGGElement, DrawingLine>('path')
        .data(link_data);

    const enter = tool
      .enter()
        .append<SVGPathElement>('path');

    tool
      .merge(enter)
        .attr('d', value_line)
        .attr('stroke', '#000')
        .attr('stroke-width', '2');
    
  }
}
