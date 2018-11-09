import { Injectable } from "@angular/core";

import { Converter } from "../converter";
import { Symbol } from "../../../models/symbol";
import { MapSymbol } from "../../models/map/map-symbol";


@Injectable()
export class SymbolToMapSymbolConverter implements Converter<Symbol, MapSymbol> {
    convert(symbol: Symbol) {
        const mapSymbol = new MapSymbol();
        mapSymbol.id = symbol.symbol_id;
        mapSymbol.builtin = symbol.builtin;
        mapSymbol.filename = symbol.filename;
        mapSymbol.raw = symbol.raw;
        return mapSymbol;
    }
}
