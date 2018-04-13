import { Selection } from "d3-selection";

import { TestSVGCanvas } from "../../testing";
import { Node } from "../models/node";
import { Link } from "../models/link";
import { LinkNode } from "../models/link-node";
import { Label } from "../models/label";
import { InterfaceLabel } from "../models/interface-label";
import { InterfaceLabelWidget } from "./interface-label";


describe('InterfaceLabelsWidget', () => {
  let svg: TestSVGCanvas;
  let widget: InterfaceLabelWidget;
  let linksEnter: Selection<SVGGElement, Link, SVGGElement, any>;
  let links: Link[];

  beforeEach(() => {
    svg = new TestSVGCanvas();

    const node_1 = new Node();
    node_1.node_id = "1";
    node_1.x = 100;
    node_1.y = 200;

    const node_2 = new Node();
    node_2.node_id = "2";
    node_2.x = 300;
    node_2.y = 400;

    const link_node_1 = new LinkNode();
    link_node_1.label = new Label();
    link_node_1.label.rotation = 5;
    link_node_1.label.text = "Interface 1";
    link_node_1.label.x = 10;
    link_node_1.label.y = 20;
    link_node_1.label.style = "font-size: 12px";

    const link_node_2 = new LinkNode();
    link_node_2.label = new Label();
    link_node_2.label.rotation = 0;
    link_node_2.label.text = "Interface 2";
    link_node_2.label.x = -30;
    link_node_2.label.y = -40;
    link_node_2.label.style = "";

    const link_1 = new Link();
    link_1.link_id = "link1";
    link_1.source = node_1;
    link_1.target = node_2;
    link_1.nodes = [link_node_1, link_node_2];
    link_1.link_type = "ethernet";

    links = [link_1];

    const linksSelection = svg.canvas
      .selectAll<SVGGElement, Link>('g.link')
      .data(links);

    linksEnter = linksSelection
      .enter()
        .append<SVGGElement>('g')
        .attr('class', 'link');

    linksSelection
      .exit()
        .remove();

    widget = new InterfaceLabelWidget();
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw interface labels', () => {
    widget.draw(linksEnter);

    const drew = svg.canvas.selectAll<SVGGElement, InterfaceLabel>('text.interface_label');

    expect(drew.nodes().length).toEqual(2);

    const sourceInterface = drew.nodes()[0];
    expect(sourceInterface.innerHTML).toEqual('Interface 1');
    expect(sourceInterface.getAttribute('x')).toEqual('110');
    expect(sourceInterface.getAttribute('y')).toEqual('220');
    expect(sourceInterface.getAttribute('transform')).toEqual('rotate(5, 110, 220)');
    expect(sourceInterface.getAttribute('style')).toEqual('font-size: 12px');

    const targetInterface = drew.nodes()[1];
    expect(targetInterface.innerHTML).toEqual('Interface 2');
    expect(targetInterface.getAttribute('x')).toEqual('270');
    expect(targetInterface.getAttribute('y')).toEqual('360');
    expect(targetInterface.getAttribute('transform')).toEqual('rotate(0, 270, 360)');
    expect(targetInterface.getAttribute('style')).toEqual('');
  });

});
