import { Context } from '../models/context';
import { SVGSelection } from '../models/types';
import { MovingTool } from './moving-tool';
import { TestSVGCanvas } from '../testing';
import { Size } from '../models/size';

describe('MovingTool', () => {
  let tool: MovingTool;
  let svg: TestSVGCanvas;
  let context: Context;
  let node: SVGSelection;

  beforeEach(() => {
    context = new Context();

    tool = new MovingTool(context);
    svg = new TestSVGCanvas();

    node = svg.canvas
      .append<SVGGElement>('g')
      .attr('class', 'node')
      .attr('x', 10)
      .attr('y', 20);

    tool.setEnabled(true);
    tool.draw(svg.svg, context);
  });

  afterEach(() => {
    svg.destroy();
  });

  describe('MovingTool can move canvas', () => {
    beforeEach(() => {
      svg.svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 100,
          relatedTarget: svg.svg.node(),
          screenY: 1024,
          screenX: 1024,
          view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200, view: window }));
    });

    it('canvas should transformed', () => {
      expect(svg.canvas.attr('transform')).toEqual('translate(100, 100) scale(1)');
    });

    it('context transformation should be updated', () => {
      expect(context.transformation.x).toEqual(100);
      expect(context.transformation.y).toEqual(100);
      expect(context.transformation.k).toEqual(1);
    });
  });

  describe('MovingTool can move canvas with ZeroZeroTransformationPoint', () => {
    beforeEach(() => {
      context.centerZeroZeroPoint = true;
      context.size = new Size(1000, 1000);

      svg.svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 100,
          relatedTarget: svg.svg.node(),
          screenY: 1024,
          screenX: 1024,
          view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200, view: window }));
    });

    it('canvas should transformed', () => {
      expect(svg.canvas.attr('transform')).toEqual('translate(600, 600) scale(1)');
    });

    it('context transformation should be updated', () => {
      expect(context.transformation.x).toEqual(100);
      expect(context.transformation.y).toEqual(100);
      expect(context.transformation.k).toEqual(1);
    });
  });

  describe('MovingTool can be deactivated', () => {
    beforeEach(() => {
      tool.setEnabled(false);
      tool.draw(svg.svg, context);

      svg.svg.node().dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 100,
          relatedTarget: svg.svg.node(),
          screenY: 1024,
          screenX: 1024,
          view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    });

    it('canvas cannot be transformed', () => {
      expect(svg.canvas.attr('transform')).toBeNull();
    });
  });
});
