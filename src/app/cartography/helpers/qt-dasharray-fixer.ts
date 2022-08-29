import { Injectable } from '@angular/core';

/**
 * GNS3 GUI performs mapping from QT styles to SVG dasharray, but styles don't match
 * what you can see, here are improvements; later on please adjust GUI for proper values.
 */
@Injectable()
export class QtDasharrayFixer {
  static MAPPING = {
    '25, 25': '10, 2', // Dash
    '5, 25': '4, 2', // Dot
    '5, 25, 25': '12, 3, 5, 3', // Dash Dot
    '25, 25, 5, 25, 5': '12, 3, 5, 3, 5, 3', // Dash Dot Dot
  };

  public fix(dasharray: string): string {
    if(dasharray || dasharray == '' ){
    if (dasharray in QtDasharrayFixer.MAPPING) {
      return QtDasharrayFixer.MAPPING[dasharray];
    }
    return dasharray;
  }
}
}
