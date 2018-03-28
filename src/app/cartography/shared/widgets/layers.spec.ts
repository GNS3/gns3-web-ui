import { instance, mock, when } from "ts-mockito";

import { TestSVGCanvas } from "../../testing";
import { LayersWidget } from "./layers";
import { Layer } from "../models/layer";
import { LinksWidget } from "./links";
import { NodesWidget } from "./nodes";
import { DrawingsWidget } from "./drawings";
import { GraphLayout } from "./graph";


describe('LayersWidget', () => {
  let svg: TestSVGCanvas;
  let widget: LayersWidget;
  let mockedGraphLayout: GraphLayout;
  let mockedLinksWidget: LinksWidget;
  let mockedNodesWidget: NodesWidget;
  let mockedDrawingsWidget: DrawingsWidget;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    widget = new LayersWidget();
    mockedGraphLayout = mock(GraphLayout);
    mockedLinksWidget = mock(LinksWidget);
    mockedNodesWidget = mock(NodesWidget);
    mockedDrawingsWidget = mock(DrawingsWidget);
    when(mockedGraphLayout.getLinksWidget()).thenReturn(instance(mockedLinksWidget));
    when(mockedGraphLayout.getNodesWidget()).thenReturn(instance(mockedNodesWidget));
    when(mockedGraphLayout.getDrawingsWidget()).thenReturn(instance(mockedDrawingsWidget));

    widget.graphLayout = instance(mockedGraphLayout);
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw layers', () => {
    const layer_1 = new Layer();
    layer_1.index = 1;
    const layer_2 = new Layer();
    layer_2.index = 2;
    const layers = [layer_1, layer_2];

    widget.draw(svg.canvas, layers);

    const drew = svg.canvas.selectAll<SVGGElement, Layer>('g.layer');
    expect(drew.size()).toEqual(2);
    expect(drew.nodes()[0].getAttribute('data-index')).toEqual('1');
    expect(drew.nodes()[1].getAttribute('data-index')).toEqual('2');
  });

});
