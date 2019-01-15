import { TestSVGCanvas } from '../../testing';
import { TextDrawingWidget } from './text-drawing';
import { TextElement } from '../../models/drawings/text-element';
import { FontFixer } from '../../helpers/font-fixer';
import { MapDrawing } from '../../models/map/map-drawing';

describe('TextDrawingWidget', () => {
  let svg: TestSVGCanvas;
  let widget: TextDrawingWidget;
  let drawing: MapDrawing;

  beforeEach(() => {
    svg = new TestSVGCanvas();
    drawing = new MapDrawing();
    widget = new TextDrawingWidget(new FontFixer());
  });

  afterEach(() => {
    svg.destroy();
  });

  it('should draw text drawing', () => {
    const text = new TextElement();
    text.text = 'THIS IS TEXT';
    text.fill = '#000000';
    text.fill_opacity = 1.0;
    text.font_family = 'TypeWriter';
    text.font_size = 10.0;
    text.font_weight = 'bold';
    text.text_decoration = 'line-through';

    drawing.element = text;

    const drawings = svg.canvas.selectAll<SVGGElement, MapDrawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings
      .enter()
      .append<SVGGElement>('g')
      .classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGTextElement, TextElement>('text.text_element');
    expect(drew.size()).toEqual(1);
    const text_element = drew.nodes()[0];
    expect(text_element.innerHTML).toEqual('<tspan xml:space="preserve" x="0" dy="0em">THIS IS TEXT</tspan>');
    expect(text_element.getAttribute('fill')).toEqual('#000000');
    expect(text_element.getAttribute('style')).toEqual('font-family: "Noto Sans"; font-size: 11pt; font-weight: bold');
    expect(text_element.getAttribute('text-decoration')).toEqual('line-through');
  });

  it('should draw multiline text', () => {
    const text = new TextElement();
    text.text = 'THIS' + '\n' + 'IS TEXT';
    drawing.element = text;

    const drawings = svg.canvas.selectAll<SVGGElement, MapDrawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings
      .enter()
      .append<SVGGElement>('g')
      .classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGTSpanElement, string>('tspan');
    expect(drew.nodes().length).toEqual(2);

    expect(drew.nodes()[0].innerHTML).toEqual('THIS');
    expect(drew.nodes()[0].getAttribute('x')).toEqual('0');
    expect(drew.nodes()[0].getAttribute('dy')).toEqual('0em');

    expect(drew.nodes()[1].innerHTML).toEqual('IS TEXT');
    expect(drew.nodes()[1].getAttribute('x')).toEqual('0');
    expect(drew.nodes()[1].getAttribute('dy')).toEqual('1.4em');
  });

  it('should draw whitespaces', () => {
    const text = new TextElement();
    text.text = '   Text  with whitespaces';
    drawing.element = text;

    const drawings = svg.canvas.selectAll<SVGGElement, MapDrawing>('g.drawing').data([drawing]);
    const drawings_enter = drawings
      .enter()
      .append<SVGGElement>('g')
      .classed('drawing', true);
    const drawings_merge = drawings.merge(drawings_enter);

    widget.draw(drawings_merge);

    const drew = drawings_merge.selectAll<SVGTSpanElement, string>('tspan');
    expect(drew.nodes().length).toEqual(1);

    expect(drew.nodes()[0].innerHTML).toEqual('   Text  with whitespaces');
    expect(drew.nodes()[0].getAttribute('space')).toEqual('preserve');
  });
});
