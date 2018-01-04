import {SVGSelection} from "../../../map/models/types";
import {mouse, select} from "d3-selection";

export class SelectionTool {
  private selection: SVGSelection;
  private path;

  public connect(selection: SVGSelection) {
    const self = this;
    this.selection = selection;
    const canvas = this.selection.select<SVGGElement>("g.canvas");

    if (!canvas.select<SVGGElement>("g.selection-tool").node()) {
      const g = canvas.append<SVGGElement>('g');
      g.attr("class", "selection-line-tool");
      this.path = g.append("path");
      this.path.attr("class", "selection").attr("visibility", "hidden");
    }

    selection.on("mousedown", function() {
      const subject = select(window);
      const parent = this.parentNode;

      const start = mouse(parent);
        self.startSelection(start);
        subject
          .on("mousemove.selection", function() {
            self.moveSelection(start, mouse(parent));
          }).on("mouseup.selection", function() {
            self.endSelection(start, mouse(parent));
            subject.on("mousemove.selection", null).on("mouseup.selection", null);
          });
    });
  }

  public draw() {

  }

  private startSelection(start) {

  }

  private moveSelection(start, move) {

  }

  private endSelection(start, end) {

  }
}
