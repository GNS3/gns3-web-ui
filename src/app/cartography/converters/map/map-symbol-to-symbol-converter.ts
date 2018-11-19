import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { MapSymbol } from "../../models/map/map-symbol";
import { Symbol } from "../../../models/symbol";


@Injectable()
export class MapSymbolToSymbolConverter implements Converter<MapSymbol, Symbol> {
    convert(mapSymbol: MapSymbol) {
        const symbol = new Symbol();
        symbol.symbol_id = mapSymbol.id;
        symbol.builtin = mapSymbol.builtin;
        symbol.filename = mapSymbol.filename;
        symbol.raw = mapSymbol.raw;
        return symbol;
    }
}
