import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { CdkTableModule } from "@angular/cdk/table";

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
  MatDialogModule, MatProgressBarModule
} from '@angular/material';

import { D3Service } from 'd3-ng2-service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastyModule } from 'ng2-toasty';

import { AppRoutingModule } from './app-routing.module';


import { VersionService } from './shared/services/version.service';
import { ProjectService } from './shared/services/project.service';
import { SymbolService } from "./shared/services/symbol.service";
import { ServerService } from "./shared/services/server.service";
import { IndexedDbService } from "./shared/services/indexed-db.service";
import { HttpServer } from "./shared/services/http-server.service";
import { SnapshotService } from "./shared/services/snapshot.service";
import { ProgressDialogService } from "./shared/progress-dialog/progress-dialog.service";

import { ProjectsComponent } from './projects/projects.component';
import { DefaultLayoutComponent } from './default-layout/default-layout.component';
import { ProgressDialogComponent } from './shared/progress-dialog/progress-dialog.component';
import { AppComponent } from './app.component';
import { MapComponent } from './cartography/map/map.component';
import { CreateSnapshotDialogComponent, ProjectMapComponent } from './project-map/project-map.component';
import { ServersComponent, AddServerDialogComponent } from './servers/servers.component';
import { NodeContextMenuComponent } from './shared/node-context-menu/node-context-menu.component';


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
    ProgressDialogComponent,
    NodeContextMenuComponent,
  ],
  imports: [
    NgbModule.forRoot(),
    ToastyModule.forRoot(),
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
    MatProgressBarModule,
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
    SnapshotService,
    ProgressDialogService
  ],
  entryComponents: [
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    ProgressDialogComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
