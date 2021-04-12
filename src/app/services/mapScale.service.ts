import { Injectable, EventEmitter } from '@angular/core';
import { Context } from '../cartography/models/context';

@Injectable()
export class MapScaleService {
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
    this.currentScale = 1;
    this.context.transformation.k = this.currentScale;
    this.scaleChangeEmitter.emit(this.currentScale);
  }
}
