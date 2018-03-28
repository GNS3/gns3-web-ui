import { TestSVGCanvas } from "../../testing";


describe('LayersWidget', () => {
  let svg: TestSVGCanvas;

  beforeEach(() => {
    svg = new TestSVGCanvas();
  });

  afterEach(() => {
    svg.destroy();
  });

  it('canvas should transformed', () => {
    // expect(canvas.attr('transform')).toEqual('translate(100, 100) scale(1)');
  });

});
