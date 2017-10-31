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
import { ServersComponent, AddServerDialogComponent } from './servers/servers.component';
import { ProjectsComponent } from './projects/projects.component';

import { VersionService } from './services/version.service';
import { ProjectService } from './services/project.service';
import { SymbolService } from "./services/symbol.service";
import { ServerService } from "./services/server.service";
import { IndexedDbService } from "./services/indexed-db.service";
import { HttpServer } from "./services/http-server.service";
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

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ProjectMapComponent,
    ServersComponent,
    AddServerDialogComponent,
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
  ],
  entryComponents: [
    AddServerDialogComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
