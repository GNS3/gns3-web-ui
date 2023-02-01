import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import{ Controller } from '../../../../../models/controller';
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
  generalSettingsForm: FormGroup;
  consoleTypes: string[] = [];
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
      private formBuilder: FormBuilder,
      private dockerConfigurationService: DockerConfigurationService,
      private nonNegativeValidator: NonNegativeValidator,
      private dialog: MatDialog
  ) {
      this.generalSettingsForm = this.formBuilder.group({
          name: new FormControl('', Validators.required),
          adapter: new FormControl('', Validators.required),
          memory: new FormControl('', nonNegativeValidator.get),
          cpus: new FormControl('', nonNegativeValidator.get),
          startCommand: new FormControl(''),
          consoleHttpPort: new FormControl('', Validators.required),
          consoleHttpPath: new FormControl('', Validators.required)
      });
  }

  ngOnInit() {
      this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
          this.node = node;
          this.name = node.name;
          this.getConfiguration();
          if (!this.node.properties.cpus) this.node.properties.cpus = 0.0;
          if (this.node.properties.extra_volumes && this.node.properties.extra_volumes.length>0) {
            for (let index = 0; index < this.node.properties.extra_volumes.length - 1; index++) {
              this.additionalDirectories = this.additionalDirectories + this.node.properties.extra_volumes[index] + "\n";
            }
            this.additionalDirectories = this.additionalDirectories + this.node.properties.extra_volumes[this.node.properties.extra_volumes.length - 1];
          }
      });
  }


  getConfiguration() {
    this.consoleTypes = this.dockerConfigurationService.getConsoleTypes();
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
    var extraVolumes = this.additionalDirectories.split("\n").filter(elem => elem != "");
    for (const item of extraVolumes) {
      console.log(item);
      if (!item.startsWith("/")) {
        this.toasterService.error(`Wrong format for additional directories.`);
        return;
      }
    }
    if (this.generalSettingsForm.valid) {
      this.node.properties.extra_volumes = extraVolumes;
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
