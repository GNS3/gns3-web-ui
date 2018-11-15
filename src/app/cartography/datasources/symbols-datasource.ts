import { Injectable } from "@angular/core";

import { DataSource } from "./datasource";
import { Symbol } from "../../models/symbol";


@Injectable()
export class SymbolsDataSource extends DataSource<Symbol> {
  protected findIndex(symbol: Symbol) {
    return this.data.findIndex((s: Symbol) => s.symbol_id === symbol.symbol_id);
  }
}
