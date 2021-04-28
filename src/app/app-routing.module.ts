import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BundledServerFinderComponent } from './components/bundled-server-finder/bundled-server-finder.component';
import { DirectLinkComponent } from './components/direct-link/direct-link.component';
import { HelpComponent } from './components/help/help.component';
import { ReportIssueComponent } from './components/help/report-issue/report-issue.component';
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
import { AddDockerTemplateComponent } from './components/preferences/docker/add-docker-template/add-docker-template.component';
import { CopyDockerTemplateComponent } from './components/preferences/docker/copy-docker-template/copy-docker-template.component';
import { DockerTemplateDetailsComponent } from './components/preferences/docker/docker-template-details/docker-template-details.component';
import { DockerTemplatesComponent } from './components/preferences/docker/docker-templates/docker-templates.component';
import { AddIosTemplateComponent } from './components/preferences/dynamips/add-ios-template/add-ios-template.component';
import { CopyIosTemplateComponent } from './components/preferences/dynamips/copy-ios-template/copy-ios-template.component';
import { IosTemplateDetailsComponent } from './components/preferences/dynamips/ios-template-details/ios-template-details.component';
import { IosTemplatesComponent } from './components/preferences/dynamips/ios-templates/ios-templates.component';
import { Gns3vmComponent } from './components/preferences/gns3vm/gns3vm.component';
import { AddIouTemplateComponent } from './components/preferences/ios-on-unix/add-iou-template/add-iou-template.component';
import { CopyIouTemplateComponent } from './components/preferences/ios-on-unix/copy-iou-template/copy-iou-template.component';
import { IouTemplateDetailsComponent } from './components/preferences/ios-on-unix/iou-template-details/iou-template-details.component';
import { IouTemplatesComponent } from './components/preferences/ios-on-unix/iou-templates/iou-templates.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { AddQemuVmTemplateComponent } from './components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component';
import { CopyQemuVmTemplateComponent } from './components/preferences/qemu/copy-qemu-vm-template/copy-qemu-vm-template.component';
import { QemuVmTemplateDetailsComponent } from './components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component';
import { QemuVmTemplatesComponent } from './components/preferences/qemu/qemu-vm-templates/qemu-vm-templates.component';
import { AddVirtualBoxTemplateComponent } from './components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component';
import { VirtualBoxTemplateDetailsComponent } from './components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component';
import { VirtualBoxTemplatesComponent } from './components/preferences/virtual-box/virtual-box-templates/virtual-box-templates.component';
import { AddVmwareTemplateComponent } from './components/preferences/vmware/add-vmware-template/add-vmware-template.component';
import { VmwareTemplateDetailsComponent } from './components/preferences/vmware/vmware-template-details/vmware-template-details.component';
import { VmwareTemplatesComponent } from './components/preferences/vmware/vmware-templates/vmware-templates.component';
import { AddVpcsTemplateComponent } from './components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component';
import { VpcsTemplateDetailsComponent } from './components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component';
import { VpcsTemplatesComponent } from './components/preferences/vpcs/vpcs-templates/vpcs-templates.component';
import { ProjectMapComponent } from './components/project-map/project-map.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ServersComponent } from './components/servers/servers.component';
import { ConsoleComponent } from './components/settings/console/console.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ListOfSnapshotsComponent } from './components/snapshots/list-of-snapshots/list-of-snapshots.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { WebConsoleFullWindowComponent } from './components/web-console-full-window/web-console-full-window.component';
import { ConsoleGuard } from './guards/console-guard';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { ServerResolve } from './resolvers/server-resolve';

