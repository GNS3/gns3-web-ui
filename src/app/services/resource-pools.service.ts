import {Injectable} from '@angular/core';
import {Controller} from "@models/controller";
import {Observable, of} from "rxjs";
import {ResourcePool} from "@models/resourcePools/ResourcePool";
import {HttpController} from "@services/http-controller.service";
import {Resource} from "@models/resourcePools/Resource";
import {filter, map, mergeAll, switchMap, tap} from "rxjs/operators";
import {Project} from "@models/project";
import {ProjectService} from "@services/project.service";

@Injectable({
  providedIn: 'root'
})
export class ResourcePoolsService {

  constructor(private httpController: HttpController,
              private projectService: ProjectService) {
  }

  getAll(controller: Controller) {
    return this.httpController.get<ResourcePool[]>(controller, '/pools');
  }

  get(controller: Controller, poolId: string): Observable<ResourcePool> {
    return Observable.forkJoin([
      this.httpController.get<ResourcePool>(controller, `/pools/${poolId}`),
      this.httpController.get<Resource[]>(controller, `/pools/${poolId}/resources`),
    ]).pipe(map(results => {
      results[0].resources = results[1];
      return results[0];
    }));
  }

  delete(controller: Controller, uuid: string) {
    return this.httpController.delete(controller, `/pools/${uuid}`);
  }

  add(controller: Controller, newPoolName: string) {
    return this.httpController.post<{ name: string }>(controller, '/pools', {name: newPoolName});
  }

  update(controller: Controller, pool: ResourcePool) {
    return this.httpController.put(controller, `/pools/${pool.resource_pool_id}`, {name: pool.name});
  }

  addResource(controller: Controller, pool: ResourcePool, project: Project) {
    return this.httpController.put<string>(controller, `/pools/${pool.resource_pool_id}/resources/${project.project_id}`, {});
  }

  deleteResource(controller: Controller, resource: Resource, pool: ResourcePool) {
    return this.httpController.delete<string>(controller, `/pools/${pool.resource_pool_id}/resources/${resource.resource_id}`);
  }

  getFreeResources(controller: Controller) {
    return this.projectService
      .list(controller)
      .pipe(
        switchMap((projects) => {
            return this.getAllNonFreeResources(controller)
              .pipe(map(resources => resources.map(resource => resource.resource_id)),
                map(resources_id => projects.filter(project => !resources_id.includes(project.project_id)))
              )
          }));
  }

  private getAllNonFreeResources(controller: Controller) {
    return this.getAll(controller)
      .pipe(switchMap((resourcesPools) => {
        return Observable.forkJoin(
          resourcesPools.map((r) => this.httpController.get<Resource[]>(controller, `/pools/${r.resource_pool_id}/resources`),)
        )
      }),
        map((data) => {

          //flatten results

          const output: Resource[] = [];
          for(const res of data) {
            for(const r of res) {
              output.push(r);
            }
          }

          return output;

        }));
  }
}
