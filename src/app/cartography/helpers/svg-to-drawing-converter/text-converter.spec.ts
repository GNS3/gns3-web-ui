import { TextConverter } from './text-converter';

describe('TextConverter', () => {
  let textConverter: TextConverter;

  beforeEach(() => {
    textConverter = new TextConverter();
  });

  it('should parse attributes', () => {
    const element = document.createElement('text');
    element.innerText = 'Text';
    element.setAttribute('fill', '#00000');
    element.setAttribute('fill-opacity', '1.0');
    element.setAttribute('font-family', 'TypeWriter');
    element.setAttribute('font-size', '10.0');
    element.setAttribute('font-weight', 'bold');
    element.setAttribute('text-decoration', 'line-through');

    const drawing = textConverter.convert(element);
    expect(drawing.text).toEqual('Text');
    expect(drawing.fill).toEqual('#00000');
    expect(drawing.fill_opacity).toEqual(1.0);
    expect(drawing.font_family).toEqual('TypeWriter');
    expect(drawing.font_size).toEqual(10.0);
    expect(drawing.font_weight).toEqual('bold');
    expect(drawing.text_decoration).toEqual('line-through');
  });

  it('should parse with no attributes', () => {
    const element = document.createElement('text');

    const drawing = textConverter.convert(element);
    expect(drawing.text).toEqual('');
    expect(drawing.fill).toBeUndefined();
    expect(drawing.fill_opacity).toBeUndefined();
    expect(drawing.font_family).toBeUndefined();
    expect(drawing.font_size).toBeUndefined();
    expect(drawing.font_weight).toBeUndefined();
    expect(drawing.text_decoration).toBeUndefined();
  });
});
