import * as csstree from 'css-tree';

import { Injectable } from '@angular/core';

@Injectable()
export class CssFixer {
  public fix(styles: string): string {
    const ast = csstree.parse(styles, {
      context: 'declarationList'
    });

    // fixes font-size when unit (pt|px) is not defined
    ast.children.forEach(child => {
      if (child.property === 'font-size') {
        child.value.children.forEach(value => {
          if (value.type === 'Number') {
            const fontSize = value.value.toString();
            if (!(fontSize.indexOf('pt') >= 0 || fontSize.indexOf('px') >= 0)) {
              value.value = `${fontSize}pt`;
            }
          }
        });
      }
    });
    return csstree.generate(ast);
  }
}
