import {Size} from "../../cartography/shared/models/size.model";
import {Selection} from "d3-selection";

export class Context {
  private size: Size;
  private root: Selection<SVGSVGElement, any, null, undefined>;

  constructor(root: Selection<SVGSVGElement, any, null, undefined>) {
    this.root = root;
  }

  public getSize(): Size {
    return this.size;
  }

  public setSize(size: Size): void {
    this.size = size;
  }

  public getRoot() {
    return this.root;
  }
}
