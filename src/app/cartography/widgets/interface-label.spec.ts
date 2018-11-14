import { Selection } from "d3-selection";

import { TestSVGCanvas } from "../testing";
import { InterfaceLabel } from "../models/interface-label";
import { InterfaceLabelWidget } from "./interface-label";
import { CssFixer } from "../helpers/css-fixer";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";
import { MapLinkNode } from "../models/map/map-link-node";
import { MapLabel } from "../models/map/map-label";


describe('InterfaceLabelsWidget', () => {
  let svg: TestSVGCanvas;
  let widget: InterfaceLabelWidget;
  let linksEnter: Selection<SVGGElement, MapLink, SVGGElement, any>;
  let links: MapLink[];

  beforeEach(() => {
    svg = new TestSVGCanvas();

    const node_1 = new MapNode();
    node_1.id = "1";
    node_1.x = 100;
    node_1.y = 200;

    const node_2 = new MapNode();
    node_2.id = "2";
    node_2.x = 300;
    node_2.y = 400;

    const link_node_1 = new MapLinkNode();
    link_node_1.label = new MapLabel();
    link_node_1.label.rotation = 5;
    link_node_1.label.text = "Interface 1";
    link_node_1.label.x = 10;
    link_node_1.label.y = 20;
    link_node_1.label.style = "font-size: 12px";

    const link_node_2 = new MapLinkNode();
    link_node_2.label = new MapLabel();
    link_node_2.label.rotation = 0;
    link_node_2.label.text = "Interface 2";
    link_node_2.label.x = -30;
    link_node_2.label.y = -40;
    link_node_2.label.style = "";

    const link_1 = new MapLink();
    link_1.id = "link1";
    link_1.source = node_1;
    link_1.target = node_2;
    link_1.nodes = [link_node_1, link_node_2];
    link_1.linkType = "ethernet";

    links = [link_1];

    const linksSelection = svg.canvas
      .selectAll<SVGGElement, MapLink>('g.link')
      .data(links);

    linksEnter = linksSelection
      .enter()
        .append<SVGGElement>('g')
        .attr('class', 'link');

    linksSelection
      .exit()
        .remove();

    widget = new InterfaceLabelWidget(new CssFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw interface labels', () => {
    widget.draw(linksEnter);

    const drew = svg.canvas.selectAll<SVGGElement, InterfaceLabel>('g.interface_label_container');

    expect(drew.nodes().length).toEqual(2);

    const sourceInterface = drew.nodes()[0] as Element;

    expect(sourceInterface.getAttribute('transform')).toEqual('translate(110, 220) rotate(5, 110, 220)');
    const sourceIntefaceRect = sourceInterface.firstChild as Element;
    expect(sourceIntefaceRect.attributes.getNamedItem('class').value).toEqual('interface_label_border');
    const sourceIntefaceText = sourceInterface.children[1];
    expect(sourceIntefaceText.attributes.getNamedItem('class').value).toEqual('interface_label noselect');
    expect(sourceIntefaceText.attributes.getNamedItem('style').value).toEqual('font-size:12px');

    const targetInterface = drew.nodes()[1];

    expect(targetInterface.getAttribute('transform')).toEqual('translate(270, 360) rotate(0, 270, 360)');
    const targetIntefaceRect = targetInterface.firstChild as Element;
    expect(targetIntefaceRect.attributes.getNamedItem('class').value).toEqual('interface_label_border');
    const targetIntefaceText = targetInterface.children[1] as Element;
    expect(targetIntefaceText.attributes.getNamedItem('class').value).toEqual('interface_label noselect');
    expect(targetIntefaceText.attributes.getNamedItem('style').value).toEqual('');

  });

  it('should not draw interface labels when disabled', () => {
    widget.setEnabled(false);
    widget.draw(linksEnter);

    const drew = svg.canvas.selectAll<SVGGElement, InterfaceLabel>('g.interface_label_container');

    expect(drew.nodes().length).toEqual(0);
  });

  // it('should draw interface label with class `selected` when selected', () => {
  //   links[0].nodes[0].label.isSelected = true;

  //   widget.draw(linksEnter);

  //   const drew = svg.canvas.selectAll<SVGGElement, InterfaceLabel>('g.interface_label_container');
  //   const sourceInterface = drew.nodes()[0];
  //   expect(sourceInterface.getAttribute('class')).toContain('selected');
  // });
});

