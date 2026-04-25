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
import { CustomAdapter } from '@models/qemu/qemu-custom-adapter';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';
import { VmwareConfigurationService } from '@services/vmware-configuration.service';
import {
  CustomAdaptersComponent,
  CustomAdaptersDialogData,
  CustomAdaptersDialogResult,
} from '@components/preferences/common/custom-adapters/custom-adapters.component';

@Component({
  standalone: true,
  selector: 'app-configurator-vmware',
  templateUrl: './configurator-vmware.component.html',
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
export class ConfiguratorDialogVmwareComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogVmwareComponent>);
  private dialog = inject(MatDialog);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private vmwareConfigurationService = inject(VmwareConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  consoleTypes: string[] = [];
  onCloseOptions = [];

  networkTypes = [];

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      console_type: new UntypedFormControl(''),
      console_auto_start: new UntypedFormControl(false),
      on_close: new UntypedFormControl(''),
      headless: new UntypedFormControl(false),
      linked_clone: new UntypedFormControl(false),
      use_any_adapter: new UntypedFormControl(false),
      usage: new UntypedFormControl(''),
    });
  }

  ngOnInit() {
    this.nodeService.getNode(this.controller, this.node).subscribe({
      next: (node: Node) => {
        this.node = node;
        this.name = node.name;

        // Update form values with node data
        this.generalSettingsForm.patchValue({
          name: node.name,
          console_type: node.console_type || '',
          console_auto_start: node.console_auto_start || false,
          on_close: node.properties.on_close || '',
          headless: node.properties.headless || false,
          linked_clone: node.properties.linked_clone || false,
          use_any_adapter: node.properties.use_any_adapter || false,
          usage: node.properties.usage || '',
        });

        if (!this.node.tags) {
          this.node.tags = [];
        }
        this.getConfiguration();
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
    this.consoleTypes = this.vmwareConfigurationService.getConsoleTypes();
    this.onCloseOptions = this.vmwareConfigurationService.getOnCloseoptions();
    this.networkTypes = this.vmwareConfigurationService.getNetworkTypes();
  }

  openCustomAdaptersDialog() {
    const portNameFormat = this.node.port_name_format || 'Ethernet{0}';
    const segmentSize = this.node.port_segment_size || 0;
    const defaultAdapterType = this.node.properties.adapter_type || 'e1000';
    const adapterCount = this.node.properties.adapters || 0;

    const serverCustomAdapters = this.node.custom_adapters || [];
    const adaptersForDialog: CustomAdapter[] = [];

    for (let i = 0; i < adapterCount; i++) {
      const customAdapter = serverCustomAdapters.find((adapter) => adapter.adapter_number === i);

      if (customAdapter) {
        adaptersForDialog.push({
          adapter_number: customAdapter.adapter_number,
          adapter_type: customAdapter.adapter_type,
          port_name: customAdapter.port_name,
          mac_address: customAdapter.mac_address || '',
        });
      } else {
        let portName: string;
        if (segmentSize > 0) {
          const segment = Math.floor(i / segmentSize);
          const portInSegment = i % segmentSize;
          portName = portNameFormat.replace('{0}', String(segment * segmentSize + portInSegment));
        } else {
          portName = portNameFormat.replace('{0}', String(i));
        }

        adaptersForDialog.push({
          adapter_number: i,
          adapter_type: defaultAdapterType,
          port_name: portName,
          mac_address: '',
        });
      }
    }

    const dialogRef = this.dialog.open(CustomAdaptersComponent, {
      panelClass: 'custom-adapters-dialog-panel',
      data: {
        adapters: adaptersForDialog,
        networkTypes: this.networkTypes,
        portNameFormat: portNameFormat,
        portSegmentSize: segmentSize,
        defaultAdapterType: defaultAdapterType,
        currentAdapters: adapterCount,
      } as CustomAdaptersDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CustomAdaptersDialogResult) => {
      if (result) {
        this.node.custom_adapters = result.adapters;
        if (result.requiredAdapters !== undefined) {
          this.node.properties.adapters = result.requiredAdapters;
        }
        this.cd.markForCheck();
      }
    });
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid) {
      // Merge form values back into node
      const formValues = this.generalSettingsForm.value;

      this.node.name = formValues.name;
      this.node.console_type = formValues.console_type;
      this.node.console_auto_start = formValues.console_auto_start;
      this.node.properties.on_close = formValues.on_close;
      this.node.properties.headless = formValues.headless;
      this.node.properties.linked_clone = formValues.linked_clone;
      this.node.properties.use_any_adapter = formValues.use_any_adapter;
      this.node.properties.usage = formValues.usage;

      this.nodeService.updateNodeWithCustomAdapters(this.controller, this.node).subscribe({
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