const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: '', redirectTo: 'servers', pathMatch: 'full' },
      { path: 'servers', component: ServersComponent },
      { path: 'bundled', component: BundledServerFinderComponent },
      {
        path: 'server/:server_id/projects',
        component: ProjectsComponent,
        resolve: { server: ServerResolve },
      },
      { path: 'help', component: HelpComponent },
      { path: 'help/reportissue', component: ReportIssueComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'settings/console', component: ConsoleComponent },
      { path: 'installed-software', component: InstalledSoftwareComponent },
      { path: 'server/:server_id/systemstatus', component: SystemStatusComponent },

      { path: 'server/:server_ip/:server_port/project/:project_id', component: DirectLinkComponent },
      {
        path: 'server/:server_id/project/:project_id/snapshots',
        component: ListOfSnapshotsComponent,
        resolve: { server: ServerResolve },
      },
      { path: 'server/:server_id/preferences', component: PreferencesComponent },
      { path: 'server/:server_id/preferences/gns3vm', component: Gns3vmComponent },
      // { path: 'server/:server_id/preferences/general', component: GeneralPreferencesComponent },
      { path: 'server/:server_id/preferences/builtin', component: BuiltInPreferencesComponent },

      { path: 'server/:server_id/preferences/builtin/ethernet-hubs', component: EthernetHubsTemplatesComponent },
      {
        path: 'server/:server_id/preferences/builtin/ethernet-hubs/addtemplate',
        component: EthernetHubsAddTemplateComponent,
      },
      {
        path: 'server/:server_id/preferences/builtin/ethernet-hubs/:template_id',
        component: EthernetHubsTemplateDetailsComponent,
      },

      {
        path: 'server/:server_id/preferences/builtin/ethernet-switches',
        component: EthernetSwitchesTemplatesComponent,
      },
      {
        path: 'server/:server_id/preferences/builtin/ethernet-switches/addtemplate',
        component: EthernetSwitchesAddTemplateComponent,
      },
      {
        path: 'server/:server_id/preferences/builtin/ethernet-switches/:template_id',
        component: EthernetSwitchesTemplateDetailsComponent,
      },

      { path: 'server/:server_id/preferences/builtin/cloud-nodes', component: CloudNodesTemplatesComponent },
      {
        path: 'server/:server_id/preferences/builtin/cloud-nodes/addtemplate',
        component: CloudNodesAddTemplateComponent,
      },
      {
        path: 'server/:server_id/preferences/builtin/cloud-nodes/:template_id',
        component: CloudNodesTemplateDetailsComponent,
      },

      //{ path: 'server/:server_id/preferences/dynamips', component: DynamipsPreferencesComponent },
      { path: 'server/:server_id/preferences/dynamips/templates', component: IosTemplatesComponent },
      { path: 'server/:server_id/preferences/dynamips/templates/addtemplate', component: AddIosTemplateComponent },
      { path: 'server/:server_id/preferences/dynamips/templates/:template_id', component: IosTemplateDetailsComponent },
      {
        path: 'server/:server_id/preferences/dynamips/templates/:template_id/copy',
        component: CopyIosTemplateComponent,
      },

      // { path: 'server/:server_id/preferences/qemu', component: QemuPreferencesComponent },
      { path: 'server/:server_id/preferences/qemu/templates', component: QemuVmTemplatesComponent },
      {
        path: 'server/:server_id/preferences/qemu/templates/:template_id/copy',
        component: CopyQemuVmTemplateComponent,
      },
      { path: 'server/:server_id/preferences/qemu/templates/:template_id', component: QemuVmTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/qemu/addtemplate', component: AddQemuVmTemplateComponent },

      // { path: 'server/:server_id/preferences/vpcs', component: VpcsPreferencesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates', component: VpcsTemplatesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates/:template_id', component: VpcsTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/vpcs/addtemplate', component: AddVpcsTemplateComponent },

      // { path: 'server/:server_id/preferences/virtualbox', component: VirtualBoxPreferencesComponent },
      { path: 'server/:server_id/preferences/virtualbox/templates', component: VirtualBoxTemplatesComponent },
      {
        path: 'server/:server_id/preferences/virtualbox/templates/:template_id',
        component: VirtualBoxTemplateDetailsComponent,
      },
      { path: 'server/:server_id/preferences/virtualbox/addtemplate', component: AddVirtualBoxTemplateComponent },

      // { path: 'server/:server_id/preferences/vmware', component: VmwarePreferencesComponent },
      { path: 'server/:server_id/preferences/vmware/templates', component: VmwareTemplatesComponent },
      {
        path: 'server/:server_id/preferences/vmware/templates/:template_id',
        component: VmwareTemplateDetailsComponent,
      },
      { path: 'server/:server_id/preferences/vmware/addtemplate', component: AddVmwareTemplateComponent },

      { path: 'server/:server_id/preferences/docker/templates', component: DockerTemplatesComponent },
      {
        path: 'server/:server_id/preferences/docker/templates/:template_id',
        component: DockerTemplateDetailsComponent,
      },
      {
        path: 'server/:server_id/preferences/docker/templates/:template_id/copy',
        component: CopyDockerTemplateComponent,
      },
      { path: 'server/:server_id/preferences/docker/addtemplate', component: AddDockerTemplateComponent },

      { path: 'server/:server_id/preferences/iou/templates', component: IouTemplatesComponent },
      { path: 'server/:server_id/preferences/iou/templates/:template_id', component: IouTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/iou/templates/:template_id/copy', component: CopyIouTemplateComponent },
      { path: 'server/:server_id/preferences/iou/addtemplate', component: AddIouTemplateComponent },
    ],
  },
  {
    path: 'server/:server_id/project/:project_id',
    component: ProjectMapComponent,
    canDeactivate: [ConsoleGuard],
  },
  {
    path: 'server/:server_id/project/:project_id/nodes/:node_id',
    component: WebConsoleFullWindowComponent,
  },
  {
    path: 'static/web-ui/server/:server_id/project/:project_id/nodes/:node_id',
    component: WebConsoleFullWindowComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      enableTracing: false,
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
