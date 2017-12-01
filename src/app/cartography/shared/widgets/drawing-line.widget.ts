import {DrawingLine} from "../models/drawing-line.model";
import {SVGSelection} from "../../../map/models/types";
import {Point} from "../models/point.model";
import {line} from "d3-shape";

export class DrawingLineWidget {
  private drawingLine: DrawingLine = new DrawingLine();
  private selection: SVGSelection;

  public start(x: number, y: number) {
    this.drawingLine.start = new Point(x, y);
    this.drawingLine.end = new Point(x, y);

    this.draw();
  }

  public update(x: number, y: number) {
    this.drawingLine.end = new Point(x, y);
  }

  public stop() {
    
  }

  public connect(selection: SVGSelection) {
    this.selection = selection;
  }

  public draw() {
    const link_data = [[
      [this.drawingLine.start.x, this.drawingLine.start.y],
      [this.drawingLine.end.x, this.drawingLine.end.y]
    ]];

    const value_line = line();

    const tool = this.selection
        .selectAll<SVGGElement, DrawingLine>('g.drawing-line')
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
