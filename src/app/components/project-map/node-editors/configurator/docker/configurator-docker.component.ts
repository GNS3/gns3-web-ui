import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '../../../../../models/controller';
import { DockerConfigurationService } from '../../../../../services/docker-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters/configure-custom-adapters.component';
import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration/edit-network-configuration.component';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';

@Component({
  selector: 'app-configurator-docker',
  templateUrl: './configurator-docker.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogDockerComponent implements OnInit {
  controller:Controller ;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  consoleResolutions: string[] = ['2560x1440', '1920x1080', '1680x1050', '1440x900', '1366x768', '1280x1024', '1280x800', '1024x768', '800x600', '640x480'];
  private conf = {
    autoFocus: false,
    width: '800px',
    disableClose: true,
  };
  dialogRef;

  constructor(
      public dialogReference: MatDialogRef<ConfiguratorDialogDockerComponent>,
      public nodeService: NodeService,
      private toasterService: ToasterService,
      private formBuilder: UntypedFormBuilder,
      private dockerConfigurationService: DockerConfigurationService,
      private nonNegativeValidator: NonNegativeValidator,
      private dialog: MatDialog
  ) {
      this.generalSettingsForm = this.formBuilder.group({
          name: new UntypedFormControl('', Validators.required),
          adapter: new UntypedFormControl('', Validators.required),
          mac_address: new UntypedFormControl('', Validators.pattern(this.dockerConfigurationService.getMacAddrRegex())),
          memory: new UntypedFormControl('', nonNegativeValidator.get),
          cpus: new UntypedFormControl('', nonNegativeValidator.get),
          startCommand: new UntypedFormControl(''),
          consoleHttpPort: new UntypedFormControl('', Validators.required),
          consoleHttpPath: new UntypedFormControl('', Validators.required)
      });
  }

  ngOnInit() {
      this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
          this.node = node;
          this.name = node.name;
          this.getConfiguration();
          if (!this.node.properties.cpus) this.node.properties.cpus = 0.0;
      });
  }

  getConfiguration() {
    this.consoleTypes = this.dockerConfigurationService.getConsoleTypes();
    this.auxConsoleTypes = this.dockerConfigurationService.getAuxConsoleTypes();
  }

  configureCustomAdapters() {
    this.dialogRef = this.dialog.open(ConfigureCustomAdaptersDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }

  editNetworkConfiguration() {
    this.dialogRef = this.dialog.open(EditNetworkConfigurationDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.nodeService.updateNode(this.controller, this.node).subscribe(() => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
  }

  onCancelClick() {
    this.dialogReference.close();
  }
}
