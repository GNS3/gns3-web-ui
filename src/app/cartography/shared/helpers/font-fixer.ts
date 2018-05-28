import { Injectable } from "@angular/core";
import { Font } from "../models/font";

/**
 * GNS3 GUI doesn't update font when cannot find font in user system, this fixer fixes it
 */
@Injectable()
export class FontFixer {
  static DEFAULT_FONT = "TypeWriter";
  static DEFAULT_SIZE = 10;
  static REPLACE_BY_FONT = "Noto Sans";
  static REPLACE_BY_SIZE = 10;

  public fix(font: Font): Font {
    if (font.font_family === FontFixer.DEFAULT_FONT && font.font_size === FontFixer.DEFAULT_SIZE) {
      font.font_family = FontFixer.REPLACE_BY_FONT;
      font.font_size = FontFixer.REPLACE_BY_SIZE;
    }
    return font;
  }
}
