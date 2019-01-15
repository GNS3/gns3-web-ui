import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';

import { Symbol } from '../models/symbol';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';

@Injectable()
export class SymbolService {
  public symbols: BehaviorSubject<Symbol[]> = new BehaviorSubject<Symbol[]>([]);

  constructor(private httpServer: HttpServer) {}

  get(symbol_id: string): Symbol {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.symbol_id === symbol_id);
  }

  load(server: Server): Observable<Symbol[]> {
    const subscription = this.list(server).subscribe((symbols: Symbol[]) => {
      const streams = symbols.map(symbol => this.raw(server, symbol.symbol_id));
      forkJoin(streams).subscribe(results => {
        symbols.forEach((symbol: Symbol, i: number) => {
          symbol.raw = results[i];
        });
        this.symbols.next(symbols);
        subscription.unsubscribe();
      });
    });
    return this.symbols.asObservable();
  }

  list(server: Server) {
    return this.httpServer.get<Symbol[]>(server, '/symbols');
  }

  raw(server: Server, symbol_id: string) {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer.getText(server, `/symbols/${encoded_uri}/raw`);
  }
}
