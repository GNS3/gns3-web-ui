import { Font } from '../models/font';
import { FontFixer } from './font-fixer';

describe('FontFixer', () => {
  let fixer: FontFixer;

  beforeEach(() => {
    fixer = new FontFixer();
  });

  it('should fix TypeWriter font and 10px size', () => {
    const font: Font = {
      font_family: 'TypeWriter',
      font_size: 10,
      font_weight: 'bold',
    };

    expect(fixer.fix(font)).toEqual({
      font_family: 'Arial',
      font_size: 12,
      font_weight: 'bold',
    });
  });

  it('should not fix other fonts', () => {
    const font: Font = {
      font_family: 'OtherFont',
      font_size: 11,
      font_weight: 'bold',
    };

    expect(fixer.fix(font)).toEqual({
      font_family: 'OtherFont',
      font_size: 11,
      font_weight: 'bold',
    });
  });

  it('should fix TypeWriter font and 10px size in styles', () => {
    const styles = 'font-family: TypeWriter; font-size: 10px; font-weight: bold';

    expect(fixer.fixStyles(styles)).toEqual('font-family:Arial;font-size:12px;font-weight:bold');
  });

  it('should fix TypeWriter font and 10px size in styles with quotes', () => {
    const styles = 'font-family: "TypeWriter"; font-size: 10px; font-weight: bold';

    expect(fixer.fixStyles(styles)).toEqual('font-family:Arial;font-size:12px;font-weight:bold');
  });
});
