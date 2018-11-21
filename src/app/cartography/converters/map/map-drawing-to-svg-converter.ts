import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapDrawing } from '../../models/map/map-drawing';


@Injectable()
export class MapDrawingToSvgConverter implements Converter<MapDrawing, string> {
    constructor(
    ) {}

    convert(mapDrawing: MapDrawing) {
        return "";
    }
}