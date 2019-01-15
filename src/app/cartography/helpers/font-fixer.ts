import * as csstree from 'css-tree';
import { Injectable } from '@angular/core';
import { Font } from '../models/font';

/**
 * GNS3 GUI doesn't update font when cannot find font in user system, this fixer fixes it
 */
@Injectable()
export class FontFixer {
  static DEFAULT_FONT = 'TypeWriter';
  static DEFAULT_SIZE = 10;
  static REPLACE_BY_FONT = 'Noto Sans';
  static REPLACE_BY_SIZE = 11;

  public fix(font: Font): Font {
    if (font.font_family === FontFixer.DEFAULT_FONT && font.font_size === FontFixer.DEFAULT_SIZE) {
      font.font_family = FontFixer.REPLACE_BY_FONT;
      font.font_size = FontFixer.REPLACE_BY_SIZE;
    }
    return font;
  }

  public fixStyles(styles: string) {
    const ast = csstree.parse(styles, {
      context: 'declarationList'
    });

    let fontFamilyPointer = null;
    let fontSizePointer = null;
    let isByIdentifier = true;

    ast.children.forEach(child => {
      if (child.property === 'font-family') {
        child.value.children.forEach(value => {
          if (value.type === 'Identifier') {
            fontFamilyPointer = value;
          }
          if (value.type === 'String') {
            fontFamilyPointer = value;
            isByIdentifier = false;
          }
        });
      }
      if (child.property === 'font-size') {
        child.value.children.forEach(value => {
          if (value.type === 'Dimension') {
            fontSizePointer = value;
          }
        });
      }
    });

    if (fontSizePointer && fontFamilyPointer) {
      let fontFamilyValue = null;
      const fontSizeValue = fontSizePointer.value;

      if (isByIdentifier) {
        fontFamilyValue = fontFamilyPointer.name;
      } else {
        fontFamilyValue = fontFamilyPointer.value;
      }

      const fixedFont = this.fix({
        font_family: fontFamilyValue.split('"').join(''),
        font_size: parseInt(fontSizeValue, 10)
      } as Font);

      if (isByIdentifier) {
        fontFamilyPointer.name = fixedFont.font_family;
      } else {
        fontFamilyPointer.value = fixedFont.font_family;
      }
      fontSizePointer.value = fixedFont.font_size;
    }

    return csstree.generate(ast);
  }
}
