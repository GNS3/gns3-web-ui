import { Injectable } from '@angular/core';
import * as csstree from 'css-tree';
import { Font } from '../models/font';
import { Converter } from './converter';

@Injectable()
export class StylesToFontConverter implements Converter<string, Font> {
  convert(styles: string) {
    const font: Font = {
      font_family: undefined,
      font_size: undefined,
      font_weight: undefined,
    };

    const ast = csstree.parse(styles, {
      context: 'declarationList',
    });

    ast.children.forEach((child) => {
      if (child.property === 'font-size' && child.value && child.value.children) {
        child.value.children.forEach((value) => {
          if (value.type === 'Dimension') {
            font.font_size = parseInt(value.value);
          }
        });
      }
      if (child.property === 'font-family' && child.value && child.value.children) {
        child.value.children.forEach((value) => {
          if (value.type === 'Identifier') {
            font.font_family = value.name;
          }
        });
      }
      if (child.property === 'font-weight' && child.value && child.value.children) {
        child.value.children.forEach((value) => {
          if (value.type === 'Identifier') {
            font.font_weight = value.name;
          }
        });
      }
    });

    return font;
  }
}
