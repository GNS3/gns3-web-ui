import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';

import { Symbol } from '../../cartography/shared/models/symbol';
import { Server } from "../models/server";
import { HttpServer } from "./http-server.service";


@Injectable()
export class SymbolService {
  public symbols: BehaviorSubject<Symbol[]> = new BehaviorSubject<Symbol[]>([]);

  constructor(private httpServer: HttpServer) { }

  get(symbol_id: string): Symbol {
    return this.symbols
      .getValue()
      .find((symbol: Symbol) => symbol.symbol_id === symbol_id);
  }

  load(server: Server): Observable<Symbol[]> {
    this.list(server).subscribe((symbols: Symbol[]) => {
      const streams = symbols.map(symbol => this.raw(server, symbol.symbol_id));
      Observable.forkJoin(streams).subscribe((results) => {
        symbols.forEach((symbol: Symbol, i: number) => {
          symbol.raw = results[i].body;
        });
        this.symbols.next(symbols);
      });
    });
    return this.symbols.asObservable();
  }

  list(server: Server) {
    return this.httpServer
                .get<Symbol[]>(server, '/symbols');
  }

  raw(server: Server, symbol_id: string) {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer
                .getText(server, `/symbols/${encoded_uri}/raw`);
  }
}
