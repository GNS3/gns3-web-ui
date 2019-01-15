import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { Label } from '../../models/label';
import { MapLabel } from '../../models/map/map-label';
import { FontBBoxCalculator } from '../../helpers/font-bbox-calculator';
import { CssFixer } from '../../helpers/css-fixer';
import { FontFixer } from '../../helpers/font-fixer';

@Injectable()
export class LabelToMapLabelConverter implements Converter<Label, MapLabel> {
  constructor(
    private fontBBoxCalculator: FontBBoxCalculator,
    private cssFixer: CssFixer,
    private fontFixer: FontFixer
  ) {}
  convert(label: Label, paramaters?: { [node_id: string]: string }) {
    const mapLabel = new MapLabel();
    mapLabel.rotation = label.rotation;
    mapLabel.style = label.style;
    mapLabel.text = label.text;
    mapLabel.x = label.x;
    mapLabel.y = label.y;
    mapLabel.originalX = label.x;
    mapLabel.originalY = label.y;

    if (paramaters !== undefined) {
      mapLabel.id = paramaters.node_id;
      mapLabel.nodeId = paramaters.node_id;
    }

    const fixedCss = this.cssFixer.fix(mapLabel.style);
    const fixedFont = this.fontFixer.fixStyles(fixedCss);
    const box = this.fontBBoxCalculator.calculate(mapLabel.text, fixedFont);

    if (mapLabel.x !== null) {
      mapLabel.x += 3;
    }

    if (mapLabel.y !== null) {
      mapLabel.y += box.height;
    }

    return mapLabel;
  }
}
