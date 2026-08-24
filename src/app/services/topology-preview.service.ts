import { Injectable } from '@angular/core';
import { asyncScheduler, Observable } from 'rxjs';
import { map, mergeMap, subscribeOn } from 'rxjs/operators';
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
 * Every call fetches fresh (the request revalidates via ETag — an unchanged
 * file answers 304): the file changes whenever the project is edited
 * elsewhere, and holding a cached copy would silently drop those changes.
 * GraphDataManager diff-renders identical content as a no-op, so a
 * same-content refetch stays cheap.
 */
@Injectable({ providedIn: 'root' })
export class TopologyPreviewService {
  constructor(
    private projectService: ProjectService,
    private nodeSymbolResolver: NodeSymbolResolverService
  ) {}

  load(controller: Controller, project: Project): Observable<TopologyPreviewData> {
    // Deliver asynchronously: the consumer drives a loading → ready state
    // machine whose loading frame must actually render — a synchronous
    // emission skips it, the map never remounts, and the canvas origin stays
    // locked to the previous project's content center. Note the explicit
    // delay: asyncScheduler executes delay-0 actions synchronously.
    return this.projectService.gns3file(controller, project.project_id).pipe(
      map((file) => mapGns3FileTopology(file, project.project_id)),
      mergeMap((data) =>
        this.nodeSymbolResolver.resolve(controller, data.nodes).pipe(map((nodes) => ({ ...data, nodes })))
      ),
      subscribeOn(asyncScheduler, 1)
    );
  }
}
