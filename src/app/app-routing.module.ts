import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectMapComponent } from './project-map/project-map.component';
import { ServersComponent } from "./servers/servers.component";
import { ProjectsComponent } from "./projects/projects.component";

const routes: Routes = [
  { path: '', redirectTo: '/servers', pathMatch: 'full' },
  { path: 'servers', component: ServersComponent },
  { path: 'server/:server_id/projects', component: ProjectsComponent },
  { path: 'server/:server_id/project/:project_id', component: ProjectMapComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
