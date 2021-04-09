import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';

import { Symbol } from '../models/symbol';
import { Server } from '../models/server';
import { HttpServer } from './http-server.service';
import { shareReplay } from 'rxjs/operators';
import { Node } from '../cartography/models/node';

const CACHE_SIZE = 1;

@Injectable()
export class SymbolService {
  public symbols: BehaviorSubject<Symbol[]> = new BehaviorSubject<Symbol[]>([]);
  private cache: Observable<Symbol[]>;
  private maximumSymbolSize: number = 80;

  constructor(private httpServer: HttpServer) {}

  getMaximumSymbolSize() {
    return this.maximumSymbolSize;
  }

  get(symbol_id: string): Symbol {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.symbol_id === symbol_id);
  }

  getDimensions(server: Server, symbol_id: string): Observable<SymbolDimension> {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer.get(server, `/symbols/${encoded_uri}/dimensions`);
  }

  scaleDimensionsForNode(node: Node): SymbolDimension {
    let scale = node.width > node.height ? this.maximumSymbolSize/node.width : this.maximumSymbolSize/node.height;
    return {
      width: node.width * scale,
      height: node.height * scale
    }
  }

  getByFilename(symbol_filename: string) {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.filename === symbol_filename);
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

class SymbolDimension {
  width: number;
  height: number
}
