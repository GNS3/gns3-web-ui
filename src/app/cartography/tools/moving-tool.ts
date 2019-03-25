import { Injectable } from '@angular/core';

import { D3ZoomEvent, zoom, ZoomBehavior } from 'd3-zoom';
import { event } from 'd3-selection';

import { SVGSelection } from '../models/types';
import { Context } from '../models/context';
import { MapScaleService } from '../../services/mapScale.service';

@Injectable()
export class MovingTool {
  private zoom: ZoomBehavior<SVGSVGElement, any>;
  private enabled = false;
  private needsDeactivate = false;
  private needsActivate = false;

  constructor(
    private context: Context,
    private mapScaleService: MapScaleService
  ) {
    this.zoom = zoom<SVGSVGElement, any>().scaleExtent([0, 100]).clickDistance(5);
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

    this.zoom.on('zoom',  function() {
      const canvas = selection.select<SVGGElement>('g.canvas');
      const e: D3ZoomEvent<SVGSVGElement, any> = event;

      if (event.sourceEvent.type === "mousemove") {
        canvas.attr('transform', () => {
          self.context.transformation.x = e.transform.x;
          self.context.transformation.y = e.transform.y;

          const xTrans = self.context.getZeroZeroTransformationPoint().x + self.context.transformation.x;
          const yTrans = self.context.getZeroZeroTransformationPoint().y + self.context.transformation.y;
  
          return `translate(${xTrans}, ${yTrans}) scale(${self.mapScaleService.getScale()})`;
        });
      } else if (event.sourceEvent.type === "wheel") {
        canvas.attr('transform', () => {

          let deltaMode = e.sourceEvent.deltaMode ? 120 : 1;
          let wheelSteps = (Math.log(e.transform.k) / Math.log(2)) / Math.abs(e.sourceEvent.deltaY * deltaMode / 500);
          let kTrans = 1 + (wheelSteps*0.1);

          self.mapScaleService.setScale(kTrans);
  
          return `translate(${self.context.getZeroZeroTransformationPoint().x + self.context.transformation.x}, 
            ${self.context.getZeroZeroTransformationPoint().y + self.context.transformation.y}) 
            scale(${self.mapScaleService.getScale()})`;
        });
      }
    });

    selection.call(this.zoom);
  }

  private deactivate(selection: SVGSelection) {
    // d3.js preserves event `mousedown.zoom` and blocks selection
    selection.on('mousedown.zoom', null);
    this.zoom.on('zoom', null);
  }
}
