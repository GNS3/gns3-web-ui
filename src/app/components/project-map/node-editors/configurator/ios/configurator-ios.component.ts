import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { IosConfigurationService } from '../../../../../services/ios-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogIosComponent implements OnInit {
  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  advancedSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  NPETypes: string[] = [];
  MidplaneTypes: string[] = [];
  networkAdaptersForNode: string[] = [];
  wicsForNode: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogIosComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private configurationService: IosConfigurationService
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new UntypedFormControl('', Validators.required),
      nvram: new UntypedFormControl('', Validators.required),
    });

    this.advancedSettingsForm = this.formBuilder.group({
      mac_addr: new UntypedFormControl('', Validators.pattern(this.configurationService.getMacAddrRegex())),
      idlepc: new UntypedFormControl('', Validators.pattern(this.configurationService.getIdlepcRegex())),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
      this.fillSlotsData();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.NPETypes = this.configurationService.getNPETypes();
    this.MidplaneTypes = this.configurationService.getMidplaneTypes();
    this.adapterMatrix = this.configurationService.getAdapterMatrix();
    this.wicMatrix = this.configurationService.getWicMatrix();
  }

  fillSlotsData() {

    // load network adapters
    for (let i = 0; i <= 6; i++) {
      if (this.node.properties[`slot${i}`]) {
        this.networkAdaptersForNode[i] = this.node.properties[`slot${i}`];
      }
    }

    // load WICs
    for (let i = 0; i <= 3; i++) {
      if (this.node.properties[`wic${i}`]) {
        this.wicsForNode[i] = this.node.properties[`wic${i}`];
      }
    }
  }

  saveSlotsData() {

    // save network adapters
    for (let i = 0; i <= 6; i++) {
      if (this.adapterMatrix[this.node.properties.platform][this.node.properties.chassis || ''][i]) {
        if (this.networkAdaptersForNode[i] === undefined)
          this.node.properties[`slot${i}`] = ""
        else
          this.node.properties[`slot${i}`] = this.networkAdaptersForNode[i];
      }
    }

    // save WICs
    for (let i = 0; i <= 3; i++) {
      if (this.wicMatrix[this.node.properties.platform][i]) {
        if (this.wicsForNode[i] === undefined)
          this.node.properties[`wic${i}`] = ""
        else
          this.node.properties[`wic${i}`] = this.wicsForNode[i];
      }
    }
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.memoryForm.valid && this.advancedSettingsForm.valid) {
      this.saveSlotsData();
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
