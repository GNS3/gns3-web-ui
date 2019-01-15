import { FontFixer } from './font-fixer';
import { Font } from '../models/font';

describe('FontFixer', () => {
  let fixer: FontFixer;

  beforeEach(() => {
    fixer = new FontFixer();
  });

  it('should fix TypeWriter font and 10px size', () => {
    const font: Font = {
      font_family: 'TypeWriter',
      font_size: 10,
      font_weight: 'bold'
    };

    expect(fixer.fix(font)).toEqual({
      font_family: 'Noto Sans',
      font_size: 11,
      font_weight: 'bold'
    });
  });

  it('should not fix other fonts', () => {
    const font: Font = {
      font_family: 'OtherFont',
      font_size: 11,
      font_weight: 'bold'
    };

    expect(fixer.fix(font)).toEqual({
      font_family: 'OtherFont',
      font_size: 11,
      font_weight: 'bold'
    });
  });

  it('should fix TypeWriter font and 10px size in styles', () => {
    const styles = 'font-family: TypeWriter; font-size: 10px; font-weight: bold';

    expect(fixer.fixStyles(styles)).toEqual('font-family:Noto Sans;font-size:11px;font-weight:bold');
  });

  it('should fix TypeWriter font and 10px size in styles with quotes', () => {
    const styles = 'font-family: "TypeWriter"; font-size: 10px; font-weight: bold';

    expect(fixer.fixStyles(styles)).toEqual('font-family:Noto Sans;font-size:11px;font-weight:bold');
  });
});
