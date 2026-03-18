import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  selector: 'app-edit-network-configuration',
  templateUrl: './edit-network-configuration.component.html',
  styleUrls: ['./edit-network-configuration.component.scss'],
})
export class EditNetworkConfigurationDialogComponent implements OnInit {
  controller: Controller;
  node: Node;
  configuration: string;

  constructor(
    public dialogRef: MatDialogRef<EditNetworkConfigurationDialogComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.nodeService.getNetworkConfiguration(this.controller, this.node).subscribe((response: string) => {
      this.configuration = response;
    });
  }

  onSaveClick() {
    this.nodeService
      .saveNetworkConfiguration(this.controller, this.node, this.configuration)
      .subscribe((response: string) => {
        this.onCancelClick();
        this.toasterService.success(`Configuration for node ${this.node.name} saved.`);
      });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
