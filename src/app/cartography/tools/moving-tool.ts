import { Injectable } from '@angular/core';

import { D3ZoomEvent, zoom, ZoomBehavior } from 'd3-zoom';
import { event } from 'd3-selection';

import { SVGSelection } from '../models/types';
import { Context } from '../models/context';

@Injectable()
export class MovingTool {
  private zoom: ZoomBehavior<SVGSVGElement, any>;
  private enabled = false;
  private needsDeactivate = false;
  private needsActivate = false;

  constructor(private context: Context) {
    this.zoom = zoom<SVGSVGElement, any>().scaleExtent([1 / 2, 8]);
  }

  public setEnabled(enabled) {
    if (this.enabled != enabled) {
      if (enabled) {
        this.needsActivate = true;
      } else {
        this.needsDeactivate = true;
      }
    }
    this.enabled = enabled;
  }

  public draw(selection: SVGSelection, context: Context) {
    if (this.needsActivate) {
      this.activate(selection);
      this.needsActivate = false;
    }
    if (this.needsDeactivate) {
      this.deactivate(selection);
      this.needsDeactivate = false;
    }
  }

  private activate(selection: SVGSelection) {
    const self = this;

    const onZoom = function(this: SVGSVGElement) {
      const canvas = selection.select<SVGGElement>('g.canvas');
      const e: D3ZoomEvent<SVGSVGElement, any> = event;
      canvas.attr('transform', () => {
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
    selection.call(this.zoom);
  }

  private deactivate(selection: SVGSelection) {
    // d3.js preserves event `mousedown.zoom` and blocks selection
    selection.on('mousedown.zoom', null);
    this.zoom.on('zoom', null);
  }
}
