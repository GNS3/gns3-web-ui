import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { CdkTableModule } from "@angular/cdk/table";
import { HttpClientModule } from '@angular/common/http';

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
  MatDialogModule,
  MatProgressBarModule,
  MatProgressSpinnerModule
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
import { NodeService } from "./shared/services/node.service";
import { ApplianceService } from "./shared/services/appliance.service";
import { LinkService } from "./shared/services/link.service";

import { ProjectsComponent } from './projects/projects.component';
import { DefaultLayoutComponent } from './default-layout/default-layout.component';
import { ProgressDialogComponent } from './shared/progress-dialog/progress-dialog.component';
import { AppComponent } from './app.component';
//import { MapComponent } from './cartography/map/map.component';
import { CreateSnapshotDialogComponent, ProjectMapComponent } from './project-map/project-map.component';
import { ServersComponent, AddServerDialogComponent } from './servers/servers.component';
import { NodeContextMenuComponent } from './shared/node-context-menu/node-context-menu.component';
import { StartNodeActionComponent } from './shared/node-context-menu/actions/start-node-action/start-node-action.component';
import { StopNodeActionComponent } from './shared/node-context-menu/actions/stop-node-action/stop-node-action.component';
import { ApplianceComponent } from './appliance/appliance.component';
import { ApplianceListDialogComponent } from './appliance/appliance-list-dialog/appliance-list-dialog.component';
import { NodeSelectInterfaceComponent } from './shared/node-select-interface/node-select-interface.component';
import { CartographyModule } from './cartography/cartography.module';


@NgModule({
  declarations: [
    AppComponent,
    ProjectMapComponent,
    ServersComponent,
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    ProjectsComponent,
    DefaultLayoutComponent,
    ProgressDialogComponent,
    NodeContextMenuComponent,
    StartNodeActionComponent,
    StopNodeActionComponent,
    ApplianceComponent,
    ApplianceListDialogComponent,
    NodeSelectInterfaceComponent,
  ],
  imports: [
    NgbModule.forRoot(),
    ToastyModule.forRoot(),
    BrowserModule,
    HttpModule,
    HttpClientModule,
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
    MatProgressSpinnerModule,
    CdkTableModule,
    CartographyModule
  ],
  providers: [
    D3Service,
    VersionService,
    ProjectService,
    SymbolService,
    ServerService,
    ApplianceService,
    NodeService,
    LinkService,
    IndexedDbService,
    HttpServer,
    SnapshotService,
    ProgressDialogService
  ],
  entryComponents: [
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    ProgressDialogComponent,
    ApplianceListDialogComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
