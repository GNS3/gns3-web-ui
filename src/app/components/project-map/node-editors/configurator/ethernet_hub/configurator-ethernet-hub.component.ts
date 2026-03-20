import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VpcsConfigurationService } from '@services/vpcs-configuration.service';

@Component({
  standalone: false,
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
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

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
      if (!this.node.tags) {
        this.node.tags = [];
      }
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

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.node) {
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.node.tags.push(value);
    }

    // Clear the input value
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeTag(tag: string): void {
    if (!this.node.tags) {
      return;
    }
    const index = this.node.tags.indexOf(tag);

    if (index >= 0) {
      this.node.tags.splice(index, 1);
    }
  }
}
