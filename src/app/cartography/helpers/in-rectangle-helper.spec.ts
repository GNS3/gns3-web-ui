import { InRectangleHelper } from './in-rectangle-helper';
import { Rectangle } from '../models/rectangle';

describe('InRectangleHelper', () => {
  let inRectangleHelper: InRectangleHelper;

  beforeEach(() => {
    inRectangleHelper = new InRectangleHelper();
  });

  it('should be in rectangle', () => {
    const isIn = inRectangleHelper.inRectangle(new Rectangle(10, 10, 150, 150), 100, 100);
    expect(isIn).toBeTruthy();
  });

  it('should be outside rectangle', () => {
    const isIn = inRectangleHelper.inRectangle(new Rectangle(10, 10, 50, 50), 100, 100);
    expect(isIn).toBeFalsy();
  });
});
