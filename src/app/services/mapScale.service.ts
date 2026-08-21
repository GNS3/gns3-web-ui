import { EventEmitter, Injectable } from '@angular/core';
import { Context } from '../cartography/models/context';

@Injectable()
export class MapScaleService {
  /** Shared zoom bounds — wheel zoom and the toolbar/keyboard buttons must agree. */
  public static readonly MIN_SCALE = 0.01;
  public static readonly MAX_SCALE = 5;

  public currentScale: number;
  public scaleChangeEmitter = new EventEmitter();

  constructor(private context: Context) {
    this.currentScale = 1;
  }

  getScale() {
    return this.currentScale;
  }

  setScale(newScale: number) {
    this.currentScale = newScale;
    this.context.transformation.k = this.currentScale;
    this.scaleChangeEmitter.emit(this.currentScale);
  }

  resetToDefault() {
    // Reset to the default view: scale 1 AND pan back to the origin. Pan lives
    // in transformation.x/y — leaving it set made "reset zoom" snap the scale
    // while the view stayed offset at the panned location.
    this.currentScale = 1;
    this.context.transformation.x = 0;
    this.context.transformation.y = 0;
    this.context.transformation.k = this.currentScale;
    this.scaleChangeEmitter.emit(this.currentScale);
  }

  /**
   * Sync the tracked scale with an externally reset transformation WITHOUT
   * emitting (project open: createGraph resets the context transformation to
   * k=1 itself; without this the app-singleton service would keep the previous
   * project's scale and the first toolbar zoom click would jump from it).
   */
  resetScaleState() {
    this.currentScale = 1;
  }
}
