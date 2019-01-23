import { Font } from '../models/font';
import { StylesToFontConverter } from './styles-to-font-converter';

describe('StylesToFontConverter', () => {
  let converter: StylesToFontConverter;

  beforeEach(() => {
    converter = new StylesToFontConverter();
  });

  it('should parse fonts from styles', () => {
    const styles = 'font-family: TypeWriter; font-size: 10px; font-weight: bold';

    const expectedFont: Font = {
      font_family: 'TypeWriter',
      font_size: 10,
      font_weight: 'bold'
    };

    expect(converter.convert(styles)).toEqual(expectedFont);
  });
});
