import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BundledControllerFinderComponent } from '@components/bundled-controller-finder/bundled-controller-finder.component';
import { ComputesComponent } from '@components/computes/computes.component';
import { DirectLinkComponent } from '@components/direct-link/direct-link.component';
import { HelpComponent } from '@components/help/help.component';
import { InstalledSoftwareComponent } from '@components/installed-software/installed-software.component';
import { LoginComponent } from '@components/login/login.component';
import { PageNotFoundComponent } from '@components/page-not-found/page-not-found.component';
import { CloudNodesAddTemplateComponent } from '@components/preferences/built-in/cloud-nodes/cloud-nodes-add-template/cloud-nodes-add-template.component';
import { CloudNodesTemplateDetailsComponent } from '@components/preferences/built-in/cloud-nodes/cloud-nodes-template-details/cloud-nodes-template-details.component';
import { EthernetHubsAddTemplateComponent } from '@components/preferences/built-in/ethernet-hubs/ethernet-hubs-add-template/ethernet-hubs-add-template.component';
import { EthernetHubsTemplateDetailsComponent } from '@components/preferences/built-in/ethernet-hubs/ethernet-hubs-template-details/ethernet-hubs-template-details.component';
import { EthernetSwitchesAddTemplateComponent } from '@components/preferences/built-in/ethernet-switches/ethernet-switches-add-template/ethernet-switches-add-template.component';
import { EthernetSwitchesTemplateDetailsComponent } from '@components/preferences/built-in/ethernet-switches/ethernet-switches-template-details/ethernet-switches-template-details.component';
import { AddDockerTemplateComponent } from '@components/preferences/docker/add-docker-template/add-docker-template.component';
import { DockerTemplateDetailsComponent } from '@components/preferences/docker/docker-template-details/docker-template-details.component';
import { AddIosTemplateComponent } from '@components/preferences/dynamips/add-ios-template/add-ios-template.component';
import { IosTemplateDetailsComponent } from '@components/preferences/dynamips/ios-template-details/ios-template-details.component';
import { AddIouTemplateComponent } from '@components/preferences/ios-on-unix/add-iou-template/add-iou-template.component';
import { IouTemplateDetailsComponent } from '@components/preferences/ios-on-unix/iou-template-details/iou-template-details.component';
import { PreferencesComponent } from '@components/preferences/preferences.component';
import { NewTemplateDialogComponent } from '@components/project-map/new-template-dialog/new-template-dialog.component';
import { AddQemuVmTemplateComponent } from '@components/preferences/qemu/add-qemu-vm-template/add-qemu-vm-template.component';
import { QemuVmTemplateDetailsComponent } from '@components/preferences/qemu/qemu-vm-template-details/qemu-vm-template-details.component';
// VirtualBox support deprecated since 3.1.0
// import { AddVirtualBoxTemplateComponent } from '@components/preferences/virtual-box/add-virtual-box-template/add-virtual-box-template.component';
// import { VirtualBoxTemplateDetailsComponent } from '@components/preferences/virtual-box/virtual-box-template-details/virtual-box-template-details.component';
// VMware support deprecated since 3.1.0
// import { AddVmwareTemplateComponent } from '@components/preferences/vmware/add-vmware-template/add-vmware-template.component';
// import { VmwareTemplateDetailsComponent } from '@components/preferences/vmware/vmware-template-details/vmware-template-details.component';
import { AddVpcsTemplateComponent } from '@components/preferences/vpcs/add-vpcs-template/add-vpcs-template.component';
import { VpcsTemplateDetailsComponent } from '@components/preferences/vpcs/vpcs-template-details/vpcs-template-details.component';
import { ProjectMapComponent } from '@components/project-map/project-map.component';
import { ProjectsComponent } from '@components/projects/projects.component';
import { ControllersComponent } from '@components/controllers/controllers.component';
import { ConsoleComponent } from '@components/settings/console/console.component';
import { SettingsComponent } from '@components/settings/settings.component';
import { ServerSettingsComponent } from '@components/server-settings/server-settings.component';
import { SystemStatusComponent } from '@components/system-status/system-status.component';
import { WebConsoleFullWindowComponent } from '@components/web-console-full-window/web-console-full-window.component';
import { NodeFileManagerPageComponent } from '@components/project-map/node-file-manager-page/node-file-manager-page.component';
import { ConsoleGuard } from './guards/console-guard';
import { LoginGuard } from './guards/login-guard';
import { AdministratorGuard } from './guards/administrator-guard';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { ControllerResolve } from '@resolvers/controller-resolve';
import { UserManagementComponent } from '@components/user-management/user-management.component';
import { ImageManagerComponent } from '@components/image-manager/image-manager.component';
import { ManagementComponent } from '@components/management/management.component';
import { GroupManagementComponent } from '@components/group-management/group-management.component';
import { RoleManagementComponent } from '@components/role-management/role-management.component';
import { RoleDetailComponent } from '@components/role-management/role-detail/role-detail.component';
import { RoleDetailResolver } from '@resolvers/role-detail.resolver';
import { AclManagementComponent } from '@components/acl-management/acl-management.component';
import { ResourcePoolsManagementComponent } from '@components/resource-pools-management/resource-pools-management.component';
import { ResourcePoolDetailsComponent } from '@components/resource-pool-details/resource-pool-details.component';
import { ResourcePoolsResolver } from '@resolvers/resource-pools.resolver';

