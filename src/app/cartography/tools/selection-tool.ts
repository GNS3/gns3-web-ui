import { Injectable } from "@angular/core";
import { mouse, select } from "d3-selection";
import { Subject } from "rxjs";

import { SVGSelection } from "../models/types";
import { Context } from "../models/context";
import { Rectangle } from "../models/rectangle";


@Injectable()
export class SelectionTool {
  static readonly SELECTABLE_CLASS = '.selectable';

  public rectangleSelected = new Subject<Rectangle>();

  private path;
  private enabled = false;
  private needsDeactivate = false;
  private needsActivate = false;

  public constructor(
    private context: Context
  ) {}

  public setEnabled(enabled) {
    if (this.enabled != enabled) {
      if (enabled) {
        this.needsActivate = true;
      }
      else {
        this.needsDeactivate = true;
      }
    }
    this.enabled = enabled;
  }

  private activate(selection) {
    const self = this;

    selection.on("mousedown", function() {
      const subject = select(window);
      const parent = this.parentElement;

      const start = self.transformation(mouse(parent));
      self.startSelection(start);

      // clear selection
      selection
        .selectAll(SelectionTool.SELECTABLE_CLASS)
        .classed("selected", false);

      subject
        .on("mousemove.selection", function() {
          const end = self.transformation(mouse(parent));
          self.moveSelection(start, end);
        }).on("mouseup.selection", function() {
          const end = self.transformation(mouse(parent));
          self.endSelection(start, end);
          subject
            .on("mousemove.selection", null)
            .on("mouseup.selection", null);
        });
    });
  }

  private deactivate(selection) {
    selection.on('mousedown', null);
  }

  public draw(selection: SVGSelection, context: Context) {
    const canvas = selection.select<SVGGElement>("g.canvas");

    if (!canvas.select<SVGGElement>("g.selection-line-tool").node()) {
      const g = canvas.append<SVGGElement>('g');
      g.attr("class", "selection-line-tool");

      this.path = g.append("path");
      this.path
        .attr("class", "selection")
        .attr("visibility", "hidden");
    }

    if(this.needsActivate) {
      this.activate(selection);
      this.needsActivate = false;
    }
    if(this.needsDeactivate) {
      this.deactivate(selection);
      this.needsDeactivate = false;
    }
  }

  private startSelection(start) {
    this.path
      .attr("d", this.rect(start[0], start[1], 0, 0))
      .attr("visibility", "visible");
  }

  private moveSelection(start, move) {
    this.path.attr("d", this.rect(start[0], start[1], move[0] - start[0], move[1] - start[1]));
    this.selectedEvent(start, move);
  }

  private endSelection(start, end) {
    this.path.attr("visibility", "hidden");
    this.selectedEvent(start, end);
  }

  private selectedEvent(start, end) {
    const x = Math.min(start[0], end[0]);
    const y = Math.min(start[1], end[1]);
    const width = Math.abs(start[0] - end[0]);
    const height = Math.abs(start[1] - end[1]);
    this.rectangleSelected.next(new Rectangle(x, y, width, height));
  }

  private rect(x: number, y: number, w: number, h: number) {
    return "M" + [x, y] + " l" + [w, 0] + " l" + [0, h] + " l" + [-w, 0] + "z";
  }

  private transformation(point) {
    const transformation_point = this.context.getZeroZeroTransformationPoint();
    return [
      point[0] - transformation_point.x - this.context.transformation.x,
      point[1] - transformation_point.y - this.context.transformation.y
    ];
  }


}
