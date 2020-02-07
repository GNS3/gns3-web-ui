import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
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
import { ConfiguratorDialogTracengComponent } from '../../../node-editors/configurator/traceng/configurator-traceng.component';
import { ConfiguratorDialogVirtualBoxComponent } from '../../../node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { ConfiguratorDialogVmwareComponent } from '../../../node-editors/configurator/vmware/configurator-vmware.component';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';


@Component({
  selector: 'app-config-node-action',
  templateUrl: './config-action.component.html'
})
export class ConfigActionComponent {
  @Input() server: Server;
  @Input() node: Node;
  private conf = {
    autoFocus: false,
    width: '800px'
  };
  dialogRef;

  constructor(private dialog: MatDialog) {}

  configureNode() {
    if (this.node.node_type === 'vpcs') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVpcsComponent, this.conf);
    } else if (this.node.node_type === 'ethernet_hub') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogEthernetHubComponent, this.conf);
    } else if (this.node.node_type === 'ethernet_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogEthernetSwitchComponent, this.conf);
    } else if (this.node.node_type === 'cloud') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogCloudComponent, this.conf);
    } else if (this.node.node_type === 'dynamips') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogIosComponent, this.conf);
    } else if (this.node.node_type === 'iou') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogIouComponent, this.conf);
    } else if (this.node.node_type === 'qemu') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogQemuComponent, this.conf);
    } else if (this.node.node_type === 'virtualbox') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVirtualBoxComponent, this.conf);
    } else if (this.node.node_type === 'vmware') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVmwareComponent, this.conf);
    } else if (this.node.node_type === 'docker') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogDockerComponent, this.conf);
    } else if (this.node.node_type === 'nat') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogNatComponent, this.conf);
    } else if (this.node.node_type === 'frame_relay_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogSwitchComponent, this.conf);
    } else if (this.node.node_type === 'atm_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogAtmSwitchComponent, this.conf);
    } else if (this.node.node_type === 'traceng') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogTracengComponent, this.conf);
    }

    const instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }
}
