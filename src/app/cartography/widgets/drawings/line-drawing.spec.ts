import { TestSVGCanvas } from "../../testing";
import { LineDrawingWidget } from "./line-drawing";
import { LineElement } from "../../models/drawings/line-element";
import { QtDasharrayFixer } from "../../helpers/qt-dasharray-fixer";
import { MapDrawing } from "../../models/map/map-drawing";


describe('LineDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: LineDrawingWidget;
  let drawing: MapDrawing;


  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new MapDrawing();
    widget = new LineDrawingWidget(new QtDasharrayFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw line drawing', () => {
    const line = new LineElement();
    line.stroke = "#000000";
    line.stroke_width = 2.0;
    line.stroke_dasharray = "5,25,25";
    line.x1 = 10;
    line.x2 = 20;
    line.y1 = 30;
    line.y2 = 40;
    drawing.element = line;

    const drawings = svg.canvas.selectAll<SVGGElement, MapDrawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings.enter().append<SVGGElement>('g').classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGLineElement, LineElement>('line.line_element');
    expect(drew.size()).toEqual(1);
    const line_element = drew.nodes()[0];
    expect(line_element.getAttribute('stroke')).toEqual('#000000');
    expect(line_element.getAttribute('stroke-width')).toEqual('2');
    expect(line_element.getAttribute('stroke-dasharray')).toEqual('5,25,25');
    expect(line_element.getAttribute('x1')).toEqual('10');
    expect(line_element.getAttribute('x2')).toEqual('20');
    expect(line_element.getAttribute('y1')).toEqual('30');
    expect(line_element.getAttribute('y2')).toEqual('40');
  });
});
