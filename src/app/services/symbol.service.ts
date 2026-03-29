import { Injectable } from '@angular/core';
import { Template } from '@models/template';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';
import { Symbol } from '@models/symbol';
import { HttpController } from './http-controller.service';
import { environment } from 'environments/environment';

const CACHE_SIZE = 1;

@Injectable()
export class SymbolService {
  public symbols: BehaviorSubject<Symbol[]> = new BehaviorSubject<Symbol[]>([]);
  private cache: Observable<Symbol[]>;
  private builtinCache: Observable<Symbol[]>;
  private dimensionsCache = new Map<string, Observable<SymbolDimension>>();
  private blobUrlCache = new Map<string, Observable<string>>();
  private maximumSymbolSize: number = 80;

  constructor(private httpController: HttpController) {}

  getMaximumSymbolSize() {
    return this.maximumSymbolSize;
  }

  get(symbol_id: string): Symbol {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.symbol_id === symbol_id);
  }

  getDimensions(controller: Controller, symbol_id: string): Observable<SymbolDimension> {
    const cacheKey = `${controller.host}:${controller.port}:${symbol_id}`;
    if (!this.dimensionsCache.has(cacheKey)) {
      const encoded_uri = encodeURI(symbol_id);
      this.dimensionsCache.set(
        cacheKey,
        this.httpController.get<SymbolDimension>(controller, `/symbols/${encoded_uri}/dimensions`).pipe(shareReplay(1))
      );
    }
    return this.dimensionsCache.get(cacheKey);
  }

  getSymbolBlobUrl(controller: Controller, symbolRawUrl: string): Observable<string> {
    if (!this.blobUrlCache.has(symbolRawUrl)) {
      this.blobUrlCache.set(
        symbolRawUrl,
        this.httpController.getBlob(controller, symbolRawUrl).pipe(
          map((blob) => URL.createObjectURL(blob)),
          shareReplay(1)
        )
      );
    }
    return this.blobUrlCache.get(symbolRawUrl);
  }

  scaleDimensionsForNode(node: Node): SymbolDimension {
    let scale = node.width > node.height ? this.maximumSymbolSize / node.width : this.maximumSymbolSize / node.height;
    return {
      width: node.width * scale,
      height: node.height * scale,
    };
  }

  getByFilename(symbol_filename: string) {
    return this.symbols.getValue().find((symbol: Symbol) => symbol.filename === symbol_filename);
  }

  add(controller: Controller, symbolName: string, symbol: string) {
    // Only invalidate regular cache, builtin cache stays valid
    this.cache = null;
    return this.httpController.post(controller, `/symbols/${symbolName}/raw`, symbol);
  }

  addFile(controller: Controller, symbolName: string, file: Blob) {
    // Only invalidate regular cache, builtin cache stays valid
    this.cache = null;
    return this.httpController.postBlob(controller, `/symbols/${symbolName}/raw`, file);
  }

  delete(controller: Controller, symbolId: string) {
    // Only invalidate regular cache, builtin cache stays valid
    this.cache = null;
    const encoded_uri = encodeURI(symbolId);
    return this.httpController.delete(controller, `/symbols/${encoded_uri}`);
  }

  load(controller: Controller): Observable<Symbol[]> {
    return this.httpController.get<Symbol[]>(controller, '/symbols');
  }

  list(controller: Controller): Observable<Symbol[]> {
    if (!this.cache) {
      this.cache = this.load(controller).pipe(shareReplay(CACHE_SIZE));
    }
    return this.cache;
  }

  /**
   * Get built-in symbols with permanent caching
   * Built-in symbols don't change, so we cache them permanently
   */
  listBuiltinSymbols(controller: Controller): Observable<Symbol[]> {
    if (!this.builtinCache) {
      this.builtinCache = this.load(controller).pipe(
        map((symbols) => symbols.filter((s) => s.builtin)),
        shareReplay(1)
      );
    }
    return this.builtinCache;
  }

  /**
   * Get custom symbols (always fresh, no caching)
   */
  listCustomSymbols(controller: Controller): Observable<Symbol[]> {
    return this.load(controller).pipe(map((symbols) => symbols.filter((s) => !s.builtin)));
  }

  raw(controller: Controller, symbol_id: string) {
    const encoded_uri = encodeURI(symbol_id);
    return this.httpController.getText(controller, `/symbols/${encoded_uri}/raw`);
  }

  getSymbolFromTemplate(controller: Controller, template: Template) {
    return `${controller.protocol}//${controller.host}:${controller.port}/${environment.current_version}/symbols/${template.symbol}/raw`;
  }
}

class SymbolDimension {
  width: number;
  height: number;
}
