import { TestSVGCanvas } from "../../testing";
import { Drawing } from "../../models/drawing";
import { EllipseDrawingWidget } from "./ellipse-drawing";
import { EllipseElement } from "../../models/drawings/ellipse-element";
import { QtDasharrayFixer } from "../../helpers/qt-dasharray-fixer";


describe('EllipseDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: EllipseDrawingWidget;
  let drawing: Drawing;


  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new Drawing();
    widget = new EllipseDrawingWidget(new QtDasharrayFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw ellipse drawing', () => {
    const ellipse = new EllipseElement();
    ellipse.fill = "#FFFFFFF";
    ellipse.fill_opacity = 2.0;
    ellipse.stroke = "#000000";
    ellipse.stroke_width = 2.0;
    ellipse.stroke_dasharray = "5,25,25";
    ellipse.cx = 10;
    ellipse.cy = 20;
    ellipse.rx = 30;
    ellipse.ry = 40;
    drawing.element = ellipse;

    const drawings = svg.canvas.selectAll<SVGGElement, Drawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings.enter().append<SVGGElement>('g').classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGEllipseElement, EllipseElement>('ellipse.ellipse_element');
    expect(drew.size()).toEqual(1);
    const ellipse_element = drew.nodes()[0];
    expect(ellipse_element.getAttribute('fill')).toEqual('#FFFFFFF');
    expect(ellipse_element.getAttribute('fill-opacity')).toEqual('2');
    expect(ellipse_element.getAttribute('stroke')).toEqual('#000000');
    expect(ellipse_element.getAttribute('stroke-width')).toEqual('2');
    expect(ellipse_element.getAttribute('stroke-dasharray')).toEqual('5,25,25');
    expect(ellipse_element.getAttribute('cx')).toEqual('10');
    expect(ellipse_element.getAttribute('cy')).toEqual('20');
    expect(ellipse_element.getAttribute('rx')).toEqual('30');
    expect(ellipse_element.getAttribute('ry')).toEqual('40');
  });
});
