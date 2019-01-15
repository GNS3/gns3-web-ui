import { SymbolsDataSource } from './symbols-datasource';
import { Symbol } from '../../models/symbol';

describe('SymbolsDataSource', () => {
  let dataSource: SymbolsDataSource;
  let data: Symbol[];

  beforeEach(() => {
    dataSource = new SymbolsDataSource();
    dataSource.changes.subscribe((symbols: Symbol[]) => {
      data = symbols;
    });
  });

  describe('Symbol can be updated', () => {
    beforeEach(() => {
      const symbol = new Symbol();
      symbol.symbol_id = '1';
      symbol.filename = 'test-1';
      dataSource.add(symbol);

      symbol.filename = 'test-2';
      dataSource.update(symbol);
    });

    it('filename should change', () => {
      expect(data[0].symbol_id).toEqual('1');
      expect(data[0].filename).toEqual('test-2');
    });
  });
});
