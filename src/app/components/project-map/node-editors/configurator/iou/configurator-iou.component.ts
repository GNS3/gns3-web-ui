import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { IouConfigurationService } from '../../../../../services/iou-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';

@Component({
  selector: 'app-configurator-iou',
  templateUrl: './configurator-iou.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogIouComponent implements OnInit {
  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  networkForm: UntypedFormGroup;
  consoleTypes: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfiguratorDialogIouComponent>,
    public nodeService: NodeService,
    private toasterService: ToasterService,
    private formBuilder: UntypedFormBuilder,
    private configurationService: IouConfigurationService
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
    });

    this.networkForm = this.formBuilder.group({
      ethernetAdapters: new UntypedFormControl('', Validators.required),
      serialAdapters: new UntypedFormControl('', Validators.required),
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
    if (this.generalSettingsForm.valid && this.networkForm.valid) {
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
