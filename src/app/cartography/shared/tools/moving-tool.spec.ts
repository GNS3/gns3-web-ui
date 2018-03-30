import { Context } from "../models/context";
import { SVGSelection } from "../models/types";
import { MovingTool } from "./moving-tool";
import { TestSVGCanvas } from "../../testing";


describe('MovingTool', () => {
  let tool: MovingTool;
  let svg: TestSVGCanvas;
  let context: Context;
  let node: SVGSelection;

  beforeEach(() => {
    tool = new MovingTool();
    svg = new TestSVGCanvas();

    node = svg.canvas
      .append<SVGGElement>('g')
      .attr('class', 'node')
      .attr('x', 10)
      .attr('y', 20);

    context = new Context();

    tool.connect(svg.svg, context);
    tool.draw(svg.svg, context);
    tool.activate();
  });

  afterEach(() => {
    svg.destroy();
  });

  describe('MovingTool can move canvas', () => {
    beforeEach(() => {
      svg.svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100, clientY: 100, relatedTarget: svg.svg.node(),
          screenY: 1024, screenX: 1024, view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 200}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 200, clientY: 200, view: window}));
    });

    it('canvas should transformed', () => {
      expect(svg.canvas.attr('transform')).toEqual('translate(100, 100) scale(1)');
    });
  });

  describe('MovingTool can be deactivated', () => {
    beforeEach(() => {
      tool.deactivate();

      svg.svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100, clientY: 100, relatedTarget: svg.svg.node(),
          screenY: 1024, screenX: 1024, view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 200}));
    });

    it('canvas cannot be transformed', () => {
      expect(svg.canvas.attr('transform')).toBeNull();
    });
  });
});
