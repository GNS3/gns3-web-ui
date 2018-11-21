import { Injectable } from '@angular/core';

import { Converter } from '../converter';
import { MapDrawing } from '../../models/map/map-drawing';
import { RectElement } from '../../models/drawings/rect-element';


@Injectable()
export class MapDrawingToSvgConverter implements Converter<MapDrawing, string> {
    constructor(
    ) {}

    convert(mapDrawing: MapDrawing) {
        let str = `<svg height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\">`;
        let elem = ``;

        if (mapDrawing.element instanceof RectElement) {
            elem = `<rect fill=\"${mapDrawing.element.fill}\" fill-opacity=\"${mapDrawing.element.fill_opacity}\" height=\"${mapDrawing.element.height}\" width=\"${mapDrawing.element.width}\" stroke=\"${mapDrawing.element.stroke}\" stroke-width=\"${mapDrawing.element.stroke_width}\" />`;
        }

        return str + elem + `</svg>`;
    }
}