import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Server } from '../../../../../models/server';
import { Node } from '../../../../../cartography/models/node';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfiguratorDialogVpcsComponent } from '../../../node-editors/configurator/vpcs/configurator-vpcs.component';


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

    } else if (this.node.node_type === 'ethernet_switch') {

    } else if (this.node.node_type === 'cloud') {

    } else if (this.node.node_type === 'dynamips') {

    } else if (this.node.node_type === 'iou') {

    } else if (this.node.node_type === 'qemu') {

    } else if (this.node.node_type === 'virtualbox') {

    } else if (this.node.node_type === 'vmware') {

    } else if (this.node.node_type === 'docker') {

    } else if (this.node.node_type === 'nat') {

    }  else if (this.node.node_type === 'frame_relay_switch') {

    }  else if (this.node.node_type === 'atm_switch') {

    }  else if (this.node.node_type === 'traceng') {

    }

    let instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }
}
