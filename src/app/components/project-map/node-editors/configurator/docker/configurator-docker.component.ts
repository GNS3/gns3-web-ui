import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
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
import { ConfigureCustomAdaptersDialogComponent } from './configure-custom-adapters/configure-custom-adapters.component';
import { EditNetworkConfigurationDialogComponent } from './edit-network-configuration/edit-network-configuration.component';
import { NonNegativeValidator } from '../../../../../validators/non-negative-validator';

@Component({
  standalone: true,
  selector: 'app-configurator-docker',
  templateUrl: './configurator-docker.component.html',
  // Styles centralized in src/styles/_dialogs.scss via panelClass: 'configurator-dialog-panel'
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  private formBuilder = inject(UntypedFormBuilder);
  private dockerConfigurationService = inject(DockerConfigurationService);
  private nonNegativeValidator = inject(NonNegativeValidator);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
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

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      startCommand: new UntypedFormControl(''),
      adapter: new UntypedFormControl('', Validators.required),
      mac_address: new UntypedFormControl('', Validators.pattern(this.dockerConfigurationService.getMacAddrRegex())),
      memory: new UntypedFormControl('', this.nonNegativeValidator.get),
      cpus: new UntypedFormControl('', this.nonNegativeValidator.get),
      console_type: new UntypedFormControl(''),
      aux_type: new UntypedFormControl(''),
      console_auto_start: new UntypedFormControl(false),
      console_resolution: new UntypedFormControl(''),
      consoleHttpPort: new UntypedFormControl('', Validators.required),
      consoleHttpPath: new UntypedFormControl('', Validators.required),
      environment: new UntypedFormControl(''),
      extra_hosts: new UntypedFormControl(''),
      extra_volumes: new UntypedFormControl(''),
      usage: new UntypedFormControl(''),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe((node: Node) => {
      this.node = node;
      this.name = node.name;

      // Update form values with node data
      this.generalSettingsForm.patchValue({
        name: node.name,
        startCommand: node.properties.start_command || '',
        adapter: node.properties.adapters || 0,
        mac_address: node.properties.mac_address || '',
        memory: node.properties.memory || 0,
        cpus: node.properties.cpus || 0,
        console_type: node.console_type || '',
        aux_type: node.aux_type || '',
        console_auto_start: node.console_auto_start || false,
        console_resolution: node.properties.console_resolution || '',
        consoleHttpPort: node.properties.console_http_port || '',
        consoleHttpPath: node.properties.console_http_path || '',
        environment: node.properties.environment || '',
        extra_hosts: node.properties.extra_hosts || '',
        extra_volumes: node.properties.extra_volumes || '',
        usage: node.properties.usage || '',
      });

      this.getConfiguration();
      if (!this.node.properties.cpus) this.node.properties.cpus = 0.0;
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.cd.markForCheck();
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
      // Merge form values back into node
      const formValues = this.generalSettingsForm.value;

      this.node.name = formValues.name;
      this.node.properties.start_command = formValues.startCommand;
      this.node.properties.adapters = formValues.adapter;
      this.node.properties.mac_address = formValues.mac_address;
      this.node.properties.memory = formValues.memory;
      this.node.properties.cpus = formValues.cpus;
      this.node.console_type = formValues.console_type;
      this.node.aux_type = formValues.aux_type;
      this.node.console_auto_start = formValues.console_auto_start;
      this.node.properties.console_resolution = formValues.console_resolution;
      this.node.properties.console_http_port = formValues.consoleHttpPort;
      this.node.properties.console_http_path = formValues.consoleHttpPath;
      this.node.properties.environment = formValues.environment;
      this.node.properties.extra_hosts = formValues.extra_hosts;
      this.node.properties.extra_volumes = formValues.extra_volumes;
      this.node.properties.usage = formValues.usage;

      this.nodeService.updateNode(this.controller, this.node).subscribe({
        next: () => {
          this.toasterService.success(`Node ${this.node.name} updated.`);
          this.onCancelClick();
        },
        error: (error: unknown) => {
          const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
          this.toasterService.error(errorMessage);
        },
      });
    } else {
      this.toasterService.error(`Fill all required fields.`);
    }
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
