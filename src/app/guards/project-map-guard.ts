import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ProjectMapComponent } from '../components/project-map/project-map.component';
import { Observable, pipe, timer, from } from 'rxjs';
import { ProjectService } from '../services/project.service';
import { Server } from '../models/server';
import { ServerService } from '../services/server.service';
import { switchMap, map } from 'rxjs/operators';
import { ToasterService } from '../services/toaster.service';

@Injectable()
export class ProjectMapGuard implements CanActivate {
    constructor(
        private projectService: ProjectService, 
        private serverService: ServerService,
        private toasterService: ToasterService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        const server_id = route.paramMap.get("server_id");
        const project_id = route.paramMap.get("project_id");

        // return from(this.serverService.tryToCreateDb()).pipe(
        //     switchMap(response => {
        //         return this.serverService.get(parseInt(server_id, 10));
        //     }),
        //     switchMap(response => { 
        //         if (!response) this.router.navigate(['/servers']);
        //         return this.projectService.list(response as Server)
        //     }),
        //     map(response => {
        //         let projectToOpen = response.find(n => n.project_id === project_id);
        //         if (projectToOpen) return true;
                
        //         this.toasterService.error('Project could not be opened');
        //         this.projectService.projectListUpdated();
        //         return false;
        //     })
        // )

        return true;
    }
}
