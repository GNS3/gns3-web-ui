import { InRectangleHelper } from "./in-rectangle-helper";
import { Selectable } from "../../shared/managers/selection-manager";
import { Rectangle } from "../../shared/models/rectangle";

class ExampleNode implements Selectable {
  constructor(public x: number, public y: number, public is_selected: boolean) {}
}


describe('InRectangleHelper', () => {
  let inRectangleHelper: InRectangleHelper;
  let node: Selectable;

  beforeEach(() => {
    inRectangleHelper = new InRectangleHelper();
  });

  it('should be in rectangle', () => {
    node = new ExampleNode(100, 100, false);
    const isIn = inRectangleHelper.inRectangle(node, new Rectangle(10, 10, 150, 150));
    expect(isIn).toBeTruthy();
  });

  it('should be outside rectangle', () => {
    node = new ExampleNode(100, 100, false);
    const isIn = inRectangleHelper.inRectangle(node, new Rectangle(10, 10, 50, 50));
    expect(isIn).toBeFalsy();
  });
});
