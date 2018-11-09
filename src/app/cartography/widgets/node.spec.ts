
import { TestSVGCanvas } from "../testing";
import { CssFixer } from "../helpers/css-fixer";
import { FontFixer } from "../helpers/font-fixer";
import { NodeWidget } from "./node";
import { MapNode } from "../models/map/map-node";
import { MapLabel } from "../models/map/map-label";


describe('NodesWidget', () => {
  let svg: TestSVGCanvas;
  let widget: NodeWidget;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    widget = new NodeWidget(new CssFixer(), new FontFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  describe('draggable behaviour', () => {
    let node: MapNode;
    const tryToDrag = () => {
      const drew = svg.canvas.selectAll<SVGGElement, MapNode>('g.node');
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
      node = new MapNode();
      node.x = 100;
      node.y = 200;
      node.width = 100;
      node.height = 100;
      node.label = new MapLabel();
    });

    // it('should be draggable when enabled', () => {
    //   widget.setDraggingEnabled(true);
    //   widget.draw(svg.canvas);

    //   tryToDrag();

    //   expect(node.x).toEqual(250);
    //   expect(node.y).toEqual(250);
    // });

    // it('should be not draggable when disabled', () => {
    //   widget.setDraggingEnabled(false);
    //   widget.draw(svg.canvas);

    //   tryToDrag();

    //   expect(node.x).toEqual(100);
    //   expect(node.y).toEqual(200);
    // });

  });
});
