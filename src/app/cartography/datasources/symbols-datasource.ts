import { Injectable } from '@angular/core';

import { Symbol } from '../../models/symbol';
import { DataSource } from './datasource';

@Injectable()
export class SymbolsDataSource extends DataSource<Symbol> {
  protected getItemKey(symbol: Symbol) {
    return symbol.symbol_id;
  }
}
