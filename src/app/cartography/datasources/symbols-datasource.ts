import { Injectable } from '@angular/core';

import { DataSource } from './datasource';
import { Symbol } from '../../models/symbol';

@Injectable()
export class SymbolsDataSource extends DataSource<Symbol> {
  protected getItemKey(symbol: Symbol) {
    return symbol.symbol_id;
  }
}
