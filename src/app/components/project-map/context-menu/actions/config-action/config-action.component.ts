import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';
import { ConfiguratorDialogEthernetHubComponent } from '../../../node-editors/configurator/ethernet_hub/configurator-ethernet-hub.component';
import { ConfiguratorDialogEthernetSwitchComponent } from '../../../node-editors/configurator/ethernet-switch/configurator-ethernet-switch.component';
import { ConfiguratorDialogSwitchComponent } from '../../../node-editors/configurator/switch/configurator-switch.component';
import { ConfiguratorDialogVirtualBoxComponent } from '../../../node-editors/configurator/virtualbox/configurator-virtualbox.component';


@Component({
  selector: 'app-config-node-action',
  templateUrl: './config-action.component.html'
})
export class ConfigActionComponent {
  @Input() server: Server;
  @Input() node: Node;
  private conf = {
    width: '600px',
    autoFocus: false
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

    } else if (this.node.node_type === 'dynamips') {

    } else if (this.node.node_type === 'iou') {

    } else if (this.node.node_type === 'qemu') {

    } else if (this.node.node_type === 'virtualbox') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogVirtualBoxComponent, this.conf);
    } else if (this.node.node_type === 'vmware') {

    } else if (this.node.node_type === 'docker') {

    } else if (this.node.node_type === 'nat') {

    } else if (this.node.node_type === 'frame_relay_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogSwitchComponent, this.conf);
    } else if (this.node.node_type === 'atm_switch') {
      this.dialogRef = this.dialog.open(ConfiguratorDialogSwitchComponent, this.conf);
    } else if (this.node.node_type === 'traceng') {

    }

    let instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }
}
