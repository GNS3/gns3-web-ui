import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { IouValidationService } from '@services/validation';

@Component({
  standalone: true,
  selector: 'app-configurator-iou',
  templateUrl: './configurator-iou.component.html',
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
export class ConfiguratorDialogIouComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogIouComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(IouConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(IouValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];

  // Model signals
  readonly nodeName = model('');
  readonly consoleType = model('');
  readonly consoleAutoStart = model(false);
  readonly useDefaultIouValues = model(true);
  readonly ram = model('');
  readonly nvram = model('');
  readonly ethernetAdapters = model('');
  readonly serialAdapters = model('');
  readonly usage = model('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        this.nodeName.set(node.name || '');
        this.consoleType.set(node.console_type || '');
        this.consoleAutoStart.set(node.console_auto_start || false);
        this.useDefaultIouValues.set(
          node.properties.use_default_iou_values !== undefined ? node.properties.use_default_iou_values : true
        );
        this.ram.set(node.properties.ram?.toString() || '');
        this.nvram.set(node.properties.nvram?.toString() || '');
        this.ethernetAdapters.set(node.properties.ethernet_adapters?.toString() || '');
        this.serialAdapters.set(node.properties.serial_adapters?.toString() || '');
        this.usage.set(node.properties.usage || '');

        this.getConfiguration();
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
    this.consoleTypes = this.configurationService.getConsoleTypes();
  }

  onSaveClick() {
    // Validate required fields
    const nameValidation = this.validationService.validateName(this.nodeName());
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const ethValidation = this.validationService.validateEthernetAdapters(this.ethernetAdapters());
    if (!ethValidation.isValid) { this.toasterService.error(ethValidation.errorMessage); return; }
    const serialValidation = this.validationService.validateSerialAdapters(this.serialAdapters());
    if (!serialValidation.isValid) { this.toasterService.error(serialValidation.errorMessage); return; }

    this.node.name = this.nodeName();
    this.node.console_type = this.consoleType();
    this.node.console_auto_start = this.consoleAutoStart();
    this.node.properties.use_default_iou_values = this.useDefaultIouValues();
    this.node.properties.ram = parseInt(this.ram(), 10) || 0;
    this.node.properties.nvram = parseInt(this.nvram(), 10) || 0;
    this.node.properties.usage = this.usage();
    this.node.properties.ethernet_adapters = parseInt(this.ethernetAdapters(), 10) || 0;
    this.node.properties.serial_adapters = parseInt(this.serialAdapters(), 10) || 0;

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
