import {SVGSelection} from "../../../map/models/types";
import {Context} from "../../../map/models/context";
import {D3ZoomEvent, zoom} from "d3-zoom";
import { event } from "d3-selection";

export class MovingTool {
  private selection: SVGSelection;
  private context: Context;

  public connect(selection: SVGSelection, context: Context) {
    this.selection = selection;
    this.context = context;

    this.selection.call(zoom<SVGSVGElement, any>()
        .scaleExtent([1 / 2, 8]);
  }

  public draw(selection: SVGSelection, context: Context) {
    this.selection = selection;
    this.context = context;
  }

  public activate() {
    const self = this;

    const onZoom = function(this: SVGSVGElement) {
      const canvas = self.selection.select<SVGGElement>("g.canvas");
      const e: D3ZoomEvent<SVGSVGElement, any> = event;
      canvas.attr(
        'transform',
        `translate(${self.context.getSize().width / 2 + e.transform.x}, ` +
              `${self.context.getSize().height / 2 + e.transform.y}) scale(${e.transform.k})`);
    };

    this.selection.on('zoom', onZoom);
  }

  public deactivate() {
    this.selection.on('zoom', null);
  }
}
