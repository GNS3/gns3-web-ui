import {SVGSelection} from "../models/types";
import {Context} from "../models/context";
import {D3ZoomEvent, zoom, ZoomBehavior} from "d3-zoom";
import { event } from "d3-selection";

export class MovingTool {
  private selection: SVGSelection;
  private context: Context;
  private zoom: ZoomBehavior<SVGSVGElement, any>;

  constructor() {
    this.zoom = zoom<SVGSVGElement, any>()
        .scaleExtent([1 / 2, 8]);
  }

  public connect(selection: SVGSelection, context: Context) {
    this.selection = selection;
    this.context = context;

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

    this.zoom.on('zoom', onZoom);
    this.selection.call(this.zoom);
  }

  public deactivate() {
    // d3.js preserves event `mousedown.zoom` and blocks selection
    this.selection.on('mousedown.zoom', null);
    this.zoom.on('zoom', null);
  }
}
