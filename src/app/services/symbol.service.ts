import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';

import { Symbol } from '../models/symbol';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { shareReplay } from 'rxjs/operators';

const CACHE_SIZE = 1;

@Injectable()
export class SymbolService {
  public symbols: BehaviorSubject<Symbol[]> = new BehaviorSubject<Symbol[]>([]);
  private cache: Observable<Symbol[]>;

  constructor(private httpServer: HttpServer) {}

  get(symbol_id: string): Symbol {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.symbol_id === symbol_id);
  }

  add(server: Server, symbolName: string, symbol: string) {
    this.cache = null;
    return this.httpServer.post(server, `/symbols/${symbolName}/raw`, symbol)
  }

  load(server: Server): Observable<Symbol[]> {
    return this.httpServer.get<Symbol[]>(server, '/symbols');
  }

  list(server: Server) {
    if(!this.cache) {
      this.cache = this.load(server).pipe(
        shareReplay(CACHE_SIZE)
      );
    }

    return this.cache;
  }

  raw(server: Server, symbol_id: string) {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer.getText(server, `/symbols/${encoded_uri}/raw`);
  }
}
