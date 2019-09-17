import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';
import { ConfiguratorDialogEthernetHubComponent } from '../../../node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogEthernetSwitchComponent } from '../../../node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { ConfiguratorDialogSwitchComponent } from '../../../node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogVirtualBoxComponent } from '../../../node-editors/configurator/virtualbox/configurator-virtualbox.component';
import { ConfiguratorDialogQemuComponent } from '../../../node-editors/configurator/qemu/configurator-qemu.component';
import { ConfiguratorDialogCloudComponent } from '../../../node-editors/configurator/cloud/configurator-cloud.component';
import { ConfiguratorDialogAtmSwitchComponent } from '../../../node-editors/configurator/atm_switch/configurator-atm-switch.component';
import { ConfiguratorDialogVmwareComponent } from '../../../node-editors/configurator/vmware/configurator-vmware.component';


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

    } else if (this.node.node_type === 'iou') {

    } else if (this.node.node_type === 'qemu') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogQemuComponent, this.conf);
    } else if (this.node.node_type === 'virtualbox') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVirtualBoxComponent, this.conf);
    } else if (this.node.node_type === 'vmware') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVmwareComponent, this.conf);
    } else if (this.node.node_type === 'docker') {

    } else if (this.node.node_type === 'nat') {

    } else if (this.node.node_type === 'frame_relay_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogSwitchComponent, this.conf);
    } else if (this.node.node_type === 'atm_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogAtmSwitchComponent, this.conf);
    } else if (this.node.node_type === 'traceng') {

    }

    let instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }
}
