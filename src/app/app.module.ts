import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { D3Service } from 'd3-ng2-service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { MapComponent } from './cartography/map/map.component';
import {CreateSnapshotDialogComponent, ProjectMapComponent} from './project-map/project-map.component';
import { ServersComponent, AddServerDialogComponent } from './servers/servers.component';
import { ProjectsComponent } from './projects/projects.component';

import { VersionService } from './shared/services/version.service';
import { ProjectService } from './shared/services/project.service';
import { SymbolService } from "./shared/services/symbol.service";
import { ServerService } from "./shared/services/server.service";
import { IndexedDbService } from "./shared/services/indexed-db.service";
import { HttpServer } from "./shared/services/http-server.service";
import { DefaultLayoutComponent } from './default-layout/default-layout.component';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatMenuModule,
  MatToolbarModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatTableModule,
  MatDialogModule
} from '@angular/material';

import {CdkTableModule} from "@angular/cdk/table";
import {SnapshotService} from "./shared/services/snapshot.service";

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ProjectMapComponent,
    ServersComponent,
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    ProjectsComponent,
    DefaultLayoutComponent,
  ],
  imports: [
    NgbModule.forRoot(),
    BrowserModule,
    HttpModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    CdkTableModule
  ],
  providers: [
    D3Service,
    VersionService,
    ProjectService,
    SymbolService,
    ServerService,
    IndexedDbService,
    HttpServer,
    SnapshotService
  ],
  entryComponents: [
    AddServerDialogComponent,
    CreateSnapshotDialogComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
