import { Injectable } from '@angular/core';
import { Point } from './point';
import { Size } from './size';

export class Transformation {
  constructor(public x: number, public y: number, public k: number) {}
}

@Injectable()
export class Context {
  public transformation: Transformation;
  public size: Size;
  public centerZeroZeroPoint = true;
  /** Explicit SVG x-coordinate of the scene origin (0,0). Null = use size.width/2. */
  public centerX: number | null = null;
  /** Explicit SVG y-coordinate of the scene origin (0,0). Null = use size.height/2. */
  public centerY: number | null = null;

  constructor() {
    this.size = new Size(0, 0);
    this.transformation = new Transformation(0, 0, 1);
  }

  public getZeroZeroTransformationPoint() {
    if (this.centerZeroZeroPoint) {
      return new Point(
        this.centerX !== null ? this.centerX : this.size.width / 2,
        this.centerY !== null ? this.centerY : this.size.height / 2
      );
    }
    return new Point(0, 0);
  }
}
