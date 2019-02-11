import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectMapComponent } from './components/project-map/project-map.component';
import { ServersComponent } from './components/servers/servers.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LocalServerComponent } from './components/local-server/local-server.component';
import { PreferencesComponent } from './components/preferences/preferences.component';
import { QemuPreferencesComponent } from './components/preferences/qemu/qemu-preferences/qemu-preferences.component';
import { QemuVmTemplatesComponent } from './components/preferences/qemu/qemu-vm-templates/qemu-vm-templates.component';
import { QemuVmTemplateDetailsComponent } from './components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component';
import { AddQemuVmTemplateComponent } from './components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component';
import { GeneralPreferencesComponent } from './components/preferences/general/general-preferences.component';
import { VpcsPreferencesComponent } from './components/preferences/vpcs/vpcs-preferences/vpcs-preferences.component';
import { VpcsTemplatesComponent } from './components/preferences/vpcs/vpcs-templates/vpcs-templates.component';
import { AddVpcsTemplateComponent } from './components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component';
import { VpcsTemplateDetailsComponent } from './components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component';
import { VirtualBoxPreferencesComponent } from './components/preferences/virtual-box/virtual-box-preferences/virtual-box-preferences.component';
import { VirtualBoxTemplatesComponent } from './components/preferences/virtual-box/virtual-box-templates/virtual-box-templates.component';
import { VirtualBoxTemplateDetailsComponent } from './components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component';
import { AddVirtualBoxTemplateComponent } from './components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component';
import { BuiltInPreferencesComponent } from './components/preferences/built-in/built-in-preferences.component';
import { EthernetHubsTemplatesComponent } from './components/preferences/built-in/ethernet-hubs/ethernet-hubs-templates/ethernet-hubs-templates.component';
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
import { InstalledSoftwareComponent } from './components/installed-software/installed-software.component';
import { IosTemplateDetailsComponent } from './components/preferences/dynamips/ios-template-details/ios-template-details.component';
import { AddIosTemplateComponent } from './components/preferences/dynamips/add-ios-template/add-ios-template.component';
import { VmwarePreferencesComponent } from './components/preferences/vmware/vmware-preferences/vmware-preferences.component';
import { VmwareTemplatesComponent } from './components/preferences/vmware/vmware-templates/vmware-templates.component';
import { VmwareTemplateDetailsComponent } from './components/preferences/vmware/vmware-template-details/vmware-template-details.component';
import { AddVmwareTemplateComponent } from './components/preferences/vmware/add-vmware-template/add-vmware-template.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: '', redirectTo: 'servers', pathMatch: 'full' },
      { path: 'servers', component: ServersComponent },
      { path: 'local', component: LocalServerComponent },
      { path: 'server/:server_id/projects', component: ProjectsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'installed-software', component: InstalledSoftwareComponent },
      { path: 'server/:server_id/preferences', component: PreferencesComponent },
      // { path: 'server/:server_id/preferences/general', component: GeneralPreferencesComponent },
      { path: 'server/:server_id/preferences/builtin', component: BuiltInPreferencesComponent},

      { path: 'server/:server_id/preferences/builtin/ethernet-hubs', component: EthernetHubsTemplatesComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-hubs/addtemplate', component: EthernetHubsAddTemplateComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-hubs/:template_id', component: EthernetHubsTemplateDetailsComponent },

      { path: 'server/:server_id/preferences/builtin/ethernet-switches', component: EthernetSwitchesTemplatesComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-switches/addtemplate', component: EthernetSwitchesAddTemplateComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-switches/:template_id', component: EthernetSwitchesTemplateDetailsComponent },

      { path: 'server/:server_id/preferences/builtin/cloud-nodes', component: CloudNodesTemplatesComponent },
      { path: 'server/:server_id/preferences/builtin/cloud-nodes/addtemplate', component: CloudNodesAddTemplateComponent },
      { path: 'server/:server_id/preferences/builtin/cloud-nodes/:template_id', component: CloudNodesTemplateDetailsComponent },

      //{ path: 'server/:server_id/preferences/dynamips', component: DynamipsPreferencesComponent },
      { path: 'server/:server_id/preferences/dynamips/templates', component: IosTemplatesComponent },
      { path: 'server/:server_id/preferences/dynamips/templates/addtemplate', component: AddIosTemplateComponent },
      { path: 'server/:server_id/preferences/dynamips/templates/:template_id', component: IosTemplateDetailsComponent },

      // { path: 'server/:server_id/preferences/qemu', component: QemuPreferencesComponent },
      { path: 'server/:server_id/preferences/qemu/templates', component: QemuVmTemplatesComponent },
      { path: 'server/:server_id/preferences/qemu/templates/:template_id', component: QemuVmTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/qemu/addtemplate', component: AddQemuVmTemplateComponent },

      // { path: 'server/:server_id/preferences/vpcs', component: VpcsPreferencesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates', component: VpcsTemplatesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates/:template_id', component: VpcsTemplateDetailsComponent},
      { path: 'server/:server_id/preferences/vpcs/addtemplate', component: AddVpcsTemplateComponent },

      // { path: 'server/:server_id/preferences/virtualbox', component: VirtualBoxPreferencesComponent },
      { path: 'server/:server_id/preferences/virtualbox/templates', component: VirtualBoxTemplatesComponent },
      { path: 'server/:server_id/preferences/virtualbox/templates/:template_id', component: VirtualBoxTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/virtualbox/addtemplate', component: AddVirtualBoxTemplateComponent },

      // { path: 'server/:server_id/preferences/vmware', component: VmwarePreferencesComponent },
      { path: 'server/:server_id/preferences/vmware/templates', component: VmwareTemplatesComponent },
      { path: 'server/:server_id/preferences/vmware/templates/:template_id', component: VmwareTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/vmware/addtemplate', component: AddVmwareTemplateComponent }
    ]
  },
  { path: 'server/:server_id/project/:project_id', component: ProjectMapComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
