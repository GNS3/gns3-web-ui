import { Injectable } from "@angular/core";

import { Selectable } from "../../shared/managers/selection-manager";
import { Rectangle } from "../../shared/models/rectangle";


@Injectable()
export class InRectangleHelper {
  public inRectangle(rectangle: Rectangle, x: number, y: number): boolean {
    return (rectangle.x <= x && x < (rectangle.x + rectangle.width)
      && rectangle.y <= y && y < (rectangle.y + rectangle.height));
  }
}
