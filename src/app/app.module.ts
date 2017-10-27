import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { D3Service } from 'd3-ng2-service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { ProjectMapComponent } from './project-map/project-map.component';
import { ServerCreateModalComponent, ServersComponent } from './servers/servers.component';
import { ProjectsComponent } from './projects/projects.component';

import { VersionService } from './services/version.service';
import { ProjectService } from './services/project.service';
import { SymbolService } from "./services/symbol.service";
import { ServerService } from "./services/server.service";
import { IndexedDbService } from "./services/indexed-db.service";
import { HttpServer } from "./services/http-server.service";
import { DefaultLayoutComponent } from './default-layout/default-layout.component';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ProjectMapComponent,
    ServersComponent,
    ServerCreateModalComponent,
    ProjectsComponent,
    DefaultLayoutComponent,
  ],
  imports: [
    NgbModule.forRoot(),
    BrowserModule,
    HttpModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    D3Service,
    VersionService,
    ProjectService,
    SymbolService,
    ServerService,
    IndexedDbService,
    HttpServer,
  ],
  entryComponents: [
    ServerCreateModalComponent,
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
