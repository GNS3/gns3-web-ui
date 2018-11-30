import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { Label } from "../../models/label";
import { MapLabel } from "../../models/map/map-label";
import { FontBBoxCalculator } from '../../helpers/font-bbox-calculator';


@Injectable()
export class MapLabelToLabelConverter implements Converter<MapLabel, Label> {
  constructor(
    private fontBBoxCalculator: FontBBoxCalculator
  ) {}

  convert(mapLabel: MapLabel) {
    const box = this.fontBBoxCalculator.calculate(mapLabel.text, mapLabel.style);

    const label = new Label();
    label.rotation = mapLabel.rotation;
    label.style = mapLabel.style;
    label.text = mapLabel.text;
    label.x = mapLabel.x;
    label.y = mapLabel.y;

    if (label.x !== null) {
      label.x += 3;
    }

    if (label.y !== null) {
      label.y -= box.height;
    }

    return label;
  }
}
