import { CssFixer } from './css-fixer';

describe('CssFixer', () => {
  let fixer: CssFixer;

  beforeEach(() => {
    fixer = new CssFixer();
  });

  it('should fix font-size', () => {
    const css = 'font-size: 10.0;';
    expect(fixer.fix(css)).toEqual('font-size:10.0pt');
  });

  it('should not fix font-size when pt unit is defined', () => {
    const css = 'font-size: 10.0pt;';
    expect(fixer.fix(css)).toEqual('font-size:10.0pt');
  });

  it('should not fix font-size when px unit is defined', () => {
    const css = 'font-size: 10.0px;';
    expect(fixer.fix(css)).toEqual('font-size:10.0px');
  });

  it('should fix font-size with other attributes', () => {
    const css = 'font: Verdana; font-size: 10.0;';
    expect(fixer.fix(css)).toEqual('font:Verdana;font-size:10.0pt');
  });
});
