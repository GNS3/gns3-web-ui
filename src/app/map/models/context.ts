import {Size} from "../../cartography/shared/models/size";
import {Selection} from "d3-selection";
import {Point} from "../../cartography/shared/models/point";

export class Context {
  private size: Size;

  constructor(private centerZeroZeroPoint = false) {
    this.size = new Size(0, 0);
  }

  public getSize(): Size {
    return this.size;
  }

  public setSize(size: Size): void {
    this.size = size;
  }

  public getZeroZeroTransformationPoint() {
    if (this.centerZeroZeroPoint) {
      return new Point(this.getSize().width / 2., this.getSize().height / 2.);
    }
    return new Point(0, 0);
  }
}
