import { FontBBoxCalculator } from './font-bbox-calculator';

describe('FontBBoxCalculator', () => {
  let calculator: FontBBoxCalculator;

  beforeEach(() => {
    calculator = new FontBBoxCalculator();
  });

  it('should calculate font width and height', () => {
    const box = calculator.calculate('My text', 'font-family:Arial; font-size: 12px; font-weight:bold');

    expect(box.height).toEqual(14);
    expect(box.width).toEqual(41.34375);
  });

  xit('should calculate font width and height for different font', () => {
    const box = calculator.calculate('My text', 'font-family:Tahoma; font-size: 14px; font-weight:bold');

    expect(box.height).toEqual(15);
    expect(box.width).toEqual(46.25);
  });
});
