import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { Label } from "../../models/label";
import { MapLabel } from "../../models/map/map-label";


@Injectable()
export class MapLabelToLabelConverter implements Converter<MapLabel, Label> {
    convert(mapLabel: MapLabel) {
        const label = new Label();
        label.rotation = mapLabel.rotation;
        label.style = mapLabel.style;
        label.text = mapLabel.text;
        label.x = mapLabel.x;
        label.y = mapLabel.y;
        return label;
    }
}
