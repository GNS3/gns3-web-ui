import { TestSVGCanvas } from "../../testing";
import { Drawing } from "../../models/drawing";
import { RectDrawingWidget } from "./rect-drawing";
import { RectElement } from "../../models/drawings/rect-element";
import { QtDasharrayFixer } from "../../helpers/qt-dasharray-fixer";


describe('RectDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: RectDrawingWidget;
  let drawing: Drawing;


  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new Drawing();
    widget = new RectDrawingWidget(new QtDasharrayFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw rect drawing', () => {
    const rect = new RectElement();
    rect.fill = "#FFFFFF";
    rect.fill_opacity = 1.0;
    rect.stroke = "#000000";
    rect.stroke_width = 2.0;
    rect.stroke_dasharray = "5,25,25";
    rect.width = 100;
    rect.height = 200;
    drawing.element = rect;

    const drawings = svg.canvas.selectAll<SVGGElement, Drawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings.enter().append<SVGGElement>('g').classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGRectElement, RectElement>('rect.rect_element');
    expect(drew.size()).toEqual(1);
    const rect_element = drew.nodes()[0];
    expect(rect_element.getAttribute('fill')).toEqual('#FFFFFF');
    expect(rect_element.getAttribute('fill-opacity')).toEqual('1');
    expect(rect_element.getAttribute('stroke')).toEqual('#000000');
    expect(rect_element.getAttribute('stroke-width')).toEqual('2');
    expect(rect_element.getAttribute('stroke-dasharray')).toEqual('5,25,25');
    expect(rect_element.getAttribute('width')).toEqual('100');
    expect(rect_element.getAttribute('height')).toEqual('200');
  });
});
