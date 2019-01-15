import { TestSVGCanvas } from '../../testing';
import { ImageDrawingWidget } from './image-drawing';
import { ImageElement } from '../../models/drawings/image-element';
import { MapDrawing } from '../../models/map/map-drawing';

describe('ImageDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: ImageDrawingWidget;
  let drawing: MapDrawing;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new MapDrawing();
    widget = new ImageDrawingWidget();
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw image drawing', () => {
    const image = new ImageElement();
    image.width = 100;
    image.height = 200;
    image.data = 'data:image/svg+xml;base64,DATA';
    drawing.element = image;

    const drawings = svg.canvas.selectAll<SVGGElement, MapDrawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings
      .enter()
      .append<SVGGElement>('g')
      .classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGImageElement, ImageElement>('image.image_element');
    expect(drew.size()).toEqual(1);
    const image_element = drew.nodes()[0];
    expect(image_element.getAttribute('width')).toEqual('100');
    expect(image_element.getAttribute('height')).toEqual('200');
    expect(image_element.getAttribute('href')).toEqual('data:image/svg+xml;base64,DATA');
  });
});
