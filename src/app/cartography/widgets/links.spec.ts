import { Selection } from 'd3-selection';
import { instance, mock } from 'ts-mockito';
import { MultiLinkCalculatorHelper } from '../helpers/multi-link-calculator-helper';
import { Layer } from '../models/layer';
import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { TestSVGCanvas } from '../testing';
import { LinkWidget } from './link';
import { LinksWidget } from './links';

describe('LinksWidget', () => {
  let svg: TestSVGCanvas;
  let widget: LinksWidget;
  let layersEnter: Selection<SVGGElement, Layer, SVGGElement, any>;
  let layer: Layer;
  let linkWidget: LinkWidget;
  let multiLinkCalculatorHelper: MultiLinkCalculatorHelper;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    linkWidget = instance(mock(LinkWidget));
    multiLinkCalculatorHelper = new MultiLinkCalculatorHelper();
    widget = new LinksWidget(multiLinkCalculatorHelper, linkWidget);

    const node_1 = new MapNode();
    node_1.id = '1';
    node_1.x = 10;
    node_1.y = 10;

    const node_2 = new MapNode();
    node_2.id = '2';
    node_2.x = 100;
    node_2.y = 100;

    const link_1 = new MapLink();
    link_1.id = 'link1';
    link_1.source = node_1;
    link_1.target = node_2;
    link_1.linkType = 'ethernet';

    layer = new Layer();
    layer.index = 1;

    layer.links = [link_1];

    const layers = [layer];

    const layersSelection = svg.canvas.selectAll<SVGGElement, Layer>('g.layer').data(layers);

    layersEnter = layersSelection.enter().append<SVGGElement>('g').attr('class', 'layer');

    layersSelection.exit().remove();
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

  it('should recalculate spacing using links connected to both endpoints on redraw', () => {
    const center = new MapNode();
    center.id = 'center';
    center.x = 400;
    center.y = 300;
    center.width = 40;
    center.height = 40;

    const leftTop = new MapNode();
    leftTop.id = 'left-top';
    leftTop.x = 100;
    leftTop.y = 100;
    leftTop.width = 40;
    leftTop.height = 40;

    const leftBottom = new MapNode();
    leftBottom.id = 'left-bottom';
    leftBottom.x = 100;
    leftBottom.y = 500;
    leftBottom.width = 40;
    leftBottom.height = 40;

    const rightTop = new MapNode();
    rightTop.id = 'right-top';
    rightTop.x = 700;
    rightTop.y = 100;
    rightTop.width = 40;
    rightTop.height = 40;

    const linkA = new MapLink();
    linkA.id = 'link-a';
    linkA.source = leftTop;
    linkA.target = center;
    linkA.linkType = 'ethernet';
    linkA.link_style = { link_type: 'bezier' } as any;

    const linkB = new MapLink();
    linkB.id = 'link-b';
    linkB.source = leftBottom;
    linkB.target = center;
    linkB.linkType = 'ethernet';
    linkB.link_style = { link_type: 'bezier' } as any;

    const linkC = new MapLink();
    linkC.id = 'link-c';
    linkC.source = center;
    linkC.target = rightTop;
    linkC.linkType = 'ethernet';
    linkC.link_style = { link_type: 'bezier' } as any;

    layer.links = [linkA, linkB, linkC];

    const assignSpy = spyOn(multiLinkCalculatorHelper, 'assignDataToLinks').and.callThrough();

    widget.draw(layersEnter);

    assignSpy.calls.reset();

    widget.redrawLink(layersEnter, {
      id: 'link-a',
      source: leftTop,
      target: center,
      link_style: { link_type: 'bezier' },
    } as MapLink);

    expect(assignSpy).toHaveBeenCalled();
    const recalculatedLinks = assignSpy.calls.mostRecent().args[0] as MapLink[];
    expect(recalculatedLinks.length).toEqual(3);
  });
});
