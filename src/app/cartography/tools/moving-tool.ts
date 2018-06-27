import { D3ZoomEvent, zoom, ZoomBehavior} from "d3-zoom";
import { event } from "d3-selection";

import { SVGSelection} from "../models/types";
import { Context} from "../models/context";


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
      () => {
        self.context.transformation.x = e.transform.x;
        self.context.transformation.y = e.transform.y;
        self.context.transformation.k = e.transform.k;

        const xTrans = self.context.getZeroZeroTransformationPoint().x + self.context.transformation.x;
        const yTrans = self.context.getZeroZeroTransformationPoint().y + self.context.transformation.y;
        const kTrans = self.context.transformation.k;
        return `translate(${xTrans}, ${yTrans}) scale(${kTrans})`;
      });
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
