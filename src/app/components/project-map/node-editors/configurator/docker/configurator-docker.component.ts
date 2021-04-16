import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../../../cartography/models/node';
import { Server } from '../../../../../models/server';
import { DockerConfigurationService } from '../../../../../services/docker-configuration.service';
import { NodeService } from '../../../../../services/node.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters/configure-custom-adapters.component';
import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration/edit-network-configuration.component';

@Component({
  selector: 'app-configurator-docker',
  templateUrl: './configurator-docker.component.html',
  styleUrls: ['../configurator.component.scss'],
})
export class ConfiguratorDialogDockerComponent implements OnInit {
  server: Server;
  node: Node;
  name: string;
  generalSettingsForm: FormGroup;
  consoleTypes: string[] = [];
  consoleResolutions: string[] = ['640x480', '800x600', '1024x768', '1280x800', '1280x1024', '1366x768', '1920x1080'];
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
    private dialog: MatDialog
  ) {
    this.generalSettingsForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
      adapter: new FormControl('', Validators.required),
      startCommand: new FormControl('', Validators.required),
      consoleHttpPort: new FormControl('', Validators.required),
      consoleHttpPath: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.server, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;
      this.getConfiguration();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.dockerConfigurationService.getConsoleTypes();
  }

  configureCustomAdapters() {
    this.dialogRef = this.dialog.open(ConfigureCustomAdaptersDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }

  editNetworkConfiguration() {
    this.dialogRef = this.dialog.open(EditNetworkConfigurationDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.server = this.server;
    instance.node = this.node;
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      this.nodeService.updateNode(this.server, this.node).subscribe(() => {
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
