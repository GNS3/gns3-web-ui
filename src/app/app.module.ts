import * as Raven from 'raven-js';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkTableModule } from "@angular/cdk/table";
import { HttpClientModule } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { D3Service } from 'd3-ng2-service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HotkeyModule } from 'angular2-hotkeys';
import { PersistenceModule } from 'angular-persistence';
import { NgxElectronModule } from 'ngx-electron';

import { AppRoutingModule } from './app-routing.module';

import { VersionService } from './services/version.service';
import { ProjectService } from './services/project.service';
import { SymbolService } from "./services/symbol.service";
import { ServerService } from "./services/server.service";
import { IndexedDbService } from "./services/indexed-db.service";
import { HttpServer, ServerErrorHandler } from "./services/http-server.service";
import { SnapshotService } from "./services/snapshot.service";
import { ProgressDialogService } from "./common/progress-dialog/progress-dialog.service";
import { NodeService } from "./services/node.service";
import { ApplianceService } from "./services/appliance.service";
import { LinkService } from "./services/link.service";

import { ProjectsComponent } from './components/projects/projects.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { ProgressDialogComponent } from './common/progress-dialog/progress-dialog.component';
import { AppComponent } from './app.component';

import { ProjectMapComponent } from './components/project-map/project-map.component';
import { ServersComponent, AddServerDialogComponent } from './components/servers/servers.component';
import { NodeContextMenuComponent } from './components/project-map/node-context-menu/node-context-menu.component';
import { StartNodeActionComponent } from './components/project-map/node-context-menu/actions/start-node-action/start-node-action.component';
import { StopNodeActionComponent } from './components/project-map/node-context-menu/actions/stop-node-action/stop-node-action.component';
import { ApplianceComponent } from './components/appliance/appliance.component';
import { ApplianceListDialogComponent } from './components/appliance/appliance-list-dialog/appliance-list-dialog.component';
import { NodeSelectInterfaceComponent } from './components/project-map/node-select-interface/node-select-interface.component';
import { CartographyModule } from './cartography/cartography.module';
import { ToasterService } from './services/toaster.service';
import { ProjectWebServiceHandler } from "./handlers/project-web-service-handler";
import { LinksDataSource } from "./cartography/datasources/links-datasource";
import { NodesDataSource } from "./cartography/datasources/nodes-datasource";
import { SymbolsDataSource } from "./cartography/datasources/symbols-datasource";
import { SelectionManager } from "./cartography/managers/selection-manager";
import { InRectangleHelper } from "./cartography/helpers/in-rectangle-helper";
import { DrawingsDataSource } from "./cartography/datasources/drawings-datasource";
import { MoveLayerDownActionComponent } from './components/project-map/node-context-menu/actions/move-layer-down-action/move-layer-down-action.component';
import { MoveLayerUpActionComponent } from './components/project-map/node-context-menu/actions/move-layer-up-action/move-layer-up-action.component';
import { ProjectMapShortcutsComponent } from './components/project-map/project-map-shortcuts/project-map-shortcuts.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsService } from "./services/settings.service";

import { LocalServerComponent } from './components/local-server/local-server.component';
import { ProgressComponent } from './common/progress/progress.component';
import { ProgressService } from "./common/progress/progress.service";
import { version } from "./version";
import { ToasterErrorHandler } from "./common/error-handlers/toaster-error-handler";
import { environment } from "../environments/environment";
import { RavenState } from "./common/error-handlers/raven-state-communicator";
import { ServerDiscoveryComponent } from "./components/servers/server-discovery/server-discovery.component";
import { ServerDatabase } from './services/server.database';
import { CreateSnapshotDialogComponent } from './components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component';
import { SnapshotsComponent } from './components/snapshots/snapshots.component';
import { SnapshotMenuItemComponent } from './components/snapshots/snapshot-menu-item/snapshot-menu-item.component';
import { MATERIAL_IMPORTS } from './material.imports';


if (environment.production) {
  Raven
    .config('https://b2b1cfd9b043491eb6b566fd8acee358@sentry.io/842726', {
      shouldSendCallback: () => {
        return RavenState.shouldSend;
      },
      release: version
    })
    .install();
}


@NgModule({
  declarations: [
    AppComponent,
    ProjectMapComponent,
    ServersComponent,
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    SnapshotMenuItemComponent,
    SnapshotsComponent,
    ProjectsComponent,
    DefaultLayoutComponent,
    ProgressDialogComponent,
    NodeContextMenuComponent,
    StartNodeActionComponent,
    StopNodeActionComponent,
    ApplianceComponent,
    ApplianceListDialogComponent,
    NodeSelectInterfaceComponent,
    MoveLayerDownActionComponent,
    MoveLayerUpActionComponent,
    ProjectMapShortcutsComponent,
    SettingsComponent,
    LocalServerComponent,
    ProgressComponent,
    ServerDiscoveryComponent,
  ],
  imports: [
    NgbModule.forRoot(),
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    CdkTableModule,
    CartographyModule,
    HotkeyModule.forRoot(),
    PersistenceModule,
    NgxElectronModule,
    ...MATERIAL_IMPORTS
  ],
  providers: [
    SettingsService,
    { provide: ErrorHandler, useClass: ToasterErrorHandler },
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
    ProgressDialogService,
    ToasterService,
    ProgressService,
    ProjectWebServiceHandler,
    LinksDataSource,
    NodesDataSource,
    SymbolsDataSource,
    SelectionManager,
    InRectangleHelper,
    DrawingsDataSource,
    ServerErrorHandler,
    ServerDatabase
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
