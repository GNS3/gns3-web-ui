import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { DockerConfigurationService } from '@services/docker-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { DockerValidationService } from '@services/validation';
import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters/configure-custom-adapters.component';
import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration/edit-network-configuration.component';

@Component({
  standalone: true,
  selector: 'app-configurator-docker',
  templateUrl: './configurator-docker.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class ConfiguratorDialogDockerComponent implements OnInit {
  private dialogReference = inject(MatDialogRef<ConfiguratorDialogDockerComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private dockerConfigurationService = inject(DockerConfigurationService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(DockerValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  auxConsoleTypes: string[] = [];
  consoleResolutions: string[] = [
    '2560x1440',
    '1920x1080',
    '1680x1050',
    '1440x900',
    '1366x768',
    '1280x1024',
    '1280x800',
    '1024x768',
    '800x600',
    '640x480',
  ];
  private conf = {
    autoFocus: false,
    panelClass: ['base-dialog-panel', 'docker-configurator-dialog-panel'],
    disableClose: true,
  };
  dialogRef;

  // Model signals
  readonly nodeName = model('');
  readonly dockerImage = model('');
  readonly startCommand = model('');
  readonly adapter = model('');
  readonly macAddress = model('');
  readonly memory = model('');
  readonly cpus = model('');
  readonly consoleType = model('');
  readonly auxType = model('');
  readonly consoleAutoStart = model(false);
  readonly consoleResolution = model('');
  readonly consoleHttpPort = model('');
  readonly consoleHttpPath = model('');
  readonly environment = model('');
  readonly extraHosts = model('');
  readonly extraVolumes = model('');
  readonly usage = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update model signals with node data
        this.nodeName.set(node.name || '');
        this.dockerImage.set(node.properties.image || '');
        this.startCommand.set(node.properties.start_command || '');
        this.adapter.set(node.properties.adapters?.toString() || '');
        this.macAddress.set(node.properties.mac_address || '');
        this.memory.set(node.properties.memory?.toString() || '');
        this.cpus.set(node.properties.cpus?.toString() || '');
        this.consoleType.set(node.console_type || '');
        this.auxType.set(node.aux_type || '');
        this.consoleAutoStart.set(node.console_auto_start || false);
        this.consoleResolution.set(node.properties.console_resolution || '');
        this.consoleHttpPort.set(node.properties.console_http_port?.toString() || '');
        this.consoleHttpPath.set(node.properties.console_http_path || '');
        this.environment.set(node.properties.environment || '');
        this.extraHosts.set(node.properties.extra_hosts || '');
        const volumes = node.properties.extra_volumes;
        this.extraVolumes.set(Array.isArray(volumes) ? volumes.join('\n') : (volumes || ''));
        this.usage.set(node.properties.usage || '');

        this.getConfiguration();
        if (!this.node.properties.cpus) this.node.properties.cpus = 0.0;
        if (!this.node.tags) {
          this.node.tags = [];
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
      },
    });
  }

  getConfiguration() {
    this.consoleTypes = this.dockerConfigurationService.getConsoleTypes();
    this.auxConsoleTypes = this.dockerConfigurationService.getAuxConsoleTypes();
  }

  configureCustomAdapters() {
    // Generate adapter data from current node state
    let adapters = this.node.custom_adapters || [];
    if (adapters.length === 0) {
      const count = parseInt(this.adapter(), 10) || 1;
      adapters = Array.from({ length: count }, (_, i) => ({
        adapter_number: i,
        mac_address: '',
      }));
    }
    this.dialogRef = this.dialog.open(ConfigureCustomAdaptersDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.adapters.set(adapters);
    instance.saveHandler = (updatedAdapters: any[]) => {
      this.node.custom_adapters = updatedAdapters.map((a: any) => ({
        ...a,
        mac_address: a.mac_address || null,
      }));
      this.adapter.set(updatedAdapters.length.toString());
    };
  }

  editNetworkConfiguration() {
    this.dialogRef = this.dialog.open(EditNetworkConfigurationDialogComponent, this.conf);
    let instance = this.dialogRef.componentInstance;
    instance.controller = this.controller;
    instance.node = this.node;
  }

  onSaveClick() {
    // Validate name (required)
    const nameValidation = this.validationService.validateName(this.nodeName());
    if (!nameValidation.isValid) {
      this.toasterService.error(nameValidation.errorMessage || 'Name is required');
      return;
    }

    // Validate adapters (0-99)
    const adapterValidation = this.validationService.validateAdapters(this.adapter(), 99);
    if (!adapterValidation.isValid) {
      this.toasterService.error(adapterValidation.errorMessage);
      return;
    }

    // Validate MAC address format if provided
    const macValidation = this.validationService.validateMacAddress(this.macAddress());
    if (!macValidation.isValid) {
      this.toasterService.error(macValidation.errorMessage);
      return;
    }

    // Validate memory (non-negative integer)
    const memoryValidation = this.validationService.validateMemory(this.memory());
    if (!memoryValidation.isValid) {
      this.toasterService.error(memoryValidation.errorMessage);
      return;
    }

    // Validate CPUs (non-negative number)
    const cpusValidation = this.validationService.validateCpus(this.cpus());
    if (!cpusValidation.isValid) {
      this.toasterService.error(cpusValidation.errorMessage);
      return;
    }

    // Validate console HTTP port (required)
    if (!this.consoleHttpPort() || this.consoleHttpPort().trim() === '') {
      this.toasterService.error('Console HTTP port is required');
      return;
    }

    // Validate console HTTP path (required)
    const httpPathValidation = this.validationService.validateConsoleHttpPath(this.consoleHttpPath());
    if (!httpPathValidation.isValid) {
      this.toasterService.error(httpPathValidation.errorMessage);
      return;
    }

    // Validate environment variables format if provided
    const envValidation = this.validationService.validateEnvironment(this.environment(), 'Advanced > Environment');
    if (!envValidation.isValid) {
      this.toasterService.error(envValidation.errorMessage);
      return;
    }

    // Merge signal values back into node
    this.node.name = this.nodeName();
    this.node.properties.image = this.dockerImage();
    this.node.properties.start_command = this.startCommand();
    this.node.properties.adapters = parseInt(this.adapter(), 10) || 0;
    this.node.properties.mac_address = this.macAddress();
    this.node.properties.memory = parseInt(this.memory(), 10) || 0;
    this.node.properties.cpus = parseFloat(this.cpus()) || 0;
    this.node.console_type = this.consoleType();
    this.node.aux_type = this.auxType();
    this.node.console_auto_start = this.consoleAutoStart();
    this.node.properties.console_resolution = this.consoleResolution();
    this.node.properties.console_http_port = parseInt(this.consoleHttpPort(), 10) || undefined;
    this.node.properties.console_http_path = this.consoleHttpPath();
    this.node.properties.environment = this.environment();
    this.node.properties.extra_hosts = this.extraHosts();
    this.node.properties.extra_volumes = this.extraVolumes() ? this.extraVolumes().split('\n').filter((v) => v.trim()) : [] as any;
    this.node.properties.usage = this.usage();

    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.cd.markForCheck();
      },
    });
  }

  onCancelClick() {
    this.dialogReference.close();
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