const routes: Routes = [
  // Routes without DefaultLayout (clean pages)
  { path: 'controller/:controller_id/login', component: LoginComponent },

  // Routes with DefaultLayout
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      { path: 'controllers', component: ControllersComponent },
      { path: '', redirectTo: 'controllers', pathMatch: 'full' },
      { path: 'bundled', component: BundledControllerFinderComponent },
      { path: 'controller/:controller_id/image-manager', component: ImageManagerComponent },
      {
        path: 'controller/:controller_id/dashboard',
        redirectTo: 'controller/:controller_id/systemstatus',
        pathMatch: 'full',
      },
      {
        path: 'controller/:controller_id/projects',
        component: ProjectsComponent,
        canActivate: [LoginGuard],
        resolve: { controller: ControllerResolve },
      },
      { path: 'controller/:controller_id/help', component: HelpComponent },
      { path: 'controller/:controller_id/settings', component: SettingsComponent },
      { path: 'controller/:controller_id/settings/console', component: ConsoleComponent },
      {
        path: 'controller/:controller_id/server-settings',
        component: ServerSettingsComponent,
        canActivate: [LoginGuard, AdministratorGuard],
      },
      {
        path: 'controller/:controller_id/management/pools/:pool_id',
        component: ResourcePoolDetailsComponent,
        canActivate: [LoginGuard, AdministratorGuard],
        resolve: {
          pool: ResourcePoolsResolver,
          controller: ControllerResolve,
        },
      },
      { path: 'installed-software', component: InstalledSoftwareComponent },
      {
        path: 'controller/:controller_id/systemstatus',
        component: SystemStatusComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_ip/:controller_port/project/:project_id',
        component: DirectLinkComponent,
        canActivate: [LoginGuard],
      },
      { path: 'controller/:controller_id/preferences', component: PreferencesComponent, canActivate: [LoginGuard] },
      {
        // New template wizard: install from the registry or import an appliance.
        // Opened as its own page (like the manual template creation pages).
        path: 'controller/:controller_id/preferences/new-template',
        component: NewTemplateDialogComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/computes',
        component: ComputesComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/builtin/ethernet-hubs/addtemplate',
        component: EthernetHubsAddTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/builtin/ethernet-hubs/:template_id',
        component: EthernetHubsTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_id/preferences/builtin/ethernet-switches/addtemplate',
        component: EthernetSwitchesAddTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/builtin/ethernet-switches/:template_id',
        component: EthernetSwitchesTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_id/preferences/builtin/cloud-nodes/addtemplate',
        component: CloudNodesAddTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/builtin/cloud-nodes/:template_id',
        component: CloudNodesTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_id/preferences/dynamips/templates/addtemplate',
        component: AddIosTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/dynamips/templates/:template_id',
        component: IosTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_id/preferences/qemu/templates/:template_id',
        component: QemuVmTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/qemu/addtemplate',
        component: AddQemuVmTemplateComponent,
        canActivate: [LoginGuard],
      },

      {
        path: 'controller/:controller_id/preferences/vpcs/templates/:template_id',
        component: VpcsTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/vpcs/addtemplate',
        component: AddVpcsTemplateComponent,
        canActivate: [LoginGuard],
      },

      // VirtualBox support deprecated since 3.1.0 - routes removed
      // { path: 'controller/:controller_id/preferences/virtualbox', component: VirtualBoxPreferencesComponent },
      // {
      //   path: 'controller/:controller_id/preferences/virtualbox/templates/:template_id',
      //   component: VirtualBoxTemplateDetailsComponent,
      //   canActivate: [LoginGuard],
      // },
      // {
      //   path: 'controller/:controller_id/preferences/virtualbox/addtemplate',
      //   component: AddVirtualBoxTemplateComponent,
      //   canActivate: [LoginGuard],
      // },

      // VMware support deprecated since 3.1.0 - routes removed
      // { path: 'controller/:controller_id/preferences/vmware', component: VmwarePreferencesComponent },
      // {
      //   path: 'controller/:controller_id/preferences/vmware/templates/:template_id',
      //   component: VmwareTemplateDetailsComponent,
      //   canActivate: [LoginGuard],
      // },
      // {
      //   path: 'controller/:controller_id/preferences/vmware/addtemplate',
      //   component: AddVmwareTemplateComponent,
      //   canActivate: [LoginGuard],
      // },

      {
        path: 'controller/:controller_id/preferences/docker/templates/:template_id',
        component: DockerTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/docker/addtemplate',
        component: AddDockerTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/iou/templates/:template_id',
        component: IouTemplateDetailsComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/preferences/iou/addtemplate',
        component: AddIouTemplateComponent,
        canActivate: [LoginGuard],
      },
      {
        path: 'controller/:controller_id/management',
        component: ManagementComponent,
        canActivate: [LoginGuard, AdministratorGuard],
        children: [
          {
            path: 'users',
            component: UserManagementComponent,
          },
          {
            path: 'groups',
            component: GroupManagementComponent,
          },
          {
            path: 'roles',
            component: RoleManagementComponent,
          },
          {
            path: 'pools',
            component: ResourcePoolsManagementComponent,
          },
          {
            path: 'ACL',
            component: AclManagementComponent,
          },
        ],
      },
      {
        path: 'controller/:controller_id/management/roles/:role_id',
        component: RoleDetailComponent,
        canActivate: [LoginGuard, AdministratorGuard],
        resolve: {
          role: RoleDetailResolver,
          controller: ControllerResolve,
        },
      },
    ],
  },
  {
    path: 'controller/:controller_id/project/:project_id',
    component: ProjectMapComponent,
    canActivate: [LoginGuard],
    canDeactivate: [ConsoleGuard],
  },
  {
    path: 'controller/:controller_id/project/:project_id/nodes/:node_id',
    component: WebConsoleFullWindowComponent,
    canActivate: [LoginGuard],
  },
  {
    path: 'controller/:controller_id/project/:project_id/nodes/:node_id/files',
    component: NodeFileManagerPageComponent,
    canActivate: [LoginGuard],
  },
  {
    path: 'static/web-ui/controller/:controller_id/project/:project_id/nodes/:node_id',
    component: WebConsoleFullWindowComponent,
    canActivate: [LoginGuard],
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
