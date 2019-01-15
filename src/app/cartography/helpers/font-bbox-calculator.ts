import { Injectable } from '@angular/core';

@Injectable()
export class FontBBoxCalculator {
  calculate(text: string, styles: string) {
    const element = document.createElement('text');
    element.innerText = text;
    element.setAttribute('fill', '#00000');
    element.setAttribute('fill-opacity', '0');
    element.setAttribute('style', styles);
    document.documentElement.appendChild(element);
    const bbox = element.getBoundingClientRect();
    document.documentElement.removeChild(element);

    return {
      width: bbox.width,
      height: bbox.height
    };
  }
}
