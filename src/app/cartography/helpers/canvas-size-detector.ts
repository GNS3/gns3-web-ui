import { Injectable } from '@angular/core';
import { Size } from '../models/size';

@Injectable()
export class CanvasSizeDetector {
  public getOptimalSize(minWidth: number, minHeight: number) {
    let width = document.documentElement.clientWidth;
    let height = document.documentElement.clientHeight;
    if (minWidth > width) {
      width = minWidth;
    }
    if (minHeight > height) {
      height = minHeight;
    }
    return new Size(width, height);
  }
}
