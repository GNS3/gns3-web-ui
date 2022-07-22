import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
import { IosConfigurationService } from '../../../../../services/ios-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogIosComponent implements OnInit {
  controller:Controller ;
  node: Node;
  name: string;
  generalSettingsForm: FormGroup;
  memoryForm: FormGroup;
  consoleTypes: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogIosComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: FormBuilder,
    private configurationService: IosConfigurationService
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new FormControl('', Validators.required),
      nvram: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.memoryForm.valid) {
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
