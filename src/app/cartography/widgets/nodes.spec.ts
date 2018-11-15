
import { TestSVGCanvas } from "../testing";
import { NodesWidget } from "./nodes";
import { Node } from "../models/node";
import { Label } from "../models/label";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";


describe('NodesWidget', () => {
  let svg: TestSVGCanvas;
  let widget: NodesWidget;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    widget = new NodesWidget(
      new CssFixer(),
      new FontFixer()
    );
  });

  afterEach(() => {
    svg.destroy();
  });

  describe('draggable behaviour', () => {
    let node: Node;
    const tryToDrag = () => {
      const drew = svg.canvas.selectAll<SVGGElement, Node>('g.node');
      const drewNode = drew.nodes()[0];

      drewNode.dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: 150, clientY: 250, relatedTarget: drewNode,
          screenY: 1024, screenX: 1024, view: window
        })
      );

      window.dispatchEvent(new MouseEvent('mousemove', {clientX: 300, clientY: 300}));
      window.dispatchEvent(new MouseEvent('mouseup', {clientX: 300, clientY: 300, view: window}));
    };

    beforeEach(() => {
      node = new Node();
      node.x = 100;
      node.y = 200;
      node.width = 100;
      node.height = 100;
      node.label = new Label();
    });

    it('should be draggable when enabled', () => {
      widget.setDraggingEnabled(true);
      widget.draw(svg.canvas, [node]);

      tryToDrag();

      expect(node.x).toEqual(250);
      expect(node.y).toEqual(250);
    });

     it('should be not draggable when disabled', () => {
      widget.setDraggingEnabled(false);
      widget.draw(svg.canvas, [node]);

      tryToDrag();

      expect(node.x).toEqual(100);
      expect(node.y).toEqual(200);
    });
  });


});
