import { Injectable } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Node } from '../cartography/models/node';
import { Controller } from '@models/controller';
import { environment } from 'environments/environment';
import { SymbolService } from './symbol.service';

/**
 * Fills symbol_url (and width/height when unknown) on nodes that lack them.
 *
 * Extracted from project-map's nodesDataSource.changes handler so the static
 * topology preview can share it. Both symbol dimensions and blob URLs are in
 * place before the single emission: a static preview gets no WS-driven
 * redraw that could fix them afterwards (label centering reads node.width).
 */
@Injectable({ providedIn: 'root' })
export class NodeSymbolResolverService {
  constructor(private symbolService: SymbolService) {}

  resolve(controller: Controller, nodes: Node[]): Observable<Node[]> {
    const nodesToLoad = nodes.filter((node: Node) => !node.symbol_url);
    if (nodesToLoad.length === 0) {
      return of(nodes);
    }

    // Fetch dimensions for any node with unknown size. Per-call catchError
    // keeps one failing symbol from killing the join (log and continue).
    const dimensions$ = forkJoin(
      nodesToLoad.map((node: Node) => {
        if (node.width == 0 && node.height == 0) {
          return this.symbolService.getDimensions(controller, node.symbol).pipe(
            map((dimensions) => ({ node, dimensions })),
            catchError(() => {
              console.error('Failed to get symbol dimensions:', node.symbol);
              return of(null);
            })
          );
        }
        return of(null);
      })
    ).pipe(
      tap((results) => {
        for (const result of results) {
          if (result) {
            result.node.width = result.dimensions.width;
            result.node.height = result.dimensions.height;
          }
        }
      })
    );

    // Deduplicate: only 1 fetch per unique symbol URL (shareReplay(1) in
    // getSymbolBlobUrl handles concurrent callers). Fall back to raw URLs if
    // the blob fetch fails.
    const rawUrlByNode = new Map<Node, string>();
    nodesToLoad.forEach((node: Node) => {
      rawUrlByNode.set(node, `/symbols/${node.symbol}/raw`);
    });
    const uniqueRawUrls = Array.from(new Set(rawUrlByNode.values()));
    const blobs$ = forkJoin(uniqueRawUrls.map((url) => this.symbolService.getSymbolBlobUrl(controller, url))).pipe(
      map((blobUrls: string[]) => {
        const blobUrlMap = new Map(uniqueRawUrls.map((url, i) => [url, blobUrls[i]]));
        nodesToLoad.forEach((node: Node) => {
          node.symbol_url = blobUrlMap.get(rawUrlByNode.get(node));
        });
      }),
      catchError(() => {
        nodesToLoad.forEach((node: Node) => {
          node.symbol_url = `${controller.protocol}//${controller.host}:${controller.port}/${
            environment.current_version
          }${rawUrlByNode.get(node)}`;
        });
        return of(null);
      })
    );

    return forkJoin([dimensions$, blobs$]).pipe(map(() => nodes));
  }
}
