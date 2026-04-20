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
import { IosConfigurationService } from '@services/ios-configuration.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

@Component({
  standalone: true,
  selector: 'app-configurator-ios',
  templateUrl: './configurator-ios.component.html',
  styleUrls: ['../configurator.component.scss', './configurator-ios.component.scss'],
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
export class ConfiguratorDialogIosComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConfiguratorDialogIosComponent>);
  private nodeService = inject(NodeService);
  private toasterService = inject(ToasterService);
  private formBuilder = inject(UntypedFormBuilder);
  private configurationService = inject(IosConfigurationService);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  node: Node;
  name: string;
  generalSettingsForm: UntypedFormGroup;
  memoryForm: UntypedFormGroup;
  advancedSettingsForm: UntypedFormGroup;
  consoleTypes: string[] = [];
  NPETypes: string[] = [];
  MidplaneTypes: string[] = [];
  adapterMatrix = {};
  wicMatrix = {};
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    this.generalSettingsForm = this.formBuilder.group({
      name: new UntypedFormControl('', Validators.required),
      path: new UntypedFormControl('', Validators.required),
      midplane: new UntypedFormControl(''),
      npe: new UntypedFormControl(''),
      console_type: new UntypedFormControl(''),
      aux_type: new UntypedFormControl(''),
      console_auto_start: new UntypedFormControl(false),
      // Slots (0-6)
      slot0: new UntypedFormControl(''),
      slot1: new UntypedFormControl(''),
      slot2: new UntypedFormControl(''),
      slot3: new UntypedFormControl(''),
      slot4: new UntypedFormControl(''),
      slot5: new UntypedFormControl(''),
      slot6: new UntypedFormControl(''),
      // WICs (0-2)
      wic0: new UntypedFormControl(''),
      wic1: new UntypedFormControl(''),
      wic2: new UntypedFormControl(''),
    });

    this.memoryForm = this.formBuilder.group({
      ram: new UntypedFormControl('', Validators.required),
      nvram: new UntypedFormControl('', Validators.required),
      iomem: new UntypedFormControl(''),
      disk0: new UntypedFormControl(''),
      disk1: new UntypedFormControl(''),
      auto_delete_disks: new UntypedFormControl(false),
    });

    this.advancedSettingsForm = this.formBuilder.group({
      system_id: new UntypedFormControl(''),
      mac_addr: new UntypedFormControl('', Validators.pattern(this.configurationService.getMacAddrRegex())),
      idlepc: new UntypedFormControl('', Validators.pattern(this.configurationService.getIdlepcRegex())),
      idlemax: new UntypedFormControl(''),
      idlesleep: new UntypedFormControl(''),
      exec_area: new UntypedFormControl(''),
      mmap: new UntypedFormControl(false),
      sparsemem: new UntypedFormControl(false),
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
        path: node.properties.image || '',
        midplane: node.properties.midplane || '',
        npe: node.properties.npe || '',
        console_type: node.console_type || '',
        aux_type: node.properties.aux_type || '',
        console_auto_start: node.console_auto_start || false,
        // Slots
        slot0: node.properties.slot0 || '',
        slot1: node.properties.slot1 || '',
        slot2: node.properties.slot2 || '',
        slot3: node.properties.slot3 || '',
        slot4: node.properties.slot4 || '',
        slot5: node.properties.slot5 || '',
        slot6: node.properties.slot6 || '',
        // WICs
        wic0: node.properties.wic0 || '',
        wic1: node.properties.wic1 || '',
        wic2: node.properties.wic2 || '',
      });

      this.memoryForm.patchValue({
        ram: node.properties.ram || '',
        nvram: node.properties.nvram || '',
        iomem: node.properties.iomem || '',
        disk0: node.properties.disk0 || 0,
        disk1: node.properties.disk1 || 0,
        auto_delete_disks: node.properties.auto_delete_disks || false,
      });

      this.advancedSettingsForm.patchValue({
        system_id: node.properties.system_id || '',
        mac_addr: node.properties.mac_addr || '',
        idlepc: node.properties.idlepc || '',
        idlemax: node.properties.idlemax || '',
        idlesleep: node.properties.idlesleep || '',
        exec_area: node.properties.exec_area || '',
        mmap: node.properties.mmap || false,
        sparsemem: node.properties.sparsemem || false,
        usage: node.properties.usage || '',
      });

      if (!this.node.tags) {
        this.node.tags = [];
      }
      this.getConfiguration();
      this.fillSlotsData();
      this.cd.markForCheck();
    });
  }

  getConfiguration() {
    this.consoleTypes = this.configurationService.getConsoleTypes();
    this.NPETypes = this.configurationService.getNPETypes();
    this.MidplaneTypes = this.configurationService.getMidplaneTypes();
    this.adapterMatrix = this.configurationService.getAdapterMatrix();
    this.wicMatrix = this.configurationService.getWicMatrix();
  }

  fillSlotsData() {
    // Slots and WICs are now directly in the form, no need to load separately
    // This method is kept for compatibility but does nothing
  }

  saveSlotsData() {
    const generalFormValues = this.generalSettingsForm.value;

    // save network adapters
    for (let i = 0; i <= 6; i++) {
      const platform = this.node.properties.platform;
      const chassis = this.node.properties.chassis || '';
      const slotAdapters = this.adapterMatrix?.[platform]?.[chassis]?.[i];

      if (slotAdapters) {
        const slotValue = generalFormValues[`slot${i}`];
        if (slotValue === undefined || slotValue === null) {
          this.node.properties[`slot${i}`] = '';
        } else {
          this.node.properties[`slot${i}`] = slotValue;
        }
      } else {
        // Remove slot properties that don't exist on this platform/chassis
        delete this.node.properties[`slot${i}`];
      }
    }

    // save WICs
    for (let i = 0; i <= 2; i++) {
      const platform = this.node.properties.platform;
      const wicAdapters = this.wicMatrix?.[platform]?.[i];

      if (wicAdapters) {
        const wicValue = generalFormValues[`wic${i}`];
        if (wicValue === undefined || wicValue === null) {
          this.node.properties[`wic${i}`] = '';
        } else {
          this.node.properties[`wic${i}`] = wicValue;
        }
      } else {
        // Remove WIC properties that don't exist on this platform
        delete this.node.properties[`wic${i}`];
      }
    }
  }

  onSaveClick() {
    if (this.generalSettingsForm.valid && this.memoryForm.valid && this.advancedSettingsForm.valid) {
      // Merge form values back into node
      const generalFormValues = this.generalSettingsForm.value;
      const memoryFormValues = this.memoryForm.value;
      const advancedFormValues = this.advancedSettingsForm.value;

      // Update general settings
      this.node.name = generalFormValues.name;
      this.node.properties.image = generalFormValues.path;
      this.node.properties.midplane = generalFormValues.midplane;
      this.node.properties.npe = generalFormValues.npe;
      this.node.console_type = generalFormValues.console_type;
      this.node.properties.aux_type = generalFormValues.aux_type;
      this.node.console_auto_start = generalFormValues.console_auto_start;

      // Update memory settings
      this.node.properties.ram = memoryFormValues.ram;
      this.node.properties.nvram = memoryFormValues.nvram;
      // Only update iomem if it's supported by the platform (c1700, c2600, c2691, c3600, c3725, c3745)
      const iomemSupportedPlatforms = ['c1700', 'c2600', 'c2691', 'c3600', 'c3725', 'c3745'];
      if (iomemSupportedPlatforms.includes(this.node.properties.platform)) {
        // Convert empty string to null (server expects integer or null, not empty string)
        this.node.properties.iomem = memoryFormValues.iomem !== '' ? memoryFormValues.iomem : null;
      } else {
        delete this.node.properties.iomem;
      }
      this.node.properties.disk0 = memoryFormValues.disk0;
      this.node.properties.disk1 = memoryFormValues.disk1;
      this.node.properties.auto_delete_disks = memoryFormValues.auto_delete_disks;

      // Update advanced settings
      this.node.properties.system_id = advancedFormValues.system_id;
      this.node.properties.mac_addr = advancedFormValues.mac_addr;
      this.node.properties.idlepc = advancedFormValues.idlepc;
      this.node.properties.idlemax = advancedFormValues.idlemax;
      this.node.properties.idlesleep = advancedFormValues.idlesleep;
      this.node.properties.exec_area = advancedFormValues.exec_area;
      this.node.properties.mmap = advancedFormValues.mmap;
      this.node.properties.sparsemem = advancedFormValues.sparsemem;
      this.node.properties.usage = advancedFormValues.usage;

      this.saveSlotsData();
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
