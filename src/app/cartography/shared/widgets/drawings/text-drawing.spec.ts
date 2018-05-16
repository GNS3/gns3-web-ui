import { instance, mock, when } from "ts-mockito";
import { TestSVGCanvas } from "../../../testing";
import { TextDrawingWidget } from "./text-drawing";
import { Drawing } from "../../models/drawing";
import { TextElement } from "../../models/drawings/text-element";

describe('TextDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: TextDrawingWidget;
  let drawing: Drawing;


  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new Drawing();
    widget = new TextDrawingWidget();
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw text drawing', () => {
    drawing.svg = '<svg height="23" width="106"><text fill="#000000" fill-opacity="1.0" ' +
      'font-family="TypeWriter" font-size="10.0" font-weight="bold">THIS IS TEXT</text></svg>';

    const drawings = svg.canvas.selectAll<SVGGElement, Drawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings.enter().append<SVGGElement>('g').classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGTextElement, TextElement>('text.text_element');
    expect(drew.size()).toEqual(1);
    const text_element = drew.nodes()[0];
    expect(text_element.innerHTML).toEqual("THIS IS TEXT");
    expect(text_element.getAttribute('style')).toEqual('font-family: "TypeWriter"; font-size: 10pt; font-weight: bold');
  });

  it('should draw multiline text', () => {
    drawing.svg = '<svg height="23" width="106"><text>THIS' + "\n" + 'IS TEXT</text></svg>';

    const drawings = svg.canvas.selectAll<SVGGElement, Drawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings.enter().append<SVGGElement>('g').classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGTSpanElement, string>('tspan');
    expect(drew.nodes().length).toEqual(2);

    expect(drew.nodes()[0].innerHTML).toEqual('THIS');
    expect(drew.nodes()[0].getAttribute('x')).toEqual('0');
    expect(drew.nodes()[0].getAttribute('dy')).toEqual('0em');

    expect(drew.nodes()[1].innerHTML).toEqual('IS TEXT');
    expect(drew.nodes()[1].getAttribute('x')).toEqual('0');
    expect(drew.nodes()[1].getAttribute('dy')).toEqual('1.2em');
  });

});
