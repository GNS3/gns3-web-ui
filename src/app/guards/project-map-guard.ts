import { Injectable } from "@angular/core";
import { CanDeactivate } from '@angular/router';
import { ProjectMapComponent } from '../components/project-map/project-map.component';
import { Observable, pipe, timer, from } from 'rxjs';
import { ProjectService } from '../services/project.service';
import { Server } from '../models/server';
import { ServerService } from '../services/server.service';
import { switchMap, map } from 'rxjs/operators';

@Injectable()
export class ProjectMapGuard implements CanDeactivate<ProjectMapComponent> {
    constructor(
        private projectService: ProjectService, 
        private serverService: ServerService
        ) {}

    canDeactivate(
        component: ProjectMapComponent, 
        currentRoute: import("@angular/router").ActivatedRouteSnapshot, 
        currentState: import("@angular/router").RouterStateSnapshot, 
        nextState?: import("@angular/router").RouterStateSnapshot): Observable<boolean>
    {
        const server_id = currentRoute.paramMap.get("server_id");
        const project_id = currentRoute.paramMap.get("project_id");

        return from(this.serverService.get(parseInt(server_id, 10))).pipe(
            switchMap(response => this.projectService.list(response as Server)),
            map(response => (response.find(n => n.project_id === project_id) ? true : false))
        )
    }
}
