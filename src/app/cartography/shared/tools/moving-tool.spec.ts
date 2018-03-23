import { select } from "d3-selection";
import { Context } from "../models/context";
import { SVGSelection } from "../models/types";
import { MovingTool } from "./moving-tool";


describe('MovingTool', () => {
  let tool: MovingTool;
  let svg: SVGSelection;
  let context: Context;
  let node: SVGSelection;
  let canvas: SVGSelection;

  beforeEach(() => {
    tool = new MovingTool();

    svg = select('body')
        .append<SVGSVGElement>('svg')
        .attr('width', 1000)
        .attr('height', 1000);

    canvas = svg.append<SVGGElement>('g').attr('class', 'canvas');

    node = canvas
      .append<SVGGElement>('g')
      .attr('class', 'node')
      .attr('x', 10)
      .attr('y', 20);


    context = new Context();

    tool.connect(svg, context);
    tool.draw(svg, context);
    tool.activate();

  });

  describe('MovingTool can move canvas', () => {
    beforeEach(() => {
      svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100, clientY: 100, relatedTarget: svg.node(),
          screenY: 1024, screenX: 1024, view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 200}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 200, clientY: 200, view: window}));
    });

    it('canvas should transformed', () => {
      expect(canvas.attr('transform')).toEqual('translate(100, 100) scale(1)');
    });
  });

  describe('MovingTool can be deactivated', () => {
    beforeEach(() => {
      tool.deactivate();

      svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100, clientY: 100, relatedTarget: svg.node(),
          screenY: 1024, screenX: 1024, view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200, clientY: 200}));
    });

    it('canvas cannot be transformed', () => {
      expect(canvas.attr('transform')).toBeNull();
    });
  });
});
