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
import { ServersComponent } from './components/servers/servers.component';
import { AddServerDialogComponent } from './components/servers/add-server-dialog/add-server-dialog.component';
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

import { BundledServerFinderComponent } from './components/bundled-server-finder/bundled-server-finder.component';
import { ProgressComponent } from './common/progress/progress.component';
import { ProgressService } from './common/progress/progress.service';
import { version } from './version';
import { ToasterErrorHandler } from './common/error-handlers/toaster-error-handler';
import { environment } from '../environments/environment';
import { RavenState } from './common/error-handlers/raven-state-communicator';
import { ServerDiscoveryComponent } from './components/servers/server-discovery/server-discovery.component';
import { ServerDatabase } from './services/server.database';
import { CreateSnapshotDialogComponent } from './components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component';
import { SnapshotMenuItemComponent } from './components/snapshots/snapshot-menu-item/snapshot-menu-item.component';
import { MATERIAL_IMPORTS } from './material.imports';
import { DrawingService } from './services/drawing.service';
import { ProjectNameValidator } from './components/projects/models/projectNameValidator';
import { MatSidenavModule } from '@angular/material';
import { NodeSelectInterfaceComponent } from './components/project-map/node-select-interface/node-select-interface.component';
import { DrawLinkToolComponent } from './components/project-map/draw-link-tool/draw-link-tool.component';

import { InstalledSoftwareComponent } from './components/installed-software/installed-software.component';
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
import { InstallSoftwareComponent } from './components/installed-software/install-software/install-software.component';

