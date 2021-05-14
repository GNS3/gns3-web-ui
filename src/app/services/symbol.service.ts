import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Node } from '../cartography/models/node';
import { Server } from '../models/server';
import { Symbol } from '../models/symbol';
import { HttpServer } from './http-server.service';
import { Template } from '../models/template';

@Injectable()
export class SymbolService {
  private symbols: Symbol[] = [];
  private maximumSymbolSize: number = 80;
  public symbolsLoaded: Subject<boolean> = new Subject<boolean>();

  constructor(private httpServer: HttpServer) {}

  async load(server: Server) {
    let symbols  = await this.httpServer.get<Symbol[]>(server, '/symbols').toPromise();
    await symbols.forEach(async symbol => {
      symbol.raw = await this.raw(server, symbol.symbol_id).toPromise();
      this.symbols.push(symbol);
    });
    this.symbolsLoaded.next(true);
  }

  getMaximumSymbolSize() {
    return this.maximumSymbolSize;
  }

  get(symbol_id: string): Symbol {
    return this.symbols.find((symbol: Symbol) => symbol.filename === symbol_id);
  }

  getDimensions(server: Server, symbol_id: string): Observable<SymbolDimension> {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer.get(server, `/symbols/${encoded_uri}/dimensions`);
  }

  scaleDimensionsForNode(node: Node): SymbolDimension {
    let scale = node.width > node.height ? this.maximumSymbolSize / node.width : this.maximumSymbolSize / node.height;
    return {
      width: node.width * scale,
      height: node.height * scale,
    };
  }

  add(server: Server, symbolName: string, symbol: string) {
    this.load(server);
    return this.httpServer.post(server, `/symbols/${symbolName}/raw`, symbol);
  }

  list(server: Server) {
    return this.httpServer.get<Symbol[]>(server, '/symbols');
  }

  raw(server: Server, symbol_id: string) {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpServer.getText(server, `/symbols/${encoded_uri}/raw`);
  }

  getSymbolFromTemplate(server: Server, template: Template) {
    return `${server.protocol}//${server.host}:${server.port}/v3/symbols/${template.symbol}/raw`;
  }
}

class SymbolDimension {
  width: number;
  height: number;
}
