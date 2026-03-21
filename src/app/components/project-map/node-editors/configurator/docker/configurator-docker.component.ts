import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatIconModule, MatCheckboxModule]
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
  consoleResolutions: string[] = ['2560x1440', '1920x1080', '1680x1050', '1440x900', '1366x768', '1280x1024', '1280x800', '1024x768', '800x600', '640x480'];
  private conf = {
    autoFocus: false,
    width: '800px',
    disableClose: true,
  };
  dialogRef;

  constructor() {
      this.generalSettingsForm = this.formBuilder.group({
          name: new UntypedFormControl('', Validators.required),
          adapter: new UntypedFormControl('', Validators.required),
          mac_address: new UntypedFormControl('', Validators.pattern(this.dockerConfigurationService.getMacAddrRegex())),
          memory: new UntypedFormControl('', this.nonNegativeValidator.get),
          cpus: new UntypedFormControl('', this.nonNegativeValidator.get),
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
