import {Size} from "./size";
import {Point} from "./point";

export class Transformation {
  constructor(
    public x: number,
    public y: number,
    public k: number
  ) {}
}


export class Context {
  public transformation: Transformation;
  public size: Size;

  constructor(public centerZeroZeroPoint = true) {
    this.size = new Size(0, 0);
    this.transformation = new Transformation(0, 0, 1);
  }

  public getZeroZeroTransformationPoint() {
    if (this.centerZeroZeroPoint) {
      return new Point(this.size.width / 2., this.size.height / 2.);
    }
    return new Point(0, 0);
  }
}
