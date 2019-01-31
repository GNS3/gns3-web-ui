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
      { path: 'server/:server_id/preferences', component: PreferencesComponent },
      // temporary disabled
      // { path: 'server/:server_id/preferences/general', component: GeneralPreferencesComponent },
      { path: 'server/:server_id/preferences/builtin', component: BuiltInPreferencesComponent},
      { path: 'server/:server_id/preferences/builtin/ethernet-hubs', component: EthernetHubsTemplatesComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-hubs/addtemplate', component: EthernetHubsAddTemplateComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-hubs/:template_id', component: EthernetHubsTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/builtin/ethernet-switches', component: EthernetHubsTemplatesComponent },
      { path: 'server/:server_id/preferences/builtin/cloud-nodes', component: EthernetHubsTemplatesComponent },
      // temporary disabled
      // { path: 'server/:server_id/preferences/qemu', component: QemuPreferencesComponent },
      { path: 'server/:server_id/preferences/qemu/templates', component: QemuVmTemplatesComponent },
      { path: 'server/:server_id/preferences/qemu/templates/:template_id', component: QemuVmTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/qemu/addtemplate', component: AddQemuVmTemplateComponent },
      // temporary disabled
      // { path: 'server/:server_id/preferences/vpcs', component: VpcsPreferencesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates', component: VpcsTemplatesComponent },
      { path: 'server/:server_id/preferences/vpcs/templates/:template_id', component: VpcsTemplateDetailsComponent},
      { path: 'server/:server_id/preferences/vpcs/addtemplate', component: AddVpcsTemplateComponent },
      // temporary disabled
      // { path: 'server/:server_id/preferences/virtualbox', component: VirtualBoxPreferencesComponent }
      { path: 'server/:server_id/preferences/virtualbox/templates', component: VirtualBoxTemplatesComponent },
      { path: 'server/:server_id/preferences/virtualbox/templates/:template_id', component: VirtualBoxTemplateDetailsComponent },
      { path: 'server/:server_id/preferences/virtualbox/addtemplate', component: AddVirtualBoxTemplateComponent }
    ]
  },
  { path: 'server/:server_id/project/:project_id', component: ProjectMapComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
