import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { VpcsConfigurationService } from '../../../../../services/vpcs-configuration.service';

@Component({
  selector: 'app-configurator-ethernet-hub',
  templateUrl: './configurator-ethernet-hub.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogEthernetHubComponent implements OnInit {
  controller: Controller;
  node: Node;
  numberOfPorts: number;
  inputForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  categories = [];
  name: string;

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogEthernetHubComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private vpcsConfigurationService: VpcsConfigurationService
  ) {
    this.inputForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = this.node.name;
      this.numberOfPorts = this.node.ports.length;
      this.getConfiguration();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.vpcsConfigurationService.getConsoleTypes();
    this.categories = this.vpcsConfigurationService.getCategories();
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      this.node.properties.ports_mapping = [];
      for (let i = 0; i < this.numberOfPorts; i++) {
        this.node.properties.ports_mapping.push({
          name: `Ethernet${i}`,
          port_number: i,
        });
      }

      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogRef.close();
  }
}
