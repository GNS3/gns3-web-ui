import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../../cartography/models/node';
import { Controller } from '../../../../../../models/controller';
import { DockerConfigurationService } from '../../../../../../services/docker-configuration.service';
import { NodeService } from '../../../../../../services/node.service';
import { ToasterService } from '../../../../../../services/toaster.service';

@Component({
  selector: 'app-configure-custom-adapters',
  templateUrl: './configure-custom-adapters.component.html',
  styleUrls: ['./configure-custom-adapters.component.scss'],
})
export class ConfigureCustomAdaptersDialogComponent implements OnInit {
  controller: Controller;
  node: Node;
  displayedColumns: string[] = ['adapter_number', 'port_name'];
  adapters: CustomAdapter[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfigureCustomAdaptersDialogComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private dockerConfigurationService: DockerConfigurationService
  ) {}

  ngOnInit() {
    let i: number = 0;
    if (!this.node.custom_adapters) {
      this.node.ports.forEach((port) => {
        this.adapters.push({
          adapter_number: i,
          port_name: '',
        });
      });
    } else {
      this.adapters = this.node.custom_adapters;
    }
  }

  onSaveClick() {
    this.node.custom_adapters = this.adapters;
    this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe(() => {
      this.onCancelClick();
      this.toasterService.success(`Configuration saved for node ${this.node.name}`);
    });
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}

export class CustomAdapter {
  adapter_number: number;
  port_name: string;
}
