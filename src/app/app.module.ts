import * as Raven from 'raven-js';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { D3Service } from 'd3-ng2-service';
import { HotkeyModule } from 'angular2-hotkeys';
import { PersistenceModule } from 'angular-persistence';
import { NgxElectronModule } from 'ngx-electron';
import { FileUploadModule } from 'ng2-file-upload';
import { AppRoutingModule } from './app-routing.module';

import { VersionService } from './services/version.service';
import { ProjectService } from './services/project.service';
import { SymbolService } from './services/symbol.service';
import { ServerService } from './services/server.service';
import { IndexedDbService } from './services/indexed-db.service';
import { HttpServer, ServerErrorHandler } from './services/http-server.service';
import { SnapshotService } from './services/snapshot.service';
import { ProgressDialogService } from './common/progress-dialog/progress-dialog.service';
import { NodeService } from './services/node.service';
import { TemplateService } from './services/template.service';
import { LinkService } from './services/link.service';

import { ProjectsComponent } from './components/projects/projects.component';
import { AddBlankProjectDialogComponent } from './components/projects/add-blank-project-dialog/add-blank-project-dialog.component';
import { ImportProjectDialogComponent } from './components/projects/import-project-dialog/import-project-dialog.component';
import { ConfirmationDialogComponent } from './components/projects/confirmation-dialog/confirmation-dialog.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { ProgressDialogComponent } from './common/progress-dialog/progress-dialog.component';
import { AppComponent } from './app.component';

import { ProjectMapComponent } from './components/project-map/project-map.component';
import { ServersComponent, AddServerDialogComponent } from './components/servers/servers.component';
import { ContextMenuComponent } from './components/project-map/context-menu/context-menu.component';
import { StartNodeActionComponent } from './components/project-map/context-menu/actions/start-node-action/start-node-action.component';
import { StopNodeActionComponent } from './components/project-map/context-menu/actions/stop-node-action/stop-node-action.component';
import { TemplateComponent } from './components/template/template.component';
import { TemplateListDialogComponent } from './components/template/template-list-dialog/template-list-dialog.component';
import { CartographyModule } from './cartography/cartography.module';
import { ToasterService } from './services/toaster.service';
import { ProjectWebServiceHandler } from './handlers/project-web-service-handler';
import { LinksDataSource } from './cartography/datasources/links-datasource';
import { NodesDataSource } from './cartography/datasources/nodes-datasource';
import { SymbolsDataSource } from './cartography/datasources/symbols-datasource';
import { SelectionManager } from './cartography/managers/selection-manager';
import { InRectangleHelper } from './cartography/helpers/in-rectangle-helper';
import { DrawingsDataSource } from './cartography/datasources/drawings-datasource';
import { EditStyleActionComponent } from './components/project-map/context-menu/actions/edit-style-action/edit-style-action.component';
import { MoveLayerDownActionComponent } from './components/project-map/context-menu/actions/move-layer-down-action/move-layer-down-action.component';
import { MoveLayerUpActionComponent } from './components/project-map/context-menu/actions/move-layer-up-action/move-layer-up-action.component';
import { ProjectMapShortcutsComponent } from './components/project-map/project-map-shortcuts/project-map-shortcuts.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsService } from './services/settings.service';

