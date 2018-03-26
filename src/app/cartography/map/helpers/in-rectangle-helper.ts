import {Selectable} from "../../shared/managers/selection-manager";
import {Rectangle} from "../../shared/models/rectangle";
import {Injectable} from "@angular/core";

@Injectable()
export class InRectangleHelper {
  public inRectangle(item: Selectable, rectangle: Rectangle): boolean {
    return (rectangle.x <= item.x && item.x < (rectangle.x + rectangle.width)
      && rectangle.y <= item.y && item.y < (rectangle.y + rectangle.height));
  }
}
