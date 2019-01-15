import { Injectable } from '@angular/core';

import { Rectangle } from '../models/rectangle';

@Injectable()
export class InRectangleHelper {
  public inRectangle(rectangle: Rectangle, x: number, y: number): boolean {
    return (
      rectangle.x <= x && x < rectangle.x + rectangle.width && rectangle.y <= y && y < rectangle.y + rectangle.height
    );
  }
}