import { LocalServerComponent } from './components/local-server/local-server.component';
import { ProgressComponent } from './common/progress/progress.component';
import { ProgressService } from './common/progress/progress.service';
import { version } from './version';
import { ToasterErrorHandler } from './common/error-handlers/toaster-error-handler';
import { environment } from '../environments/environment';
import { RavenState } from './common/error-handlers/raven-state-communicator';
import { ServerDiscoveryComponent } from './components/servers/server-discovery/server-discovery.component';
import { ServerDatabase } from './services/server.database';
import { CreateSnapshotDialogComponent } from './components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component';
import { SnapshotsComponent } from './components/snapshots/snapshots.component';
import { SnapshotMenuItemComponent } from './components/snapshots/snapshot-menu-item/snapshot-menu-item.component';
import { MATERIAL_IMPORTS } from './material.imports';
import { DrawingService } from './services/drawing.service';
import { ProjectNameValidator } from './components/projects/models/projectNameValidator';
import { MatSidenavModule } from '@angular/material';
import { NodeSelectInterfaceComponent } from './components/project-map/node-select-interface/node-select-interface.component';
import { DrawLinkToolComponent } from './components/project-map/draw-link-tool/draw-link-tool.component';
import { DrawingResizedComponent } from './components/drawings-listeners/drawing-resized/drawing-resized.component';
import { TextEditedComponent } from './components/drawings-listeners/text-edited/text-edited.component';
import { NodeDraggedComponent } from './components/drawings-listeners/node-dragged/node-dragged.component';
import { NodeLabelDraggedComponent } from './components/drawings-listeners/node-label-dragged/node-label-dragged.component';
import { DrawingDraggedComponent } from './components/drawings-listeners/drawing-dragged/drawing-dragged.component';
import { LinkCreatedComponent } from './components/drawings-listeners/link-created/link-created.component';
import { InterfaceLabelDraggedComponent } from './components/drawings-listeners/interface-label-dragged/interface-label-dragged.component';
import { ToolsService } from './services/tools.service';
import { TextAddedComponent } from './components/drawings-listeners/text-added/text-added.component';
import { DrawingAddedComponent } from './components/drawings-listeners/drawing-added/drawing-added.component';
import { StyleEditorDialogComponent } from './components/project-map/drawings-editors/style-editor/style-editor.component';
import { EditTextActionComponent } from './components/project-map/context-menu/actions/edit-text-action/edit-text-action.component';
import { TextEditorDialogComponent } from './components/project-map/drawings-editors/text-editor/text-editor.component';
import { PreferencesComponent } from './components/preferences/preferences.component';

if (environment.production) {
  Raven.config('https://b2b1cfd9b043491eb6b566fd8acee358@sentry.io/842726', {
    shouldSendCallback: () => {
      return RavenState.shouldSend;
    },
    release: version
  }).install();
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
    AddBlankProjectDialogComponent,
    ImportProjectDialogComponent,
    ConfirmationDialogComponent,
    DefaultLayoutComponent,
    ProgressDialogComponent,
    ContextMenuComponent,
    StartNodeActionComponent,
    StopNodeActionComponent,
    TemplateComponent,
    TemplateListDialogComponent,
    MoveLayerDownActionComponent,
    MoveLayerUpActionComponent,
    EditStyleActionComponent,
    EditTextActionComponent,
    ProjectMapShortcutsComponent,
    SettingsComponent,
    PreferencesComponent,
    LocalServerComponent,
    ProgressComponent,
    ServerDiscoveryComponent,
    NodeSelectInterfaceComponent,
    DrawLinkToolComponent,
    DrawingAddedComponent,
    DrawingResizedComponent,
    TextAddedComponent,
    TextEditedComponent,
    NodeDraggedComponent,
    NodeLabelDraggedComponent,
    DrawingDraggedComponent,
    LinkCreatedComponent,
    InterfaceLabelDraggedComponent,
    StyleEditorDialogComponent,
    TextEditorDialogComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CdkTableModule,
    CartographyModule,
    HotkeyModule.forRoot(),
    PersistenceModule,
    NgxElectronModule,
    FileUploadModule,
    MatSidenavModule,
    MATERIAL_IMPORTS
  ],
  providers: [
    SettingsService,
    { provide: ErrorHandler, useClass: ToasterErrorHandler },
    D3Service,
    VersionService,
    ProjectService,
    SymbolService,
    ServerService,
    TemplateService,
    NodeService,
    LinkService,
    DrawingService,
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
    ServerDatabase,
    ProjectNameValidator,
    ToolsService
  ],
  entryComponents: [
    AddServerDialogComponent,
    CreateSnapshotDialogComponent,
    ProgressDialogComponent,
    TemplateListDialogComponent,
    AddBlankProjectDialogComponent,
    ImportProjectDialogComponent,
    ConfirmationDialogComponent,
    StyleEditorDialogComponent,
    TextEditorDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
