import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
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
import { IouConfigurationService } from '@services/iou-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configurator-iou',
  templateUrl: './configurator-iou.component.html',
  styleUrls: ['../configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatIconModule, MatCheckboxModule]
})
export class ConfiguratorDialogIouComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogIouComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private configurationService = inject(IouConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  networkForm: UntypedFormGroup;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];

  constructor() {
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
      this.generalSettingsForm.patchValue({ name: node.name });
      this.networkForm.patchValue({
        ethernetAdapters: node.properties.ethernet_adapters,
        serialAdapters: node.properties.serial_adapters,
      });
      this.getConfiguration();
      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.cd.markForCheck();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.networkForm.valid) {
      // Sync form values back to node.properties
      this.node.properties.ethernet_adapters = this.networkForm.value.ethernetAdapters;
      this.node.properties.serial_adapters = this.networkForm.value.serialAdapters;
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
