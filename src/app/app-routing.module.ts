import { environment } from "../environments/environment";

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectMapComponent } from './project-map/project-map.component';
import { ServersComponent } from "./servers/servers.component";
import { ProjectsComponent } from "./projects/projects.component";
import { DefaultLayoutComponent } from "./layouts/default-layout/default-layout.component";
import { SettingsComponent } from "./settings/settings.component";
import { LocalServerComponent } from "./local-server/local-server.component";


const routes: Routes = [
  { path: '',  component: DefaultLayoutComponent,
    children: [
      { path: '', redirectTo: 'servers', pathMatch: 'full'},
      { path: 'servers', component: ServersComponent },
      { path: 'local', component: LocalServerComponent },
      { path: 'server/:server_id/projects', component: ProjectsComponent },
      { path: 'settings', component: SettingsComponent },
    ]
  },
  { path: 'server/:server_id/project/:project_id', component: ProjectMapComponent },
];

let routerModule;
if (environment.electron) {
  // angular in electron has problem with base-href and links separated by slashes, because of that
  // we use simply hashes
  routerModule = RouterModule.forRoot(routes, {useHash: true});
} else {
  routerModule = RouterModule.forRoot(routes);
}

@NgModule({
  imports: [ routerModule ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
