import {SVGSelection} from "../../../map/models/types";
import {mouse, select} from "d3-selection";
import {Context} from "../../../map/models/context";
import {Subject} from "rxjs/Subject";
import {Rectangle} from "../models/rectangle";


export class SelectionTool {
  static readonly SELECTABLE_CLASS = '.selectable';

  public rectangleSelected = new Subject<Rectangle>();

  private selection: SVGSelection;
  private path;
  private context: Context;
  // public selectedSubject: Subject<Selectable[]>;

  public constructor() {
    // this.selectedSubject = new Subject<Selectable[]>();
  }

  public connect(selection: SVGSelection, context: Context) {
    this.selection = selection;
    this.context = context;
  }

  public activate() {
    const self = this;


    this.selection.on("mousedown", function() {
      const subject = select(window);
      const parent = this.parentElement;

      const start = self.transformation(mouse(parent));
      self.startSelection(start);

      // clear selection
      self.selection
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

  public deactivate() {
    this.selection.on('mousedown', null);
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
    this.selection = selection;
  }

  private startSelection(start) {
    this.path
      .attr("d", this.rect(start[0], start[1], 0, 0))
      .attr("visibility", "visible");
  }

  private moveSelection(start, move) {
    this.path.attr("d", this.rect(start[0], start[1], move[0] - start[0], move[1] - start[1]));
    this.selectedEvent(start, move);
    // this.getSelectedItems(start, move);
  }

  private endSelection(start, end) {
    this.path.attr("visibility", "hidden");
    // const selected_items = this.getSelectedItems(start, end);
    // this.selectedSubject.next(selected_items);
  }

  private selectedEvent(start, end) {
    const x = Math.min(start[0], end[0]);
    const y = Math.min(start[1], end[1]);
    const width = Math.abs(start[0] - end[0]);
    const height = Math.abs(start[1] - end[1]);
    this.rectangleSelected.next(new Rectangle(x, y, width, height));
  }

  // private getSelectedItems(start, end): Selectable[] {
  //   const x = Math.min(start[0], end[0]);
  //   const y = Math.min(start[1], end[1]);
  //   const width = Math.abs(start[0] - end[0]);
  //   const height = Math.abs(start[1] - end[1]);
  //   const items: Selectable[] = [];
  //
  //   this.selection
  //     .selectAll<null, Selectable>(SelectionTool.SELECTABLE_CLASS)
  //     .classed('selected', (item: Selectable) => {
  //
  //       const in_rect = (x <= item.x && item.x < (x + width) && y <= item.y && item.y < (y + height));
  //       if (in_rect) {
  //         items.push(item);
  //       }
  //       return in_rect;
  //     });
  //
  //   return items;
  // }

  private rect(x: number, y: number, w: number, h: number) {
    return "M" + [x, y] + " l" + [w, 0] + " l" + [0, h] + " l" + [-w, 0] + "z";
  }

  private transformation(point) {
    const transformation_point = this.context.getZeroZeroTransformationPoint();
    return [point[0] - transformation_point.x, point[1] - transformation_point.y];
  }


}
