import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { PortsComponent } from '../../../../../components/preferences/common/ports/ports.component';
import { Controller } from '../../../../../models/controller';
import { BuiltInTemplatesConfigurationService } from '../../../../../services/built-in-templates-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-configurator-ethernet-switch',
  templateUrl: './configurator-ethernet-switch.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogEthernetSwitchComponent implements OnInit {
  @ViewChild(PortsComponent) portsComponent: PortsComponent;
  controller: Controller;
  node: Node;
  name: string;
  inputForm: UntypedFormGroup;
  consoleTypes: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogEthernetSwitchComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private ethernetSwitchesConfigurationService: BuiltInTemplatesConfigurationService
  ) {
    this.inputForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = this.node.name;
      this.getConfiguration();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.ethernetSwitchesConfigurationService.getConsoleTypesForEthernetSwitches();
  }

  onSaveClick() {
    if (this.inputForm.valid) {
      this.node.properties.ports_mapping = this.portsComponent.ethernetPorts;
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
