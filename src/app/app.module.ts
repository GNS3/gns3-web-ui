import { AngularReactBrowserModule } from '@angular-react/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { PersistenceModule } from 'angular-persistence';
import { ResizableModule } from 'angular-resizable-element';
import { D3Service } from 'd3-ng2-service';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxChildProcessModule } from 'ngx-childprocess';
import { NgxElectronModule } from 'ngx-electron';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CartographyModule } from './cartography/cartography.module';
import { DrawingsDataSource } from './cartography/datasources/drawings-datasource';
import { LinksDataSource } from './cartography/datasources/links-datasource';
import { NodesDataSource } from './cartography/datasources/nodes-datasource';
import { SymbolsDataSource } from './cartography/datasources/symbols-datasource';
import { InRectangleHelper } from './cartography/helpers/in-rectangle-helper';
import { SelectionManager } from './cartography/managers/selection-manager';
import { ToasterErrorHandler } from './common/error-handlers/toaster-error-handler';
import { ProgressDialogComponent } from './common/progress-dialog/progress-dialog.component';
import { ProgressDialogService } from './common/progress-dialog/progress-dialog.service';
import { ProgressComponent } from './common/progress/progress.component';
import { ProgressService } from './common/progress/progress.service';
import { AdbutlerComponent } from './components/adbutler/adbutler.component';
import { BundledServerFinderComponent } from './components/bundled-server-finder/bundled-server-finder.component';
import { InformationDialogComponent } from './components/dialogs/information-dialog.component';
import { DirectLinkComponent } from './components/direct-link/direct-link.component';
import { DrawingAddedComponent } from './components/drawings-listeners/drawing-added/drawing-added.component';
import { DrawingDraggedComponent } from './components/drawings-listeners/drawing-dragged/drawing-dragged.component';
import { DrawingResizedComponent } from './components/drawings-listeners/drawing-resized/drawing-resized.component';
import { InterfaceLabelDraggedComponent } from './components/drawings-listeners/interface-label-dragged/interface-label-dragged.component';
import { LinkCreatedComponent } from './components/drawings-listeners/link-created/link-created.component';
import { NodeDraggedComponent } from './components/drawings-listeners/node-dragged/node-dragged.component';
import { NodeLabelDraggedComponent } from './components/drawings-listeners/node-label-dragged/node-label-dragged.component';
import { TextAddedComponent } from './components/drawings-listeners/text-added/text-added.component';
import { TextEditedComponent } from './components/drawings-listeners/text-edited/text-edited.component';
import { HelpComponent } from './components/help/help.component';
import { ReportIssueComponent } from './components/help/report-issue/report-issue.component';
import { InstallSoftwareComponent } from './components/installed-software/install-software/install-software.component';
import { InstalledSoftwareComponent } from './components/installed-software/installed-software.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BuiltInPreferencesComponent } from './components/preferences/built-in/built-in-preferences.component';
import { CloudNodesAddTemplateComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component';
import { CloudNodesTemplateDetailsComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-template-details/cloud-nodes-template-details.component';
import { CloudNodesTemplatesComponent } from './components/preferences/built-in/cloud-nodes/cloud-nodes-templates/cloud-nodes-templates.component';
import { EthernetHubsAddTemplateComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component';
import { EthernetHubsTemplateDetailsComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component';
import { EthernetHubsTemplatesComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component';
import { EthernetSwitchesAddTemplateComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component';
import { EthernetSwitchesTemplateDetailsComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component';
import { EthernetSwitchesTemplatesComponent } from './components/preferences/built-in/ethernet-switches/ethernet-switches-templates/ethernet-switches-templates.component';
import { CustomAdaptersTableComponent } from './components/preferences/common/custom-adapters-table/custom-adapters-table.component';
import { CustomAdaptersComponent } from './components/preferences/common/custom-adapters/custom-adapters.component';
import { DeleteConfirmationDialogComponent } from './components/preferences/common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteTemplateComponent } from './components/preferences/common/delete-template-component/delete-template.component';
import { EmptyTemplatesListComponent } from './components/preferences/common/empty-templates-list/empty-templates-list.component';
import { PortsComponent } from './components/preferences/common/ports/ports.component';
import { SymbolsMenuComponent } from './components/preferences/common/symbols-menu/symbols-menu.component';
import { SymbolsComponent } from './components/preferences/common/symbols/symbols.component';
import { UdpTunnelsComponent } from './components/preferences/common/udp-tunnels/udp-tunnels.component';
import { AddDockerTemplateComponent } from './components/preferences/docker/add-docker-template/add-docker-template.component';
import { CopyDockerTemplateComponent } from './components/preferences/docker/copy-docker-template/copy-docker-template.component';
import { DockerTemplateDetailsComponent } from './components/preferences/docker/docker-template-details/docker-template-details.component';
import { DockerTemplatesComponent } from './components/preferences/docker/docker-templates/docker-templates.component';
import { AddIosTemplateComponent } from './components/preferences/dynamips/add-ios-template/add-ios-template.component';
import { CopyIosTemplateComponent } from './components/preferences/dynamips/copy-ios-template/copy-ios-template.component';
import { DynamipsPreferencesComponent } from './components/preferences/dynamips/dynamips-preferences/dynamips-preferences.component';
import { IosTemplateDetailsComponent } from './components/preferences/dynamips/ios-template-details/ios-template-details.component';
import { IosTemplatesComponent } from './components/preferences/dynamips/ios-templates/ios-templates.component';
import { GeneralPreferencesComponent } from './components/preferences/general/general-preferences.component';
import { Gns3vmComponent } from './components/preferences/gns3vm/gns3vm.component';
import { AddIouTemplateComponent } from './components/preferences/ios-on-unix/add-iou-template/add-iou-template.component';
import { CopyIouTemplateComponent } from './components/preferences/ios-on-unix/copy-iou-template/copy-iou-template.component';
import { IouTemplateDetailsComponent } from './components/preferences/ios-on-unix/iou-template-details/iou-template-details.component';
import { IouTemplatesComponent } from './components/preferences/ios-on-unix/iou-templates/iou-templates.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { AddQemuVmTemplateComponent } from './components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component';
import { CopyQemuVmTemplateComponent } from './components/preferences/qemu/copy-qemu-vm-template/copy-qemu-vm-template.component';
import { QemuPreferencesComponent } from './components/preferences/qemu/qemu-preferences/qemu-preferences.component';
import { QemuVmTemplateDetailsComponent } from './components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component';
import { QemuVmTemplatesComponent } from './components/preferences/qemu/qemu-vm-templates/qemu-vm-templates.component';
import { AddVirtualBoxTemplateComponent } from './components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component';
import { VirtualBoxPreferencesComponent } from './components/preferences/virtual-box/virtual-box-preferences/virtual-box-preferences.component';
import { VirtualBoxTemplateDetailsComponent } from './components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component';
import { VirtualBoxTemplatesComponent } from './components/preferences/virtual-box/virtual-box-templates/virtual-box-templates.component';
import { AddVmwareTemplateComponent } from './components/preferences/vmware/add-vmware-template/add-vmware-template.component';
import { VmwarePreferencesComponent } from './components/preferences/vmware/vmware-preferences/vmware-preferences.component';
import { VmwareTemplateDetailsComponent } from './components/preferences/vmware/vmware-template-details/vmware-template-details.component';
import { VmwareTemplatesComponent } from './components/preferences/vmware/vmware-templates/vmware-templates.component';
import { AddVpcsTemplateComponent } from './components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component';
import { VpcsPreferencesComponent } from './components/preferences/vpcs/vpcs-preferences/vpcs-preferences.component';
import { VpcsTemplateDetailsComponent } from './components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component';
import { VpcsTemplatesComponent } from './components/preferences/vpcs/vpcs-templates/vpcs-templates.component';
import { ChangeHostnameDialogComponent } from './components/project-map/change-hostname-dialog/change-hostname-dialog.component';
import { ChangeSymbolDialogComponent } from './components/project-map/change-symbol-dialog/change-symbol-dialog.component';
import { ConsoleWrapperComponent } from './components/project-map/console-wrapper/console-wrapper.component';
import { ContextConsoleMenuComponent } from './components/project-map/context-console-menu/context-console-menu.component';
import { AlignHorizontallyActionComponent } from './components/project-map/context-menu/actions/align-horizontally/align-horizontally.component';
import { AlignVerticallyActionComponent } from './components/project-map/context-menu/actions/align_vertically/align-vertically.component';
import { BringToFrontActionComponent } from './components/project-map/context-menu/actions/bring-to-front-action/bring-to-front-action.component';
import { ChangeHostnameActionComponent } from './components/project-map/context-menu/actions/change-hostname/change-hostname-action.component';
import { ChangeSymbolActionComponent } from './components/project-map/context-menu/actions/change-symbol/change-symbol-action.component';
import { ConfigActionComponent } from './components/project-map/context-menu/actions/config-action/config-action.component';
import { ConsoleDeviceActionBrowserComponent } from './components/project-map/context-menu/actions/console-device-action-browser/console-device-action-browser.component';
import { ConsoleDeviceActionComponent } from './components/project-map/context-menu/actions/console-device-action/console-device-action.component';
import { DeleteActionComponent } from './components/project-map/context-menu/actions/delete-action/delete-action.component';
import { DuplicateActionComponent } from './components/project-map/context-menu/actions/duplicate-action/duplicate-action.component';
import { EditConfigActionComponent } from './components/project-map/context-menu/actions/edit-config/edit-config-action.component';
import { EditStyleActionComponent } from './components/project-map/context-menu/actions/edit-style-action/edit-style-action.component';
import { EditTextActionComponent } from './components/project-map/context-menu/actions/edit-text-action/edit-text-action.component';
import { ExportConfigActionComponent } from './components/project-map/context-menu/actions/export-config/export-config-action.component';
import { HttpConsoleNewTabActionComponent } from './components/project-map/context-menu/actions/http-console-new-tab/http-console-new-tab-action.component';
import { HttpConsoleActionComponent } from './components/project-map/context-menu/actions/http-console/http-console-action.component';
import { ImportConfigActionComponent } from './components/project-map/context-menu/actions/import-config/import-config-action.component';
import { LockActionComponent } from './components/project-map/context-menu/actions/lock-action/lock-action.component';
import { MoveLayerDownActionComponent } from './components/project-map/context-menu/actions/move-layer-down-action/move-layer-down-action.component';
import { MoveLayerUpActionComponent } from './components/project-map/context-menu/actions/move-layer-up-action/move-layer-up-action.component';
import { OpenFileExplorerActionComponent } from './components/project-map/context-menu/actions/open-file-explorer/open-file-explorer-action.component';
import { PacketFiltersActionComponent } from './components/project-map/context-menu/actions/packet-filters-action/packet-filters-action.component';
import { ReloadNodeActionComponent } from './components/project-map/context-menu/actions/reload-node-action/reload-node-action.component';
import { ResumeLinkActionComponent } from './components/project-map/context-menu/actions/resume-link-action/resume-link-action.component';
import { ShowNodeActionComponent } from './components/project-map/context-menu/actions/show-node-action/show-node-action.component';
import { StartCaptureOnStartedLinkActionComponent } from './components/project-map/context-menu/actions/start-capture-on-started-link/start-capture-on-started-link.component';
import { StartCaptureActionComponent } from './components/project-map/context-menu/actions/start-capture/start-capture-action.component';
import { StartNodeActionComponent } from './components/project-map/context-menu/actions/start-node-action/start-node-action.component';
import { StopCaptureActionComponent } from './components/project-map/context-menu/actions/stop-capture/stop-capture-action.component';
import { StopNodeActionComponent } from './components/project-map/context-menu/actions/stop-node-action/stop-node-action.component';
import { SuspendLinkActionComponent } from './components/project-map/context-menu/actions/suspend-link/suspend-link-action.component';
import { SuspendNodeActionComponent } from './components/project-map/context-menu/actions/suspend-node-action/suspend-node-action.component';
import { ContextMenuComponent } from './components/project-map/context-menu/context-menu.component';
import { ConfigDialogComponent } from './components/project-map/context-menu/dialogs/config-dialog/config-dialog.component';
import { DrawLinkToolComponent } from './components/project-map/draw-link-tool/draw-link-tool.component';
import { StyleEditorDialogComponent } from './components/project-map/drawings-editors/style-editor/style-editor.component';
import { TextEditorDialogComponent } from './components/project-map/drawings-editors/text-editor/text-editor.component';
import { HelpDialogComponent } from './components/project-map/help-dialog/help-dialog.component';
import { NodeCreatedLabelStylesFixer } from './components/project-map/helpers/node-created-label-styles-fixer';
import { ImportApplianceComponent } from './components/project-map/import-appliance/import-appliance.component';
import { InfoDialogComponent } from './components/project-map/info-dialog/info-dialog.component';
import { LogConsoleComponent } from './components/project-map/log-console/log-console.component';
import { LogEventsDataSource } from './components/project-map/log-console/log-events-datasource';
import { ApplianceInfoDialogComponent } from './components/project-map/new-template-dialog/appliance-info-dialog/appliance-info-dialog.component';
import { NewTemplateDialogComponent } from './components/project-map/new-template-dialog/new-template-dialog.component';
import { TemplateNameDialogComponent } from './components/project-map/new-template-dialog/template-name-dialog/template-name-dialog.component';
import { ConfigEditorDialogComponent } from './components/project-map/node-editors/config-editor/config-editor.component';
import { ConfiguratorDialogAtmSwitchComponent } from './components/project-map/node-editors/configurator/atm_switch/configurator-atm-switch.component';
import { ConfiguratorDialogCloudComponent } from './components/project-map/node-editors/configurator/cloud/configurator-cloud.component';
import { ConfiguratorDialogDockerComponent } from './components/project-map/node-editors/configurator/docker/configurator-docker.component';
import { ConfigureCustomAdaptersDialogComponent } from './components/project-map/node-editors/configurator/docker/configure-custom-adapters/configure-custom-adapters.component';
import { EditNetworkConfigurationDialogComponent } from './components/project-map/node-editors/configurator/docker/edit-network-configuration/edit-network-configuration.component';
import { ConfiguratorDialogEthernetSwitchComponent } from './components/project-map/node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { ConfiguratorDialogEthernetHubComponent } from './components/project-map/node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogIosComponent } from './components/project-map/node-editors/configurator/ios/configurator-ios.component';
import { ConfiguratorDialogIouComponent } from './components/project-map/node-editors/configurator/iou/configurator-iou.component';
import { ConfiguratorDialogNatComponent } from './components/project-map/node-editors/configurator/nat/configurator-nat.component';
import { ConfiguratorDialogQemuComponent } from './components/project-map/node-editors/configurator/qemu/configurator-qemu.component';
import { QemuImageCreatorComponent } from './components/project-map/node-editors/configurator/qemu/qemu-image-creator/qemu-image-creator.component';
import { ConfiguratorDialogSwitchComponent } from './components/project-map/node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogVirtualBoxComponent } from './components/project-map/node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { ConfiguratorDialogVmwareComponent } from './components/project-map/node-editors/configurator/vmware/configurator-vmware.component';
import { ConfiguratorDialogVpcsComponent } from './components/project-map/node-editors/configurator/vpcs/configurator-vpcs.component';
import { NodeSelectInterfaceComponent } from './components/project-map/node-select-interface/node-select-interface.component';
import { NodesMenuComponent } from './components/project-map/nodes-menu/nodes-menu.component';
import { PacketFiltersDialogComponent } from './components/project-map/packet-capturing/packet-filters/packet-filters.component';
import { StartCaptureDialogComponent } from './components/project-map/packet-capturing/start-capture/start-capture.component';
import { ProjectMapMenuComponent } from './components/project-map/project-map-menu/project-map-menu.component';
import { ProjectMapComponent } from './components/project-map/project-map.component';
import { ProjectReadmeComponent } from './components/project-map/project-readme/project-readme.component';
import { ScreenshotDialogComponent } from './components/project-map/screenshot-dialog/screenshot-dialog.component';
import { WebConsoleComponent } from './components/project-map/web-console/web-console.component';
import { AddBlankProjectDialogComponent } from './components/projects/add-blank-project-dialog/add-blank-project-dialog.component';
import { ChooseNameDialogComponent } from './components/projects/choose-name-dialog/choose-name-dialog.component';
import { ConfirmationBottomSheetComponent } from './components/projects/confirmation-bottomsheet/confirmation-bottomsheet.component';
import { ConfirmationDialogComponent } from './components/projects/confirmation-dialog/confirmation-dialog.component';
import { EditProjectDialogComponent } from './components/projects/edit-project-dialog/edit-project-dialog.component';
import { ReadmeEditorComponent } from './components/projects/edit-project-dialog/readme-editor/readme-editor.component';
import { ImportProjectDialogComponent } from './components/projects/import-project-dialog/import-project-dialog.component';
import { ProjectNameValidator } from './components/projects/models/projectNameValidator';
import { NavigationDialogComponent } from './components/projects/navigation-dialog/navigation-dialog.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { SaveProjectDialogComponent } from './components/projects/save-project-dialog/save-project-dialog.component';
import { AddServerDialogComponent } from './components/servers/add-server-dialog/add-server-dialog.component';
import { ConfigureGns3VMDialogComponent } from './components/servers/configure-gns3vm-dialog/configure-gns3vm-dialog.component';
import { ServerDiscoveryComponent } from './components/servers/server-discovery/server-discovery.component';
import { ServersComponent } from './components/servers/servers.component';
import { ConsoleComponent } from './components/settings/console/console.component';
import { SettingsComponent } from './components/settings/settings.component';
import { CreateSnapshotDialogComponent } from './components/snapshots/create-snapshot-dialog/create-snapshot-dialog.component';
import { ListOfSnapshotsComponent } from './components/snapshots/list-of-snapshots/list-of-snapshots.component';
import { SnapshotMenuItemComponent } from './components/snapshots/snapshot-menu-item/snapshot-menu-item.component';
import { StatusChartComponent } from './components/system-status/status-chart/status-chart.component';
import { StatusInfoComponent } from './components/system-status/status-info/status-info.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { TemplateListDialogComponent } from './components/template/template-list-dialog/template-list-dialog.component';
import { TemplateComponent } from './components/template/template.component';
import { TopologySummaryComponent } from './components/topology-summary/topology-summary.component';
import { WebConsoleFullWindowComponent } from './components/web-console-full-window/web-console-full-window.component';
import { DataSourceFilter } from './filters/dataSourceFilter';
import { AuthImageFilter } from './filters/authImageFilter';
import { DateFilter } from './filters/dateFilter.pipe';
import { NameFilter } from './filters/nameFilter.pipe';
import { ProjectsFilter } from './filters/projectsFilter.pipe';
import { SearchFilter } from './filters/searchFilter.pipe';
import { TemplateFilter } from './filters/templateFilter.pipe';
import { ConsoleGuard } from './guards/console-guard';
import { LoginGuard } from './guards/login-guard';
import { ProjectWebServiceHandler } from './handlers/project-web-service-handler';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { MATERIAL_IMPORTS } from './material.imports';
import { ServerResolve } from './resolvers/server-resolve';
import { ApplianceService } from './services/appliances.service';
import { BuiltInTemplatesConfigurationService } from './services/built-in-templates-configuration.service';
import { BuiltInTemplatesService } from './services/built-in-templates.service';
import { ComputeService } from './services/compute.service';
import { DockerConfigurationService } from './services/docker-configuration.service';
import { DockerService } from './services/docker.service';
import { DrawingService } from './services/drawing.service';
import { ExternalSoftwareDefinitionService } from './services/external-software-definition.service';
import { Gns3vmService } from './services/gns3vm.service';
import { GoogleAnalyticsService } from './services/google-analytics.service';
import { HttpServer, ServerErrorHandler } from './services/http-server.service';
import { IndexedDbService } from './services/indexed-db.service';
import { InfoService } from './services/info.service';
import { InstalledSoftwareService } from './services/installed-software.service';
import { IosConfigurationService } from './services/ios-configuration.service';
import { IosService } from './services/ios.service';
import { IouConfigurationService } from './services/iou-configuration.service';
import { IouService } from './services/iou.service';
import { LinkService } from './services/link.service';
import { MapScaleService } from './services/mapScale.service';
import { MapSettingsService } from './services/mapsettings.service';
import { NodeService } from './services/node.service';
import { NodeConsoleService } from './services/nodeConsole.service';
import { NotificationService } from './services/notification.service';
import { PacketCaptureService } from './services/packet-capture.service';
import { PlatformService } from './services/platform.service';
import { ProjectService } from './services/project.service';
import { QemuConfigurationService } from './services/qemu-configuration.service';
import { QemuService } from './services/qemu.service';
import { RecentlyOpenedProjectService } from './services/recentlyOpenedProject.service';
import { ServerManagementService } from './services/server-management.service';
import { ServerSettingsService } from './services/server-settings.service';
import { ServerDatabase } from './services/server.database';
import { ServerService } from './services/server.service';
import { SettingsService } from './services/settings.service';
import { ConsoleService } from './services/settings/console.service';
import { DefaultConsoleService } from './services/settings/default-console.service';
import { SnapshotService } from './services/snapshot.service';
import { SymbolService } from './services/symbol.service';
import { TemplateMocksService } from './services/template-mocks.service';
import { TemplateService } from './services/template.service';
import { ThemeService } from './services/theme.service';
import { ToasterService } from './services/toaster.service';
import { ToolsService } from './services/tools.service';
import { UpdatesService } from './services/updates.service';
import { VersionService } from './services/version.service';
import { VirtualBoxConfigurationService } from './services/virtual-box-configuration.service';
import { VirtualBoxService } from './services/virtual-box.service';
import { VmwareConfigurationService } from './services/vmware-configuration.service';
import { VmwareService } from './services/vmware.service';
import { VpcsConfigurationService } from './services/vpcs-configuration.service';
import { VpcsService } from './services/vpcs.service';
import { NonNegativeValidator } from './validators/non-negative-validator';
import { RotationValidator } from './validators/rotation-validator';
import { MarkedDirective } from './directives/marked.directive';
import { LoginComponent } from './components/login/login.component';
import { LoginService } from './services/login.service';
import { HttpRequestsInterceptor } from './interceptors/http.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    ProjectMapComponent,
    LoginComponent,
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
    ContextConsoleMenuComponent,
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
    DataSourceFilter,
    TemplateFilter,
    ProjectsFilter,
    AuthImageFilter,
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
    UdpTunnelsComponent,
    ConfiguratorDialogAtmSwitchComponent,
    ConfiguratorDialogVmwareComponent,
    ConfiguratorDialogIouComponent,
    ConfiguratorDialogIosComponent,
    ConfiguratorDialogDockerComponent,
    ConfiguratorDialogNatComponent,
    QemuImageCreatorComponent,
    ChooseNameDialogComponent,
    StartCaptureOnStartedLinkActionComponent,
    LockActionComponent,
    NavigationDialogComponent,
    ScreenshotDialogComponent,
    PageNotFoundComponent,
    AlignHorizontallyActionComponent,
    AlignVerticallyActionComponent,
    ConfirmationBottomSheetComponent,
    ConfigDialogComponent,
    Gns3vmComponent,
    ConfigureGns3VMDialogComponent,
    ImportApplianceComponent,
    DirectLinkComponent,
    SystemStatusComponent,
    StatusInfoComponent,
    StatusChartComponent,
    OpenFileExplorerActionComponent,
    HttpConsoleActionComponent,
    WebConsoleComponent,
    ConsoleWrapperComponent,
    HttpConsoleNewTabActionComponent,
    WebConsoleFullWindowComponent,
    NewTemplateDialogComponent,
    ChangeHostnameActionComponent,
    ChangeHostnameDialogComponent,
    ApplianceInfoDialogComponent,
    ReadmeEditorComponent,
    MarkedDirective,
    InformationDialogComponent,
    TemplateNameDialogComponent,
    ConfigureCustomAdaptersDialogComponent,
    EditNetworkConfigurationDialogComponent,
    ReportIssueComponent,
  ],
  imports: [
    AngularReactBrowserModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CdkTableModule,
    CartographyModule,
    PersistenceModule,
    NgxElectronModule,
    FileUploadModule,
    MatSidenavModule,
    ResizableModule,
    DragAndDropModule,
    DragDropModule,
    NgxChildProcessModule,
    MATERIAL_IMPORTS,
    NgCircleProgressModule.forRoot(),
    OverlayModule,
  ],
  providers: [
    SettingsService,
    { provide: ErrorHandler, useClass: ToasterErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: HttpRequestsInterceptor, multi: true },
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
    ComputeService,
    PacketCaptureService,
    NotificationService,
    Gns3vmService,
    ThemeService,
    GoogleAnalyticsService,
    NodeConsoleService,
    ServerResolve,
    LoginGuard,
    ConsoleGuard,
    Title,
    ApplianceService,
    UpdatesService,
    LoginService
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
    ConfigureGns3VMDialogComponent,
    ConfiguratorDialogVpcsComponent,
    ConfiguratorDialogEthernetHubComponent,
    ConfiguratorDialogEthernetSwitchComponent,
    ConfiguratorDialogSwitchComponent,
    ConfiguratorDialogVirtualBoxComponent,
    ConfiguratorDialogQemuComponent,
    ConfiguratorDialogCloudComponent,
    ConfiguratorDialogAtmSwitchComponent,
    ConfiguratorDialogVmwareComponent,
    ConfiguratorDialogIouComponent,
    ConfiguratorDialogIosComponent,
    ConfiguratorDialogDockerComponent,
    ConfiguratorDialogNatComponent,
    QemuImageCreatorComponent,
    ChooseNameDialogComponent,
    NavigationDialogComponent,
    ScreenshotDialogComponent,
    ConfirmationBottomSheetComponent,
    ConfigDialogComponent,
    AdbutlerComponent,
    NewTemplateDialogComponent,
    ChangeHostnameDialogComponent,
    ApplianceInfoDialogComponent,
    ConfigureCustomAdaptersDialogComponent,
    EditNetworkConfigurationDialogComponent,
    ProjectReadmeComponent
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(protected _googleAnalyticsService: GoogleAnalyticsService) {}
}
