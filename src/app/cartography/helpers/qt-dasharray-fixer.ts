import { Injectable } from '@angular/core';
import { Font } from '../models/font';

/**
 * GNS3 GUI performs mapping from QT styles to SVG dasharray, but styles don't match
 * what you can see, here are improvements; later on please adjust GUI for proper values.
 */
@Injectable()
export class QtDasharrayFixer {
  static MAPPING = {
    '25, 25': '10, 2',
    '5, 25': '4, 2',
    '5, 25, 25': '5, 5, 1, 5',
    '25, 25, 5, 25, 5': '5, 2, 5, 2, 5'
  };

  public fix(dasharray: string): string {
    if (dasharray in QtDasharrayFixer.MAPPING) {
      return QtDasharrayFixer.MAPPING[dasharray];
    }
    return dasharray;
  }
}