import { StyleEditorDialogComponent } from './components/project-map/drawings-editors/style-editor/style-editor.component';
import { EditTextActionComponent } from './components/project-map/context-menu/actions/edit-text-action/edit-text-action.component';
import { TextEditorDialogComponent } from './components/project-map/drawings-editors/text-editor/text-editor.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { QemuPreferencesComponent } from './components/preferences/qemu/qemu-preferences/qemu-preferences.component';
import { ServerSettingsService } from './services/server-settings.service';
import { QemuVmTemplatesComponent } from './components/preferences/qemu/qemu-vm-templates/qemu-vm-templates.component';
import { AddQemuVmTemplateComponent } from './components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component';
import { QemuVmTemplateDetailsComponent } from './components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component';
import { QemuService } from './services/qemu.service';
import { GeneralPreferencesComponent } from './components/preferences/general/general-preferences.component';
import { VpcsPreferencesComponent } from './components/preferences/vpcs/vpcs-preferences/vpcs-preferences.component';
import { VpcsTemplatesComponent } from './components/preferences/vpcs/vpcs-templates/vpcs-templates.component';
import { VpcsService } from './services/vpcs.service';
import { AddVpcsTemplateComponent } from './components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component';
import { VpcsTemplateDetailsComponent } from './components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component';
import { TemplateMocksService } from './services/template-mocks.service';
import { VirtualBoxPreferencesComponent } from './components/preferences/virtual-box/virtual-box-preferences/virtual-box-preferences.component';
import { VirtualBoxTemplatesComponent } from './components/preferences/virtual-box/virtual-box-templates/virtual-box-templates.component';
import { VirtualBoxService } from './services/virtual-box.service';
import { VirtualBoxTemplateDetailsComponent } from './components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component';
import { AddVirtualBoxTemplateComponent } from './components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component';
import { BuiltInPreferencesComponent } from './components/preferences/built-in/built-in-preferences.component';
import { EthernetHubsTemplatesComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component';
import { BuiltInTemplatesService } from './services/built-in-templates.service';
import { EthernetHubsAddTemplateComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component';
import { EthernetHubsTemplateDetailsComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component';
import { CloudNodesTemplatesComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-templates/cloud-nodes-templates.component';
import { CloudNodesAddTemplateComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component';
import { CloudNodesTemplateDetailsComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-template-details/cloud-nodes-template-details.component';
import { EthernetSwitchesTemplatesComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-templates/ethernet-switches-templates.component';
import { EthernetSwitchesAddTemplateComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component';
import { EthernetSwitchesTemplateDetailsComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component';
import { DynamipsPreferencesComponent } from './components/preferences/dynamips/dynamips-preferences/dynamips-preferences.component';
import { IosTemplatesComponent } from './components/preferences/dynamips/ios-templates/ios-templates.component';
import { IosService } from './services/ios.service';
import { SymbolsComponent } from './components/preferences/common/symbols/symbols.component';
import { InstalledSoftwareService } from './services/installed-software.service';
import { ExternalSoftwareDefinitionService } from './services/external-software-definition.service';
import { PlatformService } from './services/platform.service';
import { IosTemplateDetailsComponent } from './components/preferences/dynamips/ios-template-details/ios-template-details.component';
import { AddIosTemplateComponent } from './components/preferences/dynamips/add-ios-template/add-ios-template.component';
import { IosConfigurationService } from './services/ios-configuration.service';
import { QemuConfigurationService } from './services/qemu-configuration.service';
import { VirtualBoxConfigurationService } from './services/virtual-box-configuration.service';
import { VpcsConfigurationService } from './services/vpcs-configuration.service';
import { BuiltInTemplatesConfigurationService } from './services/built-in-templates-configuration.service';
import { VmwarePreferencesComponent } from './components/preferences/vmware/vmware-preferences/vmware-preferences.component';
import { VmwareTemplatesComponent } from './components/preferences/vmware/vmware-templates/vmware-templates.component';
import { VmwareService } from './services/vmware.service';
import { VmwareConfigurationService } from './services/vmware-configuration.service';
import { VmwareTemplateDetailsComponent } from './components/preferences/vmware/vmware-template-details/vmware-template-details.component';
import { AddVmwareTemplateComponent } from './components/preferences/vmware/add-vmware-template/add-vmware-template.component';
import { DeleteConfirmationDialogComponent } from './components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteTemplateComponent } from './components/preferences/common/delete-template-component/delete-template.component';
import { DockerService } from './services/docker.service';
import { DockerTemplatesComponent } from './components/preferences/docker/docker-templates/docker-templates.component';
import { DockerConfigurationService } from './services/docker-configuration.service';
import { AddDockerTemplateComponent } from './components/preferences/docker/add-docker-template/add-docker-template.component';
import { DockerTemplateDetailsComponent } from './components/preferences/docker/docker-template-details/docker-template-details.component';
import { IouTemplatesComponent } from './components/preferences/ios-on-unix/iou-templates/iou-templates.component';
import { IouService } from './services/iou.service';
import { AddIouTemplateComponent } from './components/preferences/ios-on-unix/add-iou-template/add-iou-template.component';
import { IouConfigurationService } from './services/iou-configuration.service';
import { IouTemplateDetailsComponent } from './components/preferences/ios-on-unix/iou-template-details/iou-template-details.component';
import { CopyQemuVmTemplateComponent } from './components/preferences/qemu/copy-qemu-vm-template/copy-qemu-vm-template.component';
import { CopyIosTemplateComponent } from './components/preferences/dynamips/copy-ios-template/copy-ios-template.component';
import { CopyIouTemplateComponent } from './components/preferences/ios-on-unix/copy-iou-template/copy-iou-template.component';
import { CopyDockerTemplateComponent } from './components/preferences/docker/copy-docker-template/copy-docker-template.component';
import { EmptyTemplatesListComponent } from './components/preferences/common/empty-templates-list/empty-templates-list.component';
import { SymbolsMenuComponent } from './components/preferences/common/symbols-menu/symbols-menu.component';
import { SearchFilter } from './filters/searchFilter.pipe';
import { RecentlyOpenedProjectService } from './services/recentlyOpenedProject.service';
import { ServerManagementService } from './services/server-management.service';
import { DeleteActionComponent } from './components/project-map/context-menu/actions/delete-action/delete-action.component';
import { ListOfSnapshotsComponent } from './components/snapshots/list-of-snapshots/list-of-snapshots.component';
import { DateFilter } from './filters/dateFilter.pipe';
import { NameFilter } from './filters/nameFilter.pipe';
import { CustomAdaptersComponent } from './components/preferences/common/custom-adapters/custom-adapters.component';

import { ConsoleDeviceActionComponent } from './components/project-map/context-menu/actions/console-device-action/console-device-action.component';
import { ConsoleComponent } from './components/settings/console/console.component';
import { NodesMenuComponent } from './components/project-map/nodes-menu/nodes-menu.component';
import { PacketFiltersActionComponent } from './components/project-map/context-menu/actions/packet-filters-action/packet-filters-action.component';
import { PacketFiltersDialogComponent } from './components/project-map/packet-capturing/packet-filters/packet-filters.component';
import { HelpDialogComponent } from './components/project-map/help-dialog/help-dialog.component';
import { StartCaptureActionComponent } from './components/project-map/context-menu/actions/start-capture/start-capture-action.component';
import { StartCaptureDialogComponent } from './components/project-map/packet-capturing/start-capture/start-capture.component';
import { SuspendLinkActionComponent } from './components/project-map/context-menu/actions/suspend-link/suspend-link-action.component';
import { ResumeLinkActionComponent } from './components/project-map/context-menu/actions/resume-link-action/resume-link-action.component';
import { StopCaptureActionComponent } from './components/project-map/context-menu/actions/stop-capture/stop-capture-action.component';
import { MapScaleService } from './services/mapScale.service';
import { AdbutlerComponent } from './components/adbutler/adbutler.component';
import { ConsoleService } from './services/settings/console.service';
import { DefaultConsoleService } from './services/settings/default-console.service';
import { NodeCreatedLabelStylesFixer } from './components/project-map/helpers/node-created-label-styles-fixer';
import { NonNegativeValidator } from './validators/non-negative-validator';
import { RotationValidator } from './validators/rotation-validator';
import { DuplicateActionComponent } from './components/project-map/context-menu/actions/duplicate-action/duplicate-action.component';
import { MapSettingsService } from './services/mapsettings.service';
import { ProjectMapMenuComponent } from './components/project-map/project-map-menu/project-map-menu.component';
import { HelpComponent } from './components/help/help.component';
import { ConfigEditorDialogComponent } from './components/project-map/node-editors/config-editor/config-editor.component';
import { EditConfigActionComponent } from './components/project-map/context-menu/actions/edit-config/edit-config-action.component';
import { LogConsoleComponent } from './components/project-map/log-console/log-console.component';
import { LogEventsDataSource } from './components/project-map/log-console/log-events-datasource';
import { SaveProjectDialogComponent } from './components/projects/save-project-dialog/save-project-dialog.component';
import { TopologySummaryComponent } from './components/topology-summary/topology-summary.component';
import { ShowNodeActionComponent } from './components/project-map/context-menu/actions/show-node-action/show-node-action.component';
import { InfoDialogComponent } from './components/project-map/info-dialog/info-dialog.component';
import { InfoService } from './services/info.service';
import { BringToFrontActionComponent } from './components/project-map/context-menu/actions/bring-to-front-action/bring-to-front-action.component';
import { ExportConfigActionComponent } from './components/project-map/context-menu/actions/export-config/export-config-action.component';
import { ImportConfigActionComponent } from './components/project-map/context-menu/actions/import-config/import-config-action.component';
import { ConsoleDeviceActionBrowserComponent } from './components/project-map/context-menu/actions/console-device-action-browser/console-device-action-browser.component';
import { ChangeSymbolDialogComponent } from './components/project-map/change-symbol-dialog/change-symbol-dialog.component';
import { ChangeSymbolActionComponent } from './components/project-map/context-menu/actions/change-symbol/change-symbol-action.component';
import { EditProjectDialogComponent } from './components/projects/edit-project-dialog/edit-project-dialog.component';
import { ProjectsFilter } from './filters/projectsFilter.pipe';
import { ComputeService } from './services/compute.service';
import { ReloadNodeActionComponent } from './components/project-map/context-menu/actions/reload-node-action/reload-node-action.component';
import { SuspendNodeActionComponent } from './components/project-map/context-menu/actions/suspend-node-action/suspend-node-action.component';
import { ConfigActionComponent } from './components/project-map/context-menu/actions/config-action/config-action.component';
import { ConfiguratorDialogVpcsComponent } from './components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component';
import { ConfiguratorDialogEthernetHubComponent } from './components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogEthernetSwitchComponent } from './components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { PortsComponent } from './components/preferences/common/ports/ports.component';
import { ConfiguratorDialogSwitchComponent } from './components/project-map/node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogVirtualBoxComponent } from './components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { CustomAdaptersTableComponent } from './components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { ConfiguratorDialogQemuComponent } from './components/project-map/node-editors/configurator/qemu/configurator-qemu.component';
import { ConfiguratorDialogCloudComponent } from './components/project-map/node-editors/configurator/cloud/configurator-cloud.component';
import { UdpTunnelsComponent } from './components/preferences/common/udp-tunnels/udp-tunnels.component';

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
    DeleteActionComponent,
    DuplicateActionComponent,
    PacketFiltersActionComponent,
    StartCaptureActionComponent,
    StopCaptureActionComponent,
    ResumeLinkActionComponent,
    SuspendLinkActionComponent,
    ProjectMapShortcutsComponent,
    SettingsComponent,
    PreferencesComponent,
    BundledServerFinderComponent,
    ProgressComponent,
    ServerDiscoveryComponent,
    NodeSelectInterfaceComponent,
    DrawLinkToolComponent,
    InstalledSoftwareComponent,
    DrawingAddedComponent,
    DrawingResizedComponent,
    TextAddedComponent,
    TextEditedComponent,
    NodeDraggedComponent,
    NodeLabelDraggedComponent,
    DrawingDraggedComponent,
    LinkCreatedComponent,
    InterfaceLabelDraggedComponent,
    InstallSoftwareComponent,
    StyleEditorDialogComponent,
    TextEditorDialogComponent,
    PacketFiltersDialogComponent,
    QemuPreferencesComponent,
    QemuVmTemplatesComponent,
    AddQemuVmTemplateComponent,
    QemuVmTemplateDetailsComponent,
    GeneralPreferencesComponent,
    VpcsPreferencesComponent,
    VpcsTemplatesComponent,
    AddVpcsTemplateComponent,
    VpcsTemplateDetailsComponent,
    VirtualBoxPreferencesComponent,
    VirtualBoxTemplatesComponent,
    VirtualBoxTemplateDetailsComponent,
    AddVirtualBoxTemplateComponent,
    BuiltInPreferencesComponent,
    EthernetHubsTemplatesComponent,
    EthernetHubsAddTemplateComponent,
    EthernetHubsTemplateDetailsComponent,
    CloudNodesTemplatesComponent,
    CloudNodesAddTemplateComponent,
    CloudNodesTemplateDetailsComponent,
    EthernetSwitchesTemplatesComponent,
    EthernetSwitchesAddTemplateComponent,
    EthernetSwitchesTemplateDetailsComponent,
    DynamipsPreferencesComponent,
    IosTemplatesComponent,
    IosTemplateDetailsComponent,
    AddIosTemplateComponent,
    SymbolsComponent,
    VmwarePreferencesComponent,
    VmwareTemplatesComponent,
    VmwareTemplateDetailsComponent,
    AddVmwareTemplateComponent,
    DeleteConfirmationDialogComponent,
    HelpDialogComponent,
    StartCaptureDialogComponent,
    DeleteTemplateComponent,
    DockerTemplatesComponent,
    AddDockerTemplateComponent,
    DockerTemplateDetailsComponent,
    IouTemplatesComponent,
    AddIouTemplateComponent,
    IouTemplateDetailsComponent,
    CopyQemuVmTemplateComponent,
    CopyIosTemplateComponent,
    CopyIouTemplateComponent,
    CopyDockerTemplateComponent,
    EmptyTemplatesListComponent,
    SymbolsMenuComponent,
    SearchFilter,
    DateFilter,
    NameFilter,
    ProjectsFilter,
    ListOfSnapshotsComponent,
    CustomAdaptersComponent,
    NodesMenuComponent,
    AdbutlerComponent,
    ConsoleDeviceActionComponent,
    ShowNodeActionComponent,
    ConsoleComponent,
    NodesMenuComponent,
    ProjectMapMenuComponent,
    HelpComponent,
    ConfigEditorDialogComponent,
    EditConfigActionComponent,
    LogConsoleComponent,
    SaveProjectDialogComponent,
    TopologySummaryComponent,
    InfoDialogComponent,
    BringToFrontActionComponent,
    ExportConfigActionComponent,
    ImportConfigActionComponent,
    ConsoleDeviceActionBrowserComponent,
    ChangeSymbolDialogComponent,
    ChangeSymbolActionComponent,
    EditProjectDialogComponent,
    ReloadNodeActionComponent,
    SuspendNodeActionComponent,
    ConfigActionComponent,
    ConfiguratorDialogVpcsComponent,
    ConfiguratorDialogEthernetHubComponent,
    ConfiguratorDialogEthernetSwitchComponent,
    PortsComponent,
    ConfiguratorDialogSwitchComponent,
    ConfiguratorDialogVirtualBoxComponent,
    CustomAdaptersTableComponent,
    ConfiguratorDialogQemuComponent,
    ConfiguratorDialogCloudComponent,
    UdpTunnelsComponent
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
    LogEventsDataSource,
    SelectionManager,
    InRectangleHelper,
    DrawingsDataSource,
    ServerErrorHandler,
    ServerDatabase,
    ProjectNameValidator,
    ToolsService,
    ServerSettingsService,
    QemuService,
    VpcsService,
    TemplateMocksService,
    VirtualBoxService,
    BuiltInTemplatesService,
    IosService,
    InstalledSoftwareService,
    ExternalSoftwareDefinitionService,
    PlatformService,
    IosConfigurationService,
    QemuConfigurationService,
    VirtualBoxConfigurationService,
    VpcsConfigurationService,
    BuiltInTemplatesConfigurationService,
    VmwareService,
    VmwareConfigurationService,
    DockerService,
    DockerConfigurationService,
    IouService,
    IouConfigurationService,
    RecentlyOpenedProjectService,
    ServerManagementService,
    MapScaleService,
    ConsoleService,
    DefaultConsoleService,
    NodeCreatedLabelStylesFixer,
    NonNegativeValidator,
    RotationValidator,
    MapSettingsService,
    InfoService,
    ComputeService
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
    PacketFiltersDialogComponent,
    TextEditorDialogComponent,
    SymbolsComponent,
    DeleteConfirmationDialogComponent,
    HelpDialogComponent,
    StartCaptureDialogComponent,
    ConfigEditorDialogComponent,
    SaveProjectDialogComponent,
    InfoDialogComponent,
    ChangeSymbolDialogComponent,
    EditProjectDialogComponent,
    ConfiguratorDialogVpcsComponent,
    ConfiguratorDialogEthernetHubComponent,
    ConfiguratorDialogEthernetSwitchComponent,
    ConfiguratorDialogSwitchComponent,
    ConfiguratorDialogVirtualBoxComponent,
    ConfiguratorDialogQemuComponent,
    ConfiguratorDialogCloudComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
