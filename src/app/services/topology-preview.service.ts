import { Injectable } from '@angular/core';
import { asyncScheduler, Observable } from 'rxjs';
import { map, mergeMap, shareReplay, subscribeOn, tap } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ProjectService } from './project.service';
import { NodeSymbolResolverService } from './node-symbol-resolver.service';
import { mapGns3FileTopology, TopologyPreviewData } from './gns3-file.mapper';

/**
 * Loads a static topology preview from the raw `.gns3` file
 * (`GET /projects/{id}/gns3file` — available for closed projects) and maps it
 * onto the models the map renders from.
 *
 * Results are cached per controller+project (shareReplay): switching between
 * the panel thumbnail and the enlarged dialog remounts the map but never
 * refetches. Failed loads are evicted so a later selection retries.
 */
@Injectable({ providedIn: 'root' })
export class TopologyPreviewService {
  private cache = new Map<string, Observable<TopologyPreviewData>>();

  constructor(
    private projectService: ProjectService,
    private nodeSymbolResolver: NodeSymbolResolverService
  ) {}

  load(controller: Controller, project: Project): Observable<TopologyPreviewData> {
    const key = `${controller.host}:${controller.port}:${project.project_id}`;
    // Both paths (fresh and cached) go through the deferred return below —
    // a synchronous cache replay would skip the consumer's loading frame.
    const cached = this.cache.get(key);
    if (cached) return cached.pipe(subscribeOn(asyncScheduler, 1));

    const load$ = this.projectService.gns3file(controller, project.project_id).pipe(
      map((file) => mapGns3FileTopology(file, project.project_id)),
      mergeMap((data) =>
        this.nodeSymbolResolver.resolve(controller, data.nodes).pipe(map((nodes) => ({ ...data, nodes })))
      ),
      // Evict failures before shareReplay caches them, so a retry refetches.
      tap({ error: () => this.cache.delete(key) }),
      shareReplay(1)
    );
    this.cache.set(key, load$);
    // Always deliver asynchronously (also on cache hits): the consumer drives
    // a loading → ready state machine whose loading frame must actually render
    // — a synchronous replay skips it, the map never remounts, and the canvas
    // origin stays locked to the previous project's content center. Note the
    // explicit delay: asyncScheduler executes delay-0 actions synchronously.
    return load$.pipe(subscribeOn(asyncScheduler, 1));
  }

  /** Drop cached entries — for a projectId, or everything when omitted. */
  invalidate(projectId?: string): void {
    if (projectId === undefined) {
      this.cache.clear();
      return;
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.endsWith(`:${projectId}`)) this.cache.delete(key);
    }
  }
}
