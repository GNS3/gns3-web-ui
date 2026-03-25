import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { ConfiguratorDialogAtmSwitchComponent } from '../../../node-editors/configurator/atm_switch/configurator-atm-switch.component';
import { ConfiguratorDialogCloudComponent } from '../../../node-editors/configurator/cloud/configurator-cloud.component';
import { ConfiguratorDialogDockerComponent } from '../../../node-editors/configurator/docker/configurator-docker.component';
import { ConfiguratorDialogEthernetSwitchComponent } from '../../../node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { ConfiguratorDialogEthernetHubComponent } from '../../../node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogIosComponent } from '../../../node-editors/configurator/ios/configurator-ios.component';
import { ConfiguratorDialogIouComponent } from '../../../node-editors/configurator/iou/configurator-iou.component';
import { ConfiguratorDialogNatComponent } from '../../../node-editors/configurator/nat/configurator-nat.component';
import { ConfiguratorDialogQemuComponent } from '../../../node-editors/configurator/qemu/configurator-qemu.component';
import { ConfiguratorDialogSwitchComponent } from '../../../node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogVirtualBoxComponent } from '../../../node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { ConfiguratorDialogVmwareComponent } from '../../../node-editors/configurator/vmware/configurator-vmware.component';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';

export interface ConfigDialogData {
  controller: Controller;
  node: Node;
}

@Component({
  selector: 'app-config-node-action',
  templateUrl: './config-action.component.html',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigActionComponent {
  private dialog = inject(MatDialog);

  readonly controller = input<Controller>(undefined);
  readonly node = input<Node>(undefined);

  configureNode() {
    const node = this.node();
    const dialogData: ConfigDialogData = {
      controller: this.controller(),
      node: node,
    };
    const dialogConfig = {
      autoFocus: false,
      width: '950px',
      disableClose: false,
      data: dialogData,
    };

    if (node.node_type === 'vpcs') {
      this.dialog.open(ConfiguratorDialogVpcsComponent, dialogConfig);
    } else if (node.node_type === 'ethernet_hub') {
      this.dialog.open(ConfiguratorDialogEthernetHubComponent, dialogConfig);
    } else if (node.node_type === 'ethernet_switch') {
      this.dialog.open(ConfiguratorDialogEthernetSwitchComponent, dialogConfig);
    } else if (node.node_type === 'cloud') {
      this.dialog.open(ConfiguratorDialogCloudComponent, dialogConfig);
    } else if (node.node_type === 'dynamips') {
      this.dialog.open(ConfiguratorDialogIosComponent, dialogConfig);
    } else if (node.node_type === 'iou') {
      this.dialog.open(ConfiguratorDialogIouComponent, dialogConfig);
    } else if (node.node_type === 'qemu') {
      this.dialog.open(ConfiguratorDialogQemuComponent, dialogConfig);
    } else if (node.node_type === 'virtualbox') {
      this.dialog.open(ConfiguratorDialogVirtualBoxComponent, dialogConfig);
    } else if (node.node_type === 'vmware') {
      this.dialog.open(ConfiguratorDialogVmwareComponent, dialogConfig);
    } else if (node.node_type === 'docker') {
      this.dialog.open(ConfiguratorDialogDockerComponent, dialogConfig);
    } else if (node.node_type === 'nat') {
      this.dialog.open(ConfiguratorDialogNatComponent, dialogConfig);
    } else if (node.node_type === 'frame_relay_switch') {
      this.dialog.open(ConfiguratorDialogSwitchComponent, dialogConfig);
    } else if (node.node_type === 'atm_switch') {
      this.dialog.open(ConfiguratorDialogAtmSwitchComponent, dialogConfig);
    }
  }
}
