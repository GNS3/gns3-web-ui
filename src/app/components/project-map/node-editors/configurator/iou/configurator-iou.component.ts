import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, model, signal } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Node } from '../../../../../cartography/models/node';
import { Controller } from '@models/controller';
import { IouConfigurationService } from '@services/iou-configuration.service';
import { NodeService } from '@services/node.service';
import { TemplateService } from '@services/template.service';
import { ToasterService } from '@services/toaster.service';
import { IouValidationService } from '@services/validation';
import { NetmikoDeviceTypeSelectComponent } from '@components/netmiko-device-type-select/netmiko-device-type-select.component';

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
    MatProgressSpinnerModule,
    NetmikoDeviceTypeSelectComponent,
  ],
})
export class ConfiguratorDialogIouComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogIouComponent>);
  private nodeService = inject(NodeService);
  private templateService = inject(TemplateService);
  private toasterService = inject(ToasterService);
  private configurationService = inject(IouConfigurationService);
  private cd = inject(ChangeDetectorRef);
  private validationService = inject(IouValidationService);

  controller: Controller;
  node: Node;
  name: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];

  readonly isApplying = signal(false);
  readonly isLoading = signal(true);

  // Model signals
  readonly nodeName = model('');
  readonly consoleType = model('');
  readonly consoleAutoStart = model(false);
  readonly l1Keepalives = model(false);
  readonly useDefaultIouValues = model(true);
  readonly ram = model('');
  readonly nvram = model('');
  readonly ethernetAdapters = model('');
  readonly serialAdapters = model('');
  readonly usage = model('');
  readonly netmikoDeviceType = model('');
  readonly defaultUsername = model(''); readonly defaultPassword = model('');
  // inherited values shown as placeholders when the node fields are empty
  readonly defaultUsernamePlaceholder = signal('');
  readonly defaultPasswordPlaceholder = signal('');

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        this.nodeName.set(node.name || '');
        this.consoleType.set(node.console_type || '');
        this.consoleAutoStart.set(node.console_auto_start || false);
        this.l1Keepalives.set(node.properties.l1_keepalives ?? false);
        this.useDefaultIouValues.set(
          node.properties.use_default_iou_values !== undefined ? node.properties.use_default_iou_values : true
        );
        this.ram.set(node.properties.ram?.toString() || '');
        this.nvram.set(node.properties.nvram?.toString() || '');
        this.ethernetAdapters.set(node.properties.ethernet_adapters?.toString() || '');
        this.serialAdapters.set(node.properties.serial_adapters?.toString() || '');
        this.usage.set(node.properties.usage || '');
        this.netmikoDeviceType.set(node.netmiko_device_type || '');
        this.defaultUsername.set(node.default_username || '');
        this.defaultPassword.set(node.default_password || '');
        // empty node credentials: show the template appliance metadata as placeholder
        if ((!node.default_username || !node.default_password) && node.template_id) {
          this.templateService.list(this.controller).subscribe({
            next: (templates) => {
              const metadata = templates.find((tpl) => tpl.template_id === node.template_id)?.appliance_metadata;
              if (metadata) {
                this.defaultUsernamePlaceholder.set(node.default_username ? '' : (metadata.default_username as string) || '');
                this.defaultPasswordPlaceholder.set(node.default_password ? '' : (metadata.default_password as string) || '');
                this.cd.markForCheck();
              }
            },
            error: () => {
              // placeholder is informational only — ignore lookup failures
            },
          });
        }

        this.getConfiguration();
        if (!this.node.tags) {
          this.node.tags = [];
        }
        this.cd.markForCheck();
        this.isLoading.set(false);
        this.dialogRef.disableClose = false;
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load node';
        this.toasterService.error(message);
        this.cd.markForCheck();
        this.isLoading.set(false);
        this.dialogRef.disableClose = false;
      },
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
  }

  onSaveClick() {
    if (this.isApplying()) return;

    // Validate required fields
    const nameValidation = this.validationService.validateName(this.nodeName());
    if (!nameValidation.isValid) { this.toasterService.error(nameValidation.errorMessage); return; }
    const ethValidation = this.validationService.validateEthernetAdapters(this.ethernetAdapters());
    if (!ethValidation.isValid) { this.toasterService.error(ethValidation.errorMessage); return; }
    const serialValidation = this.validationService.validateSerialAdapters(this.serialAdapters());
    if (!serialValidation.isValid) { this.toasterService.error(serialValidation.errorMessage); return; }
    const netmikoValidation = this.validationService.validateNetmikoDeviceType(this.netmikoDeviceType());
    if (!netmikoValidation.isValid) { this.toasterService.error(netmikoValidation.errorMessage); return; }

    this.node.name = this.nodeName();
    this.node.console_type = this.consoleType();
    this.node.console_auto_start = this.consoleAutoStart();
    this.node.properties.l1_keepalives = this.l1Keepalives();
    this.node.properties.use_default_iou_values = this.useDefaultIouValues();
    this.node.properties.ram = parseInt(this.ram(), 10) || 0;
    this.node.properties.nvram = parseInt(this.nvram(), 10) || 0;
    this.node.properties.usage = this.usage();
    this.node.netmiko_device_type = this.netmikoDeviceType().trim() || null;
    this.node.default_username = this.defaultUsername().trim() || null;
    this.node.default_password = this.defaultPassword().trim() || null;
    this.node.properties.ethernet_adapters = parseInt(this.ethernetAdapters(), 10) || 0;
    this.node.properties.serial_adapters = parseInt(this.serialAdapters(), 10) || 0;

    this.isApplying.set(true);
    this.dialogRef.disableClose = true;
    this.nodeService.updateNode(this.controller, this.node).subscribe({
      next: () => {
        this.toasterService.success(`Node ${this.node.name} updated.`);
        this.onCancelClick();
      },
      error: (error: unknown) => {
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || 'Failed to update node';
        this.toasterService.error(errorMessage);
        this.isApplying.set(false);
        this.dialogRef.disableClose = false;
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
