import { describe, expect, it } from 'vitest';
import { CssFixer } from '../helpers/css-fixer';
import { FontFixer } from '../helpers/font-fixer';
import { LabelWidget } from './label';

describe('LabelWidget color mode', () => {
  const createWidget = () => new LabelWidget(new CssFixer(), new FontFixer(), {} as any, {} as any);

  it('should preserve explicit colors from serialized workspace label defaults', () => {
    const widget = createWidget() as any;
    const style = new FontFixer().fixStyles(
      new CssFixer().fix('font-family: Arial;font-size: 12;fill: #123456;--gns3-custom-label-color: 1;')
    );

    const result = widget.applyLabelColorMode(style);

    expect(result).toContain('fill:#123456');
  });

  it('should accept whitespace around the custom color marker', () => {
    const style = 'font-size:10pt;fill:#123456;--gns3-custom-label-color: 1;';

    const result = (createWidget() as any).applyLabelColorMode(style);

    expect(result).toContain('fill:#123456');
  });

  it('should keep legacy labels theme-aware', () => {
    const style = 'font-size:10pt;fill:#000000';

    const result = (createWidget() as any).applyLabelColorMode(style);

    expect(result).not.toContain('fill:');
  });
});
