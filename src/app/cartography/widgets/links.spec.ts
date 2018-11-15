import { instance, mock } from "ts-mockito";
import { Selection } from "d3-selection";


import { TestSVGCanvas } from "../testing";
import { Layer } from "../models/layer";
import { LinksWidget } from "./links";
import { LinkWidget } from "./link";
import { MultiLinkCalculatorHelper } from "../helpers/multi-link-calculator-helper";
import { MapNode } from "../models/map/map-node";
import { MapLink } from "../models/map/map-link";


describe('LinksWidget', () => {
  let svg: TestSVGCanvas;
  let widget: LinksWidget;
  let layersEnter: Selection<SVGGElement, Layer, SVGGElement, any>;
  let layer: Layer;
  let linkWidget: LinkWidget;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    linkWidget = instance(mock(LinkWidget));
    widget = new LinksWidget(new MultiLinkCalculatorHelper(), linkWidget);

    const node_1 = new MapNode();
    node_1.id = "1";
    node_1.x = 10;
    node_1.y = 10;

    const node_2 = new MapNode();
    node_2.id = "2";
    node_2.x = 100;
    node_2.y = 100;

    const link_1 = new MapLink();
    link_1.id = "link1";
    link_1.source = node_1;
    link_1.target = node_2;
    link_1.linkType = "ethernet";

    layer = new Layer();
    layer.index = 1;

    layer.links = [link_1];

    const layers = [layer];

    const layersSelection = svg.canvas
        .selectAll<SVGGElement, Layer>('g.layer')
        .data(layers);

    layersEnter = layersSelection
        .enter()
            .append<SVGGElement>('g')
            .attr('class', 'layer');

    layersSelection
        .exit()
            .remove();
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw links', () => {
    widget.draw(layersEnter);

    const drew = svg.canvas.selectAll<SVGGElement, MapLink>('g.link');
    const linkNode = drew.nodes()[0];
    expect(linkNode.getAttribute('link_id')).toEqual('link1');
    expect(linkNode.getAttribute('map-source')).toEqual('1');
    expect(linkNode.getAttribute('map-target')).toEqual('2');
  });

});
